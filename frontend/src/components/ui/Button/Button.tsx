import React from 'react';
import { Button as AntButton } from 'antd';
import type { ButtonProps } from './Button.types';

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'middle',
  loading = false,
  disabled = false,
  onClick,
  ...props
}) => {
  return (
    <AntButton
      type={variant}
      size={size}
      loading={loading}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </AntButton>
  );
};

export default Button;
