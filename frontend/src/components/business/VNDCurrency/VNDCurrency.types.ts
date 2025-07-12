import type { InputProps } from 'antd';

export interface VNDDisplayProps {
  amount: number;
  showSymbol?: boolean;
  showCode?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

export interface VNDInputProps extends Omit<InputProps, 'onChange' | 'value'> {
  value?: number;
  onChange?: (value: number) => void;
}
