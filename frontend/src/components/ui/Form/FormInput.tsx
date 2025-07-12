import React from 'react';
import { Input } from 'antd';
import type { FormInputProps } from './Form.types';

export const FormInput: React.FC<FormInputProps> = ({
  placeholder,
  type = 'text',
  size = 'middle',
  disabled = false,
  ...props
}) => {
  return (
    <Input
      placeholder={placeholder}
      type={type}
      size={size}
      disabled={disabled}
      {...props}
    />
  );
};

export default FormInput;
