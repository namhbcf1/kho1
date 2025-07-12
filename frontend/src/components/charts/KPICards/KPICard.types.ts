export interface KPICardProps {
  title: string;
  value: number | string;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  precision?: number;
  loading?: boolean;
}
