export interface SalesData {
  period: string;
  sales: number;
}

export interface SalesChartProps {
  data: SalesData[];
  title?: string;
  height?: number;
}
