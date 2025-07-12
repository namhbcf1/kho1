# KhoAugment POS - Documentation

Hệ thống Point of Sale (POS) được tối ưu hóa cho Cloudflare với hỗ trợ đầy đủ tiếng Việt.

## 📋 Mục lục

- [Tổng quan](#tổng-quan)
- [Kiến trúc hệ thống](#kiến-trúc-hệ-thống)
- [Cài đặt và triển khai](#cài-đặt-và-triển-khai)
- [Tính năng chính](#tính-năng-chính)
- [API Documentation](#api-documentation)
- [Hướng dẫn sử dụng](#hướng-dẫn-sử-dụng)
- [Troubleshooting](#troubleshooting)

## 🎯 Tổng quan

KhoAugment POS là một hệ thống bán hàng hiện đại được thiết kế đặc biệt cho thị trường Việt Nam, tối ưu hóa cho nền tảng Cloudflare để đảm bảo hiệu suất cao và độ tin cậy.

### Đặc điểm nổi bật

- ✅ **Tối ưu cho Cloudflare**: Sử dụng Workers, D1, R2, KV
- ✅ **Hỗ trợ tiếng Việt**: Giao diện và tính năng phù hợp với Việt Nam
- ✅ **Tích hợp thanh toán**: VNPay, MoMo, ZaloPay
- ✅ **PWA**: Hoạt động offline, cài đặt như app native
- ✅ **Responsive**: Tương thích mọi thiết bị
- ✅ **Real-time**: Cập nhật dữ liệu thời gian thực

## 🏗️ Kiến trúc hệ thống

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Cloudflare    │
│   (React)       │◄──►│   (Workers)     │◄──►│   Services      │
│                 │    │                 │    │                 │
│ • Ant Design    │    │ • Hono          │    │ • D1 Database   │
│ • TypeScript    │    │ • TypeScript    │    │ • R2 Storage    │
│ • Zustand       │    │ • Zod           │    │ • KV Cache      │
│ • PWA           │    │ • JWT Auth      │    │ • Analytics     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Tech Stack

#### Frontend (Cloudflare Pages)
- **Framework**: React 18 + TypeScript
- **UI Library**: Ant Design 5.x
- **State Management**: Zustand
- **Charts**: Recharts
- **Build Tool**: Vite
- **PWA**: Workbox

#### Backend (Cloudflare Workers)
- **Runtime**: Cloudflare Workers
- **Framework**: Hono
- **Database**: Cloudflare D1 (SQLite)
- **Storage**: Cloudflare R2
- **Cache**: Cloudflare KV
- **Validation**: Zod

#### Tích hợp Việt Nam
- **Thanh toán**: VNPay, MoMo, ZaloPay
- **Địa chỉ**: Tỉnh/thành, quận/huyện, phường/xã
- **Tiền tệ**: VND với định dạng Việt Nam
- **Thuế**: VAT 10% theo quy định

## 🚀 Cài đặt và triển khai

### Yêu cầu hệ thống

- Node.js 18+
- Cloudflare Account
- Git

### 1. Clone repository

```bash
git clone https://github.com/your-org/khoaugment-pos.git
cd khoaugment-pos
```

### 2. Cài đặt dependencies

```bash
# Frontend
cd frontend
npm install

# Backend
cd ../backend
npm install
```

### 3. Cấu hình Cloudflare

#### Tạo D1 Database

```bash
# Development
wrangler d1 create khoaugment-pos-dev

# Production
wrangler d1 create khoaugment-pos-prod
```

#### Tạo R2 Bucket

```bash
# Development
wrangler r2 bucket create khoaugment-pos-storage-dev

# Production
wrangler r2 bucket create khoaugment-pos-storage
```

#### Tạo KV Namespace

```bash
# Development
wrangler kv:namespace create "CACHE" --preview

# Production
wrangler kv:namespace create "CACHE"
```

### 4. Cấu hình environment variables

Cập nhật `backend/wrangler.toml` với các ID đã tạo:

```toml
[[env.development.d1_databases]]
binding = "DB"
database_name = "khoaugment-pos-dev"
database_id = "your-d1-dev-database-id"

[[env.development.r2_buckets]]
binding = "STORAGE"
bucket_name = "khoaugment-pos-storage-dev"

[[env.development.kv_namespaces]]
binding = "CACHE"
id = "your-kv-dev-namespace-id"
```

### 5. Khởi tạo database

```bash
cd backend
npm run db:generate
npm run db:migrate
npm run db:seed
```

### 6. Chạy development

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 7. Triển khai production

```bash
# Deploy backend
cd backend
npm run deploy:production

# Deploy frontend
cd frontend
npm run build
# Upload dist/ to Cloudflare Pages
```

## 🎯 Tính năng chính

### 1. Hệ thống POS
- Giao diện bán hàng trực quan
- Quét mã vạch
- Tính toán tự động (thuế, giảm giá)
- Nhiều phương thức thanh toán
- In hóa đơn

### 2. Quản lý sản phẩm
- CRUD sản phẩm
- Quản lý danh mục
- Theo dõi tồn kho
- Upload hình ảnh (R2)
- Tạo mã vạch

### 3. Quản lý khách hàng
- Thông tin khách hàng
- Chương trình khách hàng thân thiết
- Lịch sử mua hàng
- Địa chỉ Việt Nam

### 4. Báo cáo & Thống kê
- Doanh thu theo ngày/tháng
- Sản phẩm bán chạy
- Hiệu suất nhân viên
- Xuất báo cáo Excel/PDF

### 5. Quản lý nhân viên
- Phân quyền theo vai trò
- Theo dõi ca làm việc
- Hoa hồng bán hàng

## 📚 API Documentation

### Authentication

```typescript
// Login
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password",
  "remember": true
}

// Response
{
  "success": true,
  "user": { ... },
  "token": "jwt-token"
}
```

### POS Operations

```typescript
// Get products
GET /api/pos/products

// Create order
POST /api/pos/orders
{
  "items": [
    {
      "productId": "prod-001",
      "name": "Coca Cola",
      "price": 15000,
      "quantity": 2,
      "total": 30000
    }
  ],
  "subtotal": 30000,
  "tax": 3000,
  "total": 33000,
  "paymentMethod": "cash"
}
```

### Products

```typescript
// Get products
GET /api/products?page=1&limit=20&category=cat-001

// Create product
POST /api/products
{
  "name": "Sản phẩm mới",
  "price": 50000,
  "stock": 100,
  "categoryId": "cat-001"
}
```

## 👥 Hướng dẫn sử dụng

### Đăng nhập hệ thống

1. Truy cập URL của ứng dụng
2. Nhập email và mật khẩu
3. Chọn "Ghi nhớ đăng nhập" nếu muốn

**Tài khoản mặc định:**
- Admin: `admin@khoaugment.com` / `admin123`
- Manager: `manager@khoaugment.com` / `manager123`
- Cashier: `cashier1@khoaugment.com` / `cashier123`

### Sử dụng POS Terminal

1. Chọn menu "Bán hàng (POS)"
2. Tìm và chọn sản phẩm
3. Hoặc quét mã vạch
4. Kiểm tra giỏ hàng
5. Chọn phương thức thanh toán
6. Hoàn tất đơn hàng
7. In hóa đơn

### Quản lý sản phẩm

1. Chọn menu "Sản phẩm"
2. Thêm mới: Click "Thêm sản phẩm"
3. Chỉnh sửa: Click icon bút chì
4. Xóa: Click icon thùng rác
5. Tìm kiếm: Sử dụng ô tìm kiếm

### Xem báo cáo

1. Chọn menu "Báo cáo & Thống kê"
2. Chọn loại báo cáo
3. Chọn khoảng thời gian
4. Xem biểu đồ và số liệu
5. Xuất file nếu cần

## 🔧 Troubleshooting

### Lỗi thường gặp

#### 1. Không thể đăng nhập
- Kiểm tra email/password
- Xóa cache trình duyệt
- Kiểm tra kết nối mạng

#### 2. Sản phẩm không hiển thị
- Kiểm tra trạng thái sản phẩm (active)
- Kiểm tra tồn kho > 0
- Refresh trang

#### 3. Thanh toán thất bại
- Kiểm tra cấu hình payment gateway
- Kiểm tra số dư tài khoản
- Thử phương thức khác

#### 4. Không in được hóa đơn
- Kiểm tra máy in
- Kiểm tra driver máy in
- Thử in thử nghiệm

### Debug mode

Để bật debug mode:

```bash
# Frontend
VITE_DEBUG=true npm run dev

# Backend
DEBUG=true npm run dev
```

### Logs

Xem logs tại:
- Frontend: Browser DevTools Console
- Backend: Cloudflare Workers Dashboard
- Database: D1 Console

## 📞 Hỗ trợ

- **Email**: support@khoaugment.com
- **Phone**: 1900-xxxx
- **Documentation**: https://docs.khoaugment.com
- **GitHub Issues**: https://github.com/your-org/khoaugment-pos/issues

## 📄 License

MIT License - xem file [LICENSE](../LICENSE) để biết thêm chi tiết.
