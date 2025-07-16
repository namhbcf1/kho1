@echo off
REM Simple Authentication Setup for KhoAugment POS
chcp 65001 >nul 2>&1
setlocal enabledelayedexpansion

title KhoAugment POS - Authentication Setup

echo.
echo ========================================================
echo   KhoAugment POS - Authentication Setup
echo ========================================================
echo.

echo [INFO] This script will help you setup authentication for:
echo   + GitHub repository: https://github.com/namhbcf1/kho1
echo   + Cloudflare Pages: https://kho1.pages.dev
echo.

echo [SETUP] Step 1: GitHub Authentication
echo ========================================
echo.

REM Check if git is installed
git --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Git is not installed.
    echo [INFO] Please install Git from: https://git-scm.com/
    pause
    exit /b 1
)

echo [OK] Git is installed

REM Check if gh CLI is available
gh --version >nul 2>&1
if errorlevel 1 (
    echo [INFO] GitHub CLI not found. Let's setup Git credentials instead.
    echo.
    echo [INFO] Please setup Git credentials:
    echo.
    
    set /p "git_username=Enter your GitHub username (namhbcf1): "
    if "%git_username%"=="" set "git_username=namhbcf1"
    
    set /p "git_email=Enter your GitHub email: "
    if "%git_email%"=="" (
        echo [ERROR] Email is required
        pause
        exit /b 1
    )
    
    echo [SETUP] Configuring Git credentials...
    git config --global user.name "%git_username%"
    git config --global user.email "%git_email%"
    
    echo [OK] Git credentials configured
    echo.
    echo [INFO] For authentication, you have two options:
    echo.
    echo [INFO] Option 1: Personal Access Token (Recommended)
    echo   1. Go to: https://github.com/settings/tokens
    echo   2. Click "Generate new token (classic)"
    echo   3. Select scopes: repo, workflow
    echo   4. Copy the token
    echo   5. When git asks for password, use the token
    echo.
    echo [INFO] Option 2: Use your GitHub password
    echo   - Git will prompt for password during push
    echo.
    
    echo [WARN] Please setup authentication before proceeding
    pause
    
) else (
    echo [OK] GitHub CLI found
    echo [INFO] Please login to GitHub:
    echo.
    gh auth login
    if errorlevel 1 (
        echo [ERROR] GitHub authentication failed
        pause
        exit /b 1
    )
    echo [OK] GitHub authentication successful
)

echo.
echo [SETUP] Step 2: Cloudflare Authentication
echo ========================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed.
    echo [INFO] Please install Node.js from: https://nodejs.org/
    pause
    exit /b 1
)

echo [OK] Node.js is installed

REM Check if wrangler is installed
wrangler --version >nul 2>&1
if errorlevel 1 (
    echo [INFO] Installing Wrangler CLI...
    npm install -g wrangler
    if errorlevel 1 (
        echo [ERROR] Failed to install Wrangler. Please run as administrator.
        pause
        exit /b 1
    )
)

echo [OK] Wrangler CLI is ready

echo [INFO] Please login to Cloudflare:
echo.
wrangler login
if errorlevel 1 (
    echo [ERROR] Cloudflare authentication failed
    pause
    exit /b 1
)

echo [OK] Cloudflare authentication successful

echo.
echo [SETUP] Step 3: Test Authentication
echo ========================================
echo.

echo [INFO] Testing GitHub access...
git ls-remote https://github.com/namhbcf1/kho1.git >nul 2>&1
if errorlevel 1 (
    echo [WARN] Cannot access GitHub repository yet
    echo [INFO] You may need to authenticate during the first push
) else (
    echo [OK] GitHub repository access confirmed
)

echo [INFO] Testing Cloudflare access...
wrangler whoami >nul 2>&1
if errorlevel 1 (
    echo [WARN] Cloudflare authentication may need refresh
) else (
    echo [OK] Cloudflare access confirmed
)

echo.
echo [OK] ========================================
echo [OK]   AUTHENTICATION SETUP COMPLETE!
echo [OK] ========================================
echo.

echo [INFO] What's been setup:
echo   [OK] Git credentials configured
echo   [OK] GitHub authentication ready
echo   [OK] Cloudflare authentication ready
echo   [OK] Wrangler CLI installed and configured
echo.

echo [INFO] Next steps:
echo   1. Run: run-deployment.cmd
echo   2. The script will now be able to upload to GitHub and Cloudflare
echo   3. If prompted for password, use your Personal Access Token
echo.

echo [INFO] Your repositories:
echo   + GitHub: https://github.com/namhbcf1/kho1
echo   + Cloudflare: https://kho1.pages.dev
echo   + Dashboard: https://dash.cloudflare.com/5b62d10947844251d23e0eac532531dd/pages/view/kho1
echo.

echo [OK] Ready to deploy! Run run-deployment.cmd when ready.
pause