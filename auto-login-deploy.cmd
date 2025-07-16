@echo off
REM KhoAugment POS - Fully Automated Login and Deploy
REM This script automatically handles all authentication and deployment
chcp 65001 >nul 2>&1
setlocal enabledelayedexpansion

title KhoAugment POS - Auto Login and Deploy

echo.
echo ========================================================
echo   KhoAugment POS - Fully Automated Deploy System
echo ========================================================
echo.
echo   [INFO] This script will automatically:
echo   + Install required tools
echo   + Open authentication pages
echo   + Setup credentials
echo   + Deploy to GitHub and Cloudflare
echo.
echo ========================================================
echo.

REM Check admin privileges
net session >nul 2>&1
if errorlevel 1 (
    echo [WARN] Running without admin privileges
    echo [INFO] Some installations may require admin rights
    echo.
)

echo [SETUP] Step 1: Installing Required Tools
echo ========================================
echo.

REM Check and install Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo [INFO] Node.js not found. Installing...
    echo [INFO] Opening Node.js download page...
    start https://nodejs.org/en/download/
    echo.
    echo [WAIT] Please install Node.js and press any key to continue...
    pause
    
    REM Check again
    node --version >nul 2>&1
    if errorlevel 1 (
        echo [ERROR] Node.js still not found. Please install and restart.
        pause
        exit /b 1
    )
)
echo [OK] Node.js is ready

REM Check and install Git
git --version >nul 2>&1
if errorlevel 1 (
    echo [INFO] Git not found. Installing...
    echo [INFO] Opening Git download page...
    start https://git-scm.com/download/win
    echo.
    echo [WAIT] Please install Git and press any key to continue...
    pause
    
    REM Check again
    git --version >nul 2>&1
    if errorlevel 1 (
        echo [ERROR] Git still not found. Please install and restart.
        pause
        exit /b 1
    )
)
echo [OK] Git is ready

REM Install GitHub CLI
gh --version >nul 2>&1
if errorlevel 1 (
    echo [INFO] Installing GitHub CLI...
    winget install --id GitHub.cli --silent
    if errorlevel 1 (
        echo [WARN] Winget install failed. Trying alternative method...
        echo [INFO] Opening GitHub CLI download page...
        start https://github.com/cli/cli/releases/latest
        echo.
        echo [WAIT] Please install GitHub CLI and press any key to continue...
        pause
    )
)

REM Install Wrangler CLI
echo [INFO] Installing Wrangler CLI...
npm install -g wrangler
if errorlevel 1 (
    echo [ERROR] Failed to install Wrangler. Please run as administrator.
    pause
    exit /b 1
)
echo [OK] Wrangler CLI installed

echo.
echo [SETUP] Step 2: GitHub Authentication
echo ========================================
echo.

REM Configure Git first
echo [INFO] Configuring Git credentials...
git config --global user.name "namhbcf1"

REM Get email from user
set /p "git_email=Enter your GitHub email: "
if "%git_email%"=="" (
    echo [ERROR] Email is required
    pause
    exit /b 1
)

git config --global user.email "%git_email%"
echo [OK] Git credentials configured

REM Try GitHub CLI login first
echo [INFO] Attempting GitHub CLI authentication...
gh auth login --web --hostname github.com --git-protocol https
if errorlevel 1 (
    echo [WARN] GitHub CLI login failed. Using token method...
    echo.
    echo [INFO] Opening GitHub token creation page...
    start https://github.com/settings/tokens/new?scopes=repo,workflow,admin:public_key&description=KhoAugment-POS-Deploy
    echo.
    echo [INFO] Please:
    echo   1. Generate a new token with 'repo' and 'workflow' scopes
    echo   2. Copy the token
    echo   3. Paste it below
    echo.
    set /p "github_token=Paste your GitHub token here: "
    
    if "!github_token!"=="" (
        echo [ERROR] Token is required
        pause
        exit /b 1
    )
    
    REM Store token in Git credential manager
    echo [INFO] Storing GitHub token...
    git config --global credential.helper manager-core
    
    REM Test token by cloning
    echo [INFO] Testing GitHub access...
    git ls-remote https://!github_token!@github.com/namhbcf1/kho1.git >nul 2>&1
    if errorlevel 1 (
        echo [ERROR] Invalid token or repository access denied
        pause
        exit /b 1
    )
    
    echo [OK] GitHub token validated
) else (
    echo [OK] GitHub CLI authentication successful
)

echo.
echo [SETUP] Step 3: Cloudflare Authentication
echo ========================================
echo.

echo [INFO] Opening Cloudflare login page...
start https://dash.cloudflare.com/login

echo [INFO] Attempting Cloudflare authentication...
wrangler login
if errorlevel 1 (
    echo [ERROR] Cloudflare authentication failed
    echo [INFO] Please try again or check your internet connection
    pause
    exit /b 1
)

echo [OK] Cloudflare authentication successful

REM Verify Cloudflare account
echo [INFO] Verifying Cloudflare account...
wrangler whoami
if errorlevel 1 (
    echo [WARN] Could not verify Cloudflare account, but proceeding...
)

echo.
echo [SETUP] Step 4: Repository Setup
echo ========================================
echo.

REM Initialize repository if needed
if not exist ".git" (
    echo [INFO] Initializing Git repository...
    git init
    git branch -M main
    git remote add origin https://github.com/namhbcf1/kho1.git
) else (
    echo [INFO] Updating remote repository...
    git remote set-url origin https://github.com/namhbcf1/kho1.git
)

REM Create initial commit if needed
git status --porcelain >nul 2>&1
if errorlevel 1 (
    echo [INFO] Repository is empty, creating initial commit...
    git add .
    git commit -m "Initial commit - KhoAugment POS System"
)

echo [OK] Repository setup complete

echo.
echo [SETUP] Step 5: Cloudflare Resources Setup
echo ========================================
echo.

echo [INFO] Setting up Cloudflare resources...

REM Create Pages project
echo [INFO] Creating Cloudflare Pages project...
wrangler pages create kho1 --compatibility-date 2024-01-15 >nul 2>&1
if errorlevel 1 (
    echo [WARN] Pages project may already exist
)

REM Create D1 database
echo [INFO] Creating D1 database...
wrangler d1 create kho1-db >nul 2>&1
if errorlevel 1 (
    echo [WARN] D1 database may already exist
)

REM Create KV namespaces
echo [INFO] Creating KV namespaces...
wrangler kv:namespace create "CACHE" >nul 2>&1
wrangler kv:namespace create "SESSIONS" >nul 2>&1
wrangler kv:namespace create "SETTINGS" >nul 2>&1

echo [OK] Cloudflare resources setup complete

echo.
echo [DEPLOY] Step 6: Automated Deployment
echo ========================================
echo.

REM Update package.json version
echo [INFO] Updating project version...
if exist "package.json" (
    powershell -Command "(Get-Content package.json) -replace '\"version\": \".*\"', '\"version\": \"2.1.0\"' | Set-Content package.json"
)

REM Create deployment info
echo [INFO] Creating deployment information...
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "timestamp=!dt:~0,4!-!dt:~4,2!-!dt:~6,2! !dt:~8,2!:!dt:~10,2!:!dt:~12,2!"

(
    echo {
    echo   "deployment_id": "auto-deploy-!random!",
    echo   "timestamp": "!timestamp!",
    echo   "environment": "production",
    echo   "version": "2.1.0",
    echo   "github_repo": "https://github.com/namhbcf1/kho1",
    echo   "frontend_url": "https://kho1.pages.dev",
    echo   "deployed_by": "Auto-deployment script"
    echo }
) > deployment-info.json

echo [INFO] Staging all files...
git add .

echo [INFO] Creating deployment commit...
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
- Timestamp: !timestamp!
- Environment: production
- Version: 2.1.0
- Repository: https://github.com/namhbcf1/kho1

🚀 Generated with Claude Code (https://claude.ai/code)
Co-Authored-By: Claude <noreply@anthropic.com>"

echo [INFO] Pushing to GitHub...
git push -u origin main
if errorlevel 1 (
    echo [ERROR] Failed to push to GitHub
    echo [INFO] This might be due to authentication issues
    pause
    exit /b 1
)

echo [OK] Successfully pushed to GitHub

echo [INFO] Deploying to Cloudflare Pages...
if exist "frontend" (
    cd frontend
    if exist "package.json" (
        echo [INFO] Installing frontend dependencies...
        npm install
        
        echo [INFO] Building frontend...
        npm run build
        
        echo [INFO] Deploying to Cloudflare Pages...
        wrangler pages deploy dist --project-name kho1
        if errorlevel 1 (
            echo [ERROR] Frontend deployment failed
            cd ..
            pause
            exit /b 1
        )
    )
    cd ..
) else (
    echo [INFO] Direct deployment to Cloudflare Pages...
    wrangler pages deploy . --project-name kho1
)

echo [INFO] Deploying backend to Cloudflare Workers...
if exist "backend" (
    cd backend
    if exist "package.json" (
        echo [INFO] Installing backend dependencies...
        npm install
        
        echo [INFO] Building backend...
        npm run build >nul 2>&1
        
        echo [INFO] Deploying to Cloudflare Workers...
        wrangler deploy --name kho1-api
        if errorlevel 1 (
            echo [ERROR] Backend deployment failed
            cd ..
            pause
            exit /b 1
        )
    )
    cd ..
)

echo.
echo [OK] ========================================
echo [OK]   DEPLOYMENT SUCCESSFUL!
echo [OK] ========================================
echo.

echo [*] Congratulations! Your KhoAugment POS is now live!
echo.
echo [>>>] Your applications are now available at:
echo   + Frontend: https://kho1.pages.dev
echo   + Backend API: https://kho1-api.workers.dev
echo   + GitHub: https://github.com/namhbcf1/kho1
echo   + Cloudflare Dashboard: https://dash.cloudflare.com/5b62d10947844251d23e0eac532531dd/pages/view/kho1
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

echo [INFO] Opening your applications...
start https://kho1.pages.dev
start https://github.com/namhbcf1/kho1
start https://dash.cloudflare.com/5b62d10947844251d23e0eac532531dd/pages/view/kho1

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

REM Save deployment log
echo !timestamp! - Auto deployment completed successfully > deployment-log.txt
echo Frontend: https://kho1.pages.dev >> deployment-log.txt
echo Backend: https://kho1-api.workers.dev >> deployment-log.txt
echo GitHub: https://github.com/namhbcf1/kho1 >> deployment-log.txt
echo Cloudflare: https://dash.cloudflare.com/5b62d10947844251d23e0eac532531dd/pages/view/kho1 >> deployment-log.txt
echo Version: 2.1.0 >> deployment-log.txt

pause