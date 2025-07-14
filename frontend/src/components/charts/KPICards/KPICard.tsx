import React from 'react';
import { Card, Statistic } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';

interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  changeType?: 'increase' | 'decrease';
  icon?: React.ReactNode;
  color?: string;
  loading?: boolean;
  precision?: number;
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  change,
  changeType = 'increase',
  icon,
  color = '#1890ff',
  loading = false,
  precision = 0,
}) => {
  const getTrendIcon = () => {
    if (changeType === 'increase') return <ArrowUpOutlined />;
    if (changeType === 'decrease') return <ArrowDownOutlined />;
    return null;
  };

  const getTrendColor = () => {
    if (changeType === 'increase') return '#3f8600';
    if (changeType === 'decrease') return '#cf1322';
    return color;
  };

  return (
    <Card 
      loading={loading}
      className="hover:shadow-md transition-shadow"
      bodyStyle={{ padding: '20px' }}
    >
      <div className="flex items-center justify-between mb-4">
        <div style={{ color }} className="text-2xl">
          {icon}
        </div>
        {change !== undefined && (
          <div className="flex items-center" style={{ color: getTrendColor() }}>
            {getTrendIcon()}
            <span className="ml-1 text-sm font-medium">
              {Math.abs(change)}%
            </span>
          </div>
        )}
      </div>
      
      <Statistic
        title={title}
        value={value}
        precision={typeof value === 'number' ? precision : 0}
        valueStyle={{ 
          color: '#262626',
          fontSize: '28px',
          fontWeight: 'bold',
          lineHeight: 1.2,
        }}
        className="mb-0"
      />
      
      {change !== undefined && (
        <div className="mt-2 text-sm text-gray-500">
          So với hôm qua
        </div>
      )}
    </Card>
  );
};

export default KPICard;
