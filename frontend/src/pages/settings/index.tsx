import React from 'react';
import { Card, Form, Input, Select, Switch, Button, Typography, Row, Col } from 'antd';
import { SaveOutlined } from '@ant-design/icons';

const { Title } = Typography;

export default function SettingsPage() {
  const [form] = Form.useForm();

  const handleSave = (values: any) => {
    console.log('Settings saved:', values);
    // TODO: Implement save logic
  };

  return (
    <div className="settings-page">
      <Title level={2} style={{ marginBottom: 24 }}>Cài đặt hệ thống</Title>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Thông tin cửa hàng">
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSave}
              initialValues={{
                storeName: 'KhoAugment Store',
                storeAddress: '123 Đường ABC, Quận 1, TP.HCM',
                storePhone: '028 1234 5678',
                storeEmail: 'contact@khoaugment.com',
                taxCode: '0123456789'
              }}
            >
              <Form.Item
                name="storeName"
                label="Tên cửa hàng"
                rules={[{ required: true, message: 'Vui lòng nhập tên cửa hàng' }]}
              >
                <Input />
              </Form.Item>

              <Form.Item
                name="storeAddress"
                label="Địa chỉ"
                rules={[{ required: true, message: 'Vui lòng nhập địa chỉ' }]}
              >
                <Input.TextArea rows={2} />
              </Form.Item>

              <Form.Item
                name="storePhone"
                label="Số điện thoại"
                rules={[{ required: true, message: 'Vui lòng nhập số điện thoại' }]}
              >
                <Input />
              </Form.Item>

              <Form.Item
                name="storeEmail"
                label="Email"
                rules={[{ required: true, type: 'email', message: 'Vui lòng nhập email hợp lệ' }]}
              >
                <Input />
              </Form.Item>

              <Form.Item
                name="taxCode"
                label="Mã số thuế"
              >
                <Input />
              </Form.Item>
            </Form>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="Cài đặt hệ thống">
            <Form layout="vertical">
              <Form.Item
                name="currency"
                label="Đơn vị tiền tệ"
                initialValue="VND"
              >
                <Select>
                  <Select.Option value="VND">Việt Nam Đồng (₫)</Select.Option>
                  <Select.Option value="USD">US Dollar ($)</Select.Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="language"
                label="Ngôn ngữ"
                initialValue="vi"
              >
                <Select>
                  <Select.Option value="vi">Tiếng Việt</Select.Option>
                  <Select.Option value="en">English</Select.Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="autoBackup"
                label="Tự động sao lưu dữ liệu"
                valuePropName="checked"
                initialValue={true}
              >
                <Switch />
              </Form.Item>

              <Form.Item
                name="printReceipt"
                label="In hóa đơn tự động"
                valuePropName="checked"
                initialValue={true}
              >
                <Switch />
              </Form.Item>

              <Form.Item
                name="lowStockAlert"
                label="Cảnh báo hết hàng"
                valuePropName="checked"
                initialValue={true}
              >
                <Switch />
              </Form.Item>
            </Form>
          </Card>

          <Card title="Thanh toán" style={{ marginTop: 16 }}>
            <Form layout="vertical">
              <Form.Item
                name="taxRate"
                label="Thuế VAT (%)"
                initialValue={10}
              >
                <Select>
                  <Select.Option value={0}>0% (Miễn thuế)</Select.Option>
                  <Select.Option value={5}>5%</Select.Option>
                  <Select.Option value={10}>10% (Chuẩn)</Select.Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="enableVNPay"
                label="Kích hoạt VNPay"
                valuePropName="checked"
                initialValue={false}
              >
                <Switch />
              </Form.Item>

              <Form.Item
                name="enableMoMo"
                label="Kích hoạt MoMo"
                valuePropName="checked"
                initialValue={false}
              >
                <Switch />
              </Form.Item>

              <Form.Item
                name="enableZaloPay"
                label="Kích hoạt ZaloPay"
                valuePropName="checked"
                initialValue={false}
              >
                <Switch />
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>

      <div style={{ marginTop: 24, textAlign: 'center' }}>
        <Button type="primary" icon={<SaveOutlined />} size="large">
          Lưu cài đặt
        </Button>
      </div>
    </div>
  );
}