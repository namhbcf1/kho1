// Application routes
export const ROUTES = {
  // Public routes
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  
  // Protected routes
  DASHBOARD: '/dashboard',
  
  // POS
  POS: '/pos',
  
  // Products
  PRODUCTS: '/products',
  PRODUCTS_LIST: '/products/list',
  PRODUCTS_ADD: '/products/add',
  PRODUCTS_EDIT: '/products/edit/:id',
  PRODUCTS_VIEW: '/products/view/:id',
  PRODUCTS_CATEGORIES: '/products/categories',
  PRODUCTS_INVENTORY: '/products/inventory',
  
  // Customers
  CUSTOMERS: '/customers',
  CUSTOMERS_LIST: '/customers/list',
  CUSTOMERS_ADD: '/customers/add',
  CUSTOMERS_EDIT: '/customers/edit/:id',
  CUSTOMERS_VIEW: '/customers/view/:id',
  CUSTOMERS_LOYALTY: '/customers/loyalty',
  
  // Orders
  ORDERS: '/orders',
  ORDERS_LIST: '/orders/list',
  ORDERS_VIEW: '/orders/view/:id',
  ORDERS_REFUNDS: '/orders/refunds',
  
  // Analytics
  ANALYTICS: '/analytics',
  ANALYTICS_SALES: '/analytics/sales',
  ANALYTICS_REVENUE: '/analytics/revenue',
  ANALYTICS_INVENTORY: '/analytics/inventory',
  ANALYTICS_CUSTOMERS: '/analytics/customers',
  
  // Payments
  PAYMENTS: '/payments',
  PAYMENTS_METHODS: '/payments/methods',
  PAYMENTS_HISTORY: '/payments/history',
  
  // Staff
  STAFF: '/staff',
  STAFF_MANAGEMENT: '/staff/management',
  STAFF_PERFORMANCE: '/staff/performance',
  STAFF_SHIFTS: '/staff/shifts',
  
  // Settings
  SETTINGS: '/settings',
  SETTINGS_BUSINESS: '/settings/business',
  SETTINGS_TAX: '/settings/tax',
  SETTINGS_RECEIPT: '/settings/receipt',
  SETTINGS_PAYMENT: '/settings/payment',
  SETTINGS_BACKUP: '/settings/backup',
  
  // Profile
  PROFILE: '/profile',
  CHANGE_PASSWORD: '/change-password',
} as const;

// Route helpers
export const getProductEditRoute = (id: string) => ROUTES.PRODUCTS_EDIT.replace(':id', id);
export const getProductViewRoute = (id: string) => ROUTES.PRODUCTS_VIEW.replace(':id', id);
export const getCustomerEditRoute = (id: string) => ROUTES.CUSTOMERS_EDIT.replace(':id', id);
export const getCustomerViewRoute = (id: string) => ROUTES.CUSTOMERS_VIEW.replace(':id', id);
export const getOrderViewRoute = (id: string) => ROUTES.ORDERS_VIEW.replace(':id', id);

// Navigation menu structure
export const MENU_ITEMS = [
  {
    key: 'dashboard',
    path: ROUTES.DASHBOARD,
    label: 'Tổng quan',
    icon: 'DashboardOutlined',
  },
  {
    key: 'pos',
    path: ROUTES.POS,
    label: 'Bán hàng (POS)',
    icon: 'ShoppingCartOutlined',
  },
  {
    key: 'products',
    label: 'Sản phẩm',
    icon: 'ShopOutlined',
    children: [
      {
        key: 'products-list',
        path: ROUTES.PRODUCTS_LIST,
        label: 'Danh sách sản phẩm',
      },
      {
        key: 'products-categories',
        path: ROUTES.PRODUCTS_CATEGORIES,
        label: 'Danh mục',
      },
      {
        key: 'products-inventory',
        path: ROUTES.PRODUCTS_INVENTORY,
        label: 'Quản lý tồn kho',
      },
    ],
  },
  {
    key: 'customers',
    label: 'Khách hàng',
    icon: 'UserOutlined',
    children: [
      {
        key: 'customers-list',
        path: ROUTES.CUSTOMERS_LIST,
        label: 'Danh sách khách hàng',
      },
      {
        key: 'customers-loyalty',
        path: ROUTES.CUSTOMERS_LOYALTY,
        label: 'Chương trình khách hàng thân thiết',
      },
    ],
  },
  {
    key: 'orders',
    label: 'Đơn hàng',
    icon: 'FileTextOutlined',
    children: [
      {
        key: 'orders-list',
        path: ROUTES.ORDERS_LIST,
        label: 'Danh sách đơn hàng',
      },
      {
        key: 'orders-refunds',
        path: ROUTES.ORDERS_REFUNDS,
        label: 'Hoàn trả',
      },
    ],
  },
  {
    key: 'analytics',
    label: 'Báo cáo & Thống kê',
    icon: 'BarChartOutlined',
    children: [
      {
        key: 'analytics-sales',
        path: ROUTES.ANALYTICS_SALES,
        label: 'Báo cáo bán hàng',
      },
      {
        key: 'analytics-revenue',
        path: ROUTES.ANALYTICS_REVENUE,
        label: 'Báo cáo doanh thu',
      },
      {
        key: 'analytics-inventory',
        path: ROUTES.ANALYTICS_INVENTORY,
        label: 'Báo cáo tồn kho',
      },
      {
        key: 'analytics-customers',
        path: ROUTES.ANALYTICS_CUSTOMERS,
        label: 'Phân tích khách hàng',
      },
    ],
  },
  {
    key: 'payments',
    label: 'Thanh toán',
    icon: 'CreditCardOutlined',
    children: [
      {
        key: 'payments-methods',
        path: ROUTES.PAYMENTS_METHODS,
        label: 'Phương thức thanh toán',
      },
      {
        key: 'payments-history',
        path: ROUTES.PAYMENTS_HISTORY,
        label: 'Lịch sử giao dịch',
      },
    ],
  },
  {
    key: 'staff',
    label: 'Nhân viên',
    icon: 'TeamOutlined',
    children: [
      {
        key: 'staff-management',
        path: ROUTES.STAFF_MANAGEMENT,
        label: 'Quản lý nhân viên',
      },
      {
        key: 'staff-performance',
        path: ROUTES.STAFF_PERFORMANCE,
        label: 'Hiệu suất làm việc',
      },
      {
        key: 'staff-shifts',
        path: ROUTES.STAFF_SHIFTS,
        label: 'Quản lý ca làm việc',
      },
    ],
  },
  {
    key: 'settings',
    label: 'Cài đặt',
    icon: 'SettingOutlined',
    children: [
      {
        key: 'settings-business',
        path: ROUTES.SETTINGS_BUSINESS,
        label: 'Thông tin doanh nghiệp',
      },
      {
        key: 'settings-tax',
        path: ROUTES.SETTINGS_TAX,
        label: 'Cài đặt thuế',
      },
      {
        key: 'settings-receipt',
        path: ROUTES.SETTINGS_RECEIPT,
        label: 'Mẫu hóa đơn',
      },
      {
        key: 'settings-payment',
        path: ROUTES.SETTINGS_PAYMENT,
        label: 'Cổng thanh toán',
      },
      {
        key: 'settings-backup',
        path: ROUTES.SETTINGS_BACKUP,
        label: 'Sao lưu dữ liệu',
      },
    ],
  },
] as const;
