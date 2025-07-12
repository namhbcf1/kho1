import React from 'react';
import { Button, Spin } from 'antd';
import type { ButtonLoadingProps } from './Loading.types';

export const ButtonLoading: React.FC<ButtonLoadingProps> = ({
  loading = false,
  children,
  ...props
}) => {
  return (
    <Button
      {...props}
      icon={loading ? <Spin size="small" /> : props.icon}
      disabled={loading || props.disabled}
    >
      {children}
    </Button>
  );
};

export default ButtonLoading;
