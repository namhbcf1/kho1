#!/bin/bash

# Vietnamese POS System - Production Deployment Script
# Deployment to Cloudflare Pages and Workers

set -e

echo "🇻🇳 Bắt đầu triển khai KhoAugment POS System..."
echo "📅 Thời gian: $(date)"
echo "🏗️  Phiên bản: $(node -p "require('./package.json').version")"

# Colors for Vietnamese output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Vietnamese error handler
error_exit() {
    echo -e "${RED}❌ Lỗi: $1${NC}" >&2
    exit 1
}

success_msg() {
    echo -e "${GREEN}✅ $1${NC}"
}

info_msg() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

warning_msg() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Check prerequisites
info_msg "Kiểm tra điều kiện tiên quyết..."

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    error_exit "Wrangler CLI chưa được cài đặt. Chạy: npm install -g wrangler"
fi

# Check if git is installed
if ! command -v git &> /dev/null; then
    error_exit "Git chưa được cài đặt"
fi

# Check if node is installed
if ! command -v node &> /dev/null; then
    error_exit "Node.js chưa được cài đặt"
fi

# Check if authenticated with Cloudflare
if ! wrangler whoami &> /dev/null; then
    error_exit "Chưa đăng nhập Cloudflare. Chạy: wrangler login"
fi

success_msg "Điều kiện tiên quyết đã đáp ứng"

# Environment setup
info_msg "Thiết lập môi trường triển khai..."

# Create production environment file if not exists
if [ ! -f ".env.production" ]; then
    warning_msg "Tạo file .env.production mới"
    cat > .env.production << EOL
# Vietnamese POS Production Environment
VITE_API_URL=https://kho1-api-production.bangachieu2.workers.dev
VITE_APP_NAME=KhoAugment POS
VITE_APP_DESCRIPTION=Hệ thống bán hàng Việt Nam
VITE_DEFAULT_LANGUAGE=vi-VN
VITE_CURRENCY_CODE=VND
VITE_COUNTRY_CODE=VN
VITE_TIMEZONE=Asia/Ho_Chi_Minh
EOL
fi

# Check for required secrets
REQUIRED_SECRETS=(
    "JWT_SECRET"
    "JWT_REFRESH_SECRET"
    "DATABASE_URL"
    "RATE_LIMIT_REQUESTS"
    "RATE_LIMIT_WINDOW"
)

info_msg "Kiểm tra secrets môi trường..."
for secret in "${REQUIRED_SECRETS[@]}"; do
    if ! wrangler secret list | grep -q "$secret"; then
        warning_msg "Secret $secret chưa được thiết lập"
        read -p "Nhập giá trị cho $secret: " -s secret_value
        echo
        wrangler secret put "$secret" <<< "$secret_value"
        success_msg "Đã thiết lập secret $secret"
    fi
done

# Git checks
info_msg "Kiểm tra Git repository..."

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    error_exit "Không phải Git repository. Chạy: git init"
fi

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    warning_msg "Có thay đổi chưa commit:"
    git status --short
    read -p "Tiếp tục triển khai? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        error_exit "Triển khai bị hủy bởi người dùng"
    fi
fi

# Build and test
info_msg "Xây dựng project..."

# Install dependencies
npm ci --production=false || error_exit "Cài đặt dependencies thất bại"

# Run tests if available
if [ -f "package.json" ] && npm run | grep -q "test"; then
    info_msg "Chạy tests..."
    npm run test || error_exit "Tests thất bại"
fi

# Lint code
if [ -f "package.json" ] && npm run | grep -q "lint"; then
    info_msg "Kiểm tra code quality..."
    npm run lint || error_exit "Lint thất bại"
fi

# Type check
if [ -f "package.json" ] && npm run | grep -q "type-check"; then
    info_msg "Kiểm tra TypeScript..."
    npm run type-check || error_exit "Type check thất bại"
fi

# Backend deployment
info_msg "Triển khai Backend (Cloudflare Workers)..."

cd backend

# Install backend dependencies
npm ci || error_exit "Cài đặt backend dependencies thất bại"

# Run database migrations
info_msg "Chạy database migrations..."
wrangler d1 migrations apply kho1-database --remote || error_exit "Database migration thất bại"

# Deploy backend
info_msg "Triển khai Workers..."
wrangler deploy || error_exit "Triển khai Workers thất bại"

success_msg "Backend đã được triển khai thành công"

cd ..

# Frontend deployment
info_msg "Triển khai Frontend (Cloudflare Pages)..."

cd frontend

# Install frontend dependencies
npm ci || error_exit "Cài đặt frontend dependencies thất bại"

# Build frontend
info_msg "Xây dựng frontend..."
npm run build || error_exit "Build frontend thất bại"

# Deploy to Cloudflare Pages
info_msg "Triển khai Pages..."
wrangler pages deploy dist --project-name=kho1 || error_exit "Triển khai Pages thất bại"

success_msg "Frontend đã được triển khai thành công"

cd ..

# Post-deployment checks
info_msg "Kiểm tra sau triển khai..."

# Test API endpoint
API_URL="https://kho1-api-production.bangachieu2.workers.dev"
FRONTEND_URL="https://kho1.pages.dev"

info_msg "Kiểm tra API endpoint..."
if curl -f -s "$API_URL/health" > /dev/null; then
    success_msg "API endpoint hoạt động bình thường"
else
    warning_msg "API endpoint có thể chưa sẵn sàng (cần vài phút)"
fi

info_msg "Kiểm tra frontend..."
if curl -f -s "$FRONTEND_URL" > /dev/null; then
    success_msg "Frontend hoạt động bình thường"
else
    warning_msg "Frontend có thể chưa sẵn sàng (cần vài phút)"
fi

# Update GitHub
info_msg "Cập nhật GitHub repository..."

# Tag the release
VERSION=$(node -p "require('./package.json').version")
COMMIT_MSG="🚀 Deploy v${VERSION} - Vietnamese POS Production"

# Commit if there are changes
if [ -n "$(git status --porcelain)" ]; then
    git add .
    git commit -m "$COMMIT_MSG"
fi

# Create tag
git tag -a "v${VERSION}" -m "Production release v${VERSION}" || warning_msg "Tag đã tồn tại"

# Push to GitHub
info_msg "Đẩy code lên GitHub..."
git push origin main || error_exit "Push lên GitHub thất bại"
git push origin --tags || warning_msg "Push tags có thể thất bại nếu đã tồn tại"

# Success summary
echo
echo "🎉 TRIỂN KHAI THÀNH CÔNG!"
echo "================================"
echo "📦 Phiên bản: v${VERSION}"
echo "🌐 Frontend: $FRONTEND_URL"
echo "🔧 API: $API_URL"
echo "📅 Thời gian: $(date)"
echo "🇻🇳 Hệ thống POS Việt Nam đã sẵn sàng!"
echo
echo "📋 Checklist sau triển khai:"
echo "  ✅ Kiểm tra đăng nhập tại $FRONTEND_URL"
echo "  ✅ Test chức năng bán hàng"
echo "  ✅ Kiểm tra báo cáo"
echo "  ✅ Test thanh toán VNPay/MoMo/ZaloPay"
echo "  ✅ Kiểm tra hoạt động offline"
echo
echo "📞 Hỗ trợ kỹ thuật: support@khoaugment.com"
echo "📖 Tài liệu: https://docs.khoaugment.com"

# Final reminder
warning_msg "Nhớ kiểm tra logs trong vài phút đầu:"
echo "  wrangler tail kho1-api-production"
echo "  wrangler pages deployment list --project-name=kho1"

success_msg "Triển khai hoàn tất! 🇻🇳"