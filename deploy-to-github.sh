#!/bin/bash

# Deploy KhoAugment POS to GitHub
# This script initializes git repository and pushes to GitHub

set -e

echo "🚀 Starting GitHub deployment for KhoAugment POS..."

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

# Check if git is installed
if ! command -v git &> /dev/null; then
    print_error "Git is not installed. Please install Git first."
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root directory."
    exit 1
fi

# Get repository URL from user
echo ""
print_status "Please enter your GitHub repository URL:"
echo "Example: https://github.com/yourusername/khoaugment-pos.git"
read -p "Repository URL: " REPO_URL

if [ -z "$REPO_URL" ]; then
    print_error "Repository URL is required."
    exit 1
fi

# Validate repository URL
if [[ ! "$REPO_URL" =~ ^https://github\.com/.+/.+\.git$ ]]; then
    print_warning "Repository URL should be in format: https://github.com/username/repository.git"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_error "Deployment cancelled."
        exit 1
    fi
fi

# Initialize git repository if not already initialized
if [ ! -d ".git" ]; then
    print_status "Initializing Git repository..."
    git init
    print_success "Git repository initialized."
else
    print_status "Git repository already exists."
fi

# Create .gitignore if it doesn't exist
if [ ! -f ".gitignore" ]; then
    print_status "Creating .gitignore file..."
    cat > .gitignore << 'EOF'
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Build outputs
dist/
build/
.next/
out/

# Cache
.cache/
.parcel-cache/
.vite/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
logs/
*.log

# Runtime data
pids/
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/
.nyc_output/

# Dependency directories
jspm_packages/

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# Microbundle cache
.rpt2_cache/
.rts2_cache_cjs/
.rts2_cache_es/
.rts2_cache_umd/

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variables file
.env

# parcel-bundler cache (https://parceljs.org/)
.cache
.parcel-cache

# next.js build output
.next

# nuxt.js build output
.nuxt

# vuepress build output
.vuepress/dist

# Serverless directories
.serverless

# FuseBox cache
.fusebox/

# DynamoDB Local files
.dynamodb/

# TernJS port file
.tern-port

# Cloudflare
.wrangler/
wrangler.toml.bak

# Testing
coverage/
.nyc_output/
test-results/
playwright-report/

# Temporary files
tmp/
temp/
*.tmp
EOF
    print_success ".gitignore file created."
fi

# Add all files to git
print_status "Adding files to Git..."
git add .

# Check if there are any changes to commit
if git diff --staged --quiet; then
    print_warning "No changes to commit."
else
    # Commit changes
    print_status "Committing changes..."
    git commit -m "Initial commit: KhoAugment POS Enterprise System

✨ Features:
- Complete Vietnamese POS system
- Multi-payment gateway support (VNPay, MoMo, ZaloPay)
- Real-time inventory management
- Vietnamese tax compliance (VAT)
- Progressive Web App (PWA)
- Advanced analytics and reporting
- Role-based access control
- Modern React 18 + TypeScript frontend
- Cloudflare Workers backend
- Comprehensive testing suite
- CI/CD with GitHub Actions

🏗️ Architecture:
- Event Sourcing & ACID compliance
- Multi-layer caching
- Load balancing
- Business continuity & disaster recovery
- End-to-end encryption
- Performance optimization

🎨 UI/UX:
- Modern dashboard with dark mode
- Responsive design
- Accessibility compliant
- Advanced form components
- Interactive charts and analytics

🚀 Generated with Claude Code (https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"
    
    print_success "Changes committed successfully."
fi

# Add remote origin if not already added
if ! git remote get-url origin &> /dev/null; then
    print_status "Adding GitHub repository as remote origin..."
    git remote add origin "$REPO_URL"
    print_success "Remote origin added."
else
    print_status "Remote origin already exists. Updating URL..."
    git remote set-url origin "$REPO_URL"
    print_success "Remote origin URL updated."
fi

# Create main branch if we're on master
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" = "master" ]; then
    print_status "Renaming master branch to main..."
    git branch -M main
    print_success "Branch renamed to main."
fi

# Push to GitHub
print_status "Pushing code to GitHub..."
if git push -u origin main; then
    print_success "Code successfully pushed to GitHub!"
else
    print_error "Failed to push to GitHub. Please check your repository URL and permissions."
    exit 1
fi

# Display repository information
echo ""
print_success "🎉 GitHub deployment completed!"
echo ""
echo "Repository URL: $REPO_URL"
echo "Branch: main"
echo "Files committed: $(git ls-files | wc -l) files"
echo ""
print_status "Next steps:"
echo "1. Go to your GitHub repository"
echo "2. Set up repository secrets for Cloudflare deployment"
echo "3. Enable GitHub Actions"
echo "4. Configure branch protection rules"
echo ""
print_status "Required GitHub Secrets:"
echo "- CLOUDFLARE_API_TOKEN"
echo "- CLOUDFLARE_ACCOUNT_ID"
echo "- CLOUDFLARE_ZONE_ID (if using custom domain)"
echo ""
echo "Visit: $(echo $REPO_URL | sed 's/\.git$//')/settings/secrets/actions"
echo ""
print_success "Happy coding! 🚀"