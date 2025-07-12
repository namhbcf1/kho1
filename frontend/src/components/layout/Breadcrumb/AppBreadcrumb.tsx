import React from 'react';
import { Breadcrumb } from 'antd';
import { HomeOutlined } from '@ant-design/icons';
import type { AppBreadcrumbProps } from './Breadcrumb.types';

export const AppBreadcrumb: React.FC<AppBreadcrumbProps> = ({
  items,
  showHome = true,
}) => {
  const breadcrumbItems = [
    ...(showHome ? [{
      href: '/',
      title: <HomeOutlined />,
    }] : []),
    ...items,
  ];

  return (
    <Breadcrumb 
      items={breadcrumbItems}
      style={{ margin: '16px 0' }}
    />
  );
};

export default AppBreadcrumb;
