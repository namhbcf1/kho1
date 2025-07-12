// R2 image upload for products
import React from 'react';
import { Upload, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd';

export const ImageUploader: React.FC = () => {
  const [fileList, setFileList] = React.useState<UploadFile[]>([]);

  const handleChange: UploadProps['onChange'] = ({ fileList: newFileList }) => {
    setFileList(newFileList);
  };

  const beforeUpload = (file: File) => {
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
    if (!isJpgOrPng) {
      message.error('Chỉ hỗ trợ file JPG/PNG!');
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error('Kích thước file phải nhỏ hơn 2MB!');
    }
    return isJpgOrPng && isLt2M;
  };

  const uploadButton = (
    <div>
      <PlusOutlined />
      <div style={{ marginTop: 8 }}>Tải ảnh lên</div>
    </div>
  );

  return (
    <Upload
      action="/api/upload/image"
      listType="picture-card"
      fileList={fileList}
      onChange={handleChange}
      beforeUpload={beforeUpload}
      multiple
      maxCount={5}
    >
      {fileList.length >= 5 ? null : uploadButton}
    </Upload>
  );
};

export default ImageUploader;
