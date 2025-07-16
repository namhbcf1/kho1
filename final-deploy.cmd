@echo off
setlocal enabledelayedexpansion

echo.
echo ========================================================
echo   KhoAugment POS - Final Deploy
echo ========================================================
echo.

echo [1] Configuring Git...
git config --global user.name "namhbcf1"

:ask_email
set /p "email=Your GitHub email: "
if "%email%"=="" goto ask_email
git config --global user.email "%email%"
echo [OK] Git configured

echo.
echo [2] Opening GitHub token page...
start https://github.com/settings/tokens/new?scopes=repo,workflow^&description=KhoAugment-Deploy
echo.
echo Create a token with 'repo' and 'workflow' scopes, then copy it.
echo.

:ask_token
set /p "token=Paste GitHub token: "
if "%token%"=="" goto ask_token

echo.
echo [3] Setting up Git repository...
if not exist ".git" git init
git branch -M main
git remote remove origin 2>nul
git remote add origin https://%token%@github.com/namhbcf1/kho1.git
echo [OK] Repository configured

echo.
echo [4] Committing code...
git add .
git commit -m "KhoAugment POS System - Production Deploy"
echo [OK] Code committed

echo.
echo [5] Pushing to GitHub...
git push -u origin main
if errorlevel 1 (
    echo [ERROR] Push failed - check your token
    pause
    exit /b 1
)
echo [OK] Code pushed to GitHub

echo.
echo [6] Opening Cloudflare...
start https://dash.cloudflare.com/login
echo.
echo Login to Cloudflare, then press any key...
pause

echo.
echo [7] Cloudflare authentication...
wrangler login
if errorlevel 1 (
    echo [ERROR] Cloudflare auth failed
    pause
    exit /b 1
)
echo [OK] Cloudflare authenticated

echo.
echo [8] Deploying to Cloudflare Pages...
wrangler pages deploy . --project-name kho1 --compatibility-date 2024-01-15
if errorlevel 1 (
    echo [ERROR] Cloudflare deploy failed
    pause
    exit /b 1
)
echo [OK] Deployed to Cloudflare

echo.
echo ========================================================
echo   DEPLOYMENT SUCCESSFUL!
echo ========================================================
echo.
echo Your KhoAugment POS is now live at:
echo   https://kho1.pages.dev
echo.
echo GitHub repository:
echo   https://github.com/namhbcf1/kho1
echo.
echo Cloudflare dashboard:
echo   https://dash.cloudflare.com/5b62d10947844251d23e0eac532531dd/pages/view/kho1
echo.

echo Opening your applications...
start https://kho1.pages.dev
start https://github.com/namhbcf1/kho1
start https://dash.cloudflare.com/5b62d10947844251d23e0eac532531dd/pages/view/kho1

echo.
echo [SUCCESS] KhoAugment POS deployed successfully!
echo Login credentials: admin@khoaugment.com / admin123
echo.
pause