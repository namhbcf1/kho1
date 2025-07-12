import React from 'react';
import { Upload, Button } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import type { FileUploadProps } from './Upload.types';

export const FileUpload: React.FC<FileUploadProps> = ({
  value,
  onChange,
  accept,
  multiple = false,
  ...props
}) => {
  const handleChange = (info: any) => {
    onChange?.(info.fileList);
  };

  return (
    <Upload
      action="/api/upload" // Cloudflare R2 upload endpoint
      fileList={value}
      onChange={handleChange}
      accept={accept}
      multiple={multiple}
      {...props}
    >
      <Button icon={<UploadOutlined />}>Chọn file</Button>
    </Upload>
  );
};

export default FileUpload;
