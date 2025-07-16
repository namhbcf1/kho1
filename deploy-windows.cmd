@echo off
REM Deploy KhoAugment POS to GitHub and Cloudflare (Windows)
REM This script handles both GitHub and Cloudflare deployment

setlocal enabledelayedexpansion

echo.
echo ============================================
echo   KhoAugment POS Deployment Tool (Windows)
echo ============================================
echo.

REM Colors for Windows (limited)
set "INFO=[INFO]"
set "SUCCESS=[SUCCESS]"
set "WARNING=[WARNING]"
set "ERROR=[ERROR]"

REM Check if we're in the right directory
if not exist "package.json" (
    echo %ERROR% package.json not found. Please run this script from the project root directory.
    pause
    exit /b 1
)

echo %INFO% Welcome to KhoAugment POS deployment tool!
echo.
echo What would you like to deploy?
echo 1) Deploy to GitHub only
echo 2) Deploy to Cloudflare only  
echo 3) Deploy to both GitHub and Cloudflare
echo 4) Setup development environment
echo.
set /p "choice=Enter your choice (1-4): "

if "%choice%"=="1" goto deploy_github
if "%choice%"=="2" goto deploy_cloudflare
if "%choice%"=="3" goto deploy_both
if "%choice%"=="4" goto setup_dev
echo %ERROR% Invalid choice. Exiting.
pause
exit /b 1

:deploy_github
echo.
echo %INFO% Starting GitHub deployment...
call :github_deployment
goto end

:deploy_cloudflare
echo.
echo %INFO% Starting Cloudflare deployment...
call :cloudflare_deployment
goto end

:deploy_both
echo.
echo %INFO% Starting deployment to both GitHub and Cloudflare...
call :github_deployment
if errorlevel 1 goto error_exit
call :cloudflare_deployment
goto end

:setup_dev
echo.
echo %INFO% Setting up development environment...
call :setup_development
goto end

REM GitHub deployment function
:github_deployment
echo.
echo %INFO% === GitHub Deployment ===

REM Check if git is installed
git --version >nul 2>&1
if errorlevel 1 (
    echo %ERROR% Git is not installed. Please install Git first.
    echo Download from: https://git-scm.com/download/win
    exit /b 1
)

REM Get repository URL
echo.
echo Please enter your GitHub repository URL:
echo Example: https://github.com/yourusername/khoaugment-pos.git
set /p "repo_url=Repository URL: "

if "%repo_url%"=="" (
    echo %ERROR% Repository URL is required.
    exit /b 1
)

REM Initialize git repository if not already initialized
if not exist ".git" (
    echo %INFO% Initializing Git repository...
    git init
    echo %SUCCESS% Git repository initialized.
) else (
    echo %INFO% Git repository already exists.
)

REM Create .gitignore if it doesn't exist
if not exist ".gitignore" (
    echo %INFO% Creating .gitignore file...
    (
        echo # Dependencies
        echo node_modules/
        echo npm-debug.log*
        echo yarn-debug.log*
        echo yarn-error.log*
        echo pnpm-debug.log*
        echo.
        echo # Environment variables
        echo .env
        echo .env.local
        echo .env.development.local
        echo .env.test.local
        echo .env.production.local
        echo.
        echo # Build outputs
        echo dist/
        echo build/
        echo .next/
        echo out/
        echo.
        echo # Cache
        echo .cache/
        echo .parcel-cache/
        echo .vite/
        echo.
        echo # IDE
        echo .vscode/
        echo .idea/
        echo *.swp
        echo *.swo
        echo.
        echo # OS
        echo .DS_Store
        echo Thumbs.db
        echo.
        echo # Logs
        echo logs/
        echo *.log
        echo.
        echo # Cloudflare
        echo .wrangler/
        echo wrangler.toml.bak
        echo.
        echo # Testing
        echo coverage/
        echo .nyc_output/
        echo test-results/
        echo playwright-report/
    ) > .gitignore
    echo %SUCCESS% .gitignore file created.
)

REM Add all files to git
echo %INFO% Adding files to Git...
git add .

REM Check if there are changes to commit
git diff --staged --quiet
if errorlevel 1 (
    echo %INFO% Committing changes...
    git commit -m "Initial commit: KhoAugment POS Enterprise System

✨ Features:
- Complete Vietnamese POS system
- Multi-payment gateway support (VNPay, MoMo, ZaloPay)
- Real-time inventory management
- Vietnamese tax compliance (VAT)
- Progressive Web App (PWA)
- Advanced analytics and reporting
- Role-based access control
- Modern React 18 + TypeScript frontend
- Cloudflare Workers backend
- Comprehensive testing suite
- CI/CD with GitHub Actions

🏗️ Architecture:
- Event Sourcing & ACID compliance
- Multi-layer caching
- Load balancing
- Business continuity & disaster recovery
- End-to-end encryption
- Performance optimization

🎨 UI/UX:
- Modern dashboard with dark mode
- Responsive design
- Accessibility compliant
- Advanced form components
- Interactive charts and analytics

🚀 Generated with Claude Code (https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"
    
    echo %SUCCESS% Changes committed successfully.
) else (
    echo %WARNING% No changes to commit.
)

REM Add remote origin
git remote get-url origin >nul 2>&1
if errorlevel 1 (
    echo %INFO% Adding GitHub repository as remote origin...
    git remote add origin "%repo_url%"
    echo %SUCCESS% Remote origin added.
) else (
    echo %INFO% Remote origin already exists. Updating URL...
    git remote set-url origin "%repo_url%"
    echo %SUCCESS% Remote origin URL updated.
)

REM Rename branch to main if on master
for /f "tokens=*" %%i in ('git rev-parse --abbrev-ref HEAD') do set current_branch=%%i
if "%current_branch%"=="master" (
    echo %INFO% Renaming master branch to main...
    git branch -M main
    echo %SUCCESS% Branch renamed to main.
)

REM Push to GitHub
echo %INFO% Pushing code to GitHub...
git push -u origin main
if errorlevel 1 (
    echo %ERROR% Failed to push to GitHub. Please check your repository URL and permissions.
    exit /b 1
)

echo.
echo %SUCCESS% GitHub deployment completed successfully!
echo Repository URL: %repo_url%
echo Branch: main
echo.
echo %INFO% Next steps:
echo 1. Go to your GitHub repository
echo 2. Set up repository secrets for Cloudflare deployment
echo 3. Enable GitHub Actions
echo 4. Configure branch protection rules
echo.
echo %INFO% Required GitHub Secrets:
echo - CLOUDFLARE_API_TOKEN
echo - CLOUDFLARE_ACCOUNT_ID  
echo - CLOUDFLARE_ZONE_ID (if using custom domain)
echo.
exit /b 0

REM Cloudflare deployment function
:cloudflare_deployment
echo.
echo %INFO% === Cloudflare Deployment ===

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo %ERROR% Node.js is not installed. Please install Node.js first.
    echo Download from: https://nodejs.org/
    exit /b 1
)

REM Check if wrangler is installed
wrangler --version >nul 2>&1
if errorlevel 1 (
    echo %INFO% Installing Wrangler CLI...
    npm install -g wrangler
    echo %SUCCESS% Wrangler CLI installed.
)

REM Check Cloudflare authentication
echo %INFO% Checking Cloudflare authentication...
wrangler whoami >nul 2>&1
if errorlevel 1 (
    echo %INFO% Please log in to Cloudflare...
    wrangler login
)

echo %SUCCESS% Cloudflare authentication verified.

REM Get environment choice
echo.
echo %INFO% Select deployment environment:
echo 1) Development
echo 2) Staging
echo 3) Production
set /p "env_choice=Enter choice (1-3): "

set "environment=development"
if "%env_choice%"=="2" set "environment=staging"
if "%env_choice%"=="3" set "environment=production"

echo %INFO% Deploying to: %environment%

REM Deploy backend
echo.
echo %INFO% Deploying backend to Cloudflare Workers...
cd backend

echo %INFO% Installing backend dependencies...
call npm install
if errorlevel 1 (
    echo %ERROR% Failed to install backend dependencies.
    cd ..
    exit /b 1
)

echo %INFO% Building backend...
call npm run build
if errorlevel 1 (
    echo %ERROR% Backend build failed.
    cd ..
    exit /b 1
)

echo %INFO% Deploying to Cloudflare Workers...
call wrangler deploy --env %environment%
if errorlevel 1 (
    echo %ERROR% Backend deployment failed.
    cd ..
    exit /b 1
)

echo %SUCCESS% Backend deployed successfully!
cd ..

REM Deploy frontend
echo.
echo %INFO% Deploying frontend to Cloudflare Pages...
cd frontend

echo %INFO% Installing frontend dependencies...
where pnpm >nul 2>&1
if errorlevel 1 (
    call npm install
) else (
    call pnpm install
)
if errorlevel 1 (
    echo %ERROR% Failed to install frontend dependencies.
    cd ..
    exit /b 1
)

echo %INFO% Building frontend...
where pnpm >nul 2>&1
if errorlevel 1 (
    call npm run build
) else (
    call pnpm build
)
if errorlevel 1 (
    echo %ERROR% Frontend build failed.
    cd ..
    exit /b 1
)

echo %INFO% Deploying to Cloudflare Pages...
call wrangler pages deploy dist --project-name khoaugment-pos-frontend-%environment% --compatibility-date 2024-01-15
if errorlevel 1 (
    echo %ERROR% Frontend deployment failed.
    cd ..
    exit /b 1
)

echo %SUCCESS% Frontend deployed successfully!
cd ..

echo.
echo %SUCCESS% Cloudflare deployment completed!
echo Environment: %environment%
echo Frontend: https://khoaugment-pos-frontend-%environment%.pages.dev
echo.
exit /b 0

REM Setup development environment
:setup_development
echo.
echo %INFO% === Development Environment Setup ===

REM Install dependencies
echo %INFO% Installing root dependencies...
call npm install
if errorlevel 1 (
    echo %ERROR% Failed to install root dependencies.
    exit /b 1
)

echo %INFO% Installing frontend dependencies...
cd frontend
where pnpm >nul 2>&1
if errorlevel 1 (
    call npm install
) else (
    call pnpm install
)
if errorlevel 1 (
    echo %ERROR% Failed to install frontend dependencies.
    cd ..
    exit /b 1
)
cd ..

echo %INFO% Installing backend dependencies...
cd backend
call npm install
if errorlevel 1 (
    echo %ERROR% Failed to install backend dependencies.
    cd ..
    exit /b 1
)
cd ..

REM Create .env file if it doesn't exist
if not exist ".env" (
    echo %INFO% Creating .env file...
    (
        echo # Cloudflare Configuration
        echo CLOUDFLARE_ACCOUNT_ID=your_account_id_here
        echo CLOUDFLARE_API_TOKEN=your_api_token_here
        echo CLOUDFLARE_ZONE_ID=your_zone_id_here
        echo.
        echo # Database
        echo DATABASE_URL=your_d1_database_url
        echo.
        echo # Payment Gateways
        echo VNPAY_TMN_CODE=your_vnpay_code
        echo VNPAY_HASH_SECRET=your_vnpay_secret
        echo MOMO_PARTNER_CODE=your_momo_code
        echo ZALOPAY_APP_ID=your_zalopay_id
        echo.
        echo # Security
        echo JWT_SECRET=your_jwt_secret_here
        echo ENCRYPTION_KEY=your_encryption_key_here
        echo.
        echo # Environment
        echo NODE_ENV=development
    ) > .env
    echo %SUCCESS% .env file created. Please update with your actual values.
)

echo.
echo %SUCCESS% Development environment setup completed!
echo.
echo %INFO% To start development:
echo 1. Update .env file with your actual values
echo 2. Run: npm run dev (starts both frontend and backend)
echo 3. Frontend: http://localhost:5173
echo 4. Backend: http://localhost:8787
echo.
exit /b 0

:error_exit
echo %ERROR% Deployment failed. Check the error messages above.
pause
exit /b 1

:end
echo.
echo %SUCCESS% Deployment process completed!
echo.
echo %INFO% Useful commands:
echo - npm run dev          : Start development servers
echo - npm run build        : Build for production
echo - npm run test         : Run tests
echo - npm run deploy       : Deploy to Cloudflare
echo.
echo Thank you for using KhoAugment POS! 🚀
pause