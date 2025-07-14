// Dashboard Component Types
import { ReactNode } from 'react';

export interface DashboardTheme {
  mode: 'light' | 'dark';
  colors: {
    primary: string;
    secondary: string;
    success: string;
    warning: string;
    error: string;
    background: string;
    surface: string;
    text: {
      primary: string;
      secondary: string;
      disabled: string;
    };
    border: string;
  };
}

export interface ResponsiveBreakpoints {
  xs: number; // < 576px
  sm: number; // >= 576px
  md: number; // >= 768px
  lg: number; // >= 992px
  xl: number; // >= 1200px
  xxl: number; // >= 1600px
}

export interface DashboardGridProps {
  children: ReactNode;
  spacing?: number | [number, number];
  responsive?: boolean;
  className?: string;
  'aria-label'?: string;
}

export interface DashboardWidgetProps {
  title?: string;
  subtitle?: string;
  icon?: ReactNode;
  loading?: boolean;
  error?: string;
  onRefresh?: () => void;
  refreshing?: boolean;
  children: ReactNode;
  className?: string;
  headerActions?: ReactNode;
  size?: 'small' | 'default' | 'large';
  'aria-label'?: string;
  'aria-describedby'?: string;
}

export interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
  icon?: ReactNode;
  color?: string;
  loading?: boolean;
  formatter?: (value: number | string) => string;
  size?: 'small' | 'default' | 'large';
  trend?: 'up' | 'down' | 'neutral';
  'aria-label'?: string;
}

export interface ChartContainerProps {
  title: string;
  children: ReactNode;
  loading?: boolean;
  error?: string;
  onRefresh?: () => void;
  height?: number | string;
  className?: string;
  headerActions?: ReactNode;
  'aria-label'?: string;
}

export interface SkeletonProps {
  loading?: boolean;
  children?: ReactNode;
  rows?: number;
  avatar?: boolean;
  title?: boolean;
  round?: boolean;
  active?: boolean;
}

export interface ResponsiveContainerProps {
  children: ReactNode;
  breakpoints?: Partial<ResponsiveBreakpoints>;
  className?: string;
}

export interface QuickActionProps {
  icon: ReactNode;
  title: string;
  description?: string;
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
  color?: string;
  size?: 'small' | 'default' | 'large';
  'aria-label'?: string;
}

export interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  breadcrumbs?: Array<{
    title: string;
    href?: string;
  }>;
  className?: string;
}

export interface StatCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  color?: string;
  loading?: boolean;
  className?: string;
  'aria-label'?: string;
}

export interface LayoutConfig {
  mobile: {
    span: number;
    order?: number;
  };
  tablet: {
    span: number;
    order?: number;
  };
  desktop: {
    span: number;
    order?: number;
  };
}

export interface DashboardLayoutProps {
  children: ReactNode;
  layout?: LayoutConfig;
  className?: string;
}