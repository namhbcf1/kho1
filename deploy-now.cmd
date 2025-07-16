@echo off
setlocal enabledelayedexpansion

title KhoAugment POS Deploy

echo.
echo ========================================================
echo   KhoAugment POS - Deploy Now
echo ========================================================
echo.

echo [INFO] Starting deployment...
echo.

REM Configure Git
echo [INFO] Configuring Git...
git config --global user.name "namhbcf1"

set /p "email=Enter your GitHub email: "
git config --global user.email "%email%"

echo [INFO] Opening GitHub token page...
start https://github.com/settings/tokens/new?scopes=repo,workflow

echo.
echo [INFO] Create a token with 'repo' and 'workflow' scopes
echo.

set /p "token=Paste your GitHub token: "

echo [INFO] Setting up repository...
git init
git branch -M main
git remote remove origin 2>nul
git remote add origin https://%token%@github.com/namhbcf1/kho1.git

echo [INFO] Adding files and committing...
git add .
git commit -m "Deploy KhoAugment POS System"

echo [INFO] Pushing to GitHub...
git push -u origin main

if errorlevel 1 (
    echo [ERROR] Failed to push to GitHub
    pause
    exit /b 1
)

echo [OK] Pushed to GitHub successfully

echo [INFO] Opening Cloudflare for authentication...
start https://dash.cloudflare.com/login

echo [INFO] Press any key after logging into Cloudflare...
pause

echo [INFO] Authenticating Cloudflare...
wrangler login

echo [INFO] Deploying to Cloudflare Pages...
wrangler pages deploy . --project-name kho1

echo.
echo [SUCCESS] Deployment completed!
echo.
echo Your apps are live at:
echo   Frontend: https://kho1.pages.dev
echo   GitHub: https://github.com/namhbcf1/kho1
echo.

echo [INFO] Opening your applications...
start https://kho1.pages.dev
start https://github.com/namhbcf1/kho1

echo.
echo [SUCCESS] Done! Your POS system is deployed.
pause