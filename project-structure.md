# Cấu trúc dự án - Tách biệt Deploy, Demo và Mock

## 📁 Cấu trúc hiện tại đã được tối ưu:

```
kho1/
├── 🚀 deployment/                    # Files triển khai Cloudflare
│   ├── cloudflare/
│   │   ├── wrangler.toml
│   │   ├── _routes.json
│   │   ├── _headers
│   │   └── _redirects
│   ├── scripts/
│   │   ├── deploy.sh
│   │   ├── deploy-production.sh
│   │   ├── deploy-windows.cmd
│   │   └── quick-deploy.sh
│   └── configs/
│       ├── production.env
│       └── staging.env
│
├── 🎯 demo/                          # Files demo và test
│   ├── data/
│   │   ├── sample-products.json
│   │   ├── demo-customers.json
│   │   └── test-orders.json
│   ├── pages/
│   │   ├── demo-dashboard.html
│   │   ├── simple.html
│   │   └── debug.html
│   └── assets/
│       ├── demo-images/
│       └── sample-data/
│
├── 🔧 mock/                          # Files mock và testing
│   ├── api/
│   │   ├── mock-responses/
│   │   ├── test-endpoints.json
│   │   └── api-stubs.js
│   ├── database/
│   │   ├── mock-data.sql
│   │   ├── test-schema.sql
│   │   └── seed-test-data.sql
│   └── services/
│       ├── mock-payment-gateway.js
│       └── mock-auth-service.js
│
├── 📱 frontend/                      # Frontend chính
│   ├── src/
│   ├── dist/
│   ├── public/
│   └── package.json
│
├── 🔄 backend/                       # Backend chính
│   ├── src/
│   ├── migrations/
│   └── package.json
│
├── 📚 shared/                        # Code dùng chung
│   ├── types/
│   ├── schemas/
│   └── constants/
│
└── 📖 docs/                          # Tài liệu
    ├── API.md
    ├── DEPLOYMENT.md
    └── README.md
```

## 🛠️ Tách biệt theo mục đích:

### 1. **Deployment Files** (deployment/)
- **Cloudflare configs**: wrangler.toml, _routes.json, _headers
- **Deploy scripts**: Các script triển khai cho Windows/Linux
- **Environment configs**: Cấu hình môi trường production/staging

### 2. **Demo Files** (demo/)
- **Sample data**: Dữ liệu mẫu cho demo
- **Test pages**: Các trang test đơn giản
- **Demo assets**: Hình ảnh và tài nguyên demo

### 3. **Mock Files** (mock/)
- **API mocks**: Mock responses cho testing
- **Database mocks**: Dữ liệu test và schema
- **Service mocks**: Mock các service ngoài

## 🤖 Hỗ trợ Claude & Cursor:

### **Cho Claude:**
- Tập trung vào `deployment/` và `mock/` cho automation
- Sử dụng `shared/` cho type definitions
- Refer đến `docs/` để hiểu project structure

### **Cho Cursor:**
- Focus vào `frontend/` và `backend/` cho development
- Sử dụng `demo/` để test features nhanh
- Leverage `shared/` cho intellisense

## 📋 Quy tắc làm việc:

1. **Deployment**: Chỉ Claude handle, Cursor không touch
2. **Demo**: Cursor tạo, Claude test và validate
3. **Mock**: Claude generate, Cursor sử dụng cho development
4. **Shared**: Cả hai cùng maintain, sync thường xuyên

## 🔄 Workflow collaboration:

```
Cursor (Dev) → shared/ ← Claude (Deploy/Test)
     ↓               ↑
  demo/ →        mock/
     ↓               ↑
frontend/backend/ → deployment/
```