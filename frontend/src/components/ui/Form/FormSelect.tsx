import React from 'react';
import { Select } from 'antd';
import type { FormSelectProps } from './Form.types';

export const FormSelect: React.FC<FormSelectProps> = ({
  options,
  placeholder,
  size = 'middle',
  disabled = false,
  allowClear = true,
  ...props
}) => {
  return (
    <Select
      options={options}
      placeholder={placeholder}
      size={size}
      disabled={disabled}
      allowClear={allowClear}
      {...props}
    />
  );
};

export default FormSelect;
