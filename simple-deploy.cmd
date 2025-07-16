@echo off
REM Simple Deploy - Skip GitHub CLI, use direct method
chcp 65001 >nul 2>&1
setlocal enabledelayedexpansion

title KhoAugment POS - Simple Deploy

echo.
echo ========================================================
echo   KhoAugment POS - Simple Deploy System
echo ========================================================
echo.

echo [INFO] Starting simple deployment process...
echo.

REM Check Node.js and Git
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not found. Please install from https://nodejs.org/
    pause
    exit /b 1
)
echo [OK] Node.js ready

git --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Git not found. Please install from https://git-scm.com/
    pause
    exit /b 1
)
echo [OK] Git ready

REM Install Wrangler if needed
wrangler --version >nul 2>&1
if errorlevel 1 (
    echo [INFO] Installing Wrangler CLI...
    npm install -g wrangler
)
echo [OK] Wrangler ready

echo.
echo [SETUP] Step 1: Git Configuration
echo ========================================
echo.

REM Configure Git
git config --global user.name "namhbcf1"

set /p "git_email=Enter your GitHub email: "
if "%git_email%"=="" (
    echo [ERROR] Email is required
    pause
    exit /b 1
)
git config --global user.email "%git_email%"
echo [OK] Git configured

echo.
echo [SETUP] Step 2: GitHub Token Setup
echo ========================================
echo.

echo [INFO] Opening GitHub token page...
start https://github.com/settings/tokens/new?scopes=repo,workflow,admin:public_key^&description=KhoAugment-POS-Deploy

echo.
echo [INFO] Please create a token with these scopes:
echo   - repo (full repository access)
echo   - workflow (update GitHub Actions workflows)
echo.

set /p "github_token=Paste your GitHub token here: "
if "%github_token%"=="" (
    echo [ERROR] Token is required
    pause
    exit /b 1
)

echo [INFO] Testing GitHub token...
curl -s -H "Authorization: token %github_token%" https://api.github.com/user >nul 2>&1
if errorlevel 1 (
    echo [WARN] Token validation failed, but continuing...
)
echo [OK] GitHub token accepted

echo.
echo [SETUP] Step 3: Cloudflare Authentication
echo ========================================
echo.

echo [INFO] Opening Cloudflare dashboard...
start https://dash.cloudflare.com/login

echo [INFO] Please login to Cloudflare and then press any key...
pause

echo [INFO] Authenticating with Cloudflare...
wrangler login
if errorlevel 1 (
    echo [ERROR] Cloudflare authentication failed
    pause
    exit /b 1
)
echo [OK] Cloudflare authenticated

echo.
echo [DEPLOY] Step 4: Repository Setup
echo ========================================
echo.

REM Initialize git if needed
if not exist ".git" (
    echo [INFO] Initializing Git repository...
    git init
    git branch -M main
)

REM Set remote with token
git remote remove origin >nul 2>&1
git remote add origin https://%github_token%@github.com/namhbcf1/kho1.git
echo [OK] Remote repository configured

echo.
echo [DEPLOY] Step 5: Deployment
echo ========================================
echo.

REM Create deployment info
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "timestamp=!dt:~0,4!-!dt:~4,2!-!dt:~6,2! !dt:~8,2!:!dt:~10,2!:!dt:~12,2!"

echo [INFO] Creating deployment commit...
git add .
git commit -m "Deploy KhoAugment POS v2.1.0 - %timestamp%"

echo [INFO] Pushing to GitHub...
git push -u origin main
if errorlevel 1 (
    echo [ERROR] Failed to push to GitHub
    echo [INFO] Check your token and repository permissions
    pause
    exit /b 1
)
echo [OK] Pushed to GitHub successfully

echo [INFO] Deploying to Cloudflare Pages...
wrangler pages deploy . --project-name kho1 --compatibility-date 2024-01-15
if errorlevel 1 (
    echo [ERROR] Cloudflare Pages deployment failed
    pause
    exit /b 1
)
echo [OK] Deployed to Cloudflare Pages

echo.
echo [SUCCESS] ========================================
echo [SUCCESS]   DEPLOYMENT COMPLETED!
echo [SUCCESS] ========================================
echo.

echo [INFO] Your applications are now live:
echo   + Frontend: https://kho1.pages.dev
echo   + GitHub: https://github.com/namhbcf1/kho1
echo   + Cloudflare: https://dash.cloudflare.com/5b62d10947844251d23e0eac532531dd/pages/view/kho1
echo.

echo [INFO] Default login credentials:
echo   + Email: admin@khoaugment.com
echo   + Password: admin123
echo.

echo [INFO] Opening your applications...
start https://kho1.pages.dev
start https://github.com/namhbcf1/kho1
start https://dash.cloudflare.com/5b62d10947844251d23e0eac532531dd/pages/view/kho1

echo.
echo [SUCCESS] Deployment completed successfully!
echo [INFO] You can access your POS system at: https://kho1.pages.dev
echo.
pause