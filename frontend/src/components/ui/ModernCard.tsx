/**
 * Modern Card Component for Dashboard
 * Fixes: Outdated card components, poor visual hierarchy
 * Implements: Modern card design, hover effects, customizable layouts
 */

import React from 'react';
import { Card, CardProps, Space, Badge, Tooltip, Typography, Skeleton } from 'antd';
import { 
  InfoCircleOutlined, 
  TrendingUpOutlined, 
  TrendingDownOutlined,
  MoreOutlined,
  LoadingOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

export interface ModernCardProps extends Omit<CardProps, 'loading'> {
  variant?: 'default' | 'gradient' | 'glass' | 'outlined' | 'elevated' | 'minimal';
  loading?: boolean;
  skeleton?: boolean;
  headerIcon?: React.ReactNode;
  headerExtra?: React.ReactNode;
  statusBadge?: {
    status: 'success' | 'processing' | 'error' | 'warning' | 'default';
    text?: string;
  };
  trend?: {
    value: number;
    label?: string;
    type?: 'up' | 'down' | 'neutral';
  };
  metric?: {
    value: string | number;
    label: string;
    prefix?: string;
    suffix?: string;
    precision?: number;
  };
  hover?: boolean;
  interactive?: boolean;
  glowEffect?: boolean;
  animation?: 'fade' | 'slide' | 'scale' | 'bounce';
  onCardClick?: () => void;
  footer?: React.ReactNode;
}

export const ModernCard: React.FC<ModernCardProps> = ({
  variant = 'default',
  loading = false,
  skeleton = false,
  headerIcon,
  headerExtra,
  statusBadge,
  trend,
  metric,
  hover = true,
  interactive = false,
  glowEffect = false,
  animation = 'fade',
  onCardClick,
  footer,
  title,
  children,
  className = '',
  style = {},
  ...rest
}) => {
  // Build class names
  const classNames = [
    'modern-card',
    `modern-card-${variant}`,
    hover ? 'modern-card-hover' : '',
    interactive ? 'modern-card-interactive' : '',
    glowEffect ? 'modern-card-glow' : '',
    `modern-card-${animation}`,
    loading ? 'modern-card-loading' : '',
    className
  ].filter(Boolean).join(' ');

  // Build card title with icon and badge
  const cardTitle = title && (
    <div className="modern-card-header">
      <Space align="center">
        {headerIcon && <span className="modern-card-header-icon">{headerIcon}</span>}
        <Title level={5} className="modern-card-title">{title}</Title>
        {statusBadge && (
          <Badge 
            status={statusBadge.status} 
            text={statusBadge.text}
            className="modern-card-badge"
          />
        )}
      </Space>
    </div>
  );

  // Build trend indicator
  const trendIndicator = trend && (
    <div className={`modern-card-trend ${trend.type || 'neutral'}`}>
      <Space size="small">
        {trend.type === 'up' && <TrendingUpOutlined className="trend-icon trend-up" />}
        {trend.type === 'down' && <TrendingDownOutlined className="trend-icon trend-down" />}
        <Text className={`trend-value trend-${trend.type}`}>
          {trend.value > 0 ? '+' : ''}{trend.value}%
        </Text>
        {trend.label && (
          <Text type="secondary" className="trend-label">
            {trend.label}
          </Text>
        )}
      </Space>
    </div>
  );

  // Build metric display
  const metricDisplay = metric && (
    <div className="modern-card-metric">
      <div className="metric-value">
        {metric.prefix && <span className="metric-prefix">{metric.prefix}</span>}
        <span className="metric-number">
          {typeof metric.value === 'number' && metric.precision !== undefined
            ? metric.value.toFixed(metric.precision)
            : metric.value}
        </span>
        {metric.suffix && <span className="metric-suffix">{metric.suffix}</span>}
      </div>
      <Text type="secondary" className="metric-label">
        {metric.label}
      </Text>
    </div>
  );

  // Build card extra with trend and actions
  const cardExtra = (
    <Space>
      {trendIndicator}
      {headerExtra}
      {interactive && (
        <Tooltip title="More options">
          <MoreOutlined className="modern-card-menu" />
        </Tooltip>
      )}
    </Space>
  );

  // Content wrapper
  const cardContent = (
    <div className="modern-card-content">
      {skeleton ? (
        <Skeleton active paragraph={{ rows: 3 }} />
      ) : (
        <>
          {metricDisplay}
          {children}
        </>
      )}
    </div>
  );

  return (
    <Card
      title={cardTitle}
      extra={cardExtra}
      loading={loading}
      className={classNames}
      style={{
        cursor: onCardClick ? 'pointer' : 'default',
        ...style
      }}
      onClick={onCardClick}
      {...rest}
    >
      {cardContent}
      {footer && (
        <div className="modern-card-footer">
          {footer}
        </div>
      )}
      
      {/* Loading overlay */}
      {loading && (
        <div className="modern-card-loading-overlay">
          <LoadingOutlined className="loading-icon" />
        </div>
      )}

      {/* Styles */}
      <style jsx>{`
        .modern-card {
          border-radius: 12px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border: 1px solid #f0f0f0;
          overflow: hidden;
          position: relative;
        }

        .modern-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
        }

        .modern-card-header-icon {
          font-size: 18px;
          color: #1890ff;
        }

        .modern-card-title {
          margin: 0 !important;
          color: #262626 !important;
          font-weight: 600 !important;
        }

        .modern-card-badge {
          margin-left: 8px;
        }

        .modern-card-content {
          position: relative;
          z-index: 1;
        }

        .modern-card-footer {
          border-top: 1px solid #f0f0f0;
          padding: 12px 0 0 0;
          margin-top: 16px;
        }

        /* Variants */
        .modern-card-default {
          background: #ffffff;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        }

        .modern-card-gradient {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
        }

        .modern-card-gradient .modern-card-title {
          color: white !important;
        }

        .modern-card-gradient .ant-card-body {
          color: white;
        }

        .modern-card-glass {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }

        .modern-card-outlined {
          background: transparent;
          border: 2px solid #1890ff;
          box-shadow: none;
        }

        .modern-card-elevated {
          background: #ffffff;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
          border: none;
        }

        .modern-card-minimal {
          background: #fafafa;
          border: none;
          box-shadow: none;
        }

        /* Hover effects */
        .modern-card-hover:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
        }

        .modern-card-interactive:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 32px rgba(0, 0, 0, 0.15);
        }

        .modern-card-glow {
          box-shadow: 0 0 20px rgba(24, 144, 255, 0.3);
        }

        .modern-card-glow:hover {
          box-shadow: 0 0 30px rgba(24, 144, 255, 0.5);
        }

        /* Animations */
        .modern-card-fade {
          animation: fadeIn 0.5s ease-in-out;
        }

        .modern-card-slide {
          animation: slideUp 0.5s ease-out;
        }

        .modern-card-scale {
          animation: scaleIn 0.3s ease-out;
        }

        .modern-card-bounce {
          animation: bounceIn 0.6s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        @keyframes scaleIn {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        @keyframes bounceIn {
          0% { transform: scale(0.3); opacity: 0; }
          50% { transform: scale(1.05); opacity: 1; }
          70% { transform: scale(0.9); }
          100% { transform: scale(1); }
        }

        /* Trend indicators */
        .modern-card-trend {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .trend-icon {
          font-size: 14px;
        }

        .trend-up {
          color: #52c41a;
        }

        .trend-down {
          color: #ff4d4f;
        }

        .trend-value {
          font-weight: 600;
          font-size: 12px;
        }

        .trend-value.trend-up {
          color: #52c41a;
        }

        .trend-value.trend-down {
          color: #ff4d4f;
        }

        .trend-label {
          font-size: 11px;
        }

        /* Metric display */
        .modern-card-metric {
          margin-bottom: 16px;
        }

        .metric-value {
          font-size: 28px;
          font-weight: 700;
          color: #1890ff;
          line-height: 1.2;
          margin-bottom: 4px;
        }

        .metric-prefix,
        .metric-suffix {
          font-size: 18px;
          font-weight: 500;
          color: #666;
        }

        .metric-label {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        /* Loading overlay */
        .modern-card-loading-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(255, 255, 255, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
        }

        .loading-icon {
          font-size: 24px;
          color: #1890ff;
        }

        /* Menu icon */
        .modern-card-menu {
          color: #8c8c8c;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          transition: all 0.2s;
        }

        .modern-card-menu:hover {
          background: rgba(0, 0, 0, 0.04);
          color: #1890ff;
        }

        /* Dark theme support */
        .dark-theme .modern-card-default {
          background: #1f1f1f;
          border-color: #434343;
          color: #ffffff;
        }

        .dark-theme .modern-card-title {
          color: #ffffff !important;
        }

        .dark-theme .modern-card-minimal {
          background: #2f2f2f;
        }

        .dark-theme .modern-card-footer {
          border-color: #434343;
        }

        /* Responsive design */
        @media (max-width: 768px) {
          .modern-card {
            border-radius: 8px;
          }

          .metric-value {
            font-size: 24px;
          }

          .modern-card-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }
        }

        /* Accessibility */
        .modern-card-interactive:focus {
          outline: 2px solid #1890ff;
          outline-offset: 2px;
        }

        @media (prefers-reduced-motion: reduce) {
          .modern-card,
          .modern-card-hover:hover,
          .modern-card-interactive:hover {
            transition: none;
            transform: none;
            animation: none;
          }
        }
      `}</style>
    </Card>
  );
};

// Modern Card Grid Component
export interface ModernCardGridProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4 | 6;
  gap?: 'small' | 'medium' | 'large';
  responsive?: boolean;
  autoFit?: boolean;
  minCardWidth?: number;
}

export const ModernCardGrid: React.FC<ModernCardGridProps> = ({
  children,
  columns = 3,
  gap = 'medium',
  responsive = true,
  autoFit = false,
  minCardWidth = 300
}) => {
  const gapSize = {
    small: '12px',
    medium: '16px',
    large: '24px'
  };

  const gridTemplateColumns = autoFit
    ? `repeat(auto-fit, minmax(${minCardWidth}px, 1fr))`
    : `repeat(${columns}, 1fr)`;

  return (
    <div className="modern-card-grid">
      {children}
      
      <style jsx>{`
        .modern-card-grid {
          display: grid;
          grid-template-columns: ${gridTemplateColumns};
          gap: ${gapSize[gap]};
          width: 100%;
        }

        ${responsive ? `
          @media (max-width: 1200px) {
            .modern-card-grid {
              grid-template-columns: repeat(${Math.min(columns, 2)}, 1fr);
            }
          }

          @media (max-width: 768px) {
            .modern-card-grid {
              grid-template-columns: 1fr;
              gap: ${gapSize.small};
            }
          }
        ` : ''}
      `}</style>
    </div>
  );
};

export default ModernCard;