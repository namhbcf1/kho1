// Real-time data types for Vietnamese POS system
export interface RealTimeMessage {
  type: 'data' | 'subscribe' | 'unsubscribe' | 'ping' | 'pong' | 'subscribed' | 'unsubscribed' | 'error';
  channel?: string;
  data?: any;
  timestamp: string;
}

export interface SalesMetrics {
  // Today's sales
  todayRevenue: number;
  todayOrders: number;
  todayCustomers: number;
  todayAverageOrder: number;
  
  // Growth compared to yesterday
  revenueGrowth: number;
  ordersGrowth: number;
  customersGrowth: number;
  
  // Hourly breakdown
  hourlyRevenue: Array<{
    hour: number;
    revenue: number;
    orders: number;
  }>;
  
  // Top products
  topProducts: Array<{
    id: string;
    name: string;
    sold: number;
    revenue: number;
  }>;
  
  // Top customers
  topCustomers: Array<{
    id: string;
    name: string;
    orders: number;
    spent: number;
  }>;
  
  timestamp: string;
}

export interface InventoryUpdate {
  productId: string;
  productName: string;
  sku: string;
  previousStock: number;
  newStock: number;
  minStockLevel: number;
  maxStockLevel: number;
  stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock';
  location: string;
  reason: 'sale' | 'purchase' | 'adjustment' | 'return' | 'damage';
  timestamp: string;
}

export interface OrderStatusUpdate {
  orderId: string;
  previousStatus: string;
  newStatus: 'pending' | 'processing' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  customerName: string;
  customerPhone: string;
  total: number;
  paymentMethod: 'cash' | 'card' | 'momo' | 'vnpay' | 'zalopay';
  estimatedTime?: number; // minutes
  notes?: string;
  timestamp: string;
}

export interface UserActivity {
  userId: string;
  userName: string;
  userRole: 'admin' | 'cashier' | 'kitchen' | 'manager';
  activity: 'login' | 'logout' | 'sale' | 'return' | 'inventory_update' | 'report_view' | 'settings_change';
  details: string;
  deviceInfo: {
    type: 'desktop' | 'mobile' | 'tablet';
    browser: string;
    location: string;
  };
  timestamp: string;
}

export interface LowStockAlert {
  productId: string;
  productName: string;
  sku: string;
  currentStock: number;
  minStockLevel: number;
  daysUntilEmpty: number;
  averageDailySales: number;
  suggestedReorderQuantity: number;
  supplier: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
}

export interface PaymentTransaction {
  transactionId: string;
  orderId: string;
  amount: number;
  currency: 'VND';
  paymentMethod: 'cash' | 'card' | 'momo' | 'vnpay' | 'zalopay';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  customerName: string;
  cashierName: string;
  changeAmount?: number;
  vatAmount: number;
  discountAmount: number;
  timestamp: string;
}

export interface DashboardData {
  // Key metrics
  revenue: number;
  orders: number;
  customers: number;
  activeSessions: number;
  
  // Recent activity
  recentOrders: Array<{
    id: string;
    customer_name: string;
    total: number;
    created_at: string;
    status: string;
  }>;
  
  // Inventory alerts
  lowStockItems: Array<{
    name: string;
    stock: number;
    min_stock_level: number;
    percentage: number;
  }>;
  
  // Performance indicators
  averageOrderValue: number;
  conversionRate: number;
  customerSatisfaction: number;
  
  timestamp: string;
}

export interface RealTimeSubscription {
  channel: string;
  callback: (data: any) => void;
  errorHandler?: (error: Error) => void;
}

export interface WebSocketConnectionInfo {
  id: string;
  connected: boolean;
  channels: string[];
  reconnectAttempts: number;
  lastPing: number;
  latency: number;
  quality: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface VietnameseBusinessMetrics {
  // Vietnamese-specific metrics
  vatCollected: number;
  vatRate: number;
  discountGiven: number;
  loyaltyPointsAwarded: number;
  
  // Currency formatting
  currencySymbol: '₫';
  currencyFormat: 'VND';
  
  // Business hours
  businessHours: {
    open: string;
    close: string;
    timezone: 'Asia/Ho_Chi_Minh';
  };
  
  // Regional data
  location: {
    city: string;
    district: string;
    province: string;
  };
  
  // Compliance
  invoiceNumber: string;
  taxCode: string;
  
  timestamp: string;
}

export interface RealTimeError {
  code: string;
  message: string;
  channel?: string;
  timestamp: string;
  recoverable: boolean;
}

export interface SystemAlert {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  data?: any;
  dismissible: boolean;
  autoHide: boolean;
  duration?: number;
  timestamp: string;
}

// Channel types for subscription management
export type RealTimeChannels = 
  | 'dashboard'
  | 'inventory'
  | 'orders'
  | 'payments'
  | 'users'
  | 'alerts'
  | 'activity'
  | 'system';

// Event types for different channels
export interface ChannelEventMap {
  dashboard: DashboardData;
  inventory: InventoryUpdate;
  orders: OrderStatusUpdate;
  payments: PaymentTransaction;
  users: UserActivity;
  alerts: LowStockAlert | SystemAlert;
  activity: UserActivity;
  system: SystemAlert;
}

// Vietnamese currency formatting utilities
export interface VNDFormatOptions {
  showSymbol?: boolean;
  showDecimals?: boolean;
  abbreviated?: boolean;
  spacing?: boolean;
}

export interface RealTimeConfig {
  baseUrl: string;
  reconnectDelay: number;
  maxReconnectAttempts: number;
  heartbeatInterval: number;
  subscriptionTimeout: number;
  enableCompression: boolean;
  enableLogging: boolean;
  channels: RealTimeChannels[];
}

export default RealTimeMessage;