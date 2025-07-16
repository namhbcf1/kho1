#!/bin/bash

# Deploy KhoAugment POS to Cloudflare
# This script deploys both frontend and backend to Cloudflare services

set -e

echo "☁️ Starting Cloudflare deployment for KhoAugment POS..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    print_status "Installing Wrangler CLI..."
    npm install -g wrangler
    print_success "Wrangler CLI installed."
fi

# Check if user is logged in to Cloudflare
print_status "Checking Cloudflare authentication..."
if ! wrangler whoami &> /dev/null; then
    print_status "Please log in to Cloudflare..."
    wrangler login
fi

# Get user info
USER_INFO=$(wrangler whoami)
print_success "Logged in as: $USER_INFO"

# Get environment from user
echo ""
print_status "Select deployment environment:"
echo "1) Development"
echo "2) Staging" 
echo "3) Production"
read -p "Enter choice (1-3): " ENV_CHOICE

case $ENV_CHOICE in
    1)
        ENVIRONMENT="development"
        ;;
    2)
        ENVIRONMENT="staging"
        ;;
    3)
        ENVIRONMENT="production"
        ;;
    *)
        print_error "Invalid choice. Defaulting to development."
        ENVIRONMENT="development"
        ;;
esac

print_status "Deploying to: $ENVIRONMENT"

# Function to create Cloudflare resources
setup_cloudflare_resources() {
    print_status "Setting up Cloudflare resources..."
    
    # Create D1 Database
    print_status "Creating D1 database..."
    if wrangler d1 create khoaugment-pos-db-$ENVIRONMENT; then
        print_success "D1 database created successfully."
    else
        print_warning "D1 database might already exist or creation failed."
    fi
    
    # Create KV Namespaces
    print_status "Creating KV namespaces..."
    
    KV_NAMESPACES=("CACHE" "SESSIONS" "SETTINGS" "RATE_LIMITS")
    for namespace in "${KV_NAMESPACES[@]}"; do
        if wrangler kv:namespace create "$namespace" --env $ENVIRONMENT; then
            print_success "KV namespace $namespace created successfully."
        else
            print_warning "KV namespace $namespace might already exist."
        fi
    done
    
    # Create R2 Buckets
    print_status "Creating R2 buckets..."
    
    R2_BUCKETS=("khoaugment-uploads-$ENVIRONMENT" "khoaugment-backups-$ENVIRONMENT")
    for bucket in "${R2_BUCKETS[@]}"; do
        if wrangler r2 bucket create "$bucket"; then
            print_success "R2 bucket $bucket created successfully."
        else
            print_warning "R2 bucket $bucket might already exist."
        fi
    done
    
    print_success "Cloudflare resources setup completed."
}

# Function to deploy backend
deploy_backend() {
    print_status "Deploying backend to Cloudflare Workers..."
    
    cd backend
    
    # Install dependencies
    print_status "Installing backend dependencies..."
    npm install
    
    # Build backend
    print_status "Building backend..."
    if npm run build; then
        print_success "Backend build completed."
    else
        print_error "Backend build failed."
        exit 1
    fi
    
    # Run database migrations
    print_status "Running database migrations..."
    if wrangler d1 migrations apply khoaugment-pos-db-$ENVIRONMENT --env $ENVIRONMENT; then
        print_success "Database migrations completed."
    else
        print_warning "Database migrations failed or no migrations to run."
    fi
    
    # Deploy to Cloudflare Workers
    print_status "Deploying to Cloudflare Workers..."
    if wrangler deploy --env $ENVIRONMENT; then
        print_success "Backend deployed successfully to Cloudflare Workers."
        
        # Get worker URL
        WORKER_URL=$(wrangler deployments list --name khoaugment-pos-$ENVIRONMENT --format json | jq -r '.[0].url' 2>/dev/null || echo "")
        if [ -n "$WORKER_URL" ]; then
            echo "Worker URL: $WORKER_URL"
        fi
    else
        print_error "Backend deployment failed."
        exit 1
    fi
    
    cd ..
}

# Function to deploy frontend
deploy_frontend() {
    print_status "Deploying frontend to Cloudflare Pages..."
    
    cd frontend
    
    # Install dependencies
    print_status "Installing frontend dependencies..."
    if command -v pnpm &> /dev/null; then
        pnpm install
    else
        npm install
    fi
    
    # Build frontend
    print_status "Building frontend..."
    if command -v pnpm &> /dev/null; then
        if pnpm build; then
            print_success "Frontend build completed."
        else
            print_error "Frontend build failed."
            exit 1
        fi
    else
        if npm run build; then
            print_success "Frontend build completed."
        else
            print_error "Frontend build failed."
            exit 1
        fi
    fi
    
    # Deploy to Cloudflare Pages
    print_status "Deploying to Cloudflare Pages..."
    if wrangler pages deploy dist --project-name khoaugment-pos-frontend-$ENVIRONMENT --compatibility-date 2024-01-15; then
        print_success "Frontend deployed successfully to Cloudflare Pages."
        
        # Get pages URL
        PAGES_URL="https://khoaugment-pos-frontend-$ENVIRONMENT.pages.dev"
        echo "Pages URL: $PAGES_URL"
    else
        print_error "Frontend deployment failed."
        exit 1
    fi
    
    cd ..
}

# Function to run health checks
run_health_checks() {
    print_status "Running health checks..."
    
    # Wait for deployment to be ready
    sleep 10
    
    # Check backend health
    if [ -n "$WORKER_URL" ]; then
        print_status "Checking backend health..."
        if curl -f "$WORKER_URL/health" &> /dev/null; then
            print_success "Backend health check passed."
        else
            print_warning "Backend health check failed or endpoint not ready."
        fi
    fi
    
    # Check frontend
    if [ -n "$PAGES_URL" ]; then
        print_status "Checking frontend..."
        if curl -f "$PAGES_URL" &> /dev/null; then
            print_success "Frontend health check passed."
        else
            print_warning "Frontend health check failed or not ready."
        fi
    fi
}

# Function to display deployment summary
display_summary() {
    echo ""
    print_success "🎉 Cloudflare deployment completed!"
    echo ""
    echo "Environment: $ENVIRONMENT"
    echo "Backend (API): $WORKER_URL"
    echo "Frontend: $PAGES_URL"
    echo ""
    print_status "Cloudflare Resources Created:"
    echo "- D1 Database: khoaugment-pos-db-$ENVIRONMENT"
    echo "- KV Namespaces: CACHE, SESSIONS, SETTINGS, RATE_LIMITS"
    echo "- R2 Buckets: khoaugment-uploads-$ENVIRONMENT, khoaugment-backups-$ENVIRONMENT"
    echo "- Worker: khoaugment-pos-$ENVIRONMENT"
    echo "- Pages: khoaugment-pos-frontend-$ENVIRONMENT"
    echo ""
    print_status "Next steps:"
    echo "1. Configure custom domain (optional)"
    echo "2. Set up monitoring and alerts"
    echo "3. Configure environment variables"
    echo "4. Test all functionality"
    echo ""
    print_success "Deployment successful! 🚀"
}

# Main deployment flow
main() {
    # Check if we're in the right directory
    if [ ! -f "package.json" ]; then
        print_error "package.json not found. Please run this script from the project root directory."
        exit 1
    fi
    
    # Ask user what to deploy
    echo ""
    print_status "What would you like to deploy?"
    echo "1) Setup Cloudflare resources only"
    echo "2) Deploy backend only"
    echo "3) Deploy frontend only"
    echo "4) Full deployment (resources + backend + frontend)"
    read -p "Enter choice (1-4): " DEPLOY_CHOICE
    
    case $DEPLOY_CHOICE in
        1)
            setup_cloudflare_resources
            ;;
        2)
            deploy_backend
            run_health_checks
            ;;
        3)
            deploy_frontend
            run_health_checks
            ;;
        4)
            setup_cloudflare_resources
            deploy_backend
            deploy_frontend
            run_health_checks
            display_summary
            ;;
        *)
            print_error "Invalid choice."
            exit 1
            ;;
    esac
    
    if [ "$DEPLOY_CHOICE" != "4" ]; then
        print_success "Selected deployment completed!"
    fi
}

# Run main function
main