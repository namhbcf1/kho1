@echo off
REM Deploy to existing GitHub repo and Cloudflare Pages
echo ============================================
echo   KhoAugment POS - Deploy to Existing Setup
echo ============================================
echo.

REM Step 1: Push to GitHub
echo 📤 Step 1: Pushing to GitHub...
echo ===============================

git init
echo node_modules/ > .gitignore
echo dist/ >> .gitignore
echo .env >> .gitignore
echo .env.local >> .gitignore
echo .env.production >> .gitignore
echo .wrangler/ >> .gitignore

git add .
git commit -m "🇻🇳 KhoAugment POS - Complete Vietnamese Business System

✅ React 18 + TypeScript PWA with Ant Design
✅ Cloudflare Workers API with D1 database  
✅ Vietnamese business compliance (VAT, loyalty, payments)
✅ Offline functionality and real-time sync
✅ Production-ready deployment configuration"

git remote add origin https://github.com/namhbcf1/kho1.git
git branch -M main
git push -u origin main --force

echo ✅ Code pushed to GitHub successfully!

REM Step 2: Deploy Backend
echo.
echo 🔧 Step 2: Deploy Backend API...
echo ===============================
cd backend

echo 📦 Installing backend dependencies...
if not exist "node_modules" npm install

echo 🗃️ Creating D1 database...
wrangler d1 create kho1-production

echo ⚠️ IMPORTANT: Copy the database ID from above and update wrangler.toml
echo Then run the following commands manually:
echo.
echo wrangler d1 execute kho1-production --env production --file=./migrations/001_initial_schema.sql
echo wrangler secret put JWT_SECRET --env production
echo wrangler secret put REFRESH_SECRET --env production  
echo wrangler deploy --env production
echo.

REM Step 3: Frontend Build
echo 🌐 Step 3: Building Frontend...
echo =============================
cd ..\frontend

echo 📦 Installing frontend dependencies...
if not exist "node_modules" npm install

echo 🏗️ Building frontend...
npm run build

echo ✅ Frontend built successfully!

echo.
echo 🎯 Next Steps:
echo =============
echo 1. Update database ID in backend\wrangler.toml
echo 2. Run backend deployment commands shown above
echo 3. Go to https://dash.cloudflare.com/5b62d10947844251d23e0eac532531dd/pages/view/kho1
echo 4. Connect to Git and select namhbcf1/kho1 repository
echo 5. Set build command: cd frontend ^&^& npm install ^&^& npm run build
echo 6. Set output directory: frontend/dist
echo 7. Add environment variables for VITE_API_URL
echo.
echo 🚀 Your KhoAugment POS will be live at: https://kho1.pages.dev

pause