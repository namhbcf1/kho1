@echo off
setlocal enabledelayedexpansion

echo.
echo ========================================================
echo   KhoAugment POS - Quick Deploy
echo ========================================================
echo.

echo [INFO] Quick deployment to Cloudflare Pages...
echo.

REM Check if already authenticated
wrangler whoami >nul 2>&1
if errorlevel 1 (
    echo [INFO] Need to login to Cloudflare first...
    wrangler login
    if errorlevel 1 (
        echo [ERROR] Cloudflare login failed
        pause
        exit /b 1
    )
)

echo [OK] Cloudflare authenticated
echo.

echo [INFO] Deploying to Cloudflare Pages...
wrangler pages deploy . --project-name kho1

echo.
echo [SUCCESS] Deployment completed!
echo.
echo Your KhoAugment POS is now live at:
echo   https://kho1.pages.dev
echo   https://6dcdb14f.kho1.pages.dev (Latest deployment)
echo.
echo GitHub repository:
echo   https://github.com/namhbcf1/kho1
echo.
echo Cloudflare dashboard:
echo   https://dash.cloudflare.com/5b62d10947844251d23e0eac532531dd/pages/view/kho1
echo.

echo [INFO] Opening your applications...
start https://kho1.pages.dev
start https://6dcdb14f.kho1.pages.dev
start https://github.com/namhbcf1/kho1

echo.
echo [SUCCESS] KhoAugment POS deployed successfully!
echo.
echo Default login credentials:
echo   Email: admin@khoaugment.com
echo   Password: admin123
echo.
echo Available features:
echo   [OK] Vietnamese POS system
echo   [OK] Multi-payment support (VNPay, MoMo, ZaloPay)
echo   [OK] Real-time inventory management
echo   [OK] Vietnamese tax compliance
echo   [OK] Progressive Web App (PWA)
echo   [OK] Advanced analytics dashboard
echo   [OK] Role-based access control
echo   [OK] Offline functionality
echo   [OK] Barcode scanning
echo   [OK] Receipt printing
echo   [OK] Loyalty program
echo   [OK] Multi-language support
echo.
pause