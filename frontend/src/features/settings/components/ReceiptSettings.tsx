// Receipt template settings component
import React from 'react';
import { Form, Input, Select, Switch, Button, Card, Upload } from 'antd';
import { UploadOutlined } from '@ant-design/icons';

export const ReceiptSettings: React.FC = () => {
  const [form] = Form.useForm();

  const onFinish = (values: any) => {
    console.log('Receipt settings:', values);
  };

  return (
    <Card title="Cài đặt hóa đơn">
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          template: 'standard',
          showLogo: true,
          showTax: true,
          showQR: false,
          header: 'Cảm ơn quý khách đã mua hàng!',
          footer: 'Hẹn gặp lại quý khách!',
          paperSize: 'thermal_80',
        }}
      >
        <Form.Item name="template" label="Mẫu hóa đơn">
          <Select placeholder="Chọn mẫu hóa đơn">
            <Select.Option value="standard">Tiêu chuẩn</Select.Option>
            <Select.Option value="compact">Gọn nhẹ</Select.Option>
            <Select.Option value="detailed">Chi tiết</Select.Option>
            <Select.Option value="thermal">Máy in nhiệt</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item name="paperSize" label="Kích thước giấy">
          <Select placeholder="Chọn kích thước">
            <Select.Option value="a4">A4 (210x297mm)</Select.Option>
            <Select.Option value="thermal_58">Nhiệt 58mm</Select.Option>
            <Select.Option value="thermal_80">Nhiệt 80mm</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="showLogo"
          label="Hiển thị logo"
          valuePropName="checked"
        >
          <Switch checkedChildren="Hiển thị" unCheckedChildren="Ẩn" />
        </Form.Item>

        <Form.Item
          name="showTax"
          label="Hiển thị thông tin thuế"
          valuePropName="checked"
        >
          <Switch checkedChildren="Hiển thị" unCheckedChildren="Ẩn" />
        </Form.Item>

        <Form.Item
          name="showQR"
          label="Hiển thị mã QR"
          valuePropName="checked"
        >
          <Switch checkedChildren="Hiển thị" unCheckedChildren="Ẩn" />
        </Form.Item>

        <Form.Item name="header" label="Tiêu đề hóa đơn">
          <Input placeholder="Cảm ơn quý khách đã mua hàng!" />
        </Form.Item>

        <Form.Item name="footer" label="Chân trang hóa đơn">
          <Input placeholder="Hẹn gặp lại quý khách!" />
        </Form.Item>

        <Form.Item name="customMessage" label="Thông điệp tùy chỉnh">
          <Input.TextArea 
            rows={3} 
            placeholder="Thông điệp đặc biệt trên hóa đơn" 
          />
        </Form.Item>

        <Form.Item name="logo" label="Logo cho hóa đơn">
          <Upload
            name="receiptLogo"
            listType="picture"
            maxCount={1}
            beforeUpload={() => false}
          >
            <Button icon={<UploadOutlined />}>Tải lên logo</Button>
          </Upload>
        </Form.Item>

        <Form.Item name="fontSize" label="Cỡ chữ">
          <Select placeholder="Chọn cỡ chữ">
            <Select.Option value="small">Nhỏ</Select.Option>
            <Select.Option value="medium">Vừa</Select.Option>
            <Select.Option value="large">Lớn</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item name="language" label="Ngôn ngữ hóa đơn">
          <Select placeholder="Chọn ngôn ngữ">
            <Select.Option value="vi">Tiếng Việt</Select.Option>
            <Select.Option value="en">English</Select.Option>
            <Select.Option value="both">Cả hai</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit">
            Lưu cài đặt hóa đơn
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default ReceiptSettings;
