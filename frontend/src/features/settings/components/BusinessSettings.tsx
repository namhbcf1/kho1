// Vietnamese business configuration component
import React from 'react';
import { Form, Input, Upload, Button, Card } from 'antd';
import { UploadOutlined } from '@ant-design/icons';

export const BusinessSettings: React.FC = () => {
  const [form] = Form.useForm();

  const onFinish = (values: any) => {
    console.log('Business settings:', values);
  };

  return (
    <Card title="Thông tin doanh nghiệp">
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          name: 'KhoAugment POS',
          address: '123 Đường ABC, Phường 1, Quận 1, TP Hồ Chí Minh',
          phone: '0901234567',
          email: 'info@khoaugment.com',
          taxCode: '1234567890',
          website: 'https://khoaugment.com',
        }}
      >
        <Form.Item
          name="name"
          label="Tên doanh nghiệp"
          rules={[{ required: true, message: 'Vui lòng nhập tên doanh nghiệp' }]}
        >
          <Input placeholder="Tên doanh nghiệp" />
        </Form.Item>

        <Form.Item
          name="address"
          label="Địa chỉ"
          rules={[{ required: true, message: 'Vui lòng nhập địa chỉ' }]}
        >
          <Input.TextArea rows={3} placeholder="Địa chỉ đầy đủ" />
        </Form.Item>

        <Form.Item
          name="phone"
          label="Số điện thoại"
          rules={[
            { required: true, message: 'Vui lòng nhập số điện thoại' },
            { pattern: /^[0-9]{10,11}$/, message: 'Số điện thoại không hợp lệ' }
          ]}
        >
          <Input placeholder="0901234567" />
        </Form.Item>

        <Form.Item
          name="email"
          label="Email"
          rules={[
            { required: true, message: 'Vui lòng nhập email' },
            { type: 'email', message: 'Email không hợp lệ' }
          ]}
        >
          <Input placeholder="info@company.com" />
        </Form.Item>

        <Form.Item
          name="taxCode"
          label="Mã số thuế"
          rules={[{ required: true, message: 'Vui lòng nhập mã số thuế' }]}
        >
          <Input placeholder="1234567890" />
        </Form.Item>

        <Form.Item name="website" label="Website">
          <Input placeholder="https://company.com" />
        </Form.Item>

        <Form.Item name="logo" label="Logo doanh nghiệp">
          <Upload
            name="logo"
            listType="picture"
            maxCount={1}
            beforeUpload={() => false}
          >
            <Button icon={<UploadOutlined />}>Tải lên logo</Button>
          </Upload>
        </Form.Item>

        <Form.Item name="description" label="Mô tả doanh nghiệp">
          <Input.TextArea rows={4} placeholder="Mô tả về doanh nghiệp" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit">
            Lưu cài đặt
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default BusinessSettings;
