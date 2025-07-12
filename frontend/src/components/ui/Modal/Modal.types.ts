import type { ModalProps, FormInstance } from 'antd';

export interface ConfirmModalProps extends Omit<ModalProps, 'onOk' | 'onCancel'> {
  title: string;
  content: React.ReactNode;
  visible: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  confirmLoading?: boolean;
}

export interface FormModalProps extends Omit<ModalProps, 'onOk' | 'onCancel'> {
  title: string;
  visible: boolean;
  onSubmit?: (values: any) => void;
  onCancel?: () => void;
  children: React.ReactNode;
  form?: FormInstance;
  submitText?: string;
  cancelText?: string;
  confirmLoading?: boolean;
}
