// Route definitions for KhoAugment POS
export const routes = {
  DASHBOARD: '/',
  POS: '/pos',
  PRODUCTS: '/products',
  CUSTOMERS: '/customers',
  ORDERS: '/orders',
  REPORTS: '/reports',
  SETTINGS: '/settings',
  LOGIN: '/login'
} as const;

export type RouteKey = keyof typeof routes;
export type RoutePath = typeof routes[RouteKey];

// Navigation menu items
export const navigationItems = [
  {
    key: routes.DASHBOARD,
    label: 'Dashboard',
    icon: 'DashboardOutlined'
  },
  {
    key: routes.POS,
    label: 'Điểm bán hàng',
    icon: 'ShopOutlined'
  },
  {
    key: routes.PRODUCTS,
    label: 'Sản phẩm',
    icon: 'ProductOutlined'
  },
  {
    key: routes.CUSTOMERS,
    label: 'Khách hàng',
    icon: 'TeamOutlined'
  },
  {
    key: routes.ORDERS,
    label: 'Đơn hàng',
    icon: 'FileTextOutlined'
  },
  {
    key: routes.REPORTS,
    label: 'Báo cáo',
    icon: 'BarChartOutlined'
  },
  {
    key: routes.SETTINGS,
    label: 'Cài đặt',
    icon: 'SettingOutlined'
  }
];