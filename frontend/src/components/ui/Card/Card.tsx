// Enhanced Card Component - Vietnamese POS System 2025
import React from 'react';
import { Card as AntCard, CardProps } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import './Card.css';

export interface EnhancedCardProps extends CardProps {
  variant?: 'default' | 'elevated' | 'bordered' | 'flat' | 'gradient' | 'vietnamese';
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  rounded?: boolean;
  animated?: boolean;
  glowing?: boolean;
  interactive?: boolean;
  gradient?: 'primary' | 'success' | 'warning' | 'error' | 'info' | 'vietnamese';
  headerGradient?: boolean;
  compact?: boolean;
  fullHeight?: boolean;
  vietnameseStyle?: boolean;
}

const Card: React.FC<EnhancedCardProps> = ({
  variant = 'default',
  shadow = 'sm',
  rounded = false,
  animated = false,
  glowing = false,
  interactive = false,
  gradient,
  headerGradient = false,
  compact = false,
  fullHeight = false,
  vietnameseStyle = false,
  className,
  loading,
  children,
  ...props
}) => {
  const cardClasses = [
    'enhanced-card',
    `enhanced-card-${variant}`,
    shadow !== 'none' && `enhanced-card-shadow-${shadow}`,
    rounded && 'enhanced-card-rounded',
    animated && 'enhanced-card-animated',
    glowing && 'enhanced-card-glowing',
    interactive && 'enhanced-card-interactive',
    gradient && `enhanced-card-gradient-${gradient}`,
    headerGradient && 'enhanced-card-header-gradient',
    compact && 'enhanced-card-compact',
    fullHeight && 'enhanced-card-full-height',
    vietnameseStyle && 'enhanced-card-vietnamese',
    loading && 'enhanced-card-loading',
    className
  ].filter(Boolean).join(' ');

  return (
    <AntCard
      {...props}
      className={cardClasses}
      loading={loading}
    >
      {loading && (
        <div className="enhanced-card-loading-overlay">
          <LoadingOutlined className="enhanced-card-loading-icon" />
        </div>
      )}
      {children}
    </AntCard>
  );
};

export default Card;