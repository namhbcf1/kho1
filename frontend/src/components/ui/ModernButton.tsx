/**
 * Modern Button Component with Enhanced UX
 * Fixes: Inconsistent button styles, poor accessibility
 * Implements: Modern design, loading states, accessibility features
 */

import React, { useState } from 'react';
import { Button, ButtonProps, Space, Tooltip } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

export interface ModernButtonProps extends Omit<ButtonProps, 'loading'> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'ghost' | 'gradient';
  size?: 'small' | 'medium' | 'large' | 'xl';
  loading?: boolean;
  loadingText?: string;
  tooltip?: string;
  badge?: string | number;
  pulse?: boolean;
  glow?: boolean;
  shadow?: boolean;
  ripple?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  progressValue?: number; // 0-100 for progress button
  onAsyncClick?: () => Promise<void>;
}

export const ModernButton: React.FC<ModernButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  loading = false,
  loadingText,
  tooltip,
  badge,
  pulse = false,
  glow = false,
  shadow = true,
  ripple = true,
  fullWidth = false,
  leftIcon,
  rightIcon,
  progressValue,
  onAsyncClick,
  children,
  onClick,
  disabled,
  className = '',
  style = {},
  ...rest
}) => {
  const [isAsyncLoading, setIsAsyncLoading] = useState(false);
  const [rippleStyle, setRippleStyle] = useState<React.CSSProperties>({});

  const isLoading = loading || isAsyncLoading;

  // Handle async click
  const handleClick = async (e: React.MouseEvent<HTMLElement>) => {
    if (onAsyncClick && !isLoading && !disabled) {
      setIsAsyncLoading(true);
      try {
        await onAsyncClick();
      } finally {
        setIsAsyncLoading(false);
      }
    } else if (onClick) {
      onClick(e);
    }

    // Ripple effect
    if (ripple && !disabled) {
      const rect = e.currentTarget.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;
      
      setRippleStyle({
        width: size,
        height: size,
        left: x,
        top: y,
        transform: 'scale(0)',
        opacity: 0.6
      });

      setTimeout(() => {
        setRippleStyle(prev => ({
          ...prev,
          transform: 'scale(1)',
          opacity: 0
        }));
      }, 10);

      setTimeout(() => {
        setRippleStyle({});
      }, 600);
    }
  };

  // Get button type based on variant
  const getButtonType = (): ButtonProps['type'] => {
    switch (variant) {
      case 'primary':
      case 'gradient':
        return 'primary';
      case 'danger':
        return 'primary';
      case 'ghost':
        return 'ghost';
      default:
        return 'default';
    }
  };

  // Get size mapping
  const getSizeClass = () => {
    switch (size) {
      case 'small':
        return 'btn-small';
      case 'large':
        return 'btn-large';
      case 'xl':
        return 'btn-xl';
      default:
        return 'btn-medium';
    }
  };

  // Build class names
  const classNames = [
    'modern-button',
    `modern-button-${variant}`,
    getSizeClass(),
    pulse ? 'modern-button-pulse' : '',
    glow ? 'modern-button-glow' : '',
    shadow ? 'modern-button-shadow' : '',
    fullWidth ? 'modern-button-full-width' : '',
    isLoading ? 'modern-button-loading' : '',
    disabled ? 'modern-button-disabled' : '',
    className
  ].filter(Boolean).join(' ');

  // Button content
  const buttonContent = (
    <Space size="small" className="modern-button-content">
      {leftIcon && !isLoading && (
        <span className="modern-button-left-icon">{leftIcon}</span>
      )}
      
      {isLoading && (
        <LoadingOutlined className="modern-button-loading-icon" />
      )}
      
      <span className="modern-button-text">
        {isLoading && loadingText ? loadingText : children}
      </span>
      
      {rightIcon && !isLoading && (
        <span className="modern-button-right-icon">{rightIcon}</span>
      )}
      
      {badge && (
        <span className="modern-button-badge">{badge}</span>
      )}
    </Space>
  );

  // Progress overlay
  const progressOverlay = progressValue !== undefined && (
    <div 
      className="modern-button-progress"
      style={{ width: `${progressValue}%` }}
    />
  );

  // Ripple effect
  const rippleEffect = ripple && (
    <span 
      className="modern-button-ripple"
      style={rippleStyle}
    />
  );

  const buttonElement = (
    <Button
      type={getButtonType()}
      loading={false} // We handle loading ourselves
      disabled={disabled || isLoading}
      onClick={handleClick}
      className={classNames}
      style={{
        position: 'relative',
        overflow: 'hidden',
        ...style
      }}
      {...rest}
    >
      {progressOverlay}
      {buttonContent}
      {rippleEffect}
    </Button>
  );

  return tooltip ? (
    <Tooltip title={tooltip}>
      {buttonElement}
    </Tooltip>
  ) : buttonElement;
};

// Button group component
export interface ModernButtonGroupProps {
  children: React.ReactNode;
  direction?: 'horizontal' | 'vertical';
  size?: ModernButtonProps['size'];
  variant?: ModernButtonProps['variant'];
  fullWidth?: boolean;
  spacing?: 'none' | 'small' | 'medium' | 'large';
}

export const ModernButtonGroup: React.FC<ModernButtonGroupProps> = ({
  children,
  direction = 'horizontal',
  size,
  variant,
  fullWidth = false,
  spacing = 'small'
}) => {
  return (
    <div className={`modern-button-group modern-button-group-${direction} ${fullWidth ? 'full-width' : ''}`}>
      <Space 
        direction={direction === 'horizontal' ? 'horizontal' : 'vertical'}
        size={spacing}
        style={{ width: fullWidth ? '100%' : 'auto' }}
      >
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child) && child.type === ModernButton) {
            return React.cloneElement(child, {
              size: size || child.props.size,
              variant: variant || child.props.variant,
              fullWidth: fullWidth || child.props.fullWidth
            });
          }
          return child;
        })}
      </Space>
      
      <style jsx>{`
        .modern-button-group {
          display: inline-flex;
        }
        
        .modern-button-group.full-width {
          width: 100%;
        }
        
        .modern-button-group-vertical {
          flex-direction: column;
        }
      `}</style>
    </div>
  );
};

// Global styles for ModernButton
export const ModernButtonStyles = () => (
  <style jsx global>{`
    .modern-button {
      border-radius: 8px;
      font-weight: 500;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
      border: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .modern-button-content {
      position: relative;
      z-index: 2;
    }

    /* Sizes */
    .modern-button.btn-small {
      height: 32px;
      padding: 0 12px;
      font-size: 12px;
    }

    .modern-button.btn-medium {
      height: 40px;
      padding: 0 16px;
      font-size: 14px;
    }

    .modern-button.btn-large {
      height: 48px;
      padding: 0 24px;
      font-size: 16px;
    }

    .modern-button.btn-xl {
      height: 56px;
      padding: 0 32px;
      font-size: 18px;
    }

    /* Variants */
    .modern-button-primary {
      background: linear-gradient(135deg, #1890ff, #40a9ff);
      border: none;
      color: white;
    }

    .modern-button-primary:hover:not(.modern-button-disabled) {
      background: linear-gradient(135deg, #40a9ff, #69c0ff);
      transform: translateY(-1px);
    }

    .modern-button-secondary {
      background: #f0f0f0;
      border: 1px solid #d9d9d9;
      color: #595959;
    }

    .modern-button-secondary:hover:not(.modern-button-disabled) {
      background: #fafafa;
      border-color: #40a9ff;
      color: #1890ff;
      transform: translateY(-1px);
    }

    .modern-button-success {
      background: linear-gradient(135deg, #52c41a, #73d13d);
      border: none;
      color: white;
    }

    .modern-button-success:hover:not(.modern-button-disabled) {
      background: linear-gradient(135deg, #73d13d, #95de64);
      transform: translateY(-1px);
    }

    .modern-button-warning {
      background: linear-gradient(135deg, #faad14, #ffc53d);
      border: none;
      color: white;
    }

    .modern-button-warning:hover:not(.modern-button-disabled) {
      background: linear-gradient(135deg, #ffc53d, #ffd666);
      transform: translateY(-1px);
    }

    .modern-button-danger {
      background: linear-gradient(135deg, #ff4d4f, #ff7875);
      border: none;
      color: white;
    }

    .modern-button-danger:hover:not(.modern-button-disabled) {
      background: linear-gradient(135deg, #ff7875, #ffa39e);
      transform: translateY(-1px);
    }

    .modern-button-ghost {
      background: transparent;
      border: 2px solid #1890ff;
      color: #1890ff;
    }

    .modern-button-ghost:hover:not(.modern-button-disabled) {
      background: rgba(24, 144, 255, 0.1);
      border-color: #40a9ff;
      color: #40a9ff;
      transform: translateY(-1px);
    }

    .modern-button-gradient {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: none;
      color: white;
    }

    .modern-button-gradient:hover:not(.modern-button-disabled) {
      background: linear-gradient(135deg, #764ba2 0%, #f093fb 100%);
      transform: translateY(-1px);
    }

    /* Shadow */
    .modern-button-shadow {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .modern-button-shadow:hover:not(.modern-button-disabled) {
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    }

    /* Glow effect */
    .modern-button-glow {
      box-shadow: 0 0 20px rgba(24, 144, 255, 0.3);
    }

    .modern-button-glow:hover:not(.modern-button-disabled) {
      box-shadow: 0 0 30px rgba(24, 144, 255, 0.5);
    }

    /* Pulse animation */
    .modern-button-pulse {
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0% {
        transform: scale(1);
      }
      50% {
        transform: scale(1.05);
      }
      100% {
        transform: scale(1);
      }
    }

    /* Full width */
    .modern-button-full-width {
      width: 100%;
    }

    /* Loading state */
    .modern-button-loading {
      pointer-events: none;
    }

    .modern-button-loading-icon {
      margin-right: 8px;
    }

    /* Disabled state */
    .modern-button-disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none !important;
    }

    /* Badge */
    .modern-button-badge {
      background: #ff4d4f;
      color: white;
      border-radius: 10px;
      padding: 2px 6px;
      font-size: 10px;
      margin-left: 8px;
      min-width: 16px;
      text-align: center;
    }

    /* Progress overlay */
    .modern-button-progress {
      position: absolute;
      top: 0;
      left: 0;
      height: 100%;
      background: rgba(255, 255, 255, 0.2);
      transition: width 0.3s ease;
      z-index: 1;
    }

    /* Ripple effect */
    .modern-button-ripple {
      position: absolute;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.6);
      transform: scale(0);
      pointer-events: none;
      transition: transform 0.6s, opacity 0.6s;
    }

    /* Icons */
    .modern-button-left-icon,
    .modern-button-right-icon {
      display: flex;
      align-items: center;
      font-size: 1.1em;
    }

    /* Dark theme support */
    .dark-theme .modern-button-secondary {
      background: #1f1f1f;
      border-color: #434343;
      color: #ffffff;
    }

    .dark-theme .modern-button-secondary:hover:not(.modern-button-disabled) {
      background: #2f2f2f;
      border-color: #40a9ff;
    }

    .dark-theme .modern-button-ghost {
      border-color: #40a9ff;
      color: #40a9ff;
    }

    .dark-theme .modern-button-ghost:hover:not(.modern-button-disabled) {
      background: rgba(64, 169, 255, 0.1);
    }

    /* Focus states for accessibility */
    .modern-button:focus {
      outline: 2px solid #40a9ff;
      outline-offset: 2px;
    }

    /* Responsive design */
    @media (max-width: 768px) {
      .modern-button.btn-large {
        height: 44px;
        padding: 0 20px;
        font-size: 15px;
      }

      .modern-button.btn-xl {
        height: 52px;
        padding: 0 28px;
        font-size: 17px;
      }
    }

    /* High contrast mode support */
    @media (prefers-contrast: high) {
      .modern-button {
        border: 2px solid;
      }
    }

    /* Reduced motion support */
    @media (prefers-reduced-motion: reduce) {
      .modern-button {
        transition: none;
      }
      
      .modern-button-pulse {
        animation: none;
      }
      
      .modern-button-ripple {
        display: none;
      }
    }
  `}</style>
);

export default ModernButton;