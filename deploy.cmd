@echo off
:: Vietnamese POS System - Windows Deployment Script
:: Deployment to Cloudflare Pages and Workers

setlocal enabledelayedexpansion

echo.
echo 🇻🇳 Bắt đầu triển khai KhoAugment POS System...
echo 📅 Thời gian: %date% %time%
echo.

:: Check prerequisites
echo ℹ️  Kiểm tra điều kiện tiên quyết...

:: Check if wrangler is installed
wrangler --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Wrangler CLI chưa được cài đặt. Chạy: npm install -g wrangler
    exit /b 1
)

:: Check if git is installed
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Git chưa được cài đặt
    exit /b 1
)

:: Check if node is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js chưa được cài đặt
    exit /b 1
)

:: Check if authenticated with Cloudflare
wrangler whoami >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Chưa đăng nhập Cloudflare. Chạy: wrangler login
    exit /b 1
)

echo ✅ Điều kiện tiên quyết đã đáp ứng

:: Environment setup
echo.
echo ℹ️  Thiết lập môi trường triển khai...

:: Create production environment file if not exists
if not exist ".env.production" (
    echo ⚠️  Tạo file .env.production mới
    (
        echo # Vietnamese POS Production Environment
        echo VITE_API_URL=https://kho1-api-production.bangachieu2.workers.dev
        echo VITE_APP_NAME=KhoAugment POS
        echo VITE_APP_DESCRIPTION=Hệ thống bán hàng Việt Nam
        echo VITE_DEFAULT_LANGUAGE=vi-VN
        echo VITE_CURRENCY_CODE=VND
        echo VITE_COUNTRY_CODE=VN
        echo VITE_TIMEZONE=Asia/Ho_Chi_Minh
    ) > .env.production
)

:: Git checks
echo.
echo ℹ️  Kiểm tra Git repository...

if not exist ".git" (
    echo ❌ Không phải Git repository. Chạy: git init
    exit /b 1
)

:: Check for uncommitted changes
git status --porcelain | findstr /r /c:".*" >nul
if %errorlevel% equ 0 (
    echo ⚠️  Có thay đổi chưa commit:
    git status --short
    set /p continue="Tiếp tục triển khai? (y/N): "
    if /i not "!continue!"=="y" (
        echo ❌ Triển khai bị hủy bởi người dùng
        exit /b 1
    )
)

:: Build and test
echo.
echo ℹ️  Xây dựng project...

:: Install dependencies
echo Installing dependencies...
npm ci --production=false
if %errorlevel% neq 0 (
    echo ❌ Cài đặt dependencies thất bại
    exit /b 1
)

:: Backend deployment
echo.
echo ℹ️  Triển khai Backend (Cloudflare Workers)...

cd backend

:: Install backend dependencies
echo Installing backend dependencies...
npm ci
if %errorlevel% neq 0 (
    echo ❌ Cài đặt backend dependencies thất bại
    exit /b 1
)

:: Run database migrations
echo ℹ️  Chạy database migrations...
wrangler d1 migrations apply kho1-database --remote
if %errorlevel% neq 0 (
    echo ❌ Database migration thất bại
    exit /b 1
)

:: Deploy backend
echo ℹ️  Triển khai Workers...
wrangler deploy
if %errorlevel% neq 0 (
    echo ❌ Triển khai Workers thất bại
    exit /b 1
)

echo ✅ Backend đã được triển khai thành công

cd ..

:: Frontend deployment
echo.
echo ℹ️  Triển khai Frontend (Cloudflare Pages)...

cd frontend

:: Install frontend dependencies
echo Installing frontend dependencies...
npm ci
if %errorlevel% neq 0 (
    echo ❌ Cài đặt frontend dependencies thất bại
    exit /b 1
)

:: Build frontend
echo ℹ️  Xây dựng frontend...
npm run build
if %errorlevel% neq 0 (
    echo ❌ Build frontend thất bại
    exit /b 1
)

:: Deploy to Cloudflare Pages
echo ℹ️  Triển khai Pages...
wrangler pages deploy dist --project-name=kho1
if %errorlevel% neq 0 (
    echo ❌ Triển khai Pages thất bại
    exit /b 1
)

echo ✅ Frontend đã được triển khai thành công

cd ..

:: Post-deployment checks
echo.
echo ℹ️  Kiểm tra sau triển khai...

set API_URL=https://kho1-api-production.bangachieu2.workers.dev
set FRONTEND_URL=https://kho1.pages.dev

echo ℹ️  Kiểm tra API endpoint...
curl -f -s "%API_URL%/health" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ API endpoint hoạt động bình thường
) else (
    echo ⚠️  API endpoint có thể chưa sẵn sàng (cần vài phút)
)

echo ℹ️  Kiểm tra frontend...
curl -f -s "%FRONTEND_URL%" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Frontend hoạt động bình thường
) else (
    echo ⚠️  Frontend có thể chưa sẵn sàng (cần vài phút)
)

:: Update GitHub
echo.
echo ℹ️  Cập nhật GitHub repository...

:: Get version from package.json
for /f "tokens=2 delims=:, " %%a in ('type package.json ^| findstr "version"') do (
    set VERSION=%%~a
    set VERSION=!VERSION:"=!
)

set COMMIT_MSG=🚀 Deploy v!VERSION! - Vietnamese POS Production

:: Commit if there are changes
git status --porcelain | findstr /r /c:".*" >nul
if %errorlevel% equ 0 (
    git add .
    git commit -m "!COMMIT_MSG!"
)

:: Create tag
git tag -a "v!VERSION!" -m "Production release v!VERSION!" 2>nul
if %errorlevel% neq 0 (
    echo ⚠️  Tag đã tồn tại
)

:: Push to GitHub
echo ℹ️  Đẩy code lên GitHub...
git push origin main
if %errorlevel% neq 0 (
    echo ❌ Push lên GitHub thất bại
    exit /b 1
)

git push origin --tags 2>nul
if %errorlevel% neq 0 (
    echo ⚠️  Push tags có thể thất bại nếu đã tồn tại
)

:: Success summary
echo.
echo.
echo 🎉 TRIỂN KHAI THÀNH CÔNG!
echo ================================
echo 📦 Phiên bản: v%VERSION%
echo 🌐 Frontend: %FRONTEND_URL%
echo 🔧 API: %API_URL%
echo 📅 Thời gian: %date% %time%
echo 🇻🇳 Hệ thống POS Việt Nam đã sẵn sàng!
echo.
echo 📋 Checklist sau triển khai:
echo   ✅ Kiểm tra đăng nhập tại %FRONTEND_URL%
echo   ✅ Test chức năng bán hàng
echo   ✅ Kiểm tra báo cáo
echo   ✅ Test thanh toán VNPay/MoMo/ZaloPay
echo   ✅ Kiểm tra hoạt động offline
echo.
echo 📞 Hỗ trợ kỹ thuật: support@khoaugment.com
echo 📖 Tài liệu: https://docs.khoaugment.com
echo.
echo ⚠️  Nhớ kiểm tra logs trong vài phút đầu:
echo   wrangler tail kho1-api-production
echo   wrangler pages deployment list --project-name=kho1
echo.
echo ✅ Triển khai hoàn tất! 🇻🇳

pause