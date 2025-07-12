import React from 'react';
import { Card, Statistic } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import type { KPICardProps } from './KPICard.types';

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  prefix,
  suffix,
  trend,
  trendValue,
  precision = 0,
  loading = false,
}) => {
  const getTrendIcon = () => {
    if (trend === 'up') return <ArrowUpOutlined />;
    if (trend === 'down') return <ArrowDownOutlined />;
    return null;
  };

  const getTrendColor = () => {
    if (trend === 'up') return '#3f8600';
    if (trend === 'down') return '#cf1322';
    return undefined;
  };

  return (
    <Card loading={loading}>
      <Statistic
        title={title}
        value={value}
        precision={precision}
        valueStyle={{ color: getTrendColor() }}
        prefix={getTrendIcon() || prefix}
        suffix={suffix}
      />
      {trendValue && (
        <div style={{ marginTop: 8, fontSize: '14px', color: getTrendColor() }}>
          {trend === 'up' ? '+' : trend === 'down' ? '-' : ''}{trendValue}
        </div>
      )}
    </Card>
  );
};

export default KPICard;
