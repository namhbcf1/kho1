import React from 'react';
import { Form } from 'antd';
import type { FormFieldProps } from './Form.types';

export const FormField: React.FC<FormFieldProps> = ({
  label,
  name,
  rules,
  required = false,
  children,
  ...props
}) => {
  return (
    <Form.Item
      label={label}
      name={name}
      rules={rules}
      required={required}
      {...props}
    >
      {children}
    </Form.Item>
  );
};

export default FormField;
