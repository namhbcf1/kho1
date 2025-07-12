import type { FormItemProps, InputProps, SelectProps } from 'antd';

export interface FormFieldProps extends FormItemProps {
  children: React.ReactNode;
}

export interface FormInputProps extends InputProps {
  // Additional custom props if needed
}

export interface FormSelectProps extends SelectProps {
  // Additional custom props if needed
}
