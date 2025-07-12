// Vietnamese/English language toggle component
import React from 'react';
import { Form, Select, Switch, Button, Card } from 'antd';

export const LanguageSettings: React.FC = () => {
  const [form] = Form.useForm();

  const onFinish = (values: any) => {
    console.log('Language settings:', values);
  };

  return (
    <Card title="Cài đặt ngôn ngữ">
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          defaultLanguage: 'vi',
          enableMultiLanguage: false,
          dateFormat: 'DD/MM/YYYY',
          timeFormat: 'HH:mm',
          currency: 'VND',
          timezone: 'Asia/Ho_Chi_Minh',
        }}
      >
        <Form.Item name="defaultLanguage" label="Ngôn ngữ mặc định">
          <Select placeholder="Chọn ngôn ngữ">
            <Select.Option value="vi">Tiếng Việt</Select.Option>
            <Select.Option value="en">English</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="enableMultiLanguage"
          label="Hỗ trợ đa ngôn ngữ"
          valuePropName="checked"
        >
          <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
        </Form.Item>

        <Form.Item name="dateFormat" label="Định dạng ngày">
          <Select placeholder="Chọn định dạng ngày">
            <Select.Option value="DD/MM/YYYY">DD/MM/YYYY (Việt Nam)</Select.Option>
            <Select.Option value="MM/DD/YYYY">MM/DD/YYYY (Mỹ)</Select.Option>
            <Select.Option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item name="timeFormat" label="Định dạng giờ">
          <Select placeholder="Chọn định dạng giờ">
            <Select.Option value="HH:mm">24 giờ (HH:mm)</Select.Option>
            <Select.Option value="hh:mm A">12 giờ (hh:mm AM/PM)</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item name="currency" label="Đơn vị tiền tệ">
          <Select placeholder="Chọn đơn vị tiền tệ">
            <Select.Option value="VND">Việt Nam Đồng (VND)</Select.Option>
            <Select.Option value="USD">US Dollar (USD)</Select.Option>
            <Select.Option value="EUR">Euro (EUR)</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item name="timezone" label="Múi giờ">
          <Select placeholder="Chọn múi giờ">
            <Select.Option value="Asia/Ho_Chi_Minh">Việt Nam (UTC+7)</Select.Option>
            <Select.Option value="Asia/Bangkok">Bangkok (UTC+7)</Select.Option>
            <Select.Option value="Asia/Singapore">Singapore (UTC+8)</Select.Option>
            <Select.Option value="UTC">UTC (UTC+0)</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item name="numberFormat" label="Định dạng số">
          <Select placeholder="Chọn định dạng số">
            <Select.Option value="vi">Việt Nam (1.234.567,89)</Select.Option>
            <Select.Option value="en">Quốc tế (1,234,567.89)</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item name="firstDayOfWeek" label="Ngày đầu tuần">
          <Select placeholder="Chọn ngày đầu tuần">
            <Select.Option value="monday">Thứ Hai</Select.Option>
            <Select.Option value="sunday">Chủ Nhật</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit">
            Lưu cài đặt ngôn ngữ
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default LanguageSettings;
