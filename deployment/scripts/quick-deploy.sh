#!/bin/bash

# KhoAugment POS Quick Deployment Script
# Deploys both backend and frontend to Cloudflare

set -e

echo "🚀 KhoAugment POS - Quick Deploy to Cloudflare"
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check prerequisites
print_info "Checking prerequisites..."

if ! command -v wrangler &> /dev/null; then
    print_error "Wrangler CLI not found. Installing..."
    npm install -g wrangler
fi

if ! wrangler whoami &> /dev/null; then
    print_error "Not logged in to Cloudflare. Please run: wrangler login"
    exit 1
fi

print_status "Prerequisites check passed"

# Step 1: Deploy Backend
echo ""
echo "📦 Step 1: Deploying Backend API..."
echo "-----------------------------------"
cd backend

# Install dependencies
if [ ! -d "node_modules" ]; then
    print_info "Installing backend dependencies..."
    npm install
fi

# Create database if not exists
print_info "Setting up D1 database..."
if ! wrangler d1 list | grep -q "kho1-production"; then
    print_warning "Creating new D1 database..."
    DB_OUTPUT=$(wrangler d1 create kho1-production)
    echo "$DB_OUTPUT"
    
    # Extract database ID from output
    DB_ID=$(echo "$DB_OUTPUT" | grep "database_id" | awk -F'"' '{print $4}')
    
    if [ ! -z "$DB_ID" ]; then
        print_info "Updating wrangler.toml with database ID: $DB_ID"
        sed -i "s/database_id = \".*\"/database_id = \"$DB_ID\"/g" wrangler.toml
    fi
fi

# Initialize database schema
print_info "Initializing database schema..."
wrangler d1 execute kho1-production --env production --file=./migrations/001_initial_schema.sql

# Deploy backend
print_info "Deploying backend to Cloudflare Workers..."
wrangler deploy --env production

# Get worker URL
WORKER_URL="https://kho1-api.$(wrangler whoami | grep 'Account ID' | awk '{print $3}' | head -1).workers.dev"
if [[ "$WORKER_URL" == *"undefined"* ]]; then
    WORKER_URL="https://kho1-api.workers.dev"
fi

print_status "Backend deployed to: $WORKER_URL"

# Step 2: Deploy Frontend
echo ""
echo "🌐 Step 2: Deploying Frontend..."
echo "--------------------------------"
cd ../frontend

# Install dependencies
if [ ! -d "node_modules" ]; then
    print_info "Installing frontend dependencies..."
    npm install
fi

# Create production environment file
print_info "Creating production environment configuration..."
cat > .env.production << EOF
VITE_API_URL=${WORKER_URL}/api/v1
VITE_APP_NAME=KhoAugment POS
VITE_STORE_NAME=KhoAugment Store
VITE_STORE_ADDRESS=Địa chỉ cửa hàng của bạn
VITE_STORE_PHONE=1900-xxxx
VITE_TAX_CODE=0123456789
VITE_VAT_RATE=10
VITE_CURRENCY=VND
VITE_LOCALE=vi-VN
VITE_ENABLE_LOYALTY=true
VITE_ENABLE_PWA=true
VITE_ENABLE_BARCODE_SCANNER=true
VITE_ENABLE_RECEIPT_PRINTER=true
VITE_ENABLE_OFFLINE_MODE=true
EOF

# Build frontend
print_info "Building frontend for production..."
npm run build

# Deploy to Cloudflare Pages
print_info "Deploying frontend to Cloudflare Pages..."
wrangler pages deploy dist --project-name khoaugment-pos --compatibility-date 2024-01-01

# Get Pages URL
PAGES_URL="https://khoaugment-pos.pages.dev"

print_status "Frontend deployed to: $PAGES_URL"

# Step 3: Update CORS Configuration
echo ""
echo "🔧 Step 3: Updating CORS Configuration..."
echo "----------------------------------------"
cd ../backend

print_info "Updating CORS settings in backend..."
sed -i "s|CORS_ORIGIN = \".*\"|CORS_ORIGIN = \"$PAGES_URL\"|g" wrangler.toml

# Redeploy backend with updated CORS
print_info "Redeploying backend with updated CORS..."
wrangler deploy --env production

# Step 4: Test Deployment
echo ""
echo "🧪 Step 4: Testing Deployment..."
echo "-------------------------------"

print_info "Testing backend health..."
if curl -s "${WORKER_URL}/health" | grep -q "healthy"; then
    print_status "Backend health check passed"
else
    print_warning "Backend health check failed - but deployment might still work"
fi

# Final Summary
echo ""
echo "🎉 Deployment Complete!"
echo "======================="
echo ""
echo "📱 Your KhoAugment POS is now live:"
echo "   Frontend: $PAGES_URL"
echo "   Backend:  $WORKER_URL"
echo ""
echo "🔐 Default Login Credentials:"
echo "   Email:    admin@khoaugment.com"
echo "   Password: admin123"
echo ""
echo "🚀 Next Steps:"
echo "   1. Open $PAGES_URL in your browser"
echo "   2. Log in with the credentials above"
echo "   3. Configure your store settings"
echo "   4. Add your products and categories"
echo "   5. Start selling!"
echo ""
echo "📚 Documentation:"
echo "   - User Guide: Check the README.md file"
echo "   - API Docs: $WORKER_URL/health"
echo ""
echo "🔧 Troubleshooting:"
echo "   - If login fails, wait 1-2 minutes for database sync"
echo "   - Check browser console for any errors"
echo "   - Ensure cookies are enabled"
echo ""

print_status "KhoAugment POS successfully deployed! 🎊"

# Optional: Open browser
if command -v xdg-open &> /dev/null; then
    read -p "Open the application in browser? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        xdg-open "$PAGES_URL"
    fi
elif command -v open &> /dev/null; then
    read -p "Open the application in browser? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        open "$PAGES_URL"
    fi
fi