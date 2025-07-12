// Vietnamese address management component
import React from 'react';
import { Card, Button, List, Modal, Form, Input, Select } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, HomeOutlined } from '@ant-design/icons';

const { Option } = Select;

export const AddressBook: React.FC = () => {
  const [showModal, setShowModal] = React.useState(false);
  const [form] = Form.useForm();

  const addresses = [
    {
      id: '1',
      label: 'Nhà riêng',
      street: '123 Đường Nguyễn Văn Cừ',
      ward: 'Phường 1',
      district: 'Quận 1',
      province: 'TP Hồ Chí Minh',
      isDefault: true,
    },
    {
      id: '2',
      label: 'Văn phòng',
      street: '456 Đường Lê Lợi',
      ward: 'Phường Bến Nghé',
      district: 'Quận 1',
      province: 'TP Hồ Chí Minh',
      isDefault: false,
    },
  ];

  const formatAddress = (address: any) => {
    return `${address.street}, ${address.ward}, ${address.district}, ${address.province}`;
  };

  return (
    <Card 
      title="Sổ địa chỉ"
      extra={
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={() => setShowModal(true)}
        >
          Thêm địa chỉ
        </Button>
      }
    >
      <List
        dataSource={addresses}
        renderItem={(address) => (
          <List.Item
            actions={[
              <Button type="text" icon={<EditOutlined />} />,
              <Button type="text" icon={<DeleteOutlined />} danger />,
            ]}
          >
            <List.Item.Meta
              avatar={<HomeOutlined style={{ fontSize: '20px', color: '#1890ff' }} />}
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {address.label}
                  {address.isDefault && (
                    <span style={{ 
                      background: '#52c41a', 
                      color: 'white', 
                      padding: '2px 6px', 
                      borderRadius: '4px', 
                      fontSize: '10px' 
                    }}>
                      Mặc định
                    </span>
                  )}
                </div>
              }
              description={formatAddress(address)}
            />
          </List.Item>
        )}
      />

      <Modal
        title="Thêm địa chỉ mới"
        open={showModal}
        onCancel={() => setShowModal(false)}
        footer={null}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="label" label="Nhãn địa chỉ" rules={[{ required: true }]}>
            <Input placeholder="Ví dụ: Nhà riêng, Văn phòng" />
          </Form.Item>

          <Form.Item name="street" label="Địa chỉ" rules={[{ required: true }]}>
            <Input placeholder="Số nhà, tên đường" />
          </Form.Item>

          <Form.Item name="ward" label="Phường/Xã" rules={[{ required: true }]}>
            <Select placeholder="Chọn phường/xã">
              <Option value="Phường 1">Phường 1</Option>
              <Option value="Phường 2">Phường 2</Option>
            </Select>
          </Form.Item>

          <Form.Item name="district" label="Quận/Huyện" rules={[{ required: true }]}>
            <Select placeholder="Chọn quận/huyện">
              <Option value="Quận 1">Quận 1</Option>
              <Option value="Quận 2">Quận 2</Option>
            </Select>
          </Form.Item>

          <Form.Item name="province" label="Tỉnh/Thành phố" rules={[{ required: true }]}>
            <Select placeholder="Chọn tỉnh/thành phố">
              <Option value="TP Hồ Chí Minh">TP Hồ Chí Minh</Option>
              <Option value="Hà Nội">Hà Nội</Option>
              <Option value="Đà Nẵng">Đà Nẵng</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit">
              Lưu địa chỉ
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default AddressBook;
