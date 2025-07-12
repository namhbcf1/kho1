// Customer registration form
import React from 'react';
import { Form, Input, Select, DatePicker, Button } from 'antd';

const { Option } = Select;

export const CustomerForm: React.FC = () => {
  const [form] = Form.useForm();

  const onFinish = (values: any) => {
    console.log('Customer data:', values);
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
    >
      <Form.Item
        name="name"
        label="Họ và tên"
        rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
      >
        <Input placeholder="Nguyễn Văn A" />
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
          { type: 'email', message: 'Email không hợp lệ' }
        ]}
      >
        <Input placeholder="customer@example.com" />
      </Form.Item>

      <Form.Item name="gender" label="Giới tính">
        <Select placeholder="Chọn giới tính">
          <Option value="male">Nam</Option>
          <Option value="female">Nữ</Option>
          <Option value="other">Khác</Option>
        </Select>
      </Form.Item>

      <Form.Item name="dateOfBirth" label="Ngày sinh">
        <DatePicker style={{ width: '100%' }} placeholder="Chọn ngày sinh" />
      </Form.Item>

      <Form.Item name={['address', 'street']} label="Địa chỉ">
        <Input placeholder="Số nhà, tên đường" />
      </Form.Item>

      <Form.Item name={['address', 'ward']} label="Phường/Xã">
        <Input placeholder="Phường/Xã" />
      </Form.Item>

      <Form.Item name={['address', 'district']} label="Quận/Huyện">
        <Input placeholder="Quận/Huyện" />
      </Form.Item>

      <Form.Item name={['address', 'province']} label="Tỉnh/Thành phố">
        <Select placeholder="Chọn tỉnh/thành phố">
          <Option value="TP Hồ Chí Minh">TP Hồ Chí Minh</Option>
          <Option value="Hà Nội">Hà Nội</Option>
          <Option value="Đà Nẵng">Đà Nẵng</Option>
        </Select>
      </Form.Item>

      <Form.Item name="notes" label="Ghi chú">
        <Input.TextArea rows={3} placeholder="Ghi chú về khách hàng" />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit">
          Lưu khách hàng
        </Button>
      </Form.Item>
    </Form>
  );
};

export default CustomerForm;
