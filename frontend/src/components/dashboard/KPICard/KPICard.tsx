import React from 'react';
import { Card, Statistic, Typography, Skeleton } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, MinusOutlined } from '@ant-design/icons';
import { KPICardProps } from '../types';
import { useBreakpoint } from '../../../hooks/useMediaQuery';
import './KPICard.css';

const { Text } = Typography;

const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  change,
  changeType = 'neutral',
  icon,
  color,
  loading = false,
  formatter,
  size = 'default',
  trend,
  'aria-label': ariaLabel,
}) => {
  const { isMobile } = useBreakpoint();

  if (loading) {
    return (
      <Card 
        className={`kpi-card kpi-card--loading kpi-card--${size}`}
        size={isMobile ? 'small' : 'default'}
      >
        <div className="kpi-card__content">
          <div className="kpi-card__header">
            <Skeleton.Avatar size="small" shape="square" active />
            <Skeleton.Input size="small" style={{ width: 100 }} active />
          </div>
          <div className="kpi-card__value">
            <Skeleton.Input size="large" style={{ width: 120 }} active />
          </div>
          <div className="kpi-card__change">
            <Skeleton.Input size="small" style={{ width: 60 }} active />
          </div>
        </div>
      </Card>
    );
  }

  const getChangeIcon = () => {
    const iconProps = {
      className: 'kpi-card__change-icon',
      'aria-hidden': true,
    };

    switch (changeType) {
      case 'increase':
        return <ArrowUpOutlined {...iconProps} />;
      case 'decrease':
        return <ArrowDownOutlined {...iconProps} />;
      default:
        return <MinusOutlined {...iconProps} />;
    }
  };

  const getChangeColor = () => {
    switch (changeType) {
      case 'increase':
        return '#52c41a';
      case 'decrease':
        return '#ff4d4f';
      default:
        return '#8c8c8c';
    }
  };

  const formatValue = (val: string | number) => {
    if (formatter) return formatter(val);
    if (typeof val === 'number') {
      return new Intl.NumberFormat('vi-VN').format(val);
    }
    return val;
  };

  const cardClass = `kpi-card kpi-card--${size} ${changeType ? `kpi-card--${changeType}` : ''}`;

  const accessibilityProps = {
    role: 'region',
    'aria-label': ariaLabel || `${title} metric`,
    'aria-describedby': `kpi-${title.replace(/\s+/g, '-').toLowerCase()}`,
  };

  return (
    <Card 
      className={cardClass}
      size={isMobile ? 'small' : 'default'}
      hoverable
      {...accessibilityProps}
    >
      <div className="kpi-card__content">
        <div className="kpi-card__header">
          {icon && (
            <div 
              className="kpi-card__icon"
              style={{ color: color }}
              aria-hidden="true"
            >
              {icon}
            </div>
          )}
          <Text 
            className="kpi-card__title"
            type="secondary"
            id={`kpi-${title.replace(/\s+/g, '-').toLowerCase()}`}
          >
            {title}
          </Text>
        </div>
        
        <div className="kpi-card__value-container">
          <Statistic
            value={value}
            formatter={(val) => formatValue(val as string | number)}
            valueStyle={{
              color: color || 'inherit',
              fontSize: isMobile ? '20px' : size === 'large' ? '28px' : '24px',
              fontWeight: 600,
            }}
            className="kpi-card__value"
          />
        </div>

        {change !== undefined && (
          <div 
            className="kpi-card__change"
            style={{ color: getChangeColor() }}
            aria-label={`${changeType === 'increase' ? 'Increased' : changeType === 'decrease' ? 'Decreased' : 'Changed'} by ${Math.abs(change)}%`}
          >
            {getChangeIcon()}
            <Text 
              className="kpi-card__change-text"
              style={{ color: getChangeColor() }}
            >
              {Math.abs(change).toFixed(1)}%
            </Text>
          </div>
        )}

        {trend && (
          <div 
            className={`kpi-card__trend kpi-card__trend--${trend}`}
            aria-label={`Trend: ${trend}`}
          >
            <div className="kpi-card__trend-indicator" />
          </div>
        )}
      </div>
    </Card>
  );
};

export default KPICard;