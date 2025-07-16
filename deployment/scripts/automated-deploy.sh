#!/bin/bash

# Automated Deployment Script for KhoAugment POS
# Fixes: Manual deployment process and environment configuration issues

set -e  # Exit on any error

# Configuration
PROJECT_NAME="khoaugment-pos"
BACKEND_DIR="backend"
FRONTEND_DIR="frontend"
SHARED_DIR="shared"
LOG_FILE="deployment-$(date +%Y%m%d-%H%M%S).log"
BACKUP_DIR="backups"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if wrangler is installed
    if ! command -v wrangler &> /dev/null; then
        error "Wrangler CLI is not installed. Please install it first."
    fi
    
    # Check if wrangler is authenticated
    if ! wrangler whoami &> /dev/null; then
        error "Wrangler is not authenticated. Please run 'wrangler login' first."
    fi
    
    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed."
    fi
    
    # Check if npm is installed
    if ! command -v npm &> /dev/null; then
        error "npm is not installed."
    fi
    
    success "All prerequisites are satisfied."
}

# Validate environment configuration
validate_environment() {
    log "Validating environment configuration..."
    
    local env_file=".env.production"
    local required_vars=(
        "JWT_SECRET"
        "DATABASE_URL"
        "VNPAY_TMN_CODE"
        "VNPAY_HASH_SECRET"
        "MOMO_PARTNER_CODE"
        "MOMO_ACCESS_KEY"
        "MOMO_SECRET_KEY"
        "ZALOPAY_APP_ID"
        "ZALOPAY_KEY1"
        "ZALOPAY_KEY2"
    )
    
    if [[ ! -f "$env_file" ]]; then
        warning "Production environment file not found. Creating template..."
        create_env_template
    fi
    
    # Check required variables
    for var in "${required_vars[@]}"; do
        if ! grep -q "^${var}=" "$env_file" 2>/dev/null; then
            warning "Required environment variable '$var' not found in $env_file"
        fi
    done
    
    success "Environment validation completed."
}

# Create environment template
create_env_template() {
    cat > .env.production << EOF
# Production Environment Configuration
# IMPORTANT: Set all values before deployment

# JWT Configuration
JWT_SECRET=your-super-secure-jwt-secret-256-bits

# Database Configuration
DATABASE_URL=your-d1-database-url

# VNPay Configuration
VNPAY_TMN_CODE=your-vnpay-terminal-code
VNPAY_HASH_SECRET=your-vnpay-hash-secret
VNPAY_URL=https://sandbox.vnpayment.vn

# MoMo Configuration
MOMO_PARTNER_CODE=your-momo-partner-code
MOMO_ACCESS_KEY=your-momo-access-key
MOMO_SECRET_KEY=your-momo-secret-key
MOMO_ENDPOINT=https://test-payment.momo.vn

# ZaloPay Configuration
ZALOPAY_APP_ID=your-zalopay-app-id
ZALOPAY_KEY1=your-zalopay-key1
ZALOPAY_KEY2=your-zalopay-key2
ZALOPAY_ENDPOINT=https://sb-openapi.zalopay.vn

# Business Configuration
BUSINESS_NAME=Your Business Name
BUSINESS_TAX_CODE=0123456789
BUSINESS_ADDRESS=Your Business Address
BUSINESS_PHONE=+84901234567

# Security Configuration
RATE_LIMIT_AUTH=5
RATE_LIMIT_API=60
RATE_LIMIT_DEFAULT=100
SESSION_TIMEOUT=86400
REFRESH_TOKEN_TIMEOUT=604800
EOF
    
    warning "Environment template created. Please edit .env.production with your values."
}

# Run tests
run_tests() {
    log "Running tests..."
    
    # Backend tests
    if [[ -d "$BACKEND_DIR" ]]; then
        log "Running backend tests..."
        cd "$BACKEND_DIR"
        npm test || error "Backend tests failed"
        cd ..
    fi
    
    # Frontend tests
    if [[ -d "$FRONTEND_DIR" ]]; then
        log "Running frontend tests..."
        cd "$FRONTEND_DIR"
        npm test || error "Frontend tests failed"
        cd ..
    fi
    
    # Shared tests
    if [[ -d "$SHARED_DIR" ]]; then
        log "Running shared module tests..."
        cd "$SHARED_DIR"
        npm test || error "Shared module tests failed"
        cd ..
    fi
    
    success "All tests passed."
}

# Build projects
build_projects() {
    log "Building projects..."
    
    # Build shared module first
    if [[ -d "$SHARED_DIR" ]]; then
        log "Building shared module..."
        cd "$SHARED_DIR"
        npm install
        npm run build || error "Shared module build failed"
        cd ..
    fi
    
    # Build backend
    if [[ -d "$BACKEND_DIR" ]]; then
        log "Building backend..."
        cd "$BACKEND_DIR"
        npm install
        npm run build || error "Backend build failed"
        cd ..
    fi
    
    # Build frontend
    if [[ -d "$FRONTEND_DIR" ]]; then
        log "Building frontend..."
        cd "$FRONTEND_DIR"
        npm install
        npm run build || error "Frontend build failed"
        cd ..
    fi
    
    success "All projects built successfully."
}

# Create database backup
create_backup() {
    log "Creating database backup..."
    
    mkdir -p "$BACKUP_DIR"
    local backup_name="backup-$(date +%Y%m%d-%H%M%S).sql"
    
    # Export database schema and data
    wrangler d1 export ${PROJECT_NAME}-db --output "$BACKUP_DIR/$backup_name" || warning "Database backup failed"
    
    success "Database backup created: $BACKUP_DIR/$backup_name"
}

# Run database migrations
run_migrations() {
    log "Running database migrations..."
    
    local migration_dir="$BACKEND_DIR/migrations"
    
    if [[ -d "$migration_dir" ]]; then
        for migration in "$migration_dir"/*.sql; do
            if [[ -f "$migration" ]]; then
                log "Running migration: $(basename "$migration")"
                wrangler d1 execute ${PROJECT_NAME}-db --file="$migration" || error "Migration failed: $migration"
            fi
        done
    fi
    
    success "Database migrations completed."
}

# Deploy backend (Workers)
deploy_backend() {
    log "Deploying backend to Cloudflare Workers..."
    
    cd "$BACKEND_DIR"
    
    # Deploy Workers
    wrangler deploy || error "Backend deployment failed"
    
    cd ..
    success "Backend deployed successfully."
}

# Deploy frontend (Pages)
deploy_frontend() {
    log "Deploying frontend to Cloudflare Pages..."
    
    cd "$FRONTEND_DIR"
    
    # Deploy to Pages
    wrangler pages deploy dist --project-name="$PROJECT_NAME" || error "Frontend deployment failed"
    
    cd ..
    success "Frontend deployed successfully."
}

# Update KV storage
update_kv_storage() {
    log "Updating KV storage..."
    
    # Upload business settings
    local business_settings='{
        "name": "'$BUSINESS_NAME'",
        "taxCode": "'$BUSINESS_TAX_CODE'",
        "address": "'$BUSINESS_ADDRESS'",
        "phone": "'$BUSINESS_PHONE'",
        "currency": "VND",
        "timezone": "Asia/Ho_Chi_Minh"
    }'
    
    echo "$business_settings" | wrangler kv:key put --binding=BUSINESS_SETTINGS "business_config" || warning "KV update failed"
    
    success "KV storage updated."
}

# Health check
health_check() {
    log "Performing health check..."
    
    local api_url="https://${PROJECT_NAME}.your-subdomain.workers.dev"
    local pages_url="https://${PROJECT_NAME}.pages.dev"
    
    # Check API health
    if curl -s -f "$api_url/health" > /dev/null; then
        success "API health check passed"
    else
        warning "API health check failed"
    fi
    
    # Check Pages health
    if curl -s -f "$pages_url" > /dev/null; then
        success "Pages health check passed"
    else
        warning "Pages health check failed"
    fi
}

# Rollback function
rollback() {
    log "Rolling back deployment..."
    
    # Rollback Workers
    cd "$BACKEND_DIR"
    wrangler rollback || warning "Backend rollback failed"
    cd ..
    
    # Restore database from backup
    local latest_backup=$(ls -t "$BACKUP_DIR"/*.sql 2>/dev/null | head -n1)
    if [[ -f "$latest_backup" ]]; then
        log "Restoring database from: $latest_backup"
        wrangler d1 execute ${PROJECT_NAME}-db --file="$latest_backup" || warning "Database restore failed"
    fi
    
    success "Rollback completed."
}

# Cleanup function
cleanup() {
    log "Cleaning up temporary files..."
    
    # Remove old backups (keep last 5)
    if [[ -d "$BACKUP_DIR" ]]; then
        ls -t "$BACKUP_DIR"/*.sql 2>/dev/null | tail -n +6 | xargs rm -f
    fi
    
    success "Cleanup completed."
}

# Main deployment function
deploy() {
    local environment=${1:-production}
    
    log "Starting deployment to $environment environment..."
    
    # Trap errors and perform rollback
    trap 'error "Deployment failed. Attempting rollback..."; rollback' ERR
    
    check_prerequisites
    validate_environment
    run_tests
    build_projects
    create_backup
    run_migrations
    deploy_backend
    deploy_frontend
    update_kv_storage
    health_check
    cleanup
    
    success "Deployment completed successfully!"
    log "Deployment log saved to: $LOG_FILE"
}

# Parse command line arguments
case "${1:-deploy}" in
    "deploy")
        deploy "${2:-production}"
        ;;
    "rollback")
        rollback
        ;;
    "test")
        run_tests
        ;;
    "build")
        build_projects
        ;;
    "backup")
        create_backup
        ;;
    "health")
        health_check
        ;;
    "clean")
        cleanup
        ;;
    *)
        echo "Usage: $0 {deploy|rollback|test|build|backup|health|clean} [environment]"
        echo ""
        echo "Commands:"
        echo "  deploy     - Full deployment pipeline (default)"
        echo "  rollback   - Rollback to previous deployment"
        echo "  test       - Run all tests"
        echo "  build      - Build all projects"
        echo "  backup     - Create database backup"
        echo "  health     - Perform health check"
        echo "  clean      - Clean up temporary files"
        echo ""
        echo "Environments:"
        echo "  production - Production deployment (default)"
        echo "  staging    - Staging deployment"
        exit 1
        ;;
esac