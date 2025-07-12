import type { UploadProps } from 'antd';

export interface ImageUploadProps extends Omit<UploadProps, 'onChange'> {
  value?: any[];
  onChange?: (fileList: any[]) => void;
  maxCount?: number;
}

export interface FileUploadProps extends Omit<UploadProps, 'onChange'> {
  value?: any[];
  onChange?: (fileList: any[]) => void;
}
