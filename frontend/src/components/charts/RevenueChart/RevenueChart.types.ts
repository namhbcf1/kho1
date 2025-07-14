export interface RevenueData {
  date: string;
  revenue: number;
  orders?: number;
}

export interface RevenueChartProps {
  data?: RevenueData[];
  title?: string;
  height?: number;
  showOrders?: boolean;
  currency?: string;
  loading?: boolean;
}
