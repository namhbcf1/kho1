import React from 'react';
import { Card, Form, Input, Button, Avatar, Upload, message } from 'antd';
import { UserOutlined, UploadOutlined } from '@ant-design/icons';
import type { UserProfileProps } from '../types/auth.types';

export const UserProfile: React.FC<UserProfileProps> = ({
  user,
  onUpdate,
  loading = false,
}) => {
  const [form] = Form.useForm();

  const handleSubmit = (values: any) => {
    onUpdate?.(values);
  };

  const handleAvatarChange = (info: any) => {
    if (info.file.status === 'done') {
      message.success('Cập nhật ảnh đại diện thành công');
    } else if (info.file.status === 'error') {
      message.error('Cập nhật ảnh đại diện thất bại');
    }
  };

  return (
    <Card title="Thông tin cá nhân">
      <div style={{ display: 'flex', gap: 24 }}>
        <div style={{ textAlign: 'center' }}>
          <Avatar 
            size={120} 
            src={user?.avatar} 
            icon={<UserOutlined />}
          />
          <div style={{ marginTop: 16 }}>
            <Upload
              action="/api/upload/avatar"
              showUploadList={false}
              onChange={handleAvatarChange}
            >
              <Button icon={<UploadOutlined />}>
                Đổi ảnh đại diện
              </Button>
            </Upload>
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <Form
            form={form}
            layout="vertical"
            initialValues={user}
            onFinish={handleSubmit}
          >
            <Form.Item
              name="name"
              label="Họ và tên"
              rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]}
            >
              <Input placeholder="Nhập họ và tên" />
            </Form.Item>

            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: 'Vui lòng nhập email!' },
                { type: 'email', message: 'Email không hợp lệ!' }
              ]}
            >
              <Input placeholder="Nhập email" disabled />
            </Form.Item>

            <Form.Item
              name="phone"
              label="Số điện thoại"
              rules={[
                { pattern: /^[0-9]{10,11}$/, message: 'Số điện thoại không hợp lệ!' }
              ]}
            >
              <Input placeholder="Nhập số điện thoại" />
            </Form.Item>

            <Form.Item
              name="position"
              label="Chức vụ"
            >
              <Input placeholder="Nhập chức vụ" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading}>
                Cập nhật thông tin
              </Button>
            </Form.Item>
          </Form>
        </div>
      </div>
    </Card>
  );
};

export default UserProfile;
