import type { ButtonProps as AntButtonProps } from 'antd';

export interface ButtonProps extends Omit<AntButtonProps, 'type'> {
  variant?: 'primary' | 'default' | 'dashed' | 'text' | 'link';
  children: React.ReactNode;
}
