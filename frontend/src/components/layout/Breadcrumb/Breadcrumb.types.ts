import type { BreadcrumbProps } from 'antd';

export interface BreadcrumbItem {
  title: React.ReactNode;
  href?: string;
  onClick?: () => void;
}

export interface AppBreadcrumbProps {
  items: BreadcrumbItem[];
  showHome?: boolean;
}
