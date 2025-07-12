# API Documentation - KhoAugment POS

Tài liệu API cho hệ thống KhoAugment POS.

## Base URL

- **Development**: `http://localhost:8787`
- **Staging**: `https://api-staging.khoaugment.com`
- **Production**: `https://api.khoaugment.com`

## Authentication

### JWT Token

Tất cả API endpoints (trừ auth) yêu cầu JWT token trong header:

```
Authorization: Bearer <jwt_token>
```

### Refresh Token

Khi access token hết hạn, sử dụng refresh token để lấy token mới:

```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "your_refresh_token"
}
```

## Error Handling

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {},
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Validation Error
- `429` - Rate Limited
- `500` - Internal Server Error

## Authentication Endpoints

### POST /api/auth/login

Đăng nhập người dùng.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "remember": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "User Name",
      "role": "admin",
      "permissions": ["read:products", "write:orders"]
    },
    "tokens": {
      "accessToken": "jwt_token",
      "refreshToken": "refresh_token",
      "expiresIn": 3600
    }
  }
}
```

### POST /api/auth/register

Đăng ký người dùng mới.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "User Name",
  "phone": "0901234567",
  "position": "Cashier"
}
```

### POST /api/auth/logout

Đăng xuất người dùng.

**Request:**
```json
{
  "refreshToken": "refresh_token"
}
```

## Product Endpoints

### GET /api/products

Lấy danh sách sản phẩm.

**Query Parameters:**
- `page` (number): Trang hiện tại (default: 1)
- `limit` (number): Số items per page (default: 20)
- `search` (string): Tìm kiếm theo tên
- `category` (string): Lọc theo category ID
- `active` (boolean): Lọc theo trạng thái
- `lowStock` (boolean): Chỉ sản phẩm sắp hết hàng

**Response:**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "uuid",
        "name": "Cà phê đen",
        "price": 25000,
        "cost": 15000,
        "stock": 100,
        "minStock": 10,
        "barcode": "1234567890123",
        "categoryId": "uuid",
        "images": ["url1", "url2"],
        "active": true,
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "pages": 5
    }
  }
}
```

### POST /api/products

Tạo sản phẩm mới.

**Request:**
```json
{
  "name": "Cà phê đen",
  "description": "Cà phê đen truyền thống",
  "price": 25000,
  "cost": 15000,
  "stock": 100,
  "minStock": 10,
  "barcode": "1234567890123",
  "categoryId": "uuid",
  "images": ["url1", "url2"],
  "variants": [
    {
      "name": "Size M",
      "price": 25000,
      "stock": 50,
      "attributes": {
        "size": "M"
      }
    }
  ]
}
```

### GET /api/products/:id

Lấy chi tiết sản phẩm.

### PUT /api/products/:id

Cập nhật sản phẩm.

### DELETE /api/products/:id

Xóa sản phẩm.

## Customer Endpoints

### GET /api/customers

Lấy danh sách khách hàng.

**Query Parameters:**
- `page`, `limit`: Pagination
- `search`: Tìm kiếm theo tên, email, phone
- `tier`: Lọc theo hạng thành viên
- `active`: Lọc theo trạng thái

### POST /api/customers

Tạo khách hàng mới.

**Request:**
```json
{
  "name": "Nguyễn Văn A",
  "email": "customer@example.com",
  "phone": "0901234567",
  "address": {
    "street": "123 Đường ABC",
    "ward": "Phường 1",
    "district": "Quận 1",
    "province": "TP Hồ Chí Minh"
  },
  "dateOfBirth": "1990-01-01",
  "gender": "male"
}
```

### GET /api/customers/:id/loyalty

Lấy thông tin loyalty của khách hàng.

**Response:**
```json
{
  "success": true,
  "data": {
    "customerId": "uuid",
    "points": 1500,
    "tier": {
      "id": "silver",
      "name": "Bạc",
      "discountPercentage": 2,
      "pointsMultiplier": 1.2
    },
    "totalSpent": 5000000,
    "nextTier": {
      "id": "gold",
      "name": "Vàng",
      "minimumSpent": 20000000
    },
    "progress": 25.5
  }
}
```

## Order Endpoints

### GET /api/orders

Lấy danh sách đơn hàng.

### POST /api/orders

Tạo đơn hàng mới.

**Request:**
```json
{
  "customerId": "uuid",
  "items": [
    {
      "productId": "uuid",
      "variantId": "uuid",
      "name": "Cà phê đen",
      "price": 25000,
      "quantity": 2,
      "total": 50000
    }
  ],
  "subtotal": 50000,
  "discount": {
    "type": "percentage",
    "value": 10,
    "amount": 5000
  },
  "tax": {
    "rate": 0.1,
    "amount": 4500,
    "inclusive": false
  },
  "total": 49500,
  "paymentMethod": "cash",
  "cashReceived": 50000,
  "change": 500,
  "notes": "Ghi chú đơn hàng"
}
```

### GET /api/orders/:id

Lấy chi tiết đơn hàng.

### PUT /api/orders/:id/status

Cập nhật trạng thái đơn hàng.

**Request:**
```json
{
  "status": "completed",
  "notes": "Đã hoàn thành"
}
```

## Payment Endpoints

### POST /api/payments/vnpay

Tạo payment URL cho VNPay.

**Request:**
```json
{
  "orderId": "uuid",
  "amount": 100000,
  "orderInfo": "Thanh toán đơn hàng #12345",
  "returnUrl": "https://khoaugment.com/payment/return",
  "ipAddress": "192.168.1.1"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "paymentUrl": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?...",
    "transactionId": "uuid"
  }
}
```

### POST /api/payments/vnpay/callback

Xử lý callback từ VNPay.

### POST /api/payments/momo

Tạo payment cho MoMo.

### POST /api/payments/zalopay

Tạo payment cho ZaloPay.

## Analytics Endpoints

### GET /api/analytics/dashboard

Lấy dữ liệu dashboard.

**Response:**
```json
{
  "success": true,
  "data": {
    "today": {
      "revenue": 1500000,
      "orders": 45,
      "customers": 38,
      "averageOrder": 33333
    },
    "growth": {
      "revenue": 12.5,
      "orders": 8.3,
      "customers": 15.2
    },
    "topProducts": [
      {
        "id": "uuid",
        "name": "Cà phê đen",
        "sold": 125,
        "revenue": 3125000
      }
    ]
  }
}
```

### GET /api/analytics/revenue

Lấy dữ liệu doanh thu theo thời gian.

**Query Parameters:**
- `period`: today, week, month, quarter, year, custom
- `startDate`: YYYY-MM-DD (for custom period)
- `endDate`: YYYY-MM-DD (for custom period)
- `groupBy`: hour, day, week, month

### GET /api/analytics/products

Phân tích sản phẩm bán chạy.

### GET /api/analytics/customers

Phân tích khách hàng.

## Settings Endpoints

### GET /api/settings

Lấy cài đặt hệ thống.

### PUT /api/settings

Cập nhật cài đặt.

**Request:**
```json
{
  "business": {
    "name": "Cửa hàng ABC",
    "address": "123 Đường XYZ",
    "phone": "0901234567",
    "email": "info@abc.com",
    "taxCode": "1234567890"
  },
  "pos": {
    "currency": "VND",
    "taxRate": 0.1,
    "receiptTemplate": "standard",
    "printLogo": true
  },
  "payment": {
    "enableCash": true,
    "enableCard": true,
    "enableVNPay": true,
    "enableMoMo": false,
    "enableZaloPay": false
  }
}
```

## Rate Limiting

- **Authentication**: 5 requests per minute per IP
- **General API**: 100 requests per minute per user
- **Analytics**: 20 requests per minute per user
- **File Upload**: 10 requests per minute per user

## Webhooks

### Order Events

```http
POST https://your-webhook-url.com/orders
Content-Type: application/json
X-Webhook-Signature: sha256=...

{
  "event": "order.created",
  "data": {
    "order": { /* order object */ }
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Payment Events

```http
POST https://your-webhook-url.com/payments
Content-Type: application/json

{
  "event": "payment.completed",
  "data": {
    "payment": { /* payment object */ }
  }
}
```

## SDK và Libraries

### JavaScript/TypeScript

```bash
npm install @khoaugment/pos-sdk
```

```typescript
import { KhoAugmentPOS } from '@khoaugment/pos-sdk';

const client = new KhoAugmentPOS({
  apiUrl: 'https://api.khoaugment.com',
  apiKey: 'your-api-key'
});

const products = await client.products.list();
```

### cURL Examples

```bash
# Get products
curl -X GET "https://api.khoaugment.com/api/products" \
  -H "Authorization: Bearer your_token"

# Create order
curl -X POST "https://api.khoaugment.com/api/orders" \
  -H "Authorization: Bearer your_token" \
  -H "Content-Type: application/json" \
  -d '{"items": [...]}'
```

---

Để biết thêm chi tiết, truy cập [Interactive API Documentation](https://api.khoaugment.com/docs).
