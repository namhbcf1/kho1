# 🚀 Deployment Configuration

## Cloudflare Deployment Files

### 📁 cloudflare/
- `wrangler.toml` - Main Cloudflare Workers configuration
- `_routes.json` - Routing configuration for Pages
- `_headers` - HTTP headers configuration  
- `_redirects` - URL redirect rules

### 📁 scripts/
- `deploy.sh` - Linux/Mac deployment script
- `deploy-production.sh` - Production deployment
- `deploy-windows.cmd` - Windows deployment script
- `quick-deploy.sh` - Quick deployment for testing

### 📁 configs/
- Environment-specific configurations
- Production and staging settings

## Usage

### For Claude:
```bash
# Deploy to Cloudflare
./deployment/scripts/deploy-production.sh

# Quick test deployment
./deployment/scripts/quick-deploy.sh
```

### For Cursor:
- Read configs for environment setup
- Don't modify deployment scripts directly
- Use demo/ for testing features

## Environment Variables

Set these in Cloudflare dashboard or local .env:
- `DATABASE_URL`
- `JWT_SECRET`
- `VNPAY_*` variables
- `MOMO_*` variables