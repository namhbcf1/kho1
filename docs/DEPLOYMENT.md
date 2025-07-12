# Deployment Guide - KhoAugment POS

Hướng dẫn triển khai KhoAugment POS lên Cloudflare.

## Yêu cầu

- Tài khoản Cloudflare
- Node.js 18+
- Wrangler CLI
- Git

## Thiết lập Cloudflare

### 1. Cài đặt Wrangler CLI

```bash
npm install -g wrangler
```

### 2. Đăng nhập Cloudflare

```bash
wrangler login
```

### 3. Tạo các tài nguyên Cloudflare

#### D1 Database
```bash
# Production
wrangler d1 create khoaugment-pos-db

# Staging
wrangler d1 create khoaugment-pos-db-staging

# Development
wrangler d1 create khoaugment-pos-db-dev
```

#### KV Namespaces
```bash
# Cache
wrangler kv:namespace create "CACHE"
wrangler kv:namespace create "CACHE" --preview

# Sessions
wrangler kv:namespace create "SESSIONS"
wrangler kv:namespace create "SESSIONS" --preview

# Rate Limits
wrangler kv:namespace create "RATE_LIMITS"
wrangler kv:namespace create "RATE_LIMITS" --preview
```

#### R2 Buckets
```bash
# Production
wrangler r2 bucket create khoaugment-pos-storage

# Staging
wrangler r2 bucket create khoaugment-pos-storage-staging

# Development
wrangler r2 bucket create khoaugment-pos-storage-dev
```

## Cấu hình Environment Variables

### Backend (wrangler.toml)

Cập nhật file `backend/wrangler.toml` với các ID thực tế:

```toml
[[env.production.d1_databases]]
binding = "DB"
database_name = "khoaugment-pos-db"
database_id = "your-actual-d1-database-id"

[[env.production.kv_namespaces]]
binding = "CACHE"
id = "your-actual-cache-kv-id"

[[env.production.r2_buckets]]
binding = "STORAGE"
bucket_name = "khoaugment-pos-storage"
```

### Frontend (.env)

Tạo file `.env` trong thư mục `frontend/`:

```env
VITE_API_URL=https://api.khoaugment.com
VITE_APP_ENV=production
VITE_CLOUDFLARE_ACCOUNT_ID=your-account-id
VITE_VNPAY_MERCHANT_ID=your-vnpay-merchant-id
VITE_MOMO_PARTNER_CODE=your-momo-partner-code
VITE_ZALOPAY_APP_ID=your-zalopay-app-id
VITE_SENTRY_DSN=your-sentry-dsn
VITE_GOOGLE_ANALYTICS_ID=your-ga-id
VITE_VAPID_PUBLIC_KEY=your-vapid-public-key
```

## Database Migration

### 1. Tạo bảng database

```bash
cd backend
wrangler d1 execute khoaugment-pos-db --file=./migrations/001_initial.sql
```

### 2. Seed dữ liệu mẫu

```bash
wrangler d1 execute khoaugment-pos-db --file=./migrations/002_seed.sql
```

## Deployment

### 1. Deploy Backend

```bash
cd backend

# Deploy to staging
npm run deploy:staging

# Deploy to production
npm run deploy:production
```

### 2. Deploy Frontend

```bash
cd frontend

# Build
npm run build

# Deploy to Cloudflare Pages
npm run deploy
```

## Custom Domain Setup

### 1. Thêm domain vào Cloudflare

1. Đăng nhập Cloudflare Dashboard
2. Thêm domain của bạn
3. Cập nhật nameservers

### 2. Cấu hình DNS

```
Type: CNAME
Name: api
Content: your-worker-subdomain.workers.dev
Proxy: Enabled

Type: CNAME  
Name: @
Content: your-pages-subdomain.pages.dev
Proxy: Enabled
```

### 3. Cấu hình SSL

1. Vào SSL/TLS > Overview
2. Chọn "Full (strict)"
3. Bật "Always Use HTTPS"

## Environment-specific Deployment

### Staging Environment

```bash
# Backend
cd backend
wrangler deploy --env staging

# Frontend
cd frontend
npm run build:staging
npm run deploy:staging
```

### Production Environment

```bash
# Backend
cd backend
wrangler deploy --env production

# Frontend
cd frontend
npm run build:production
npm run deploy:production
```

## Monitoring và Logging

### 1. Cloudflare Analytics

- Bật Analytics trong Cloudflare Dashboard
- Cấu hình Web Analytics cho frontend

### 2. Error Tracking

```bash
# Cài đặt Sentry
npm install @sentry/react @sentry/tracing

# Cấu hình trong frontend/src/main.tsx
```

### 3. Performance Monitoring

- Sử dụng Cloudflare Speed tab
- Cấu hình Core Web Vitals tracking

## Security Configuration

### 1. WAF Rules

Tạo WAF rules trong Cloudflare Dashboard:

```
# Block common attacks
(http.request.uri.path contains "/admin" and ip.geoip.country ne "VN")

# Rate limiting
(http.request.uri.path eq "/api/auth/login" and rate(1m) > 5)
```

### 2. Page Rules

```
# Cache static assets
*.khoaugment.com/assets/*
Cache Level: Cache Everything
Edge Cache TTL: 1 month

# Security headers
*.khoaugment.com/*
Security Level: High
```

## Backup và Recovery

### 1. Database Backup

```bash
# Export database
wrangler d1 export khoaugment-pos-db --output=backup.sql

# Import database
wrangler d1 execute khoaugment-pos-db --file=backup.sql
```

### 2. R2 Backup

```bash
# Sync R2 bucket
wrangler r2 object get khoaugment-pos-storage/backup.tar.gz
```

## Troubleshooting

### Common Issues

1. **Database connection errors**
   - Kiểm tra D1 database ID trong wrangler.toml
   - Verify database exists và có quyền truy cập

2. **KV namespace errors**
   - Kiểm tra KV namespace IDs
   - Verify bindings trong wrangler.toml

3. **R2 storage errors**
   - Kiểm tra bucket name và permissions
   - Verify CORS configuration

### Debug Commands

```bash
# Check worker logs
wrangler tail

# Test worker locally
wrangler dev

# Check D1 database
wrangler d1 info khoaugment-pos-db
```

## Performance Optimization

### 1. Caching Strategy

- Static assets: 1 year
- API responses: 5 minutes
- User data: No cache

### 2. Image Optimization

- Sử dụng Cloudflare Images
- WebP format cho browsers hỗ trợ
- Responsive images

### 3. Code Splitting

- Route-based splitting
- Component lazy loading
- Vendor chunk optimization

## Rollback Strategy

### 1. Worker Rollback

```bash
# List deployments
wrangler deployments list

# Rollback to previous version
wrangler rollback [deployment-id]
```

### 2. Pages Rollback

1. Vào Cloudflare Pages Dashboard
2. Chọn deployment cũ
3. Click "Retry deployment"

## Maintenance

### 1. Regular Tasks

- Weekly database backup
- Monthly security updates
- Quarterly performance review

### 2. Monitoring Checklist

- [ ] Uptime monitoring
- [ ] Error rate tracking
- [ ] Performance metrics
- [ ] Security alerts
- [ ] Cost monitoring

---

Để biết thêm chi tiết, tham khảo [Cloudflare Documentation](https://developers.cloudflare.com/).
