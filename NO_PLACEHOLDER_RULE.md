# ANTI-PLACEHOLDER RULE - KHÔNG BAO GIỜ DÙNG PLACEHOLDER

## 🚫 QUY TẮC TUYỆT ĐỐI: KHÔNG BAO GIỜ SỬ DỤNG PLACEHOLDER

### ❌ CẤM TUYỆT ĐỐI:
- KHÔNG được tạo component với nội dung "Trang đang được phát triển"
- KHÔNG được tạo component với nội dung "Under development" 
- KHÔNG được tạo component với nội dung "Coming soon"
- KHÔNG được tạo component trống chỉ có thông báo tạm thời
- KHÔNG được để component hiển thị placeholder text

### ✅ BẮT BUỘC PHẢI LÀM:
- Tạo component hoàn chỉnh với chức năng thực tế
- Sử dụng dữ liệu thật hoặc mock data có ý nghĩa
- Tích hợp UI/UX hoàn chỉnh với Ant Design
- Implement Vietnamese localization
- Tích hợp với backend API endpoints
- Xử lý error states và loading states đúng cách

### 🎯 YÊU CẦU CỤ THỂ CHO VIETNAMESE POS:

#### 1. PRODUCTS PAGE:
- Full CRUD operations (Create, Read, Update, Delete)
- Vietnamese product categories
- VND currency formatting
- Image upload functionality
- Barcode/QR code support
- Inventory management
- Drag & drop product management

#### 2. ORDERS PAGE:
- Complete order workflow
- Payment integration (VNPay, MoMo, ZaloPay)
- Order status tracking
- Vietnamese receipt printing
- Customer management
- Timeline view with order history

#### 3. ANALYTICS PAGE:
- Real-time sales charts
- Revenue analytics in VND
- Vietnamese date/time formatting
- Export functionality (Excel, PDF)
- Dashboard widgets with actual data
- Performance metrics

#### 4. STAFF PAGE:
- Staff management system
- Role-based permissions
- Vietnamese staff information forms
- Work schedule management
- Salary calculation in VND

#### 5. PAYMENTS PAGE:
- Vietnamese payment gateway integration
- QR code payment support
- Cash register functionality
- Receipt generation
- Payment history tracking

#### 6. SETTINGS PAGE:
- Store configuration
- Tax settings (VAT)
- Currency settings (VND)
- Printer configuration
- Vietnamese language settings

### 🔧 TECHNICAL REQUIREMENTS:

#### Components must have:
- TypeScript interfaces
- Proper error handling
- Loading states
- Empty states (but not placeholder states)
- Responsive design
- Accessibility features
- Vietnamese text support

#### Data Integration:
- Connect to real API endpoints
- Use Zustand for state management
- Implement proper caching
- Handle offline scenarios with service workers

### 🚨 ENFORCEMENT:

**IF ANY COMPONENT IS FOUND WITH PLACEHOLDER CONTENT:**
1. Immediately replace with functional component
2. Implement full feature set
3. Add proper Vietnamese localization
4. Connect to backend services
5. Test all functionality

### 📝 APPROVED TEMPORARY STATES:

**ONLY these are acceptable while loading:**
- Skeleton loaders (Ant Design Skeleton)
- Loading spinners during API calls
- Empty state with actionable content (not "under development")
- Error boundaries with recovery options

### ⚡ IMMEDIATE ACTION REQUIRED:

When creating ANY new component:
1. Plan the full feature scope
2. Implement complete functionality
3. Add Vietnamese language support
4. Connect to backend services
5. Test all user flows
6. NO PLACEHOLDER CONTENT ALLOWED

---

**Remember: Users expect a fully functional Vietnamese POS system, not development placeholders!**

**Last Updated:** 2025-07-17
**Enforced By:** Vietnamese POS Development Team
**Violation Consequences:** Immediate replacement with functional component