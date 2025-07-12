// Analytics TypeScript types
export interface DashboardKPI {
  title: string;
  value: number | string;
  change: number;
  changeType: 'increase' | 'decrease' | 'neutral';
  icon: string;
  color: string;
}

export interface SalesData {
  date: string;
  sales: number;
  orders: number;
  customers: number;
}

export interface RevenueData {
  period: string;
  revenue: number;
  profit: number;
  growth: number;
}

export interface CustomerAnalyticsData {
  totalCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  averageOrderValue: number;
  customerLifetimeValue: number;
  topCustomers: Array<{
    id: string;
    name: string;
    totalSpent: number;
    orders: number;
  }>;
}

export interface ProductAnalyticsData {
  topProducts: Array<{
    id: string;
    name: string;
    sales: number;
    revenue: number;
    quantity: number;
  }>;
  categoryPerformance: Array<{
    category: string;
    sales: number;
    revenue: number;
  }>;
}

export interface InventoryAnalyticsData {
  totalProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  inventoryValue: number;
  turnoverRate: number;
}
