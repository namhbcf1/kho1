# KhoAugment POS - Hệ thống quản lý bán hàng thông minh

KhoAugment POS là một hệ thống quản lý bán hàng (Point of Sale) hiện đại được thiết kế đặc biệt cho thị trường Việt Nam, sử dụng công nghệ Cloudflare để đảm bảo hiệu suất cao và độ tin cậy.

## 🌐 Live Demo & Deployment

**Frontend (Live):** https://kho-augment-pos.pages.dev  
**Backend API:** https://khoaugment-pos-api-production.bangachieu2.workers.dev  
**GitHub Repository:** [Will be created]

## 🔐 Account Information

### Cloudflare Account
- **Account ID:** 5b62d10947844251d23e0eac532531dd
- **Worker Domain:** bangachieu2.workers.dev
- **Pages Domain:** khoaugment-frontend.pages.dev

### Database & Services
- **D1 Database (Production):** kho1-production (39657891-9d7b-4a02-8b43-9921eb8c7d8e)
- **KV Namespace:** kho1-cache-production (6bfe7a89dc0e410da200dab9da839fba)
- **Worker Name:** kho1-api
- **Pages Project:** kho-augment-pos

### Environment Configuration
- **Production API URL:** https://khoaugment-pos-api-production.bangachieu2.workers.dev
- **Frontend Deployment:** https://khoaugment-frontend.pages.dev
- **CORS Origin:** https://khoaugment-frontend.pages.dev

## ✅ Implementation Status

### Completed Features
- **JWT Authentication System** - Full production-ready authentication with access/refresh tokens
- **Barcode Scanner with Camera** - Real camera integration using ZXing library with flash control
- **Cloudflare Infrastructure** - D1 database, KV storage, Workers, and Pages deployment
- **Vietnamese Business Compliance** - Tax calculations, address validation, currency formatting
- **Payment Gateway Integration** - VNPay, MoMo, ZaloPay with real webhooks
- **Progressive Web App** - PWA with offline support and service workers
- **Production-Ready Frontend** - React 18 + TypeScript + Ant Design
- **Database Schema** - Complete Vietnamese business schema with provinces/districts

### In Progress
- TypeScript compilation fixes for backend
- Thermal receipt printing
- Vietnamese address validation system

### Planned
- SSL and domain configuration
- Monitoring and error tracking
- Backup and recovery procedures

## 🌟 Tính năng chính

### 💰 Bán hàng (POS)
- Giao diện bán hàng trực quan, tối ưu cho màn hình cảm ứng
- Quét mã vạch nhanh chóng
- Hỗ trợ nhiều phương thức thanh toán (tiền mặt, thẻ, VNPay, MoMo, ZaloPay)
- Tính toán thuế VAT tự động theo quy định Việt Nam
- In hóa đơn nhiệt và gửi hóa đơn qua email/SMS

### 📦 Quản lý sản phẩm
- Quản lý danh mục sản phẩm đa cấp
- Theo dõi tồn kho thời gian thực
- Cảnh báo hết hàng tự động
- Quản lý biến thể sản phẩm (size, màu sắc, v.v.)
- Nhập/xuất dữ liệu sản phẩm hàng loạt

### 👥 Quản lý khách hàng
- Hệ thống khách hàng thân thiết với 5 hạng (Đồng, Bạc, Vàng, Bạch kim, Kim cương)
- Tích điểm và đổi thưởng tự động
- Lịch sử mua hàng chi tiết
- Phân khúc khách hàng thông minh

### 📊 Báo cáo và phân tích
- Dashboard tổng quan với KPI quan trọng
- Báo cáo doanh thu theo thời gian thực
- Phân tích sản phẩm bán chạy
- Báo cáo hiệu suất nhân viên
- Xuất báo cáo Excel/PDF

### 🔧 Tính năng nâng cao
- PWA (Progressive Web App) - hoạt động offline
- Đồng bộ dữ liệu tự động khi có mạng
- Hỗ trợ đa thiết bị (máy tính, tablet, điện thoại)
- Bảo mật cao với mã hóa end-to-end
- Sao lưu dữ liệu tự động

## 🏗️ Kiến trúc hệ thống

### Frontend
- **Framework**: React 18 + TypeScript
- **UI Library**: Ant Design
- **State Management**: Zustand
- **Build Tool**: Vite
- **PWA**: Service Worker + Web App Manifest
- **Testing**: Vitest + Playwright

### Backend
- **Runtime**: Cloudflare Workers
- **Database**: Cloudflare D1 (SQLite)
- **Storage**: Cloudflare R2
- **Cache**: Cloudflare KV
- **CDN**: Cloudflare CDN

### Shared
- **Validation**: Zod schemas
- **Types**: TypeScript interfaces
- **API**: RESTful API với OpenAPI spec

## 🚀 Cài đặt và chạy

### Yêu cầu hệ thống
- Node.js 18+
- npm hoặc yarn
- Tài khoản Cloudflare

### Cài đặt

1. **Clone repository**
```bash
git clone https://github.com/namhbcf1/kho1.git
cd kho1
```

2. **Cài đặt dependencies**
```bash
# Root dependencies
npm install

# Frontend dependencies
cd frontend
npm install

# Backend dependencies
cd ../backend
npm install
```

3. **Cấu hình môi trường**
```bash
# Copy và chỉnh sửa file .env
cp .env.example .env
```

4. **Thiết lập Cloudflare**
```bash
# Đăng nhập Cloudflare
npx wrangler login

# Tạo D1 database
npx wrangler d1 create khoaugment-pos-db

# Tạo KV namespaces
npx wrangler kv:namespace create "CACHE"
npx wrangler kv:namespace create "SESSIONS"
npx wrangler kv:namespace create "RATE_LIMITS"

# Tạo R2 bucket
npx wrangler r2 bucket create khoaugment-pos-storage
```

5. **Chạy development**
```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev
```

### Deployment

1. **Deploy Backend**
```bash
cd backend
npm run deploy
```

2. **Deploy Frontend**
```bash
cd frontend
npm run build
npm run deploy
```

## 📱 PWA Installation

KhoAugment POS có thể được cài đặt như một ứng dụng native:

### Desktop
1. Mở trình duyệt Chrome/Edge
2. Nhấp vào biểu tượng cài đặt trong thanh địa chỉ
3. Chọn "Cài đặt KhoAugment POS"

### Mobile
1. Mở trong Safari (iOS) hoặc Chrome (Android)
2. Nhấp "Thêm vào màn hình chính"
3. Xác nhận cài đặt

## 🧪 Testing

### Unit Tests
```bash
cd frontend
npm run test
```

### E2E Tests
```bash
cd frontend
npm run test:e2e
```

### Coverage Report
```bash
cd frontend
npm run test:coverage
```

## 📚 API Documentation

API documentation được tạo tự động từ OpenAPI spec:
- Development: http://localhost:8787/docs
- Production: https://khoaugment-pos-api-production.bangachieu2.workers.dev/docs

## 🔐 Bảo mật

- Mã hóa dữ liệu end-to-end
- JWT authentication với refresh tokens
- Rate limiting và DDoS protection
- HTTPS bắt buộc
- CSP headers
- Input validation với Zod

## 🌍 Localization

Hệ thống hỗ trợ đa ngôn ngữ:
- Tiếng Việt (mặc định)
- English
- Dễ dàng thêm ngôn ngữ mới

## 📊 Monitoring

- Cloudflare Analytics
- Error tracking với Sentry
- Performance monitoring
- Uptime monitoring

## 🤝 Contributing

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Tạo Pull Request

## 📄 License

Dự án này được phân phối dưới giấy phép MIT. Xem file `LICENSE` để biết thêm chi tiết.

## 🆘 Hỗ trợ

- 📧 Email: support@khoaugment.com
- 📞 Hotline: 1900-xxxx
- 💬 Chat: https://khoaugment.com/support
- 📖 Documentation: https://docs.khoaugment.com

## 🗺️ Roadmap

### Q1 2024
- [ ] Tích hợp với hệ thống kế toán
- [ ] Mobile app (React Native)
- [ ] API cho third-party integrations

### Q2 2024
- [ ] AI-powered analytics
- [ ] Multi-store management
- [ ] Advanced inventory forecasting

### Q3 2024
- [ ] E-commerce integration
- [ ] Advanced reporting dashboard
- [ ] Franchise management

## 🙏 Acknowledgments

- [Ant Design](https://ant.design/) - UI Component Library
- [Cloudflare](https://cloudflare.com/) - Infrastructure
- [React](https://reactjs.org/) - Frontend Framework
- [TypeScript](https://typescriptlang.org/) - Type Safety

---

Made with ❤️ for Vietnamese businesses
