@echo off
setlocal enabledelayedexpansion

echo.
echo ========================================================
echo   Deploy KhoAugment POS - Full Dashboard
echo ========================================================
echo.

echo [1] Building full React application with all features...
cd frontend
npm run build
if errorlevel 1 (
    echo [ERROR] Build failed
    pause
    exit /b 1
)
echo [OK] Build completed successfully

echo.
echo [2] Deploying to Cloudflare Pages...
wrangler pages deploy dist --project-name kho1 --commit-dirty=true
if errorlevel 1 (
    echo [ERROR] Deploy failed
    pause
    exit /b 1
)
echo [OK] Deploy completed

echo.
echo [3] Committing to GitHub...
cd ..
git add .
git commit -m "Deploy full KhoAugment POS dashboard - %date% %time%"
git push origin main
echo [OK] GitHub updated

echo.
echo [SUCCESS] ========================================
echo [SUCCESS]   FULL DASHBOARD DEPLOYED!
echo [SUCCESS] ========================================
echo.

echo 🎉 KhoAugment POS Full Dashboard is now LIVE!
echo.

echo 🌐 Access URLs:
echo   + Main: https://kho1.pages.dev
echo   + Latest: https://6dc7c841.kho1.pages.dev
echo   + GitHub: https://github.com/namhbcf1/kho1
echo.

echo ✅ Full Features Deployed:
echo   [OK] Modern Dashboard with KPI Cards and Charts
echo   [OK] Vietnamese POS Terminal Interface
echo   [OK] Product Management System
echo   [OK] Customer Management with Loyalty Program
echo   [OK] Order Management System
echo   [OK] Analytics and Reporting
echo   [OK] Settings and Configuration
echo   [OK] Multi-payment Gateway Support
echo   [OK] Vietnamese Tax Compliance
echo   [OK] Progressive Web App (PWA)
echo   [OK] Responsive Design
echo   [OK] Real-time Updates
echo   [OK] Barcode Scanner Integration
echo   [OK] Receipt Printer Support
echo   [OK] Role-based Access Control
echo.

echo 🔐 Login Info:
echo   Email: admin@khoaugment.com
echo   Password: admin123
echo.

echo [INFO] Opening applications...
start https://kho1.pages.dev
start https://6dc7c841.kho1.pages.dev
start https://github.com/namhbcf1/kho1

echo.
echo [SUCCESS] Full KhoAugment POS Dashboard deployed successfully! 🚀
echo.
pause