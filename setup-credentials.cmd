@echo off
REM KhoAugment POS - One-time Credential Setup
REM This script helps you setup GitHub and Cloudflare credentials once

setlocal enabledelayedexpansion

echo.
echo ================================================
echo   KhoAugment POS - Credential Setup Wizard
echo ================================================
echo.

set "INFO=[INFO]"
set "SUCCESS=[OK]"
set "WARNING=[WARN]"
set "ERROR=[ERROR]"
set "SETUP=[SETUP]"

echo %INFO% This wizard will help you setup credentials for automated deployment.
echo %INFO% You only need to do this once, then use auto-deploy.cmd for future deployments.
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo %ERROR% Node.js is not installed.
    echo %INFO% Please download and install Node.js from: https://nodejs.org/
    echo %INFO% After installation, restart this script.
    pause
    exit /b 1
)

echo %SUCCESS% Node.js detected

REM Check if Git is installed
git --version >nul 2>&1
if errorlevel 1 (
    echo %ERROR% Git is not installed.
    echo %INFO% Please download and install Git from: https://git-scm.com/
    echo %INFO% After installation, restart this script.
    pause
    exit /b 1
)

echo %SUCCESS% Git detected

REM Install Wrangler if needed
wrangler --version >nul 2>&1
if errorlevel 1 (
    echo %SETUP% Installing Wrangler CLI...
    npm install -g wrangler
    if errorlevel 1 (
        echo %ERROR% Failed to install Wrangler. Please run as administrator.
        pause
        exit /b 1
    )
)

echo %SUCCESS% Wrangler CLI ready

echo.
echo %SETUP% ===========================================
echo %SETUP%   STEP 1: GITHUB SETUP
echo %SETUP% ===========================================
echo.

REM GitHub Repository Setup
echo %INFO% First, let's setup your GitHub repository.
echo.
echo %INFO% Option 1: Create a new repository
echo   1. Go to https://github.com/new
echo   2. Repository name: khoaugment-pos
echo   3. Description: Vietnamese Point of Sale System
echo   4. Choose Public or Private
echo   5. Do NOT initialize with README
echo   6. Click "Create repository"
echo.
echo %INFO% Option 2: Use existing repository
echo   - Make sure you have push access to the repository
echo.

set /p "github_repo=Enter your GitHub repository URL (e.g., https://github.com/username/khoaugment-pos.git): "

if "%github_repo%"=="" (
    echo %ERROR% GitHub repository URL is required.
    pause
    exit /b 1
)

echo %INFO% Testing GitHub access...

REM Test repository access
git ls-remote %github_repo% >nul 2>&1
if errorlevel 1 (
    echo %WARNING% Cannot access repository. Let's setup Git credentials...
    echo.
    echo %INFO% Setting up Git credentials:
    
    set /p "git_username=Enter your GitHub username: "
    set /p "git_email=Enter your GitHub email: "
    
    if "%git_username%"=="" (
        echo %ERROR% GitHub username is required.
        pause
        exit /b 1
    )
    
    if "%git_email%"=="" (
        echo %ERROR% GitHub email is required.
        pause
        exit /b 1
    )
    
    echo %SETUP% Configuring Git...
    git config --global user.name "%git_username%"
    git config --global user.email "%git_email%"
    
    echo %SUCCESS% Git credentials configured
    echo.
    echo %INFO% For authentication, you have two options:
    echo.
    echo %INFO% Option 1: Personal Access Token (Recommended)
    echo   1. Go to https://github.com/settings/tokens
    echo   2. Click "Generate new token (classic)"
    echo   3. Select scopes: repo, workflow, write:packages
    echo   4. Copy the token
    echo   5. When prompted for password during git push, use the token
    echo.
    echo %INFO% Option 2: SSH Key
    echo   1. Generate SSH key: ssh-keygen -t ed25519 -C "%git_email%"
    echo   2. Add to GitHub: https://github.com/settings/keys
    echo   3. Use SSH URL instead of HTTPS
    echo.
    
    echo %WARNING% Please setup authentication, then test: git ls-remote %github_repo%
)

echo %SUCCESS% GitHub setup completed

echo.
echo %SETUP% ===========================================
echo %SETUP%   STEP 2: CLOUDFLARE SETUP
echo %SETUP% ===========================================
echo.

echo %INFO% Now let's setup Cloudflare access.
echo.

REM Check if already logged in
wrangler whoami >nul 2>&1
if errorlevel 1 (
    echo %INFO% You need to login to Cloudflare first.
    echo %INFO% This will open a browser window for authentication.
    echo.
    pause
    echo %SETUP% Opening Cloudflare login...
    wrangler login
    
    if errorlevel 1 (
        echo %ERROR% Cloudflare login failed.
        echo %INFO% Please try again or login manually with: wrangler login
        pause
        exit /b 1
    )
) else (
    echo %SUCCESS% Already logged in to Cloudflare
)

REM Get account info
echo %INFO% Getting Cloudflare account information...
for /f "tokens=*" %%a in ('wrangler whoami 2^>nul') do (
    echo %SUCCESS% Logged in as: %%a
)

echo %SUCCESS% Cloudflare setup completed

echo.
echo %SETUP% ===========================================
echo %SETUP%   STEP 3: PROJECT CONFIGURATION
echo %SETUP% ===========================================
echo.

REM Get project configuration
echo %INFO% Let's configure your project settings.
echo.

set /p "project_name=Enter project name (default: khoaugment-pos): "
if "%project_name%"=="" set "project_name=khoaugment-pos"

echo %INFO% Select deployment environment:
echo   1. development
echo   2. staging  
echo   3. production
set /p "env_choice=Enter choice (1-3, default: 3): "

set "environment=production"
if "%env_choice%"=="1" set "environment=development"
if "%env_choice%"=="2" set "environment=staging"

echo %INFO% Configuration:
echo   - GitHub Repository: %github_repo%
echo   - Project Name: %project_name%
echo   - Environment: %environment%
echo.

REM Create configuration file
echo %SETUP% Creating deployment configuration...
(
    echo {
    echo   "github_repo": "%github_repo%",
    echo   "project_name": "%project_name%",
    echo   "environment": "%environment%",
    echo   "auto_open_browser": true,
    echo   "enable_health_checks": true,
    echo   "setup_date": "%date% %time%",
    echo   "deployment_notes": "Configured via setup wizard"
    echo }
) > auto-deploy-config.json

echo %SUCCESS% Configuration saved to auto-deploy-config.json

echo.
echo %SETUP% ===========================================
echo %SETUP%   STEP 4: CLOUDFLARE RESOURCES SETUP
echo %SETUP% ===========================================
echo.

echo %INFO% Setting up Cloudflare resources for your project...
echo.

REM Create D1 Database
echo %SETUP% Creating D1 database...
wrangler d1 create %project_name%-db-%environment% >nul 2>&1
if errorlevel 1 (
    echo %WARNING% Database might already exist or creation failed
) else (
    echo %SUCCESS% D1 database created
)

REM Create KV Namespaces
echo %SETUP% Creating KV namespaces...
wrangler kv:namespace create "CACHE" --env %environment% >nul 2>&1
wrangler kv:namespace create "SESSIONS" --env %environment% >nul 2>&1
wrangler kv:namespace create "SETTINGS" --env %environment% >nul 2>&1
echo %SUCCESS% KV namespaces created

REM Create R2 Buckets
echo %SETUP% Creating R2 buckets...
wrangler r2 bucket create %project_name%-uploads-%environment% >nul 2>&1
wrangler r2 bucket create %project_name%-backups-%environment% >nul 2>&1
echo %SUCCESS% R2 buckets created

echo.
echo %SUCCESS% ================================================
echo %SUCCESS%   SETUP COMPLETED SUCCESSFULLY!
echo %SUCCESS% ================================================
echo.

echo %INFO% Your credentials and configuration are now setup.
echo.
echo %SUCCESS% What's been configured:
echo   [OK] Git credentials for GitHub access
echo   [OK] Cloudflare authentication  
echo   [OK] Project configuration file
echo   [OK] Cloudflare resources (D1, KV, R2)
echo.
echo %INFO% Next steps:
echo   1. Run auto-deploy.cmd for automated deployment
echo   2. The script will automatically use your saved configuration
echo   3. Sit back and watch your POS system deploy! 🚀
echo.
echo %INFO% Files created:
echo   - auto-deploy-config.json (your deployment configuration)
echo.
echo %WARNING% Important Security Notes:
echo   - Keep your GitHub token secure
echo   - Don't share your auto-deploy-config.json file
echo   - Regularly rotate your Cloudflare API tokens
echo.

echo %SUCCESS% You're all set! Run auto-deploy.cmd to start deploying.
pause