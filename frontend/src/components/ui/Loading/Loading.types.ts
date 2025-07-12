import type { SpinProps, ButtonProps } from 'antd';

export interface PageLoadingProps {
  tip?: string;
  size?: SpinProps['size'];
  style?: React.CSSProperties;
}

export interface ButtonLoadingProps extends ButtonProps {
  loading?: boolean;
  children: React.ReactNode;
}
