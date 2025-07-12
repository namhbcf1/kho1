import React from 'react';
import { Modal, Form } from 'antd';
import type { FormModalProps } from './Modal.types';

export const FormModal: React.FC<FormModalProps> = ({
  title,
  visible,
  onSubmit,
  onCancel,
  children,
  form,
  submitText = 'Lưu',
  cancelText = 'Hủy',
  confirmLoading = false,
  ...props
}) => {
  const handleOk = async () => {
    try {
      const values = await form?.validateFields();
      onSubmit?.(values);
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  return (
    <Modal
      title={title}
      open={visible}
      onOk={handleOk}
      onCancel={onCancel}
      okText={submitText}
      cancelText={cancelText}
      confirmLoading={confirmLoading}
      {...props}
    >
      <Form form={form} layout="vertical">
        {children}
      </Form>
    </Modal>
  );
};

export default FormModal;
