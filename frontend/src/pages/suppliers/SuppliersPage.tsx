import React, { useState } from 'react';
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
  Rate,
  Progress,
  Timeline,
  Tabs
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
  ShopOutlined,
  StarOutlined,
  TruckOutlined,
  DollarOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { formatVND } from '../../utils/formatters/vietnameseCurrency';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;
const { TabPane } = Tabs;

interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  taxCode: string;
  bankAccount: string;
  status: 'active' | 'inactive';
  rating: number;
  totalOrders: number;
  totalValue: number;
  lastOrder: string;
  joinDate: string;
  category: string;
  paymentTerms: string;
  deliveryTime: number; // days
  notes?: string;
}

const SuppliersPage: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([
    {
      id: '1',
      name: 'Apple Vietnam Co., Ltd',
      contactPerson: 'Nguyễn Văn A',
      phone: '028-3825-6789',
      email: 'contact@apple.vn',
      address: 'Lầu 10, Tòa nhà Vincom Center, Quận 1, TP.HCM',
      taxCode: '0123456789',
      bankAccount: '1234567890 - Vietcombank',
      status: 'active',
      rating: 4.8,
      totalOrders: 45,
      totalValue: 2500000000,
      lastOrder: '2024-07-15',
      joinDate: '2023-01-15',
      category: 'Điện tử',
      paymentTerms: '30 ngày',
      deliveryTime: 5
    },
    {
      id: '2',
      name: 'Samsung Electronics Vietnam',
      contactPerson: 'Trần Thị B',
      phone: '028-3825-1234',
      email: 'business@samsung.vn',
      address: 'Tòa nhà HITC, Quận 3, TP.HCM',
      taxCode: '0987654321',
      bankAccount: '0987654321 - Techcombank',
      status: 'active',
      rating: 4.6,
      totalOrders: 38,
      totalValue: 1800000000,
      lastOrder: '2024-07-12',
      joinDate: '2023-03-20',
      category: 'Điện tử',
      paymentTerms: '45 ngày',
      deliveryTime: 7
    },
    {
      id: '3',
      name: 'Phụ Kiện Thông Minh JSC',
      contactPerson: 'Lê Văn C',
      phone: '028-3825-5678',
      email: 'info@accessory.vn',
      address: 'Số 123, Đường Nguyễn Văn Cừ, Quận 5, TP.HCM',
      taxCode: '0111222333',
      bankAccount: '1112223333 - BIDV',
      status: 'active',
      rating: 4.2,
      totalOrders: 67,
      totalValue: 850000000,
      lastOrder: '2024-07-10',
      joinDate: '2023-06-10',
      category: 'Phụ kiện',
      paymentTerms: '15 ngày',
      deliveryTime: 3
    },
    {
      id: '4',
      name: 'Laptop World Distribution',
      contactPerson: 'Phạm Thị D',
      phone: '028-3825-9999',
      email: 'sales@laptopworld.vn',
      address: 'Tầng 5, Tòa nhà ABC, Quận 7, TP.HCM',
      taxCode: '0444555666',
      bankAccount: '4445556666 - ACB',
      status: 'inactive',
      rating: 3.8,
      totalOrders: 22,
      totalValue: 650000000,
      lastOrder: '2024-06-25',
      joinDate: '2023-08-15',
      category: 'Máy tính',
      paymentTerms: '30 ngày',
      deliveryTime: 10
    }
  ]);

  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [form] = Form.useForm();

  const handleAddSupplier = () => {
    setEditingSupplier(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEditSupplier = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    form.setFieldsValue(supplier);
    setModalVisible(true);
  };

  const handleViewSupplier = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setDetailModalVisible(true);
  };

  const handleDeleteSupplier = (supplierId: string) => {
    setSuppliers(suppliers.filter(s => s.id !== supplierId));
    notification.success({
      message: 'Xóa nhà cung cấp',
      description: 'Nhà cung cấp đã được xóa thành công'
    });
  };

  const handleSubmit = (values: any) => {
    if (editingSupplier) {
      setSuppliers(suppliers.map(s => 
        s.id === editingSupplier.id 
          ? { ...editingSupplier, ...values }
          : s
      ));
      notification.success({
        message: 'Cập nhật nhà cung cấp',
        description: 'Thông tin nhà cung cấp đã được cập nhật'
      });
    } else {
      const newSupplier: Supplier = {
        id: Date.now().toString(),
        ...values,
        totalOrders: 0,
        totalValue: 0,
        rating: 0,
        joinDate: new Date().toISOString().split('T')[0],
        lastOrder: ''
      };
      setSuppliers([...suppliers, newSupplier]);
      notification.success({
        message: 'Thêm nhà cung cấp',
        description: 'Nhà cung cấp mới đã được thêm thành công'
      });
    }
    setModalVisible(false);
    form.resetFields();
  };

  const getStatusColor = (status: string) => {
    return status === 'active' ? 'success' : 'error';
  };

  const getStatusText = (status: string) => {
    return status === 'active' ? 'Hoạt động' : 'Ngừng hoạt động';
  };

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.phone.includes(searchTerm) ||
    supplier.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalSuppliers = suppliers.length;
  const activeSuppliers = suppliers.filter(s => s.status === 'active').length;
  const totalValue = suppliers.reduce((sum, s) => sum + s.totalValue, 0);
  const avgRating = suppliers.reduce((sum, s) => sum + s.rating, 0) / suppliers.length || 0;

  const columns = [
    {
      title: 'Nhà cung cấp',
      key: 'supplier',
      render: (record: Supplier) => (
        <Space>
          <Avatar icon={<ShopOutlined />} style={{ backgroundColor: '#1890ff' }} />
          <div>
            <div style={{ fontWeight: 600 }}>{record.name}</div>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.contactPerson} • <PhoneOutlined /> {record.phone}
            </Text>
          </div>
        </Space>
      )
    },
    {
      title: 'Thông tin',
      key: 'info',
      render: (record: Supplier) => (
        <div>
          <div style={{ fontSize: '13px' }}>
            <MailOutlined /> {record.email}
          </div>
          <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
            MST: {record.taxCode}
          </div>
        </div>
      )
    },
    {
      title: 'Danh mục',
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => (
        <Tag color="blue">{category}</Tag>
      )
    },
    {
      title: 'Đánh giá',
      dataIndex: 'rating',
      key: 'rating',
      render: (rating: number) => (
        <div>
          <Rate disabled defaultValue={rating} style={{ fontSize: '14px' }} />
          <div style={{ fontSize: '12px', color: '#666' }}>
            {rating.toFixed(1)}/5.0
          </div>
        </div>
      )
    },
    {
      title: 'Đơn hàng',
      key: 'orders',
      render: (record: Supplier) => (
        <div>
          <Text strong style={{ color: '#1890ff' }}>{record.totalOrders}</Text>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {formatVND(record.totalValue)}
          </div>
        </div>
      )
    },
    {
      title: 'Thời gian giao',
      dataIndex: 'deliveryTime',
      key: 'deliveryTime',
      render: (days: number) => (
        <div>
          <TruckOutlined style={{ color: '#52c41a' }} />
          {' '}{days} ngày
        </div>
      )
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)} icon={<CheckCircleOutlined />}>
          {getStatusText(status)}
        </Tag>
      )
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (record: Supplier) => (
        <Space>
          <Tooltip title="Xem chi tiết">
            <Button
              icon={<SearchOutlined />}
              size="small"
              onClick={() => handleViewSupplier(record)}
            />
          </Tooltip>
          <Tooltip title="Chỉnh sửa">
            <Button
              icon={<EditOutlined />}
              size="small"
              onClick={() => handleEditSupplier(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Xóa nhà cung cấp"
            description="Bạn có chắc chắn muốn xóa nhà cung cấp này?"
            onConfirm={() => handleDeleteSupplier(record.id)}
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

  // Mock order history
  const orderHistory = [
    {
      id: 'PO-001',
      date: '2024-07-15',
      value: 150000000,
      status: 'completed',
      items: 25
    },
    {
      id: 'PO-002',
      date: '2024-07-10',
      value: 85000000,
      status: 'completed',
      items: 15
    },
    {
      id: 'PO-003',
      date: '2024-07-05',
      value: 220000000,
      status: 'pending',
      items: 40
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>🏪 Quản lý Nhà Cung Cấp</Title>
      
      {/* Statistics */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Tổng nhà cung cấp"
              value={totalSuppliers}
              prefix={<ShopOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Đang hoạt động"
              value={activeSuppliers}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Tổng giá trị"
              value={formatVND(totalValue)}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Đánh giá TB"
              value={avgRating.toFixed(1)}
              prefix={<StarOutlined />}
              suffix="/ 5.0"
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Main Content */}
      <Card>
        {/* Toolbar */}
        <Row justify="space-between" align="middle" style={{ marginBottom: '16px' }}>
          <Col>
            <Search
              placeholder="Tìm kiếm nhà cung cấp..."
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
              onClick={handleAddSupplier}
            >
              Thêm nhà cung cấp
            </Button>
          </Col>
        </Row>

        {/* Suppliers Table */}
        <Table
          columns={columns}
          dataSource={filteredSuppliers}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} của ${total} nhà cung cấp`
          }}
        />
      </Card>

      {/* Add/Edit Supplier Modal */}
      <Modal
        title={editingSupplier ? 'Chỉnh sửa nhà cung cấp' : 'Thêm nhà cung cấp mới'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Tên nhà cung cấp"
                rules={[{ required: true, message: 'Vui lòng nhập tên nhà cung cấp!' }]}
              >
                <Input placeholder="Nhập tên công ty" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="contactPerson"
                label="Người liên hệ"
                rules={[{ required: true, message: 'Vui lòng nhập tên người liên hệ!' }]}
              >
                <Input placeholder="Nhập tên người liên hệ" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="phone"
                label="Số điện thoại"
                rules={[{ required: true, message: 'Vui lòng nhập số điện thoại!' }]}
              >
                <Input placeholder="028-xxxx-xxxx" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: 'Vui lòng nhập email!' },
                  { type: 'email', message: 'Email không hợp lệ!' }
                ]}
              >
                <Input placeholder="example@company.com" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="address"
            label="Địa chỉ"
            rules={[{ required: true, message: 'Vui lòng nhập địa chỉ!' }]}
          >
            <Input.TextArea rows={2} placeholder="Nhập địa chỉ đầy đủ" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="taxCode"
                label="Mã số thuế"
                rules={[{ required: true, message: 'Vui lòng nhập mã số thuế!' }]}
              >
                <Input placeholder="0123456789" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="category"
                label="Danh mục"
                rules={[{ required: true, message: 'Vui lòng chọn danh mục!' }]}
              >
                <Select placeholder="Chọn danh mục sản phẩm">
                  <Option value="Điện tử">Điện tử</Option>
                  <Option value="Máy tính">Máy tính</Option>
                  <Option value="Phụ kiện">Phụ kiện</Option>
                  <Option value="Khác">Khác</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="paymentTerms"
                label="Điều kiện thanh toán"
              >
                <Select placeholder="Chọn điều kiện thanh toán">
                  <Option value="15 ngày">15 ngày</Option>
                  <Option value="30 ngày">30 ngày</Option>
                  <Option value="45 ngày">45 ngày</Option>
                  <Option value="60 ngày">60 ngày</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="deliveryTime"
                label="Thời gian giao hàng (ngày)"
              >
                <Select placeholder="Thời gian giao hàng">
                  <Option value={1}>1 ngày</Option>
                  <Option value={3}>3 ngày</Option>
                  <Option value={5}>5 ngày</Option>
                  <Option value={7}>7 ngày</Option>
                  <Option value={10}>10 ngày</Option>
                  <Option value={14}>14 ngày</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="bankAccount"
            label="Tài khoản ngân hàng"
          >
            <Input placeholder="Số tài khoản - Tên ngân hàng" />
          </Form.Item>

          <Form.Item
            name="notes"
            label="Ghi chú"
          >
            <Input.TextArea rows={3} placeholder="Ghi chú thêm về nhà cung cấp..." />
          </Form.Item>

          <Form.Item
            name="status"
            label="Trạng thái"
            initialValue="active"
          >
            <Select>
              <Option value="active">Hoạt động</Option>
              <Option value="inactive">Ngừng hoạt động</Option>
            </Select>
          </Form.Item>

          <Divider />

          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button onClick={() => setModalVisible(false)}>
              Hủy
            </Button>
            <Button type="primary" htmlType="submit">
              {editingSupplier ? 'Cập nhật' : 'Thêm mới'}
            </Button>
          </Space>
        </Form>
      </Modal>

      {/* Supplier Detail Modal */}
      <Modal
        title="Chi tiết nhà cung cấp"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            Đóng
          </Button>,
          <Button key="edit" type="primary" onClick={() => {
            setDetailModalVisible(false);
            if (selectedSupplier) handleEditSupplier(selectedSupplier);
          }}>
            Chỉnh sửa
          </Button>
        ]}
        width={800}
      >
        {selectedSupplier && (
          <div>
            <Row gutter={24}>
              <Col span={16}>
                <div style={{ marginBottom: '24px' }}>
                  <Title level={4}>{selectedSupplier.name}</Title>
                  <Text type="secondary">{selectedSupplier.category}</Text>
                  <div style={{ marginTop: '8px' }}>
                    <Tag color={getStatusColor(selectedSupplier.status)}>
                      {getStatusText(selectedSupplier.status)}
                    </Tag>
                  </div>
                </div>

                <Tabs defaultActiveKey="1">
                  <TabPane tab="Thông tin cơ bản" key="1">
                    <Row gutter={[16, 16]}>
                      <Col span={12}>
                        <Text strong>Người liên hệ:</Text>
                        <div>{selectedSupplier.contactPerson}</div>
                      </Col>
                      <Col span={12}>
                        <Text strong>Điện thoại:</Text>
                        <div>{selectedSupplier.phone}</div>
                      </Col>
                      <Col span={12}>
                        <Text strong>Email:</Text>
                        <div>{selectedSupplier.email}</div>
                      </Col>
                      <Col span={12}>
                        <Text strong>Mã số thuế:</Text>
                        <div>{selectedSupplier.taxCode}</div>
                      </Col>
                      <Col span={24}>
                        <Text strong>Địa chỉ:</Text>
                        <div>{selectedSupplier.address}</div>
                      </Col>
                      <Col span={12}>
                        <Text strong>Điều kiện thanh toán:</Text>
                        <div>{selectedSupplier.paymentTerms}</div>
                      </Col>
                      <Col span={12}>
                        <Text strong>Thời gian giao hàng:</Text>
                        <div>{selectedSupplier.deliveryTime} ngày</div>
                      </Col>
                    </Row>
                  </TabPane>

                  <TabPane tab="Lịch sử đơn hàng" key="2">
                    <Timeline>
                      {orderHistory.map(order => (
                        <Timeline.Item 
                          key={order.id}
                          color={order.status === 'completed' ? 'green' : 'blue'}
                        >
                          <div>
                            <Text strong>{order.id}</Text>
                            <Tag color={order.status === 'completed' ? 'success' : 'processing'} style={{ marginLeft: 8 }}>
                              {order.status === 'completed' ? 'Hoàn thành' : 'Đang xử lý'}
                            </Tag>
                          </div>
                          <div style={{ marginTop: 4 }}>
                            <Text type="secondary">{dayjs(order.date).format('DD/MM/YYYY')}</Text>
                            <br />
                            <Text>Giá trị: {formatVND(order.value)}</Text>
                            <br />
                            <Text>Số lượng SP: {order.items}</Text>
                          </div>
                        </Timeline.Item>
                      ))}
                    </Timeline>
                  </TabPane>
                </Tabs>
              </Col>

              <Col span={8}>
                <Card size="small" title="Thống kê">
                  <div style={{ marginBottom: '16px' }}>
                    <Text strong>Đánh giá:</Text>
                    <div>
                      <Rate disabled defaultValue={selectedSupplier.rating} style={{ fontSize: '16px' }} />
                      <Text style={{ marginLeft: 8 }}>{selectedSupplier.rating}/5.0</Text>
                    </div>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <Text strong>Tổng đơn hàng:</Text>
                    <div style={{ fontSize: '20px', color: '#1890ff' }}>
                      {selectedSupplier.totalOrders}
                    </div>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <Text strong>Tổng giá trị:</Text>
                    <div style={{ fontSize: '16px', color: '#52c41a' }}>
                      {formatVND(selectedSupplier.totalValue)}
                    </div>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <Text strong>Đơn hàng cuối:</Text>
                    <div>{dayjs(selectedSupplier.lastOrder).format('DD/MM/YYYY')}</div>
                  </div>

                  <div>
                    <Text strong>Tham gia từ:</Text>
                    <div>{dayjs(selectedSupplier.joinDate).format('DD/MM/YYYY')}</div>
                  </div>
                </Card>
              </Col>
            </Row>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SuppliersPage;