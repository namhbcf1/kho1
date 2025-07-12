export interface RevenueData {
  date: string;
  revenue: number;
}

export interface RevenueChartProps {
  data: RevenueData[];
  title?: string;
  height?: number;
}
