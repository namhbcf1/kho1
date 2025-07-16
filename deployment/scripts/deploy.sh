#!/bin/bash

# Vietnamese POS System - Cloudflare Deployment Script
# This script automates the deployment process to Cloudflare Workers and Pages

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="vietnamese-pos-system"
BACKEND_WORKER_NAME="kho1-api"
FRONTEND_PROJECT_NAME="kho1"
PRODUCTION_DOMAIN="vietnamese-pos.com"

# Functions
print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
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

check_prerequisites() {
    print_step "Checking prerequisites..."
    
    # Check if npm is installed
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install Node.js and npm first."
        exit 1
    fi
    
    # Check if wrangler is installed
    if ! command -v wrangler &> /dev/null; then
        print_step "Installing Wrangler CLI..."
        npm install -g wrangler@latest
    fi
    
    # Check if user is logged in to Cloudflare
    if ! wrangler auth whoami &> /dev/null; then
        print_warning "You are not logged in to Cloudflare. Please run 'wrangler auth login' first."
        read -p "Do you want to login now? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            wrangler auth login
        else
            print_error "Cloudflare authentication required. Exiting."
            exit 1
        fi
    fi
    
    print_success "Prerequisites checked successfully!"
}

install_dependencies() {
    print_step "Installing dependencies..."
    
    # Install root dependencies
    npm install
    
    # Install frontend dependencies
    cd frontend
    npm install
    cd ..
    
    # Install backend dependencies
    cd backend
    npm install
    cd ..
    
    print_success "Dependencies installed successfully!"
}

setup_cloudflare_resources() {
    print_step "Setting up Cloudflare resources..."
    
    # Create D1 database if it doesn't exist
    print_step "Creating D1 database..."
    if ! wrangler d1 list | grep -q "vietnamese-pos-db"; then
        wrangler d1 create vietnamese-pos-db
        print_success "D1 database created!"
    else
        print_warning "D1 database already exists."
    fi
    
    # Create KV namespace if it doesn't exist
    print_step "Creating KV namespace..."
    if ! wrangler kv:namespace list | grep -q "CACHE"; then
        wrangler kv:namespace create CACHE
        print_success "KV namespace created!"
    else
        print_warning "KV namespace already exists."
    fi
    
    # Create R2 bucket if it doesn't exist
    print_step "Creating R2 bucket..."
    if ! wrangler r2 bucket list | grep -q "vietnamese-pos-storage"; then
        wrangler r2 bucket create vietnamese-pos-storage
        print_success "R2 bucket created!"
    else
        print_warning "R2 bucket already exists."
    fi
    
    print_success "Cloudflare resources setup completed!"
}

run_database_migrations() {
    print_step "Running database migrations..."
    
    cd backend
    
    # Check if migrations exist
    if [ -d "migrations" ] && [ "$(ls -A migrations)" ]; then
        print_step "Applying database migrations..."
        
        # Apply migrations to production database
        for migration in migrations/*.sql; do
            if [ -f "$migration" ]; then
                print_step "Applying migration: $(basename "$migration")"
                wrangler d1 execute vietnamese-pos-db --file="$migration" --env production
            fi
        done
        
        print_success "Database migrations completed!"
    else
        print_warning "No migrations found in backend/migrations directory."
    fi
    
    cd ..
}

build_frontend() {
    print_step "Building frontend..."
    
    cd frontend
    
    # Set production environment variables
    export REACT_APP_API_URL="https://${BACKEND_WORKER_NAME}.your-username.workers.dev"
    export REACT_APP_ENVIRONMENT="production"
    export REACT_APP_VERSION=$(node -p "require('./package.json').version")
    
    # Build the frontend
    npm run build
    
    print_success "Frontend build completed!"
    cd ..
}

build_backend() {
    print_step "Building backend..."
    
    cd backend
    
    # Build the backend
    npm run build
    
    print_success "Backend build completed!"
    cd ..
}

deploy_backend() {
    print_step "Deploying backend to Cloudflare Workers..."
    
    cd backend
    
    # Deploy to production
    wrangler deploy --env production
    
    print_success "Backend deployed successfully!"
    cd ..
}

deploy_frontend() {
    print_step "Deploying frontend to Cloudflare Pages..."
    
    cd frontend
    
    # Deploy to Cloudflare Pages
    wrangler pages deploy dist --project-name="$FRONTEND_PROJECT_NAME" --env production
    
    print_success "Frontend deployed successfully!"
    cd ..
}

setup_custom_domain() {
    print_step "Setting up custom domain (optional)..."
    
    read -p "Do you want to setup a custom domain? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Enter your domain name (e.g., vietnamese-pos.com): " domain_name
        
        if [ -n "$domain_name" ]; then
            print_step "Setting up custom domain: $domain_name"
            
            # Setup custom domain for frontend
            wrangler pages domain add "$domain_name" --project-name="$FRONTEND_PROJECT_NAME"
            
            # Setup custom domain for backend API
            echo "Please manually add the following DNS records:"
            echo "- CNAME api.$domain_name -> $BACKEND_WORKER_NAME.your-username.workers.dev"
            echo "- CNAME www.$domain_name -> $FRONTEND_PROJECT_NAME.pages.dev"
            echo "- A $domain_name -> (Cloudflare proxy IP)"
            
            print_success "Custom domain setup instructions provided!"
        fi
    fi
}

run_tests() {
    print_step "Running tests..."
    
    # Run frontend tests
    cd frontend
    if [ -f "package.json" ] && grep -q "test" package.json; then
        npm run test -- --watchAll=false
    fi
    cd ..
    
    # Run backend tests
    cd backend
    if [ -f "package.json" ] && grep -q "test" package.json; then
        npm run test
    fi
    cd ..
    
    print_success "Tests completed!"
}

display_deployment_info() {
    print_success "🎉 Deployment completed successfully!"
    echo
    echo "📋 Deployment Information:"
    echo "=========================="
    echo "🌐 Frontend URL: https://$FRONTEND_PROJECT_NAME.pages.dev"
    echo "🔧 Backend API: https://$BACKEND_WORKER_NAME.your-username.workers.dev"
    echo "📊 Cloudflare Dashboard: https://dash.cloudflare.com"
    echo
    echo "📝 Next Steps:"
    echo "1. Update your domain DNS records if using custom domain"
    echo "2. Configure payment gateway webhooks"
    echo "3. Set up monitoring and alerts"
    echo "4. Test all functionality in production"
    echo
    echo "🔧 Useful Commands:"
    echo "- View logs: wrangler tail $BACKEND_WORKER_NAME"
    echo "- Update backend: npm run deploy:backend:production"
    echo "- Update frontend: npm run deploy:frontend:production"
}

# Main deployment process
main() {
    echo -e "${BLUE}"
    echo "🇻🇳 Vietnamese POS System - Cloudflare Deployment"
    echo "=================================================="
    echo -e "${NC}"
    
    # Get deployment environment
    ENV=${1:-production}
    
    if [ "$ENV" != "production" ] && [ "$ENV" != "staging" ]; then
        print_error "Invalid environment: $ENV. Use 'production' or 'staging'"
        exit 1
    fi
    
    print_step "Deploying to $ENV environment..."
    
    # Run deployment steps
    check_prerequisites
    install_dependencies
    
    if [ "$ENV" = "production" ]; then
        setup_cloudflare_resources
        run_database_migrations
    fi
    
    run_tests
    build_frontend
    build_backend
    deploy_backend
    deploy_frontend
    
    if [ "$ENV" = "production" ]; then
        setup_custom_domain
    fi
    
    display_deployment_info
}

# Script execution
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
    main "$@"
fi