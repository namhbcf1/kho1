// Payment gateway configuration component
import React from 'react';
import { Form, Input, Switch, Button, Card, Divider } from 'antd';

export const PaymentSettings: React.FC = () => {
  const [form] = Form.useForm();

  const onFinish = (values: any) => {
    console.log('Payment settings:', values);
  };

  return (
    <Card title="Cài đặt thanh toán">
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          enableCash: true,
          enableCard: true,
          enableVNPay: false,
          enableMoMo: false,
          enableZaloPay: false,
        }}
      >
        {/* Cash Payment */}
        <Form.Item
          name="enableCash"
          label="Thanh toán tiền mặt"
          valuePropName="checked"
        >
          <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
        </Form.Item>

        <Form.Item
          name="enableCard"
          label="Thanh toán thẻ"
          valuePropName="checked"
        >
          <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
        </Form.Item>

        <Divider>Cổng thanh toán điện tử</Divider>

        {/* VNPay */}
        <Form.Item
          name="enableVNPay"
          label="VNPay"
          valuePropName="checked"
        >
          <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
        </Form.Item>

        <Form.Item name="vnpayMerchantId" label="VNPay Merchant ID">
          <Input placeholder="Nhập Merchant ID" />
        </Form.Item>

        <Form.Item name="vnpaySecretKey" label="VNPay Secret Key">
          <Input.Password placeholder="Nhập Secret Key" />
        </Form.Item>

        <Form.Item name="vnpayReturnUrl" label="VNPay Return URL">
          <Input placeholder="https://yoursite.com/vnpay/return" />
        </Form.Item>

        <Divider />

        {/* MoMo */}
        <Form.Item
          name="enableMoMo"
          label="MoMo"
          valuePropName="checked"
        >
          <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
        </Form.Item>

        <Form.Item name="momoPartnerCode" label="MoMo Partner Code">
          <Input placeholder="Nhập Partner Code" />
        </Form.Item>

        <Form.Item name="momoAccessKey" label="MoMo Access Key">
          <Input.Password placeholder="Nhập Access Key" />
        </Form.Item>

        <Form.Item name="momoSecretKey" label="MoMo Secret Key">
          <Input.Password placeholder="Nhập Secret Key" />
        </Form.Item>

        <Form.Item name="momoReturnUrl" label="MoMo Return URL">
          <Input placeholder="https://yoursite.com/momo/return" />
        </Form.Item>

        <Divider />

        {/* ZaloPay */}
        <Form.Item
          name="enableZaloPay"
          label="ZaloPay"
          valuePropName="checked"
        >
          <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
        </Form.Item>

        <Form.Item name="zalopayAppId" label="ZaloPay App ID">
          <Input placeholder="Nhập App ID" />
        </Form.Item>

        <Form.Item name="zalopayKey1" label="ZaloPay Key 1">
          <Input.Password placeholder="Nhập Key 1" />
        </Form.Item>

        <Form.Item name="zalopayKey2" label="ZaloPay Key 2">
          <Input.Password placeholder="Nhập Key 2" />
        </Form.Item>

        <Form.Item name="zalopayCallbackUrl" label="ZaloPay Callback URL">
          <Input placeholder="https://yoursite.com/zalopay/callback" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit">
            Lưu cài đặt thanh toán
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default PaymentSettings;
