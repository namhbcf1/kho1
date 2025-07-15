import React from 'react';
import type { BreadcrumbProps } from 'antd';

export interface BreadcrumbItem {
  title: string | React.ReactNode;
  href?: string;
  key?: string;
  onClick?: () => void;
}

export interface AppBreadcrumbProps {
  items: BreadcrumbItem[];
  showHome?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export interface NavigationBreadcrumbItem {
  title: string;
  href?: string;
  key?: string;
}
