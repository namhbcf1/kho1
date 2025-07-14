// Customer management page with full Vietnamese POS functionality
import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  Space, 
  Table, 
  Input, 
  Select, 
  Tag, 
  Modal, 
  Form, 
  InputNumber, 
  Typography,
  Row,
  Col,
  Statistic,
  Badge,
  Avatar,
  DatePicker,
  message
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  SearchOutlined,
  ExportOutlined,
  ImportOutlined,
  UserOutlined,
  CrownOutlined,
  PhoneOutlined,
  MailOutlined,
  HomeOutlined
} from '@ant-design/icons';
import { formatVND } from '../../utils/formatters/vndCurrency';
import { usePage } from '../../stores';
import dayjs from 'dayjs';

const { Search } = Input;
const { Option } = Select;
const { Title, Text } = Typography;

// Mock customer data with Vietnamese business logic
const mockCustomers = [
  {
    id: '1',
    name: 'Nguyễn Văn Anh',
    phone: '0901234567',
    email: 'nguyenvananh@gmail.com',
    address: 'Số 123, Đường Lê Lợi, Phường Bến Nghé, Quận 1, TP.HCM',
    tier: 'Vàng',
    tierId: 'gold',
    loyaltyPoints: 1500,
    totalSpent: 5000000,
    totalOrders: 25,
    lastVisit: '2024-01-20',
    birthDate: '1985-05-15',
    gender: 'Nam',
    status: 'active',
    notes: 'Khách hàng thân thiết, thích cà phê đen'
  },
  {
    id: '2',
    name: 'Trần Thị Bình',
    phone: '0987654321',
    email: 'tranthibinh@gmail.com',
    address: 'Số 456, Đường Nguyễn Huệ, Phường Đa Kao, Quận 1, TP.HCM',
    tier: 'Bạch kim',
    tierId: 'platinum',
    loyaltyPoints: 3200,
    totalSpent: 12000000,
    totalOrders: 68,
    lastVisit: '2024-01-22',
    birthDate: '1990-08-22',
    gender: 'Nữ',
    status: 'active',
    notes: 'Thường đặt hàng online, ưa thích bánh ngọt'
  },
  {
    id: '3',
    name: 'Lê Minh Cường',
    phone: '0912345678',
    email: 'leminhcuong@gmail.com',
    address: 'Số 789, Đường Điện Biên Phủ, Phường 15, Quận Bình Thạnh, TP.HCM',
    tier: 'Bạc',
    tierId: 'silver',
    loyaltyPoints: 850,
    totalSpent: 2500000,
    totalOrders: 15,
    lastVisit: '2024-01-18',
    birthDate: '1988-12-03',
    gender: 'Nam',
    status: 'active',
    notes: 'Làm việc gần quán, thường ghé buổi sáng'
  },
  {
    id: '4',
    name: 'Phạm Thị Diễm',
    phone: '0923456789',
    email: 'phamthidiem@gmail.com',
    address: 'Số 321, Đường Cách Mạng Tháng 8, Phường 5, Quận 3, TP.HCM',
    tier: 'Kim cương',
    tierId: 'diamond',
    loyaltyPoints: 5000,
    totalSpent: 20000000,
    totalOrders: 120,
    lastVisit: '2024-01-23',
    birthDate: '1982-03-18',
    gender: 'Nữ',
    status: 'vip',
    notes: 'Khách VIP, thường tổ chức sinh nhật tại quán'
  },
  {
    id: '5',
    name: 'Hoàng Văn Em',
    phone: '0934567890',
    email: 'hoangvanem@gmail.com',
    address: 'Số 654, Đường Võ Thị Sáu, Phường 7, Quận 3, TP.HCM',
    tier: 'Đồng',
    tierId: 'bronze',
    loyaltyPoints: 350,
    totalSpent: 800000,
    totalOrders: 8,
    lastVisit: '2024-01-15',
    birthDate: '1995-07-25',
    gender: 'Nam',
    status: 'active',
    notes: 'Khách hàng mới, sinh viên'
  },
  {
    id: '6',
    name: 'Võ Thị Phương',
    phone: '0945678901',
    email: 'vothiphuong@gmail.com',
    address: 'Số 987, Đường Pasteur, Phường 6, Quận 3, TP.HCM',
    tier: 'Vàng',
    tierId: 'gold',
    loyaltyPoints: 1800,
    totalSpent: 6500000,
    totalOrders: 32,
    lastVisit: '2024-01-21',
    birthDate: '1987-11-12',
    gender: 'Nữ',
    status: 'active',
    notes: 'Thích thử món mới, hay đưa bạn đến quán'
  }
];

const customerTiers = [
  { id: 'all', name: 'Tất cả', color: '' },
  { id: 'bronze', name: 'Đồng', color: '#cd7f32' },
  { id: 'silver', name: 'Bạc', color: '#c0c0c0' },
  { id: 'gold', name: 'Vàng', color: '#ffd700' },
  { id: 'platinum', name: 'Bạch kim', color: '#e5e4e2' },
  { id: 'diamond', name: 'Kim cương', color: '#b9f2ff' },
];

const statusOptions = [
  { id: 'all', name: 'Tất cả' },
  { id: 'active', name: 'Hoạt động' },
  { id: 'vip', name: 'VIP' },
  { id: 'inactive', name: 'Ngừng hoạt động' },
];

export const CustomerListPage: React.FC = () => {
  const [customers, setCustomers] = useState(mockCustomers);
  const [filteredCustomers, setFilteredCustomers] = useState(mockCustomers);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTier, setSelectedTier] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [form] = Form.useForm();
  const { setPageTitle, setBreadcrumbs } = usePage();

  useEffect(() => {
    setPageTitle('Quản lý khách hàng');
    setBreadcrumbs([
      { title: 'Khách hàng' },
    ]);
  }, [setPageTitle, setBreadcrumbs]);

  useEffect(() => {
    let filtered = customers;
    
    if (searchQuery) {
      filtered = filtered.filter(customer => 
        customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.phone.includes(searchQuery) ||
        customer.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (selectedTier !== 'all') {
      filtered = filtered.filter(customer => customer.tierId === selectedTier);
    }
    
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(customer => customer.status === selectedStatus);
    }
    
    setFilteredCustomers(filtered);
  }, [customers, searchQuery, selectedTier, selectedStatus]);

  const handleAddCustomer = () => {
    setEditingCustomer(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEditCustomer = (customer: any) => {
    setEditingCustomer(customer);
    form.setFieldsValue({
      ...customer,
      birthDate: customer.birthDate ? dayjs(customer.birthDate) : null
    });
    setModalVisible(true);
  };

  const handleDeleteCustomer = (customerId: string) => {
    Modal.confirm({
      title: 'Xác nhận xóa',
      content: 'Bạn có chắc muốn xóa khách hàng này?',
      onOk: () => {
        setCustomers(customers.filter(c => c.id !== customerId));
        message.success('Xóa khách hàng thành công!');
      },
    });
  };

  const handleSaveCustomer = async (values: any) => {
    try {
      const customerData = {
        ...values,
        birthDate: values.birthDate ? values.birthDate.format('YYYY-MM-DD') : null,
      };
      
      if (editingCustomer) {
        setCustomers(customers.map(c => 
          c.id === editingCustomer.id ? { ...editingCustomer, ...customerData } : c
        ));
        message.success('Cập nhật khách hàng thành công!');
      } else {
        const newCustomer = {
          ...customerData,
          id: Date.now().toString(),
          loyaltyPoints: 0,
          totalSpent: 0,
          totalOrders: 0,
          lastVisit: new Date().toISOString().split('T')[0],
          status: 'active',
        };
        setCustomers([...customers, newCustomer]);
        message.success('Thêm khách hàng thành công!');
      }
      setModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('Save customer error:', error);
      message.error('Lưu thông tin khách hàng thất bại!');
    }
  };

  const columns = [
    {
      title: 'Khách hàng',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: any) => (
        <div className="flex items-center space-x-3">
          <Avatar 
            icon={<UserOutlined />} 
            style={{ backgroundColor: record.status === 'vip' ? '#722ed1' : '#1890ff' }}
          />
          <div>
            <div className="font-medium flex items-center space-x-2">
              <span>{text}</span>
              {record.status === 'vip' && <CrownOutlined className="text-yellow-500" />}
            </div>
            <div className="text-xs text-gray-500 flex items-center space-x-1">
              <PhoneOutlined />
              <span>{record.phone}</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Liên hệ',
      dataIndex: 'email',
      key: 'email',
      render: (email: string, record: any) => (
        <div className="space-y-1">
          <div className="text-sm flex items-center space-x-1">
            <MailOutlined className="text-gray-400" />
            <span>{email}</span>
          </div>
          <div className="text-xs text-gray-500 flex items-start space-x-1">
            <HomeOutlined className="text-gray-400 mt-0.5" />
            <span className="line-clamp-2">{record.address}</span>
          </div>
        </div>
      ),
    },
    {
      title: 'Hạng thành viên',
      dataIndex: 'tier',
      key: 'tier',
      render: (tier: string, record: any) => {
        const tierConfig = customerTiers.find(t => t.id === record.tierId);
        return (
          <Tag color={tierConfig?.color} className="font-medium">
            {tier}
          </Tag>
        );
      },
    },
    {
      title: 'Điểm tích lũy',
      dataIndex: 'loyaltyPoints',
      key: 'loyaltyPoints',
      render: (points: number) => (
        <Badge
          count={points}
          showZero
          style={{ backgroundColor: '#52c41a' }}
        />
      ),
    },
    {
      title: 'Tổng chi tiêu',
      dataIndex: 'totalSpent',
      key: 'totalSpent',
      render: (amount: number) => (
        <Text strong className="text-green-600">
          {formatVND(amount)}
        </Text>
      ),
    },
    {
      title: 'Đơn hàng',
      dataIndex: 'totalOrders',
      key: 'totalOrders',
      render: (orders: number) => (
        <Text>{orders} đơn</Text>
      ),
    },
    {
      title: 'Lần cuối',
      dataIndex: 'lastVisit',
      key: 'lastVisit',
      render: (date: string) => (
        <Text className="text-sm">
          {dayjs(date).format('DD/MM/YYYY')}
        </Text>
      ),
    },
    {
      title: 'Hành động',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEditCustomer(record)}
          >
            Sửa
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteCustomer(record.id)}
          >
            Xóa
          </Button>
        </Space>
      ),
    },
  ];

  // Calculate statistics
  const totalCustomers = customers.length;
  const vipCustomers = customers.filter(c => c.status === 'vip').length;
  const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0);
  const totalLoyaltyPoints = customers.reduce((sum, c) => sum + c.loyaltyPoints, 0);

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Tổng khách hàng"
              value={totalCustomers}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Khách VIP"
              value={vipCustomers}
              prefix={<CrownOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Tổng doanh thu"
              value={totalRevenue}
              formatter={(value) => formatVND(Number(value))}
              prefix={<ExportOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Điểm tích lũy"
              value={totalLoyaltyPoints}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Main Card */}
      <Card
        title="Danh sách khách hàng"
        extra={
          <Space>
            <Button icon={<ImportOutlined />}>
              Nhập Excel
            </Button>
            <Button icon={<ExportOutlined />}>
              Xuất Excel
            </Button>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={handleAddCustomer}
            >
              Thêm khách hàng
            </Button>
          </Space>
        }
      >
        {/* Filters */}
        <Row gutter={[16, 16]} className="mb-4">
          <Col xs={24} md={10}>
            <Search
              placeholder="Tìm kiếm tên, số điện thoại hoặc email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} md={7}>
            <Select
              style={{ width: '100%' }}
              value={selectedTier}
              onChange={setSelectedTier}
              placeholder="Chọn hạng thành viên"
            >
              {customerTiers.map(tier => (
                <Option key={tier.id} value={tier.id}>
                  {tier.name}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} md={7}>
            <Select
              style={{ width: '100%' }}
              value={selectedStatus}
              onChange={setSelectedStatus}
              placeholder="Chọn trạng thái"
            >
              {statusOptions.map(status => (
                <Option key={status.id} value={status.id}>
                  {status.name}
                </Option>
              ))}
            </Select>
          </Col>
        </Row>

        {/* Customer Table */}
        <Table
          columns={columns}
          dataSource={filteredCustomers}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} của ${total} khách hàng`,
          }}
        />
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        title={editingCustomer ? 'Chỉnh sửa khách hàng' : 'Thêm khách hàng mới'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveCustomer}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Họ và tên"
                name="name"
                rules={[{ required: true, message: 'Vui lòng nhập họ và tên' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Số điện thoại"
                name="phone"
                rules={[
                  { required: true, message: 'Vui lòng nhập số điện thoại' },
                  { pattern: /^0[0-9]{9}$/, message: 'Số điện thoại không hợp lệ' }
                ]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Email"
                name="email"
                rules={[
                  { required: true, message: 'Vui lòng nhập email' },
                  { type: 'email', message: 'Email không hợp lệ' }
                ]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Giới tính"
                name="gender"
                rules={[{ required: true, message: 'Vui lòng chọn giới tính' }]}
              >
                <Select>
                  <Option value="Nam">Nam</Option>
                  <Option value="Nữ">Nữ</Option>
                  <Option value="Khác">Khác</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Ngày sinh"
                name="birthDate"
              >
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Hạng thành viên"
                name="tierId"
                rules={[{ required: true, message: 'Vui lòng chọn hạng thành viên' }]}
              >
                <Select>
                  {customerTiers.filter(t => t.id !== 'all').map(tier => (
                    <Option key={tier.id} value={tier.id}>
                      {tier.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Địa chỉ"
            name="address"
            rules={[{ required: true, message: 'Vui lòng nhập địa chỉ' }]}
          >
            <Input.TextArea rows={2} placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố" />
          </Form.Item>

          <Form.Item
            label="Ghi chú"
            name="notes"
          >
            <Input.TextArea rows={3} placeholder="Ghi chú về sở thích, yêu cầu đặc biệt..." />
          </Form.Item>

          <div className="flex justify-end space-x-2">
            <Button onClick={() => setModalVisible(false)}>
              Hủy
            </Button>
            <Button type="primary" htmlType="submit">
              {editingCustomer ? 'Cập nhật' : 'Thêm mới'}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default CustomerListPage;
