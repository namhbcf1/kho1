import React from 'react';
import { Modal } from 'antd';
import type { ConfirmModalProps } from './Modal.types';

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  title,
  content,
  visible,
  onConfirm,
  onCancel,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  confirmLoading = false,
  ...props
}) => {
  return (
    <Modal
      title={title}
      open={visible}
      onOk={onConfirm}
      onCancel={onCancel}
      okText={confirmText}
      cancelText={cancelText}
      confirmLoading={confirmLoading}
      {...props}
    >
      {content}
    </Modal>
  );
};

export default ConfirmModal;
