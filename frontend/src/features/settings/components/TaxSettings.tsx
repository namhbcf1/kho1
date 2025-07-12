// Vietnamese tax configuration component
import React from 'react';
import { Form, InputNumber, Switch, Button, Card, Select } from 'antd';

export const TaxSettings: React.FC = () => {
  const [form] = Form.useForm();

  const onFinish = (values: any) => {
    console.log('Tax settings:', values);
  };

  return (
    <Card title="Cài đặt thuế">
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          enabled: true,
          rate: 10,
          inclusive: false,
          method: 'exclusive',
        }}
      >
        <Form.Item
          name="enabled"
          label="Áp dụng thuế VAT"
          valuePropName="checked"
        >
          <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
        </Form.Item>

        <Form.Item
          name="rate"
          label="Thuế suất VAT (%)"
          rules={[{ required: true, message: 'Vui lòng nhập thuế suất' }]}
        >
          <InputNumber
            min={0}
            max={100}
            step={0.1}
            style={{ width: '100%' }}
            placeholder="10"
          />
        </Form.Item>

        <Form.Item name="method" label="Phương thức tính thuế">
          <Select placeholder="Chọn phương thức">
            <Select.Option value="exclusive">Thuế ngoài (Exclusive)</Select.Option>
            <Select.Option value="inclusive">Thuế trong (Inclusive)</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="inclusive"
          label="Giá đã bao gồm thuế"
          valuePropName="checked"
        >
          <Switch 
            checkedChildren="Đã bao gồm" 
            unCheckedChildren="Chưa bao gồm" 
          />
        </Form.Item>

        <Form.Item name="taxNumber" label="Số đăng ký thuế">
          <Input placeholder="Nhập số đăng ký thuế" />
        </Form.Item>

        <Form.Item name="taxOffice" label="Cục thuế quản lý">
          <Input placeholder="Tên cục thuế quản lý" />
        </Form.Item>

        <Form.Item name="exemptProducts" label="Sản phẩm miễn thuế">
          <Select
            mode="multiple"
            placeholder="Chọn sản phẩm miễn thuế"
            style={{ width: '100%' }}
          >
            <Select.Option value="medicine">Thuốc</Select.Option>
            <Select.Option value="education">Giáo dục</Select.Option>
            <Select.Option value="export">Hàng xuất khẩu</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit">
            Lưu cài đặt thuế
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default TaxSettings;
