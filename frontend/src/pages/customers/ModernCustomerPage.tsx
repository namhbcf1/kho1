import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Input,
  Modal,
  Form,
  Select,
  Tag,
  Space,
  Typography,
  Row,
  Col,
  Statistic,
  Avatar,
  Divider,
  notification,
  Popconfirm,
  Tooltip,
  Badge
} from 'antd';
import {
  UserOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  PhoneOutlined,
  MailOutlined,
  HomeOutlined,
  GiftOutlined,
  ShoppingOutlined,
  StarOutlined
} from '@ant-design/icons';
import { validateVietnamesePhone, formatVietnamesePhone } from '../../utils/validators/vietnameseValidators';
import { formatVND } from '../../utils/formatters/vietnameseCurrency';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  province?: string;
  district?: string;
  ward?: string;
  totalSpent: number;
  totalOrders: number;
  loyaltyPoints: number;
  status: 'active' | 'inactive' | 'vip';
  registeredDate: string;
  lastVisit?: string;
  notes?: string;
}

const ModernCustomerPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [form] = Form.useForm();

  // Sample customer data
  useEffect(() => {
    setCustomers([
      {
        id: '1',
        name: 'Nguyễn Văn Anh',
        phone: '0987654321',
        email: 'nguyenvananh@gmail.com',
        address: '123 Nguyễn Huệ',
        province: 'TP Hồ Chí Minh',
        district: 'Quận 1',
        ward: 'Phường Bến Nghé',
        totalSpent: 15680000,
        totalOrders: 45,
        loyaltyPoints: 1568,
        status: 'vip',
        registeredDate: '2024-01-15',
        lastVisit: '2024-07-15',
        notes: 'Khách hàng VIP, thường mua điện thoại cao cấp'
      },
      {
        id: '2',
        name: 'Trần Thị Bình',
        phone: '0912345678',
        email: 'tranthibinh@yahoo.com',
        address: '456 Lê Lợi',
        province: 'Hà Nội',
        district: 'Quận Hoàn Kiếm',
        ward: 'Phường Hàng Bài',
        totalSpent: 8950000,
        totalOrders: 28,
        loyaltyPoints: 895,
        status: 'active',
        registeredDate: '2024-02-20',
        lastVisit: '2024-07-14',
        notes: 'Thích mua phụ kiện công nghệ'
      },
      {
        id: '3',
        name: 'Lê Minh Châu',
        phone: '0765432109',
        address: '789 Hai Bà Trưng',
        province: 'Đà Nẵng',
        district: 'Quận Hải Châu',
        ward: 'Phường Hải Châu I',
        totalSpent: 3200000,
        totalOrders: 12,
        loyaltyPoints: 320,
        status: 'active',
        registeredDate: '2024-05-10',
        lastVisit: '2024-07-10'
      }
    ]);
  }, []);

  const handleAddCustomer = () => {
    setEditingCustomer(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    form.setFieldsValue(customer);
    setModalVisible(true);
  };

  const handleDeleteCustomer = (customerId: string) => {
    setCustomers(customers.filter(c => c.id !== customerId));
    notification.success({
      message: 'Xóa khách hàng',
      description: 'Khách hàng đã được xóa thành công'
    });
  };

  const handleSubmit = (values: any) => {
    if (editingCustomer) {
      // Edit existing customer
      setCustomers(customers.map(c => 
        c.id === editingCustomer.id 
          ? { ...editingCustomer, ...values }
          : c
      ));
      notification.success({
        message: 'Cập nhật khách hàng',
        description: 'Thông tin khách hàng đã được cập nhật'
      });
    } else {
      // Add new customer
      const newCustomer: Customer = {
        id: Date.now().toString(),
        ...values,
        totalSpent: 0,
        totalOrders: 0,
        loyaltyPoints: 0,
        status: 'active',
        registeredDate: new Date().toISOString().split('T')[0]
      };
      setCustomers([...customers, newCustomer]);
      notification.success({
        message: 'Thêm khách hàng',
        description: 'Khách hàng mới đã được thêm thành công'
      });
    }
    setModalVisible(false);
    form.resetFields();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'vip': return 'gold';
      case 'active': return 'green';
      case 'inactive': return 'red';
      default: return 'blue';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'vip': return 'VIP';
      case 'active': return 'Hoạt động';
      case 'inactive': return 'Ngừng hoạt động';
      default: return status;
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm) ||
    (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalCustomers = customers.length;
  const vipCustomers = customers.filter(c => c.status === 'vip').length;
  const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0);
  const avgOrderValue = totalRevenue / customers.reduce((sum, c) => sum + c.totalOrders, 0) || 0;

  const columns = [
    {
      title: 'Khách hàng',
      key: 'customer',
      render: (record: Customer) => (
        <Space>
          <Avatar icon={<UserOutlined />} />
          <div>
            <div style={{ fontWeight: 600 }}>{record.name}</div>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              <PhoneOutlined /> {formatVietnamesePhone(record.phone)}
            </Text>
          </div>
        </Space>
      )
    },
    {
      title: 'Địa chỉ',
      key: 'address',
      render: (record: Customer) => (
        <div>
          {record.address && (
            <div style={{ fontSize: '13px' }}>{record.address}</div>
          )}
          <Text type="secondary" style={{ fontSize: '11px' }}>
            {record.ward && `${record.ward}, `}
            {record.district && `${record.district}, `}
            {record.province}
          </Text>
        </div>
      )
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {status === 'vip' && <StarOutlined />} {getStatusText(status)}
        </Tag>
      )
    },
    {
      title: 'Tổng chi tiêu',
      dataIndex: 'totalSpent',
      key: 'totalSpent',
      render: (amount: number) => (
        <Text strong style={{ color: '#52c41a' }}>
          {formatVND(amount)}
        </Text>
      )
    },
    {
      title: 'Đơn hàng',
      dataIndex: 'totalOrders',
      key: 'totalOrders',
      render: (orders: number) => (
        <Badge count={orders} showZero style={{ backgroundColor: '#1890ff' }} />
      )
    },
    {
      title: 'Điểm tích lũy',
      dataIndex: 'loyaltyPoints',
      key: 'loyaltyPoints',
      render: (points: number) => (
        <Space>
          <GiftOutlined style={{ color: '#fa8c16' }} />
          <Text>{points.toLocaleString()}</Text>
        </Space>
      )
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (record: Customer) => (
        <Space>
          <Tooltip title="Chỉnh sửa">
            <Button
              icon={<EditOutlined />}
              size="small"
              onClick={() => handleEditCustomer(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Xóa khách hàng"
            description="Bạn có chắc chắn muốn xóa khách hàng này?"
            onConfirm={() => handleDeleteCustomer(record.id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Tooltip title="Xóa">
              <Button
                icon={<DeleteOutlined />}
                size="small"
                danger
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>👥 Quản lý Khách hàng</Title>
      
      {/* Statistics */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Tổng khách hàng"
              value={totalCustomers}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Khách VIP"
              value={vipCustomers}
              prefix={<StarOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Tổng doanh thu"
              value={formatVND(totalRevenue)}
              prefix={<ShoppingOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Giá trị đơn TB"
              value={formatVND(avgOrderValue)}
              prefix={<ShoppingOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Actions and Search */}
      <Card style={{ marginBottom: '16px' }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Search
              placeholder="Tìm kiếm khách hàng..."
              allowClear
              style={{ width: 300 }}
              onChange={(e) => setSearchTerm(e.target.value)}
              prefix={<SearchOutlined />}
            />
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddCustomer}
            >
              Thêm khách hàng
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Customer Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredCustomers}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} của ${total} khách hàng`
          }}
        />
      </Card>

      {/* Add/Edit Customer Modal */}
      <Modal
        title={editingCustomer ? 'Chỉnh sửa khách hàng' : 'Thêm khách hàng mới'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="name"
            label="Họ và tên"
            rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]}
          >
            <Input placeholder="Nhập họ và tên khách hàng" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="phone"
                label="Số điện thoại"
                rules={[
                  { required: true, message: 'Vui lòng nhập số điện thoại!' },
                  {
                    validator: (_, value) => {
                      if (!value || validateVietnamesePhone(value)) {
                        return Promise.resolve();
                      }
                      return Promise.reject('Số điện thoại không hợp lệ!');
                    }
                  }
                ]}
              >
                <Input placeholder="0987654321" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="email"
                label="Email (tùy chọn)"
                rules={[{ type: 'email', message: 'Email không hợp lệ!' }]}
              >
                <Input placeholder="example@gmail.com" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="address"
            label="Địa chỉ"
          >
            <Input placeholder="Số nhà, tên đường" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="ward" label="Phường/Xã">
                <Input placeholder="Phường/Xã" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="district" label="Quận/Huyện">
                <Input placeholder="Quận/Huyện" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="province" label="Tỉnh/Thành phố">
                <Select placeholder="Chọn tỉnh/thành phố">
                  <Option value="TP Hồ Chí Minh">TP Hồ Chí Minh</Option>
                  <Option value="Hà Nội">Hà Nội</Option>
                  <Option value="Đà Nẵng">Đà Nẵng</Option>
                  <Option value="Cần Thơ">Cần Thơ</Option>
                  <Option value="Hải Phòng">Hải Phòng</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="notes"
            label="Ghi chú"
          >
            <Input.TextArea rows={3} placeholder="Ghi chú về khách hàng..." />
          </Form.Item>

          <Divider />

          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button onClick={() => setModalVisible(false)}>
              Hủy
            </Button>
            <Button type="primary" htmlType="submit">
              {editingCustomer ? 'Cập nhật' : 'Thêm mới'}
            </Button>
          </Space>
        </Form>
      </Modal>
    </div>
  );
};

export default ModernCustomerPage;