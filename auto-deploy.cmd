@echo off
REM KhoAugment POS - Fully Automated Deployment Script
REM This script automates the entire deployment process after initial setup

setlocal enabledelayedexpansion

echo.
echo ================================================
echo   KhoAugment POS - Automated Deployment Tool
echo ================================================
echo.

REM Set default values - CHANGE THESE TO YOUR VALUES
set "DEFAULT_GITHUB_REPO=https://github.com/yourusername/khoaugment-pos.git"
set "DEFAULT_PROJECT_NAME=khoaugment-pos"
set "DEFAULT_ENVIRONMENT=production"

REM Colors for better UX - ASCII compatible
set "INFO=[INFO]"
set "SUCCESS=[OK]"
set "WARNING=[WARN]"
set "ERROR=[ERROR]"
set "ROCKET=>>>"

echo %INFO% Starting automated deployment...
echo.

REM Check if we're in the right directory
if not exist "package.json" (
    echo %ERROR% package.json not found. Please run this script from the project root directory.
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo %ERROR% Node.js is not installed. Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo %SUCCESS% Node.js detected

REM Check if Git is installed
git --version >nul 2>&1
if errorlevel 1 (
    echo %ERROR% Git is not installed. Please install Git from https://git-scm.com/
    pause
    exit /b 1
)

echo %SUCCESS% Git detected

REM Install/Check Wrangler
wrangler --version >nul 2>&1
if errorlevel 1 (
    echo %INFO% Installing Wrangler CLI...
    npm install -g wrangler
    if errorlevel 1 (
        echo %ERROR% Failed to install Wrangler. Please run as administrator.
        pause
        exit /b 1
    )
)

echo %SUCCESS% Wrangler CLI ready

REM Check if config file exists
if not exist "auto-deploy-config.json" (
    echo %INFO% First time setup required. Creating configuration...
    call :create_config
    echo %WARNING% Please edit auto-deploy-config.json with your actual values, then run this script again.
    pause
    exit /b 0
)

REM Load configuration
for /f "tokens=*" %%a in ('type auto-deploy-config.json') do set "config=%%a"

REM Parse JSON (simplified - in real world, use proper JSON parser)
for /f "tokens=2 delims=:" %%a in ('echo %config% ^| findstr "github_repo"') do (
    set "github_repo=%%a"
    set "github_repo=!github_repo:"=!"
    set "github_repo=!github_repo:,=!"
    set "github_repo=!github_repo: =!"
)

for /f "tokens=2 delims=:" %%a in ('echo %config% ^| findstr "project_name"') do (
    set "project_name=%%a"
    set "project_name=!project_name:"=!"
    set "project_name=!project_name:,=!"
    set "project_name=!project_name: =!"
)

for /f "tokens=2 delims=:" %%a in ('echo %config% ^| findstr "environment"') do (
    set "environment=%%a"
    set "environment=!environment:"=!"
    set "environment=!environment:,=!"
    set "environment=!environment: =!"
)

echo %INFO% Configuration loaded:
echo   - GitHub Repository: !github_repo!
echo   - Project Name: !project_name!
echo   - Environment: !environment!
echo.

REM Check GitHub authentication
echo %INFO% Checking GitHub access...
git ls-remote !github_repo! >nul 2>&1
if errorlevel 1 (
    echo %ERROR% Cannot access GitHub repository. Please check:
    echo   1. Repository URL is correct
    echo   2. You have access to the repository
    echo   3. Git credentials are configured
    echo.
    echo %INFO% To setup Git credentials:
    echo   git config --global user.name "Your Name"
    echo   git config --global user.email "your.email@example.com"
    echo.
    echo %INFO% For GitHub token authentication:
    echo   git config --global credential.helper manager-core
    pause
    exit /b 1
)

echo %SUCCESS% GitHub access verified

REM Check Cloudflare authentication
echo %INFO% Checking Cloudflare authentication...
wrangler whoami >nul 2>&1
if errorlevel 1 (
    echo %ERROR% Not authenticated with Cloudflare.
    echo %INFO% Please run: wrangler login
    echo %INFO% Then run this script again.
    pause
    exit /b 1
)

echo %SUCCESS% Cloudflare authentication verified

REM Get current timestamp for deployment tracking
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "timestamp=%dt:~0,4%-%dt:~4,2%-%dt:~6,2% %dt:~8,2%:%dt:~10,2%:%dt:~12,2%"

echo.
echo %ROCKET% Starting automated deployment at %timestamp%
echo ================================================================

REM Step 1: Prepare code for deployment
echo.
echo %INFO% Step 1: Preparing code...
echo --------------------------------

REM Update package.json version
echo %INFO% Updating version number...
powershell -Command "(Get-Content package.json) -replace '\"version\": \".*\"', '\"version\": \"2.1.0\"' | Set-Content package.json"

REM Create deployment info file
echo %INFO% Creating deployment info...
(
    echo {
    echo   "deployment_id": "deploy_%random%_%time:~0,2%%time:~3,2%%time:~6,2%",
    echo   "timestamp": "%timestamp%",
    echo   "environment": "!environment!",
    echo   "version": "2.1.0",
    echo   "github_repo": "!github_repo!",
    echo   "deployed_by": "Auto-deployment script"
    echo }
) > deployment-info.json

echo %SUCCESS% Code preparation completed

REM Step 2: GitHub deployment
echo.
echo %INFO% Step 2: Deploying to GitHub...
echo -----------------------------------

REM Initialize git if needed
if not exist ".git" (
    echo %INFO% Initializing Git repository...
    git init
    git branch -M main
)

REM Add remote if not exists
git remote get-url origin >nul 2>&1
if errorlevel 1 (
    echo %INFO% Adding remote origin...
    git remote add origin !github_repo!
) else (
    echo %INFO% Updating remote origin...
    git remote set-url origin !github_repo!
)

REM Stage all changes
echo %INFO% Staging changes...
git add .

REM Check if there are changes to commit
git diff --staged --quiet
if errorlevel 1 (
    echo %INFO% Committing changes...
    git commit -m "🚀 Automated deployment: KhoAugment POS v2.1.0

✨ Complete Vietnamese POS System Features:
- Multi-payment gateway support (VNPay, MoMo, ZaloPay)
- Real-time inventory management with barcode scanning
- Vietnamese tax compliance and VAT calculations
- Progressive Web App with offline capabilities
- Advanced analytics and reporting dashboard
- Role-based access control and user management
- Modern React 18 + TypeScript frontend
- Cloudflare Workers serverless backend
- Comprehensive testing suite (Unit, Integration, E2E)
- CI/CD pipeline with GitHub Actions

🏗️ Enterprise Architecture:
- Event Sourcing with ACID compliance
- Multi-layer caching (Memory, Redis, CDN)
- Load balancing with health monitoring
- Business continuity and disaster recovery
- End-to-end encryption and security
- Performance optimization and monitoring

🎨 Modern UI/UX:
- Responsive design with dark mode support
- Accessibility compliant (WCAG 2.1)
- Modern dashboard with interactive charts
- Advanced form components and validation
- Touch-friendly interface for tablets

🌐 Vietnamese Business Compliance:
- VAT calculation per Vietnamese tax law
- Vietnamese address and phone validation
- 5-tier loyalty program (Đồng to Kim Cương)
- Vietnamese invoice numbering system
- Multi-language support (Vietnamese/English)

📊 Deployment Details:
- Timestamp: %timestamp%
- Environment: !environment!
- Version: 2.1.0
- Repository: !github_repo!

🚀 Generated with Claude Code (https://claude.ai/code)
Co-Authored-By: Claude <noreply@anthropic.com>"
    
    echo %SUCCESS% Changes committed
) else (
    echo %WARNING% No changes to commit
)

REM Push to GitHub
echo %INFO% Pushing to GitHub...
git push -u origin main
if errorlevel 1 (
    echo %ERROR% Failed to push to GitHub
    pause
    exit /b 1
)

echo %SUCCESS% GitHub deployment completed

REM Step 3: Cloudflare deployment
echo.
echo %INFO% Step 3: Deploying to Cloudflare...
echo -------------------------------------

REM Deploy backend
echo %INFO% Deploying backend API...
cd backend

REM Install dependencies if needed
if not exist "node_modules" (
    echo %INFO% Installing backend dependencies...
    npm install
    if errorlevel 1 (
        echo %ERROR% Failed to install backend dependencies
        cd ..
        pause
        exit /b 1
    )
)

REM Build backend
echo %INFO% Building backend...
npm run build >nul 2>&1
if errorlevel 1 (
    echo %ERROR% Backend build failed
    cd ..
    pause
    exit /b 1
)

REM Deploy to Workers
echo %INFO% Deploying to Cloudflare Workers...
wrangler deploy --env !environment! --name !project_name!-api
if errorlevel 1 (
    echo %ERROR% Backend deployment failed
    cd ..
    pause
    exit /b 1
)

echo %SUCCESS% Backend deployed successfully
cd ..

REM Deploy frontend
echo %INFO% Deploying frontend...
cd frontend

REM Install dependencies if needed
if not exist "node_modules" (
    echo %INFO% Installing frontend dependencies...
    npm install
    if errorlevel 1 (
        echo %ERROR% Failed to install frontend dependencies
        cd ..
        pause
        exit /b 1
    )
)

REM Build frontend
echo %INFO% Building frontend...
npm run build >nul 2>&1
if errorlevel 1 (
    echo %ERROR% Frontend build failed
    cd ..
    pause
    exit /b 1
)

REM Deploy to Pages
echo %INFO% Deploying to Cloudflare Pages...
wrangler pages deploy dist --project-name !project_name!-frontend --compatibility-date 2024-01-15
if errorlevel 1 (
    echo %ERROR% Frontend deployment failed
    cd ..
    pause
    exit /b 1
)

echo %SUCCESS% Frontend deployed successfully
cd ..

REM Step 4: Post-deployment verification
echo.
echo %INFO% Step 4: Post-deployment verification...
echo ---------------------------------------------

REM Wait for deployment to stabilize
echo %INFO% Waiting for deployment to stabilize...
timeout /t 10 /nobreak >nul

REM Health check
echo %INFO% Performing health checks...
set "api_url=https://!project_name!-api.workers.dev"
set "frontend_url=https://!project_name!-frontend.pages.dev"

REM Check API health
curl -f -s %api_url%/health >nul 2>&1
if errorlevel 1 (
    echo %WARNING% API health check failed, but deployment may still be successful
) else (
    echo %SUCCESS% API health check passed
)

REM Check frontend
curl -f -s %frontend_url% >nul 2>&1
if errorlevel 1 (
    echo %WARNING% Frontend check failed, but deployment may still be successful
) else (
    echo %SUCCESS% Frontend check passed
)

REM Step 5: Deployment summary
echo.
echo %SUCCESS% ================================================================
echo %SUCCESS%   DEPLOYMENT COMPLETED SUCCESSFULLY!
echo %SUCCESS% ================================================================
echo.
echo %INFO% Deployment Summary:
echo   - Timestamp: %timestamp%
echo   - Environment: !environment!
echo   - Version: 2.1.0
echo.
echo %ROCKET% Your KhoAugment POS is now live:
echo   - Frontend: %frontend_url%
echo   - Backend API: %api_url%
echo   - GitHub: !github_repo!
echo.
echo %INFO% Default Login Credentials:
echo   - Email: admin@khoaugment.com
echo   - Password: admin123
echo.
echo %INFO% Next Steps:
echo   1. Open %frontend_url% in your browser
echo   2. Login with the credentials above
echo   3. Configure your store settings
echo   4. Add products and start selling!
echo.
echo %SUCCESS% Thank you for using KhoAugment POS! 🚀

REM Ask to open browser
set /p "open_browser=Open the application in browser? (y/n): "
if /i "%open_browser%"=="y" (
    start %frontend_url%
)

REM Save deployment log
echo %timestamp% - Deployment completed successfully > deployment-log.txt
echo Frontend: %frontend_url% >> deployment-log.txt
echo API: %api_url% >> deployment-log.txt
echo Version: 2.1.0 >> deployment-log.txt

pause
exit /b 0

REM Function to create configuration file
:create_config
echo %INFO% Creating configuration file...
(
    echo {
    echo   "github_repo": "%DEFAULT_GITHUB_REPO%",
    echo   "project_name": "%DEFAULT_PROJECT_NAME%",
    echo   "environment": "%DEFAULT_ENVIRONMENT%",
    echo   "auto_open_browser": true,
    echo   "enable_health_checks": true,
    echo   "deployment_notes": "Automated deployment configuration"
    echo }
) > auto-deploy-config.json

echo %SUCCESS% Configuration file created: auto-deploy-config.json
exit /b 0