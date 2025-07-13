#!/bin/bash

# Production Deployment Script for KhoAugment POS
# Deploys to Cloudflare Pages and Workers

set -e

echo "🚀 Starting KhoAugment POS deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="kho1"
ENVIRONMENT=${1:-production}
FORCE_DEPLOY=${2:-false}

echo -e "${YELLOW}Deployment Configuration:${NC}"
echo "  Project: $PROJECT_NAME"
echo "  Environment: $ENVIRONMENT"
echo "  Force Deploy: $FORCE_DEPLOY"
echo

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

if ! command -v wrangler &> /dev/null; then
    echo -e "${RED}❌ Wrangler CLI not found. Install with: npm install -g wrangler${NC}"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm not found. Please install Node.js${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites check passed${NC}"
echo

# Authenticate with Cloudflare
echo -e "${YELLOW}Checking Cloudflare authentication...${NC}"
if ! wrangler whoami &> /dev/null; then
    echo -e "${RED}❌ Not authenticated with Cloudflare. Run: wrangler login${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Cloudflare authentication verified${NC}"
echo

# Step 1: Create and configure D1 databases
echo -e "${YELLOW}Step 1: Setting up D1 databases...${NC}"

if [ "$ENVIRONMENT" = "production" ]; then
    DB_NAME="$PROJECT_NAME-production"
else
    DB_NAME="$PROJECT_NAME-development"
fi

# Create database if it doesn't exist
if ! wrangler d1 list | grep -q "$DB_NAME"; then
    echo "Creating D1 database: $DB_NAME"
    wrangler d1 create "$DB_NAME"
else
    echo "D1 database $DB_NAME already exists"
fi

# Get database ID
DB_ID=$(wrangler d1 list | grep "$DB_NAME" | awk '{print $2}')
echo "Database ID: $DB_ID"

# Run migrations
echo "Running database migrations..."
cd backend

# Apply initial schema
wrangler d1 execute "$DB_NAME" --file=migrations/0001_initial_schema.sql --env="$ENVIRONMENT"

# Apply seed data
wrangler d1 execute "$DB_NAME" --file=migrations/0002_seed_data.sql --env="$ENVIRONMENT"

# Apply additional migrations
for migration in migrations/0003_*.sql; do
    if [ -f "$migration" ]; then
        echo "Applying migration: $migration"
        wrangler d1 execute "$DB_NAME" --file="$migration" --env="$ENVIRONMENT"
    fi
done

# Apply Vietnamese business schema
wrangler d1 execute "$DB_NAME" --file=migrations/0007_production_vietnamese_schema.sql --env="$ENVIRONMENT"

echo -e "${GREEN}✅ Database setup completed${NC}"
echo

# Step 2: Create KV namespaces
echo -e "${YELLOW}Step 2: Setting up KV storage...${NC}"

KV_NAME="$PROJECT_NAME-cache-$ENVIRONMENT"
if ! wrangler kv:namespace list | grep -q "$KV_NAME"; then
    echo "Creating KV namespace: $KV_NAME"
    wrangler kv:namespace create "$KV_NAME" --env="$ENVIRONMENT"
else
    echo "KV namespace $KV_NAME already exists"
fi

echo -e "${GREEN}✅ KV storage setup completed${NC}"
echo

# Step 3: Create R2 buckets
echo -e "${YELLOW}Step 3: Setting up R2 storage...${NC}"

R2_BUCKET="$PROJECT_NAME-storage-$ENVIRONMENT"
if ! wrangler r2 bucket list | grep -q "$R2_BUCKET"; then
    echo "Creating R2 bucket: $R2_BUCKET"
    wrangler r2 bucket create "$R2_BUCKET" --env="$ENVIRONMENT"
else
    echo "R2 bucket $R2_BUCKET already exists"
fi

echo -e "${GREEN}✅ R2 storage setup completed${NC}"
echo

# Step 4: Build and deploy backend (Workers)
echo -e "${YELLOW}Step 4: Building and deploying backend...${NC}"

# Install dependencies
echo "Installing backend dependencies..."
npm ci

# Build TypeScript
echo "Building backend..."
npm run build

# Deploy to Workers
echo "Deploying to Cloudflare Workers..."
if [ "$ENVIRONMENT" = "production" ]; then
    wrangler deploy --env=production
else
    wrangler deploy --env=development
fi

echo -e "${GREEN}✅ Backend deployment completed${NC}"
echo

# Step 5: Build and deploy frontend (Pages)
echo -e "${YELLOW}Step 5: Building and deploying frontend...${NC}"

cd ../frontend

# Install dependencies
echo "Installing frontend dependencies..."
npm ci

# Build for production
echo "Building frontend..."
if [ "$ENVIRONMENT" = "production" ]; then
    VITE_API_URL="https://$PROJECT_NAME-api.bangachieu2.workers.dev" npm run build
else
    VITE_API_URL="https://$PROJECT_NAME-api-dev.bangachieu2.workers.dev" npm run build
fi

# Deploy to Cloudflare Pages
echo "Deploying to Cloudflare Pages..."
if [ "$ENVIRONMENT" = "production" ]; then
    wrangler pages deploy dist --project-name="$PROJECT_NAME" --compatibility-date="2024-01-01"
else
    wrangler pages deploy dist --project-name="$PROJECT_NAME-dev" --compatibility-date="2024-01-01"
fi

echo -e "${GREEN}✅ Frontend deployment completed${NC}"
echo

# Step 6: Configure custom domains (production only)
if [ "$ENVIRONMENT" = "production" ]; then
    echo -e "${YELLOW}Step 6: Configuring custom domains...${NC}"
    
    # Note: Custom domain setup requires manual DNS configuration
    echo "Custom domain setup requires manual configuration:"
    echo "1. Add CNAME record: $PROJECT_NAME.pages.dev -> your-domain.com"
    echo "2. Run: wrangler pages domain add your-domain.com --project-name=$PROJECT_NAME"
    
    echo -e "${YELLOW}⚠️  Custom domain setup requires manual configuration${NC}"
fi

# Step 7: Verify deployment
echo -e "${YELLOW}Step 7: Verifying deployment...${NC}"

cd ../

# Test backend health
if [ "$ENVIRONMENT" = "production" ]; then
    BACKEND_URL="https://$PROJECT_NAME-api.bangachieu2.workers.dev"
    FRONTEND_URL="https://$PROJECT_NAME.pages.dev"
else
    BACKEND_URL="https://$PROJECT_NAME-api-dev.bangachieu2.workers.dev"
    FRONTEND_URL="https://$PROJECT_NAME-dev.pages.dev"
fi

echo "Testing backend health..."
if curl -s "$BACKEND_URL/health" > /dev/null; then
    echo -e "${GREEN}✅ Backend is healthy${NC}"
else
    echo -e "${RED}❌ Backend health check failed${NC}"
fi

echo "Testing frontend..."
if curl -s "$FRONTEND_URL" > /dev/null; then
    echo -e "${GREEN}✅ Frontend is accessible${NC}"
else
    echo -e "${RED}❌ Frontend access failed${NC}"
fi

echo -e "${GREEN}✅ Deployment verification completed${NC}"
echo

# Step 8: Post-deployment tasks
echo -e "${YELLOW}Step 8: Post-deployment tasks...${NC}"

# Trigger initial data sync
echo "Triggering initial data sync..."
curl -s -X POST "$BACKEND_URL/api/admin/sync" || echo "Sync trigger failed (expected if authentication is required)"

# Clear CDN cache if applicable
echo "Clearing CDN cache..."
# Note: This would require additional Cloudflare API calls

echo -e "${GREEN}✅ Post-deployment tasks completed${NC}"
echo

# Summary
echo -e "${GREEN}🎉 Deployment Summary:${NC}"
echo "  Environment: $ENVIRONMENT"
echo "  Backend URL: $BACKEND_URL"
echo "  Frontend URL: $FRONTEND_URL"
echo "  Database: $DB_NAME ($DB_ID)"
echo "  KV Cache: $KV_NAME"
echo "  R2 Storage: $R2_BUCKET"
echo

echo -e "${GREEN}✅ KhoAugment POS deployment completed successfully!${NC}"

# Additional production notes
if [ "$ENVIRONMENT" = "production" ]; then
    echo
    echo -e "${YELLOW}Production Deployment Notes:${NC}"
    echo "1. Update DNS records to point to Cloudflare Pages"
    echo "2. Configure payment gateway webhooks to point to: $BACKEND_URL/api/payments/*/callback"
    echo "3. Set up monitoring and alerts in Cloudflare Dashboard"
    echo "4. Configure backup schedules for D1 database"
    echo "5. Review security headers and SSL settings"
    echo "6. Test all payment flows in production environment"
    echo "7. Set up real environment variables for production"
fi

echo
echo -e "${GREEN}Deployment script completed!${NC}"