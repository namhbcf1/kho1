// Order management page with full Vietnamese POS functionality
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
  Typography,
  Row,
  Col,
  Statistic,
  DatePicker,
  Descriptions,
  Tabs,
  message,
  Popover,
  Badge
} from 'antd';
import { 
  PlusOutlined, 
  ExportOutlined, 
  SearchOutlined,
  EyeOutlined,
  PrinterOutlined,
  CheckOutlined,
  CloseOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  UserOutlined,
  CalendarOutlined,
  ShoppingCartOutlined
} from '@ant-design/icons';
import { formatVND } from '../../utils/formatters/vndCurrency';
import { usePage } from '../../stores';
import dayjs from 'dayjs';

const { Search } = Input;
const { Option } = Select;
const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { RangePicker } = DatePicker;

// Mock order data with Vietnamese business logic
const mockOrders = [
  {
    id: 'DH001',
    orderNumber: 'DH-20240123-001',
    customerName: 'Nguyễn Văn Anh',
    customerPhone: '0901234567',
    items: [
      { name: 'Cà phê đen', quantity: 2, price: 20000, total: 40000 },
      { name: 'Bánh mì thịt', quantity: 1, price: 20000, total: 20000 }
    ],
    subtotal: 60000,
    discount: 5000,
    tax: 5500,
    total: 60500,
    paymentMethod: 'Tiền mặt',
    status: 'completed',
    orderDate: '2024-01-23T08:30:00',
    completedDate: '2024-01-23T08:35:00',
    cashier: 'Trần Thị B',
    notes: 'Khách yêu cầu ít đường'
  },
  {
    id: 'DH002',
    orderNumber: 'DH-20240123-002',
    customerName: 'Trần Thị Bình',
    customerPhone: '0987654321',
    items: [
      { name: 'Cà phê sữa', quantity: 1, price: 25000, total: 25000 },
      { name: 'Nước cam', quantity: 2, price: 15000, total: 30000 },
      { name: 'Bánh quy', quantity: 1, price: 12000, total: 12000 }
    ],
    subtotal: 67000,
    discount: 0,
    tax: 6700,
    total: 73700,
    paymentMethod: 'VNPay',
    status: 'processing',
    orderDate: '2024-01-23T09:15:00',
    completedDate: null,
    cashier: 'Lê Văn C',
    notes: 'Đơn hàng online'
  },
  {
    id: 'DH003',
    orderNumber: 'DH-20240123-003',
    customerName: 'Phạm Minh Dũng',
    customerPhone: '0912345678',
    items: [
      { name: 'Cà phê đen', quantity: 1, price: 20000, total: 20000 }
    ],
    subtotal: 20000,
    discount: 2000,
    tax: 1800,
    total: 19800,
    paymentMethod: 'MoMo',
    status: 'pending',
    orderDate: '2024-01-23T09:45:00',
    completedDate: null,
    cashier: 'Trần Thị B',
    notes: 'Khách VIP - ưu đãi 10%'
  },
  {
    id: 'DH004',
    orderNumber: 'DH-20240123-004',
    customerName: 'Hoàng Thị Linh',
    customerPhone: '0923456789',
    items: [
      { name: 'Bánh mì pate', quantity: 2, price: 18000, total: 36000 },
      { name: 'Nước ép táo', quantity: 1, price: 18000, total: 18000 }
    ],
    subtotal: 54000,
    discount: 0,
    tax: 5400,
    total: 59400,
    paymentMethod: 'Thẻ',
    status: 'cancelled',
    orderDate: '2024-01-23T10:20:00',
    completedDate: null,
    cashier: 'Lê Văn C',
    notes: 'Khách hủy do đổi ý kiến'
  },
  {
    id: 'DH005',
    orderNumber: 'DH-20240123-005',
    customerName: 'Vũ Văn Nam',
    customerPhone: '0934567890',
    items: [
      { name: 'Kẹo dẻ', quantity: 3, price: 8000, total: 24000 },
      { name: 'Nước cam', quantity: 1, price: 15000, total: 15000 }
    ],
    subtotal: 39000,
    discount: 0,
    tax: 3900,
    total: 42900,
    paymentMethod: 'ZaloPay',
    status: 'completed',
    orderDate: '2024-01-23T11:10:00',
    completedDate: '2024-01-23T11:15:00',
    cashier: 'Trần Thị B',
    notes: 'Khách mua cho con'
  }
];

const orderStatuses = [
  { id: 'all', name: 'Tất cả', color: '' },
  { id: 'pending', name: 'Chờ xử lý', color: 'orange' },
  { id: 'processing', name: 'Đang xử lý', color: 'blue' },
  { id: 'completed', name: 'Hoàn thành', color: 'green' },
  { id: 'cancelled', name: 'Đã hủy', color: 'red' },
];

const paymentMethods = [
  { id: 'all', name: 'Tất cả' },
  { id: 'cash', name: 'Tiền mặt' },
  { id: 'card', name: 'Thẻ' },
  { id: 'vnpay', name: 'VNPay' },
  { id: 'momo', name: 'MoMo' },
  { id: 'zalopay', name: 'ZaloPay' },
];

export const OrderListPage: React.FC = () => {
  const [orders, setOrders] = useState(mockOrders);
  const [filteredOrders, setFilteredOrders] = useState(mockOrders);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedPayment, setSelectedPayment] = useState('all');
  const [dateRange, setDateRange] = useState<any[]>([]);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const { setPageTitle, setBreadcrumbs } = usePage();

  useEffect(() => {
    setPageTitle('Quản lý đơn hàng');
    setBreadcrumbs([
      { title: 'Đơn hàng' },
    ]);
  }, [setPageTitle, setBreadcrumbs]);

  useEffect(() => {
    let filtered = orders;
    
    if (searchQuery) {
      filtered = filtered.filter(order => 
        order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customerPhone.includes(searchQuery)
      );
    }
    
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(order => order.status === selectedStatus);
    }
    
    if (selectedPayment !== 'all') {
      const paymentMap = {
        'cash': 'Tiền mặt',
        'card': 'Thẻ',
        'vnpay': 'VNPay',
        'momo': 'MoMo',
        'zalopay': 'ZaloPay'
      };
      filtered = filtered.filter(order => order.paymentMethod === paymentMap[selectedPayment]);
    }
    
    if (dateRange.length === 2) {
      filtered = filtered.filter(order => {
        const orderDate = dayjs(order.orderDate);
        return orderDate.isAfter(dateRange[0].startOf('day')) && 
               orderDate.isBefore(dateRange[1].endOf('day'));
      });
    }
    
    setFilteredOrders(filtered);
  }, [orders, searchQuery, selectedStatus, selectedPayment, dateRange]);

  const handleViewOrder = (order: any) => {
    setSelectedOrder(order);
    setDetailModalVisible(true);
  };

  const handleUpdateOrderStatus = (orderId: string, newStatus: string) => {
    setOrders(orders.map(order => 
      order.id === orderId 
        ? { 
            ...order, 
            status: newStatus,
            completedDate: newStatus === 'completed' ? new Date().toISOString() : order.completedDate
          } 
        : order
    ));
    
    const statusMessages = {
      'pending': 'Chuyển trạng thái thành "Chờ xử lý"',
      'processing': 'Chuyển trạng thái thành "Đang xử lý"',
      'completed': 'Hoàn thành đơn hàng thành công',
      'cancelled': 'Hủy đơn hàng thành công'
    };
    
    message.success(statusMessages[newStatus] || 'Cập nhật trạng thái thành công');
  };

  const getStatusActions = (record: any) => {
    const actions = [];
    
    if (record.status === 'pending') {
      actions.push(
        <Button 
          key="process"
          type="link" 
          icon={<ClockCircleOutlined />}
          onClick={() => handleUpdateOrderStatus(record.id, 'processing')}
        >
          Xử lý
        </Button>
      );
    }
    
    if (record.status === 'processing') {
      actions.push(
        <Button 
          key="complete"
          type="link" 
          icon={<CheckOutlined />}
          onClick={() => handleUpdateOrderStatus(record.id, 'completed')}
          className="text-green-600"
        >
          Hoàn thành
        </Button>
      );
    }
    
    if (['pending', 'processing'].includes(record.status)) {
      actions.push(
        <Button 
          key="cancel"
          type="link" 
          danger
          icon={<CloseOutlined />}
          onClick={() => {
            Modal.confirm({
              title: 'Xác nhận hủy đơn hàng',
              content: `Bạn có chắc muốn hủy đơn hàng ${record.orderNumber}?`,
              onOk: () => handleUpdateOrderStatus(record.id, 'cancelled'),
            });
          }}
        >
          Hủy
        </Button>
      );
    }
    
    return actions;
  };

  const columns = [
    {
      title: 'Mã đơn hàng',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      render: (text: string, record: any) => (
        <div>
          <Text strong className="text-blue-600">{text}</Text>
          <div className="text-xs text-gray-500">
            {dayjs(record.orderDate).format('DD/MM/YYYY HH:mm')}
          </div>
        </div>
      ),
    },
    {
      title: 'Khách hàng',
      dataIndex: 'customerName',
      key: 'customerName',
      render: (text: string, record: any) => (
        <div>
          <div className="font-medium">{text}</div>
          <div className="text-xs text-gray-500 flex items-center space-x-1">
            <span>{record.customerPhone}</span>
          </div>
        </div>
      ),
    },
    {
      title: 'Sản phẩm',
      dataIndex: 'items',
      key: 'items',
      render: (items: any[]) => (
        <Popover
          content={
            <div className="space-y-1">
              {items.map((item, index) => (
                <div key={index} className="text-sm">
                  {item.name} x{item.quantity} = {formatVND(item.total)}
                </div>
              ))}
            </div>
          }
          title="Chi tiết sản phẩm"
        >
          <Badge count={items.length} size="small">
            <Button type="link" icon={<ShoppingCartOutlined />}>
              {items.length} sản phẩm
            </Button>
          </Badge>
        </Popover>
      ),
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'total',
      key: 'total',
      render: (amount: number) => (
        <Text strong className="text-green-600">
          {formatVND(amount)}
        </Text>
      ),
    },
    {
      title: 'Thanh toán',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      render: (method: string) => (
        <Tag color="blue">{method}</Tag>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusConfig = orderStatuses.find(s => s.id === status);
        return (
          <Tag color={statusConfig?.color}>
            {statusConfig?.name}
          </Tag>
        );
      },
    },
    {
      title: 'Thu ngân',
      dataIndex: 'cashier',
      key: 'cashier',
      render: (cashier: string) => (
        <div className="flex items-center space-x-1">
          <UserOutlined className="text-gray-400" />
          <Text className="text-sm">{cashier}</Text>
        </div>
      ),
    },
    {
      title: 'Hành động',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleViewOrder(record)}
          >
            Xem
          </Button>
          <Button
            type="link"
            icon={<PrinterOutlined />}
          >
            In
          </Button>
          {getStatusActions(record)}
        </Space>
      ),
    },
  ];

  // Calculate statistics
  const totalOrders = orders.length;
  const totalRevenue = orders
    .filter(o => o.status === 'completed')
    .reduce((sum, o) => sum + o.total, 0);
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const completedOrders = orders.filter(o => o.status === 'completed').length;

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Tổng đơn hàng"
              value={totalOrders}
              prefix={<ShoppingCartOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Chờ xử lý"
              value={pendingOrders}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Hoàn thành"
              value={completedOrders}
              prefix={<CheckOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Doanh thu"
              value={totalRevenue}
              formatter={(value) => formatVND(Number(value))}
              prefix={<DollarOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Main Card */}
      <Card
        title="Danh sách đơn hàng"
        extra={
          <Space>
            <Button icon={<ExportOutlined />}>
              Xuất báo cáo
            </Button>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
            >
              Tạo đơn hàng
            </Button>
          </Space>
        }
      >
        {/* Filters */}
        <Row gutter={[16, 16]} className="mb-4">
          <Col xs={24} md={8}>
            <Search
              placeholder="Tìm kiếm mã đơn hàng, tên khách hoặc SĐT..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} md={4}>
            <Select
              style={{ width: '100%' }}
              value={selectedStatus}
              onChange={setSelectedStatus}
              placeholder="Trạng thái"
            >
              {orderStatuses.map(status => (
                <Option key={status.id} value={status.id}>
                  {status.name}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} md={4}>
            <Select
              style={{ width: '100%' }}
              value={selectedPayment}
              onChange={setSelectedPayment}
              placeholder="Thanh toán"
            >
              {paymentMethods.map(method => (
                <Option key={method.id} value={method.id}>
                  {method.name}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} md={8}>
            <RangePicker
              style={{ width: '100%' }}
              value={dateRange}
              onChange={setDateRange}
              format="DD/MM/YYYY"
              placeholder={['Ngày bắt đầu', 'Ngày kết thúc']}
            />
          </Col>
        </Row>

        {/* Order Table */}
        <Table
          columns={columns}
          dataSource={filteredOrders}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} của ${total} đơn hàng`,
          }}
        />
      </Card>

      {/* Order Detail Modal */}
      <Modal
        title={`Chi tiết đơn hàng ${selectedOrder?.orderNumber}`}
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="print" icon={<PrinterOutlined />}>
            In hóa đơn
          </Button>,
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            Đóng
          </Button>
        ]}
        width={700}
      >
        {selectedOrder && (
          <div className="space-y-4">
            <Descriptions bordered column={2}>
              <Descriptions.Item label="Mã đơn hàng">{selectedOrder.orderNumber}</Descriptions.Item>
              <Descriptions.Item label="Ngày tạo">
                {dayjs(selectedOrder.orderDate).format('DD/MM/YYYY HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="Khách hàng">{selectedOrder.customerName}</Descriptions.Item>
              <Descriptions.Item label="Số điện thoại">{selectedOrder.customerPhone}</Descriptions.Item>
              <Descriptions.Item label="Thu ngân">{selectedOrder.cashier}</Descriptions.Item>
              <Descriptions.Item label="Thanh toán">{selectedOrder.paymentMethod}</Descriptions.Item>
              <Descriptions.Item label="Trạng thái" span={2}>
                <Tag color={orderStatuses.find(s => s.id === selectedOrder.status)?.color}>
                  {orderStatuses.find(s => s.id === selectedOrder.status)?.name}
                </Tag>
              </Descriptions.Item>
              {selectedOrder.notes && (
                <Descriptions.Item label="Ghi chú" span={2}>
                  {selectedOrder.notes}
                </Descriptions.Item>
              )}
            </Descriptions>

            <Card title="Sản phẩm" size="small">
              <Table
                dataSource={selectedOrder.items}
                pagination={false}
                size="small"
                columns={[
                  {
                    title: 'Tên sản phẩm',
                    dataIndex: 'name',
                    key: 'name',
                  },
                  {
                    title: 'Số lượng',
                    dataIndex: 'quantity',
                    key: 'quantity',
                    align: 'center',
                  },
                  {
                    title: 'Giá',
                    dataIndex: 'price',
                    key: 'price',
                    render: (price: number) => formatVND(price),
                    align: 'right',
                  },
                  {
                    title: 'Thành tiền',
                    dataIndex: 'total',
                    key: 'total',
                    render: (total: number) => formatVND(total),
                    align: 'right',
                  },
                ]}
              />
              
              <div className="mt-4 space-y-2">
                <div className="flex justify-between">
                  <Text>Tạm tính:</Text>
                  <Text>{formatVND(selectedOrder.subtotal)}</Text>
                </div>
                {selectedOrder.discount > 0 && (
                  <div className="flex justify-between">
                    <Text>Giảm giá:</Text>
                    <Text className="text-green-600">-{formatVND(selectedOrder.discount)}</Text>
                  </div>
                )}
                <div className="flex justify-between">
                  <Text>Thuế VAT (10%):</Text>
                  <Text>{formatVND(selectedOrder.tax)}</Text>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <Title level={4}>Tổng cộng:</Title>
                  <Title level={4} className="text-blue-600">
                    {formatVND(selectedOrder.total)}
                  </Title>
                </div>
              </div>
            </Card>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default OrderListPage;
