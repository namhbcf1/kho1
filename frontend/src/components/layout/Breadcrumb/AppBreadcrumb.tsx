import React from 'react';
import { Breadcrumb } from 'antd';
import { HomeOutlined, RightOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { useNavigation } from '../../../hooks/useNavigation';
import type { AppBreadcrumbProps } from './Breadcrumb.types';

// Auto-breadcrumb component that uses navigation context
export const AutoBreadcrumb: React.FC<{
  className?: string;
  style?: React.CSSProperties;
}> = ({ className, style }) => {
  const { breadcrumbs } = useNavigation();

  const breadcrumbItems = breadcrumbs.map((item, index) => {
    const isLast = index === breadcrumbs.length - 1;
    
    return {
      key: item.key || `breadcrumb-${index}`,
      title: item.href && !isLast ? (
        <Link to={item.href} className="breadcrumb-link hover:text-blue-600">
          {item.title}
        </Link>
      ) : (
        <span className={isLast ? 'breadcrumb-current font-medium' : 'breadcrumb-text'}>
          {item.title}
        </span>
      ),
    };
  });

  return (
    <Breadcrumb 
      items={breadcrumbItems}
      separator={<RightOutlined style={{ fontSize: '12px', color: '#999' }} />}
      className={className}
      style={{
        margin: '16px 0',
        ...style,
      }}
    />
  );
};

// Manual breadcrumb component for custom breadcrumbs
export const AppBreadcrumb: React.FC<AppBreadcrumbProps> = ({
  items,
  showHome = true,
  className,
  style,
}) => {
  const breadcrumbItems = [
    ...(showHome ? [{
      key: 'home',
      title: <Link to="/dashboard"><HomeOutlined /></Link>,
    }] : []),
    ...items.map((item, index) => ({
      key: item.key || `breadcrumb-${index}`,
      title: item.href ? (
        <Link to={item.href} className="breadcrumb-link hover:text-blue-600">
          {item.title}
        </Link>
      ) : (
        <span className="breadcrumb-text">
          {item.title}
        </span>
      ),
    })),
  ];

  return (
    <Breadcrumb 
      items={breadcrumbItems}
      separator={<RightOutlined style={{ fontSize: '12px', color: '#999' }} />}
      className={className}
      style={{
        margin: '16px 0',
        ...style,
      }}
    />
  );
};

export default AppBreadcrumb;