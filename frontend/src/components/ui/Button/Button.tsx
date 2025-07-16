// Enhanced Button Component - Vietnamese POS System 2025
import React from 'react';
import { Button as AntButton, ButtonProps } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import './Button.css';

export interface EnhancedButtonProps extends ButtonProps {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'ghost' | 'vietnamese';
  gradient?: boolean;
  glow?: boolean;
  pulse?: boolean;
  elevated?: boolean;
  fullWidth?: boolean;
  compact?: boolean;
  rounded?: boolean;
  shadowLevel?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  animationDuration?: 'fast' | 'normal' | 'slow';
  vietnameseStyle?: boolean;
}

const Button: React.FC<EnhancedButtonProps> = ({
  variant = 'primary',
  gradient = false,
  glow = false,
  pulse = false,
  elevated = false,
  fullWidth = false,
  compact = false,
  rounded = false,
  shadowLevel = 'sm',
  animationDuration = 'normal',
  vietnameseStyle = false,
  className,
  loading,
  children,
  ...props
}) => {
  const buttonClasses = [
    'enhanced-button',
    `enhanced-button-${variant}`,
    gradient && 'enhanced-button-gradient',
    glow && 'enhanced-button-glow',
    pulse && 'enhanced-button-pulse',
    elevated && 'enhanced-button-elevated',
    fullWidth && 'enhanced-button-full-width',
    compact && 'enhanced-button-compact',
    rounded && 'enhanced-button-rounded',
    shadowLevel !== 'none' && `enhanced-button-shadow-${shadowLevel}`,
    `enhanced-button-animation-${animationDuration}`,
    vietnameseStyle && 'enhanced-button-vietnamese',
    className
  ].filter(Boolean).join(' ');

  return (
    <AntButton
      {...props}
      className={buttonClasses}
      loading={loading}
      icon={loading ? <LoadingOutlined /> : props.icon}
    >
      {children}
    </AntButton>
  );
};

export default Button;
