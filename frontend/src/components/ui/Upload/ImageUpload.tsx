import React from 'react';
import { Upload, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { ImageUploadProps } from './Upload.types';

export const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  maxCount = 1,
  accept = 'image/*',
  ...props
}) => {
  const handleChange = (info: any) => {
    if (info.file.status === 'uploading') {
      return;
    }
    if (info.file.status === 'done') {
      message.success(`${info.file.name} tải lên thành công.`);
      onChange?.(info.fileList);
    } else if (info.file.status === 'error') {
      message.error(`${info.file.name} tải lên thất bại.`);
    }
  };

  const uploadButton = (
    <div>
      <PlusOutlined />
      <div style={{ marginTop: 8 }}>Tải lên</div>
    </div>
  );

  return (
    <Upload
      action="/api/upload" // Cloudflare R2 upload endpoint
      listType="picture-card"
      fileList={value}
      onChange={handleChange}
      maxCount={maxCount}
      accept={accept}
      {...props}
    >
      {value && value.length >= maxCount ? null : uploadButton}
    </Upload>
  );
};

export default ImageUpload;
