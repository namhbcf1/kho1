@echo off
REM KhoAugment POS - One-Click Deployment
REM Ultimate automation script - just double-click to deploy everything

chcp 65001 >nul 2>&1
setlocal enabledelayedexpansion

title KhoAugment POS - One-Click Deployment

echo.
echo ========================================================
echo   KhoAugment POS - One-Click Deployment
echo ========================================================
echo.
echo   Complete Vietnamese Point of Sale System
echo   Auto-deployment to GitHub + Cloudflare
echo.
echo ========================================================
echo.

REM Visual elements - ASCII compatible
set "ROCKET=>>>"
set "CHECK=[OK]"
set "INFO=[INFO]"
set "WARNING=[WARN]"
set "ERROR=[ERROR]"
set "GEAR=[SETUP]"
set "STAR=[*]"

echo %STAR% Welcome to KhoAugment POS One-Click Deployment!
echo %INFO% This script will automatically deploy your POS system to the cloud.
echo.

REM Check if this is first run
if not exist "auto-deploy-config.json" (
    echo %INFO% First time setup required...
    echo %GEAR% Running credential setup wizard...
    echo.
    call setup-credentials.cmd
    if errorlevel 1 (
        echo %ERROR% Setup failed. Please check the errors above.
        pause
        exit /b 1
    )
)

echo %CHECK% Configuration found, proceeding with deployment...
echo.

REM Show loading animation
echo %GEAR% Preparing deployment...
for /l %%i in (1,1,10) do (
    echo|set /p="."
    timeout /t 1 /nobreak >nul
)
echo.
echo.

REM Run automated deployment
echo %ROCKET% Starting automated deployment...
echo.
call auto-deploy.cmd

if errorlevel 1 (
    echo.
    echo %ERROR% ========================================
    echo %ERROR%   DEPLOYMENT FAILED
    echo %ERROR% ========================================
    echo.
    echo %WARNING% Please check the error messages above.
    echo %INFO% Common solutions:
    echo   - Ensure internet connection is stable
    echo   - Check GitHub and Cloudflare credentials
    echo   - Verify repository access permissions
    echo   - Try running setup-credentials.cmd again
    echo.
    pause
    exit /b 1
)

echo.
echo %CHECK% ========================================
echo %CHECK%   DEPLOYMENT SUCCESSFUL!
echo %CHECK% ========================================
echo.

REM Show success message with animation
echo %STAR% Congratulations! Your KhoAugment POS is now live!
echo.

REM Read deployment info
if exist "deployment-info.json" (
    for /f "tokens=*" %%a in ('type deployment-info.json') do (
        echo %%a | findstr "timestamp" >nul && (
            for /f "tokens=2 delims=:" %%b in ("%%a") do (
                set "deploy_time=%%b"
                set "deploy_time=!deploy_time:"=!"
                set "deploy_time=!deploy_time:,=!"
                echo %INFO% Deployed at: !deploy_time!
            )
        )
    )
)

echo.
echo %ROCKET% Your applications are now available at:
echo   + Frontend: https://kho1.pages.dev
echo   + Backend API: https://kho1-api.workers.dev
echo   + GitHub: https://github.com/namhbcf1/kho1
echo   + Cloudflare Dashboard: https://dash.cloudflare.com/5b62d10947844251d23e0eac532531dd/pages/view/kho1
echo.
echo %INFO% Default Login Credentials:
echo   + Email: admin@khoaugment.com
echo   + Password: admin123
echo.
echo %STAR% Features now available:
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
echo %INFO% Next steps:
echo   1. Open your POS system in browser
echo   2. Login with the credentials above
echo   3. Configure your store settings
echo   4. Add your products and categories
echo   5. Start selling and managing your business!
echo.

REM Ask to open browser
echo %INFO% Would you like to open your POS system now?
set /p "open_app=Press Y to open, or any key to exit: "

if /i "%open_app%"=="y" (
    echo %ROCKET% Opening your KhoAugment POS system...
    start https://kho1.pages.dev
    timeout /t 2 /nobreak >nul
    echo %CHECK% Browser opened! Enjoy your new POS system!
) else (
    echo %INFO% You can access your POS system anytime at:
    echo   https://kho1.pages.dev
)

echo.
echo %STAR% ========================================
echo %STAR%   THANK YOU FOR USING KHOAUGMENT POS!
echo %STAR% ========================================
echo.
echo %INFO% Support:
echo   + Email: support@khoaugment.com
echo   + Documentation: Available in your repository
echo   + Issues: Create GitHub issues for bugs
echo   + Discussions: Use GitHub Discussions
echo.
echo %CHECK% Deployment completed successfully!
echo %INFO% You can run this script again anytime to redeploy.
echo.
echo %ROCKET% Happy selling!
echo.
pause