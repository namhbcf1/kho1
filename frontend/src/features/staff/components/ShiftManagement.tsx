// Work shift scheduling component
import React from 'react';
import { Calendar, Badge, Modal, Form, TimePicker, Select, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { Dayjs } from 'dayjs';

export const ShiftManagement: React.FC = () => {
  const [showModal, setShowModal] = React.useState(false);
  const [form] = Form.useForm();

  const getListData = (value: Dayjs) => {
    const shifts = [
      { type: 'success', content: 'Ca sáng: Nguyễn Văn A (8:00-16:00)' },
      { type: 'warning', content: 'Ca chiều: Trần Thị B (16:00-24:00)' },
    ];
    return shifts;
  };

  const dateCellRender = (value: Dayjs) => {
    const listData = getListData(value);
    return (
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {listData.map((item, index) => (
          <li key={index}>
            <Badge 
              status={item.type as any} 
              text={
                <span style={{ fontSize: '10px' }}>
                  {item.content.split(':')[0]}
                </span>
              } 
            />
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div>
      <div style={{ marginBottom: 16, textAlign: 'right' }}>
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={() => setShowModal(true)}
        >
          Thêm ca làm việc
        </Button>
      </div>

      <Calendar 
        dateCellRender={dateCellRender}
        style={{ border: '1px solid #d9d9d9', borderRadius: '6px' }}
      />

      <Modal
        title="Thêm ca làm việc"
        open={showModal}
        onCancel={() => setShowModal(false)}
        footer={null}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="staff" label="Nhân viên" rules={[{ required: true }]}>
            <Select placeholder="Chọn nhân viên">
              <Select.Option value="staff1">Nguyễn Văn A</Select.Option>
              <Select.Option value="staff2">Trần Thị B</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="shift" label="Ca làm việc" rules={[{ required: true }]}>
            <Select placeholder="Chọn ca">
              <Select.Option value="morning">Ca sáng (8:00-16:00)</Select.Option>
              <Select.Option value="afternoon">Ca chiều (16:00-24:00)</Select.Option>
              <Select.Option value="night">Ca đêm (0:00-8:00)</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="timeRange" label="Thời gian">
            <TimePicker.RangePicker format="HH:mm" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit">
              Lưu ca làm việc
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ShiftManagement;
