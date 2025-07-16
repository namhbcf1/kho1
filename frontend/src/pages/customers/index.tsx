import React, { useState, useMemo } from 'react';
import { 
  Table, Button, Input, Tag, Typography, Card, Modal, Form, 
  Space, Popconfirm, message, Row, Col, Select, DatePicker,
  Statistic, Grid, Avatar, Progress, Tooltip, Badge
} from 'antd';
import { 
  UserAddOutlined, SearchOutlined, EditOutlined, DeleteOutlined,
  PhoneOutlined, MailOutlined, CalendarOutlined, GiftOutlined,
  TrophyOutlined, EyeOutlined, UserOutlined, CrownOutlined
} from '@ant-design/icons';
import { useCustomerStore, type Customer } from '../../stores/useCustomerStore';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { useBreakpoint } = Grid;

export default function CustomersPage() {
  const screens = useBreakpoint();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [form] = Form.useForm();

  const {
    customers,
    loyaltyTiers,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    getCustomersByTier,
    getTopCustomers,
    addLoyaltyPoints,
    redeemLoyaltyPoints,
    loading
  } = useCustomerStore();

  const filteredCustomers = useMemo(() => {
    let filtered = customers;

    if (selectedTier !== 'all') {
      filtered = filtered.filter(c => c.loyaltyTier === selectedTier);
    }

    if (searchTerm) {
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone?.includes(searchTerm) ||
        c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [customers, selectedTier, searchTerm]);

  const topCustomers = getTopCustomers(5);
  const tierStats = loyaltyTiers.map(tier => ({
    ...tier,
    count: getCustomersByTier(tier.id).length
  }));

  const handleAddCustomer = () => {
    setEditingCustomer(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    form.setFieldsValue({
      ...customer,
      joinDate: customer.joinDate ? dayjs(customer.joinDate) : undefined
    });
    setModalVisible(true);
  };

  const handleDeleteCustomer = (id: string) => {
    deleteCustomer(id);
    message.success('Đã xóa khách hàng thành công');
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const submitData = {
        ...values,
        joinDate: values.joinDate?.toISOString()
      };
      
      if (editingCustomer) {
        updateCustomer(editingCustomer.id, submitData);
        message.success('Cập nhật khách hàng thành công');
      } else {
        addCustomer(submitData);
        message.success('Thêm khách hàng thành công');
      }
      
      setModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const handleLoyaltyPointsAction = (customerId: string, action: 'add' | 'redeem', points: number) => {
    if (action === 'add') {
      addLoyaltyPoints(customerId, points);
      message.success(`Đã thêm ${points} điểm cho khách hàng`);
    } else {
      const success = redeemLoyaltyPoints(customerId, points);
      if (success) {
        message.success(`Đã sử dụng ${points} điểm`);
      } else {
        message.error('Không đủ điểm để sử dụng');
      }
    }
  };

  const getTierColor = (tier: string) => {
    const tierData = loyaltyTiers.find(t => t.id === tier);
    const colors = {
      bronze: '#cd7f32',
      silver: '#c0c0c0', 
      gold: '#ffd700',
      platinum: '#e5e4e2',
      diamond: '#b9f2ff'
    };
    return colors[tier as keyof typeof colors] || '#1890ff';
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'diamond': return <CrownOutlined />;
      case 'platinum': return <TrophyOutlined />;
      default: return <GiftOutlined />;
    }
  };

  const columns = [
    {
      title: 'Khách hàng',
      key: 'customer',
      width: screens.lg ? 250 : 200,
      render: (record: Customer) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Avatar 
            size="large" 
            icon={<UserOutlined />}
            style={{ 
              backgroundColor: getTierColor(record.loyaltyTier),
              marginRight: 12 
            }}
          />
          <div>
            <Text strong style={{ display: 'block', fontSize: '14px' }}>
              {record.name}
            </Text>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.id}
            </Text>
            {record.phone && (
              <div style={{ fontSize: '12px', color: '#666' }}>
                <PhoneOutlined style={{ marginRight: 4 }} />
                {record.phone}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      title: 'Hạng thành viên',
      dataIndex: 'loyaltyTier',
      key: 'loyaltyTier',
      width: 140,
      render: (tier: string) => {
        const tierData = loyaltyTiers.find(t => t.id === tier);
        return (
          <Tag 
            color={getTierColor(tier)}
            icon={getTierIcon(tier)}
            style={{ fontWeight: 'bold' }}
          >
            {tierData?.name || tier}
          </Tag>
        );
      },
      filters: loyaltyTiers.map(tier => ({ text: tier.name, value: tier.id })),
      onFilter: (value: any, record: Customer) => record.loyaltyTier === value,
    },
    {
      title: 'Điểm tích lũy',
      dataIndex: 'loyaltyPoints',
      key: 'loyaltyPoints',
      width: 120,
      render: (points: number) => (
        <Tooltip title="Điểm tích lũy hiện tại">
          <Badge 
            count={points} 
            style={{ backgroundColor: '#52c41a' }}
            overflowCount={99999}
          />
        </Tooltip>
      ),
      sorter: (a: Customer, b: Customer) => a.loyaltyPoints - b.loyaltyPoints,
    },
    {
      title: 'Tổng chi tiêu',
      dataIndex: 'totalSpent',
      key: 'totalSpent',
      width: 130,
      render: (amount: number) => (
        <Text strong style={{ color: '#1890ff' }}>
          {amount.toLocaleString()}₫
        </Text>
      ),
      sorter: (a: Customer, b: Customer) => a.totalSpent - b.totalSpent,
    },
    {
      title: 'Lần cuối mua',
      dataIndex: 'lastVisit',
      key: 'lastVisit',
      width: 120,
      render: (date: string) => date ? dayjs(date).format('DD/MM/YYYY') : '-',
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 140,
      render: (record: Customer) => (
        <Space size="small">
          <Tooltip title="Xem chi tiết">
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => {
                Modal.info({
                  title: `Thông tin khách hàng: ${record.name}`,
                  width: 600,
                  content: (
                    <div style={{ marginTop: 16 }}>
                      <Row gutter={[16, 16]}>
                        <Col span={12}>
                          <p><strong>Mã KH:</strong> {record.id}</p>
                          <p><strong>Tên:</strong> {record.name}</p>
                          <p><strong>SĐT:</strong> {record.phone || 'Chưa có'}</p>
                          <p><strong>Email:</strong> {record.email || 'Chưa có'}</p>
                        </Col>
                        <Col span={12}>
                          <p><strong>Hạng:</strong> {loyaltyTiers.find(t => t.id === record.loyaltyTier)?.name}</p>
                          <p><strong>Điểm:</strong> {record.loyaltyPoints.toLocaleString()}</p>
                          <p><strong>Tổng mua:</strong> {record.totalSpent.toLocaleString()}₫</p>
                          <p><strong>Ngày tham gia:</strong> {dayjs(record.joinDate).format('DD/MM/YYYY')}</p>
                        </Col>
                      </Row>
                      {record.address && (
                        <p><strong>Địa chỉ:</strong> {record.address}</p>
                      )}
                      <div style={{ marginTop: 16 }}>
                        <Text strong>Quyền lợi thành viên:</Text>
                        <ul>
                          {loyaltyTiers.find(t => t.id === record.loyaltyTier)?.benefits.map((benefit, index) => (
                            <li key={index}>{benefit}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ),
                });
              }}
            />
          </Tooltip>
          <Tooltip title="Sửa thông tin">
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEditCustomer(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Xóa khách hàng này?"
            description="Thao tác này không thể hoàn tác"
            onConfirm={() => handleDeleteCustomer(record.id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="customers-page" style={{ padding: 0 }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 24,
        flexWrap: 'wrap',
        gap: 16
      }}>
        <Title level={2} style={{ margin: 0, fontSize: 'clamp(1.25rem, 3vw, 1.75rem)' }}>
          Quản lý khách hàng
        </Title>
        <Button type="primary" icon={<UserAddOutlined />} onClick={handleAddCustomer}>
          Thêm khách hàng
        </Button>
      </div>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tổng khách hàng"
              value={customers.length}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Khách VIP (Gold+)"
              value={getCustomersByTier('gold').length + getCustomersByTier('platinum').length + getCustomersByTier('diamond').length}
              prefix={<CrownOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tổng điểm tích lũy"
              value={customers.reduce((sum, c) => sum + c.loyaltyPoints, 0)}
              prefix={<GiftOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tổng chi tiêu"
              value={customers.reduce((sum, c) => sum + c.totalSpent, 0)}
              precision={0}
              prefix="₫"
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Tier Distribution */}
      <Card title="Phân bố hạng thành viên" style={{ marginBottom: 24 }}>
        <Row gutter={16}>
          {tierStats.map(tier => (
            <Col xs={12} sm={8} lg={4} key={tier.id}>
              <div style={{ textAlign: 'center', padding: '16px 8px' }}>
                <div style={{ fontSize: '24px', color: getTierColor(tier.id) }}>
                  {getTierIcon(tier.id)}
                </div>
                <div style={{ fontWeight: 'bold', margin: '8px 0' }}>{tier.name}</div>
                <div style={{ fontSize: '20px', color: '#1890ff' }}>{tier.count}</div>
                <Progress 
                  percent={(tier.count / customers.length) * 100} 
                  size="small" 
                  strokeColor={getTierColor(tier.id)}
                  showInfo={false}
                />
              </div>
            </Col>
          ))}
        </Row>
      </Card>

      <Card>
        {/* Search and Filter Controls */}
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} lg={8}>
            <Input
              placeholder="Tìm kiếm khách hàng..."
              prefix={<SearchOutlined />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Select
              placeholder="Chọn hạng thành viên"
              value={selectedTier}
              onChange={setSelectedTier}
              style={{ width: '100%' }}
              allowClear
            >
              <Option value="all">Tất cả hạng</Option>
              {loyaltyTiers.map(tier => (
                <Option key={tier.id} value={tier.id}>{tier.name}</Option>
              ))}
            </Select>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={filteredCustomers}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} trên ${total} khách hàng`,
          }}
          scroll={{ x: 1000 }}
          size={screens.lg ? 'middle' : 'small'}
        />
      </Card>

      {/* Add/Edit Customer Modal */}
      <Modal
        title={editingCustomer ? 'Sửa thông tin khách hàng' : 'Thêm khách hàng mới'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSubmit}
        width={screens.lg ? 600 : '95%'}
        okText={editingCustomer ? 'Cập nhật' : 'Thêm'}
        cancelText="Hủy"
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            loyaltyTier: 'bronze',
            loyaltyPoints: 0,
            totalSpent: 0,
          }}
        >
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="name"
                label="Họ và tên"
                rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
              >
                <Input placeholder="Nhập họ và tên" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="phone"
                label="Số điện thoại"
                rules={[
                  { pattern: /^[0-9]{10,11}$/, message: 'Số điện thoại không hợp lệ' }
                ]}
              >
                <Input placeholder="Nhập số điện thoại" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { type: 'email', message: 'Email không hợp lệ' }
                ]}
              >
                <Input placeholder="Nhập email" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="loyaltyTier"
                label="Hạng thành viên"
              >
                <Select placeholder="Chọn hạng thành viên">
                  {loyaltyTiers.map(tier => (
                    <Option key={tier.id} value={tier.id}>{tier.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="address"
            label="Địa chỉ"
          >
            <Input.TextArea
              placeholder="Nhập địa chỉ"
              rows={2}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}