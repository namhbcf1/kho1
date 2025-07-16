@echo off
REM KhoAugment POS Windows Deployment Script
REM Deploys both backend and frontend to Cloudflare

echo ============================================
echo    KhoAugment POS - Windows Quick Deploy
echo ============================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js not found. Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm not found. Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

echo ✅ Node.js and npm detected

REM Install Wrangler if not exists
wrangler --version >nul 2>&1
if errorlevel 1 (
    echo 📦 Installing Wrangler CLI...
    npm install -g wrangler
)

REM Check Cloudflare login
echo 🔐 Checking Cloudflare authentication...
wrangler whoami >nul 2>&1
if errorlevel 1 (
    echo ❌ Not logged in to Cloudflare
    echo Please run: wrangler login
    pause
    exit /b 1
)

echo ✅ Cloudflare authentication verified

REM Deploy Backend
echo.
echo 📦 Step 1: Deploying Backend API...
echo ===================================
cd backend

REM Install backend dependencies
if not exist "node_modules" (
    echo 📦 Installing backend dependencies...
    npm install
)

REM Create database
echo 🗃️ Setting up D1 database...
wrangler d1 list | findstr "kho1-production" >nul
if errorlevel 1 (
    echo 🆕 Creating new D1 database...
    wrangler d1 create kho1-production
    echo ⚠️ Please update wrangler.toml with the new database ID and run this script again
    pause
    exit /b 1
)

REM Initialize database
echo 🔧 Initializing database schema...
wrangler d1 execute kho1-production --env production --file=./migrations/001_initial_schema.sql

REM Deploy backend
echo 🚀 Deploying backend to Cloudflare Workers...
wrangler deploy --env production

REM Get worker URL (simplified for Windows)
set WORKER_URL=https://kho1-api.workers.dev

echo ✅ Backend deployed to: %WORKER_URL%

REM Deploy Frontend
echo.
echo 🌐 Step 2: Deploying Frontend...
echo ===============================
cd ..\frontend

REM Install frontend dependencies
if not exist "node_modules" (
    echo 📦 Installing frontend dependencies...
    npm install
)

REM Create production environment file
echo 🔧 Creating production environment...
echo VITE_API_URL=%WORKER_URL%/api/v1 > .env.production
echo VITE_APP_NAME=KhoAugment POS >> .env.production
echo VITE_STORE_NAME=KhoAugment Store >> .env.production
echo VITE_VAT_RATE=10 >> .env.production
echo VITE_ENABLE_LOYALTY=true >> .env.production
echo VITE_ENABLE_PWA=true >> .env.production

REM Build frontend
echo 🏗️ Building frontend...
npm run build

REM Deploy frontend
echo 🚀 Deploying frontend to Cloudflare Pages...
wrangler pages deploy dist --project-name khoaugment-pos --compatibility-date 2024-01-01

set PAGES_URL=https://khoaugment-pos.pages.dev

echo ✅ Frontend deployed to: %PAGES_URL%

REM Update CORS
echo.
echo 🔧 Step 3: Updating CORS Configuration...
echo ========================================
cd ..\backend

echo 🔧 Updating CORS settings...
powershell -Command "(Get-Content wrangler.toml) -replace 'CORS_ORIGIN = \".*\"', 'CORS_ORIGIN = \"%PAGES_URL%\"' | Set-Content wrangler.toml"

echo 🚀 Redeploying backend with updated CORS...
wrangler deploy --env production

REM Final Summary
echo.
echo 🎉 Deployment Complete!
echo ======================
echo.
echo 📱 Your KhoAugment POS is now live:
echo    Frontend: %PAGES_URL%
echo    Backend:  %WORKER_URL%
echo.
echo 🔐 Default Login Credentials:
echo    Email:    admin@khoaugment.com
echo    Password: admin123
echo.
echo 🚀 Next Steps:
echo    1. Open %PAGES_URL% in your browser
echo    2. Log in with the credentials above
echo    3. Configure your store settings
echo    4. Add your products and categories
echo    5. Start selling!
echo.
echo ✅ KhoAugment POS successfully deployed!

REM Ask to open browser
set /p OPEN_BROWSER="Open the application in browser? (y/n): "
if /i "%OPEN_BROWSER%"=="y" start %PAGES_URL%

pause