// Vietnamese refund process component
import React from 'react';
import { Form, Input, InputNumber, Button, Select } from 'antd';

export const RefundProcess: React.FC = () => {
  return (
    <Form layout="vertical">
      <Form.Item name="reason" label="Lý do hoàn tiền">
        <Select>
          <Select.Option value="customer_request">Khách hàng yêu cầu</Select.Option>
          <Select.Option value="product_issue">Lỗi sản phẩm</Select.Option>
          <Select.Option value="wrong_order">Đặt nhầm</Select.Option>
        </Select>
      </Form.Item>
      <Form.Item name="amount" label="Số tiền hoàn">
        <InputNumber style={{ width: '100%' }} />
      </Form.Item>
      <Form.Item name="notes" label="Ghi chú">
        <Input.TextArea />
      </Form.Item>
      <Button type="primary">Xử lý hoàn tiền</Button>
    </Form>
  );
};

export default RefundProcess;
