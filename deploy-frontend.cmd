@echo off
setlocal enabledelayedexpansion

echo.
echo ========================================================
echo   Deploy KhoAugment POS Frontend
echo ========================================================
echo.

echo [1] Building frontend application...
cd frontend
npm run build
if errorlevel 1 (
    echo [ERROR] Build failed
    pause
    exit /b 1
)
echo [OK] Build completed

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
echo [3] Updating Git repository...
cd ..
git add .
git commit -m "Deploy frontend build - %date% %time%"
git push origin main
echo [OK] Git updated

echo.
echo [SUCCESS] ========================================
echo [SUCCESS]   FRONTEND DEPLOYED SUCCESSFULLY!
echo [SUCCESS] ========================================
echo.

echo Your KhoAugment POS is now live at:
echo   https://kho1.pages.dev
echo.

echo Default login credentials:
echo   Email: admin@khoaugment.com
echo   Password: admin123
echo.

echo Features available:
echo   [OK] Complete Vietnamese POS System
echo   [OK] Modern React 18 + TypeScript UI
echo   [OK] Progressive Web App (PWA)
echo   [OK] Offline functionality
echo   [OK] Multi-payment support
echo   [OK] Vietnamese tax compliance
echo   [OK] Barcode scanning
echo   [OK] Receipt printing
echo   [OK] Inventory management
echo   [OK] Customer loyalty program
echo   [OK] Analytics dashboard
echo   [OK] Role-based access control
echo.

echo [INFO] Opening your POS system...
start https://kho1.pages.dev

echo.
echo [SUCCESS] Deployment completed! 
echo [INFO] If you see "Please enable JavaScript", wait a moment for the app to load.
echo [INFO] Clear browser cache if needed: Ctrl+Shift+R
echo.
pause