# 🚀 KhoAugment POS Deployment Guide

Hướng dẫn chi tiết để upload và deploy KhoAugment POS lên GitHub và Cloudflare.

## 📋 Yêu cầu trước khi bắt đầu

### Phần mềm cần thiết:
- **Node.js 18+** - [Download tại đây](https://nodejs.org/)
- **Git** - [Download tại đây](https://git-scm.com/)
- **Tài khoản GitHub** - [Đăng ký tại đây](https://github.com/)
- **Tài khoản Cloudflare** - [Đăng ký tại đây](https://cloudflare.com/)

### Cloudflare Services cần kích hoạt:
- **Cloudflare Workers** (Free tier có sẵn)
- **Cloudflare Pages** (Free tier có sẵn) 
- **Cloudflare D1** (Free tier có sẵn)
- **Cloudflare R2** (Free tier có sẵn)
- **Cloudflare KV** (Free tier có sẵn)

### Required Tools
```bash
npm install -g wrangler@latest
```

## Backend Deployment (Cloudflare Workers + D1)

### 1. Setup Cloudflare Wrangler

```bash
cd backend
wrangler login
```

### 2. Create D1 Database

```bash
# Create production database
wrangler d1 create khoaugment-pos-prod

# Create development database (optional)
wrangler d1 create khoaugment-pos-dev
```

### 3. Update wrangler.toml

Update the database IDs in `wrangler.toml`:

```toml
[[env.production.d1_databases]]
binding = "DB"
database_name = "khoaugment-pos-prod"
database_id = "YOUR_DATABASE_ID_HERE"
```

### 4. Create KV Namespace

```bash
# Create KV namespace for caching
wrangler kv:namespace create CACHE --env production
```

Update the KV ID in `wrangler.toml`:

```toml
[[env.production.kv_namespaces]]
binding = "CACHE"
id = "YOUR_KV_ID_HERE"
```

### 5. Set Environment Variables

```bash
# Set production secrets
wrangler secret put JWT_SECRET --env production
wrangler secret put REFRESH_SECRET --env production
```

### 6. Initialize Database

```bash
# Run database migrations
wrangler d1 execute khoaugment-pos-prod --env production --file=./migrations/001_initial_schema.sql
```

### 7. Deploy Backend

```bash
# Deploy to production
npm run deploy:prod
```

Your API will be available at: `https://khoaugment-pos-api.your-subdomain.workers.dev`

## Frontend Deployment (Cloudflare Pages)

### 1. Setup Environment Variables

Create `.env.production`:

```env
VITE_API_URL=https://khoaugment-pos-api.your-subdomain.workers.dev/api/v1
VITE_APP_NAME=KhoAugment POS
VITE_STORE_NAME=Your Store Name
VITE_VAT_RATE=10
```

### 2. Build Frontend

```bash
cd frontend
npm install
npm run build
```

### 3. Deploy to Cloudflare Pages

#### Option A: Wrangler CLI
```bash
wrangler pages deploy dist --project-name khoaugment-pos
```

#### Option B: GitHub Integration
1. Push code to GitHub repository
2. Go to Cloudflare Dashboard > Pages
3. Connect your GitHub repository
4. Set build settings:
   - Build command: `npm run build`
   - Output directory: `dist`
   - Root directory: `frontend`

### 4. Configure Custom Domain (Optional)

1. In Cloudflare Pages dashboard
2. Go to Custom domains
3. Add your domain (e.g., `pos.yourdomain.com`)

## Database Schema and Data

### Essential Database Setup

The initial schema includes:
- Users (authentication)
- Products (inventory management)
- Categories (product organization)
- Customers (loyalty system)
- Orders & Order Items (transactions)
- Loyalty Transactions (points tracking)
- Stock Movements (inventory history)
- Settings (configuration)

### Default Data

The system includes:
- Default admin user: `admin@khoaugment.com` / `admin123`
- Sample product categories
- Vietnamese business settings
- Sample products

### Backup Strategy

```bash
# Create database backup
wrangler d1 backup create khoaugment-pos-prod --env production

# Export data to SQL file
wrangler d1 export khoaugment-pos-prod --env production --output backup.sql
```

## Security Configuration

### 1. CORS Settings

Update `CORS_ORIGIN` in wrangler.toml:
```toml
CORS_ORIGIN = "https://yourdomain.com,https://pos.yourdomain.com"
```

### 2. Rate Limiting

Configure in wrangler.toml:
```toml
RATE_LIMIT_REQUESTS = "1000"  # requests per window
RATE_LIMIT_WINDOW = "900000"  # 15 minutes in ms
```

### 3. Environment Secrets

Set production secrets:
```bash
wrangler secret put JWT_SECRET --env production
wrangler secret put REFRESH_SECRET --env production
```

## Monitoring and Maintenance

### 1. View Logs

```bash
# Real-time logs
wrangler tail --env production

# Specific service logs
wrangler tail khoaugment-pos-api --env production
```

### 2. Database Monitoring

```bash
# Check database info
wrangler d1 info khoaugment-pos-prod --env production

# List all databases
wrangler d1 list
```

### 3. Performance Monitoring

The system includes:
- Error logging to D1 database
- Performance metrics collection
- Health check endpoint: `/health`

## Vietnamese Business Compliance

### 1. VAT Configuration

Set VAT rate in environment:
```env
VAT_RATE=10  # 10% for Vietnam
```

### 2. Invoice Numbering

Vietnamese invoice format: `HD{YY}{MM}{XXXXXX}`
- Configured in backend utilities
- Auto-generated for each transaction

### 3. Loyalty System

Vietnamese tier system:
- Đồng (Bronze): 0+ VND spent
- Bạc (Silver): 2,000,000+ VND spent  
- Vàng (Gold): 5,000,000+ VND spent
- Bạch Kim (Platinum): 10,000,000+ VND spent
- Kim Cương (Diamond): 20,000,000+ VND spent

## Production Checklist

### Pre-deployment
- [ ] Update API URL in frontend environment
- [ ] Set strong JWT secrets
- [ ] Configure CORS origins
- [ ] Test database migrations
- [ ] Review rate limiting settings

### Post-deployment
- [ ] Verify health check endpoint
- [ ] Test basic CRUD operations
- [ ] Verify authentication flow
- [ ] Test payment processing
- [ ] Check PWA installation
- [ ] Verify offline functionality

### Security
- [ ] Enable 2FA on Cloudflare account
- [ ] Review API access logs
- [ ] Set up monitoring alerts
- [ ] Configure backup schedule
- [ ] Test disaster recovery

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Verify database ID in wrangler.toml
   - Check database binding name matches code

2. **CORS Errors**
   - Update CORS_ORIGIN environment variable
   - Verify frontend URL matches CORS settings

3. **Authentication Issues**
   - Check JWT_SECRET is set
   - Verify token expiration settings

4. **Build Failures**
   - Check Node.js version (18+)
   - Clear node_modules and reinstall
   - Verify all dependencies are installed

### Support Resources

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Cloudflare D1 Documentation](https://developers.cloudflare.com/d1/)
- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)

## Cost Estimation (Cloudflare Free Tier)

### Workers
- 100,000 requests/day (free)
- 10ms CPU time per request

### D1 Database
- 5GB storage (free)
- 25M read/day, 50K write/day (free)

### Pages
- Unlimited bandwidth (free)
- 500 builds/month (free)

### KV Storage
- 100K read/day, 1K write/day (free)
- 1GB storage (free)

This setup is sufficient for small to medium businesses with moderate transaction volumes.