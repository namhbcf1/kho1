@echo off
REM Simplified deployment script - ASCII only
chcp 65001 >nul 2>&1
setlocal enabledelayedexpansion

title KhoAugment POS - Deployment

echo.
echo ========================================================
echo   KhoAugment POS - Deployment Tool
echo ========================================================
echo.
echo   Complete Vietnamese Point of Sale System
echo   Auto-deployment to GitHub + Cloudflare
echo.
echo ========================================================
echo.

echo [INFO] Starting deployment process...
echo.

REM Check if this is first run
if not exist "auto-deploy-config.json" (
    echo [INFO] First time setup required...
    echo [SETUP] Running credential setup wizard...
    echo.
    call setup-credentials.cmd
    if errorlevel 1 (
        echo [ERROR] Setup failed. Please check the errors above.
        pause
        exit /b 1
    )
)

echo [OK] Configuration found, proceeding with deployment...
echo.

REM Show loading
echo [SETUP] Preparing deployment...
for /l %%i in (1,1,5) do (
    echo|set /p="."
    timeout /t 1 /nobreak >nul
)
echo.
echo.

REM Run automated deployment
echo [>>>] Starting automated deployment...
echo.
call auto-deploy.cmd

if errorlevel 1 (
    echo.
    echo [ERROR] ========================================
    echo [ERROR]   DEPLOYMENT FAILED
    echo [ERROR] ========================================
    echo.
    echo [WARN] Please check the error messages above.
    echo [INFO] Common solutions:
    echo   - Ensure internet connection is stable
    echo   - Check GitHub and Cloudflare credentials
    echo   - Verify repository access permissions
    echo   - Try running setup-credentials.cmd again
    echo.
    pause
    exit /b 1
)

echo.
echo [OK] ========================================
echo [OK]   DEPLOYMENT SUCCESSFUL!
echo [OK] ========================================
echo.

echo [*] Congratulations! Your KhoAugment POS is now live!
echo.

echo [>>>] Your applications are now available at:
echo   + Frontend: https://khoaugment-pos-frontend.pages.dev
echo   + Backend API: https://khoaugment-pos-api.workers.dev
echo   + GitHub: https://github.com/yourusername/khoaugment-pos
echo.
echo [INFO] Default Login Credentials:
echo   + Email: admin@khoaugment.com
echo   + Password: admin123
echo.
echo [*] Features now available:
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
echo [INFO] Next steps:
echo   1. Open your POS system in browser
echo   2. Login with the credentials above
echo   3. Configure your store settings
echo   4. Add your products and categories
echo   5. Start selling and managing your business!
echo.

REM Ask to open browser
echo [INFO] Would you like to open your POS system now?
set /p "open_app=Press Y to open, or any key to exit: "

if /i "%open_app%"=="y" (
    echo [>>>] Opening your KhoAugment POS system...
    start https://khoaugment-pos-frontend.pages.dev
    timeout /t 2 /nobreak >nul
    echo [OK] Browser opened! Enjoy your new POS system!
) else (
    echo [INFO] You can access your POS system anytime at:
    echo   https://khoaugment-pos-frontend.pages.dev
)

echo.
echo [*] ========================================
echo [*]   THANK YOU FOR USING KHOAUGMENT POS!
echo [*] ========================================
echo.
echo [INFO] Support:
echo   + Email: support@khoaugment.com
echo   + Documentation: Available in your repository
echo   + Issues: Create GitHub issues for bugs
echo   + Discussions: Use GitHub Discussions
echo.
echo [OK] Deployment completed successfully!
echo [INFO] You can run this script again anytime to redeploy.
echo.
echo [>>>] Happy selling!
echo.
pause