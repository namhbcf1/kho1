// Modern Order Management with timeline, status tracking, and beautiful UI
import React, { useState, useEffect, useMemo } from 'react';
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
  Timeline,
  Tabs,
  Steps,
  Progress,
  Badge,
  Avatar,
  List,
  Divider,
  Drawer,
  Form,
  InputNumber,
  Switch,
  Radio,
  Tooltip,
  Popconfirm,
  Empty,
  Spin,
  Alert,
  Descriptions,
  Rate,
  Comment,
  message,
  notification
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
  ShoppingCartOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  FilterOutlined,
  DownloadOutlined,
  ShareAltOutlined,
  SettingOutlined,
  MoreOutlined,
  CreditCardOutlined,
  WalletOutlined,
  BankOutlined,
  MobileOutlined,
  TruckOutlined,
  PhoneOutlined,
  MailOutlined,
  EnvironmentOutlined,
  StarOutlined,
  HeartOutlined,
  GiftOutlined,
  FireOutlined,
  ThunderboltOutlined,
  TrophyOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  HistoryOutlined,
  FileTextOutlined,
  PaperClipOutlined,
  TeamOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  LineChartOutlined,
  BarChartOutlined,
  PieChartOutlined,
  DashboardOutlined,
  TagOutlined,
  BulbOutlined,
  LockOutlined,
  UnlockOutlined,
  SafetyOutlined,
  BellOutlined,
  NotificationOutlined,
  MessageOutlined,
  CommentOutlined,
  LikeOutlined,
  DislikeOutlined,
  RetweetOutlined,
  MenuOutlined
} from '@ant-design/icons';
import { LineChart, Line, AreaChart, Area, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, BarChart, Bar } from 'recharts';
import { formatVND } from '../../utils/formatters/vndCurrency';
import { usePage } from '../../stores';
import { useDebounce } from '../../hooks/useDebounce';
import dayjs from 'dayjs';
import './ModernOrderPage.css';

const { Search } = Input;
const { Option } = Select;
const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { RangePicker } = DatePicker;
const { Step } = Steps;

// Order status configuration
const orderStatuses = {
  pending: {
    name: 'Chờ xác nhận',
    color: '#faad14',
    icon: <ClockCircleOutlined />,
    description: 'Đơn hàng đang chờ xác nhận'
  },
  confirmed: {
    name: 'Đã xác nhận',
    color: '#1890ff',
    icon: <CheckCircleOutlined />,
    description: 'Đơn hàng đã được xác nhận'
  },
  preparing: {
    name: 'Đang chuẩn bị',
    color: '#722ed1',
    icon: <SyncOutlined />,
    description: 'Đang chuẩn bị hàng hóa'
  },
  shipping: {
    name: 'Đang giao',
    color: '#13c2c2',
    icon: <TruckOutlined />,
    description: 'Đơn hàng đang được giao'
  },
  delivered: {
    name: 'Đã giao',
    color: '#52c41a',
    icon: <CheckOutlined />,
    description: 'Đã giao hàng thành công'
  },
  cancelled: {
    name: 'Đã hủy',
    color: '#ff4d4f',
    icon: <CloseOutlined />,
    description: 'Đơn hàng đã bị hủy'
  },
  refunded: {
    name: 'Đã hoàn tiền',
    color: '#8c8c8c',
    icon: <DollarOutlined />,
    description: 'Đã hoàn tiền cho khách hàng'
  }
};

// Payment methods
const paymentMethods = {
  cash: { name: 'Tiền mặt', icon: <DollarOutlined />, color: '#52c41a' },
  card: { name: 'Thẻ tín dụng', icon: <CreditCardOutlined />, color: '#1890ff' },
  momo: { name: 'MoMo', icon: <MobileOutlined />, color: '#a0336e' },
  vnpay: { name: 'VNPay', icon: <WalletOutlined />, color: '#003d82' },
  bank: { name: 'Chuyển khoản', icon: <BankOutlined />, color: '#722ed1' }
};

// Mock order data
const mockOrders = [
  {
    id: 'ORD-2024-001',
    orderNumber: '#001',
    customerName: 'Nguyễn Văn Anh',
    customerPhone: '0901234567',
    customerEmail: 'nguyenvananh@gmail.com',
    customerAvatar: 'https://i.pravatar.cc/150?img=1',
    customerTier: 'Vàng',
    status: 'delivered',
    paymentMethod: 'card',
    paymentStatus: 'paid',
    total: 450000,
    subtotal: 400000,
    discount: 50000,
    tax: 40000,
    shippingFee: 30000,
    items: [
      { id: 1, name: 'Cà phê đen', quantity: 2, price: 25000, total: 50000 },
      { id: 2, name: 'Bánh croissant', quantity: 1, price: 35000, total: 35000 },
      { id: 3, name: 'Trà sữa', quantity: 3, price: 45000, total: 135000 }
    ],
    createdAt: '2024-01-20T08:30:00',
    updatedAt: '2024-01-20T14:45:00',
    deliveredAt: '2024-01-20T14:45:00',
    shippingAddress: 'Số 123, Đường Lê Lợi, Phường Bến Nghé, Quận 1, TP.HCM',
    notes: 'Giao hàng buổi chiều',
    rating: 5,
    review: 'Dịch vụ tuyệt vời, đồ uống ngon',
    timeline: [
      { time: '2024-01-20T08:30:00', status: 'pending', description: 'Đơn hàng được tạo' },
      { time: '2024-01-20T08:45:00', status: 'confirmed', description: 'Đã xác nhận đơn hàng' },
      { time: '2024-01-20T09:00:00', status: 'preparing', description: 'Bắt đầu chuẩn bị' },
      { time: '2024-01-20T13:30:00', status: 'shipping', description: 'Bắt đầu giao hàng' },
      { time: '2024-01-20T14:45:00', status: 'delivered', description: 'Đã giao thành công' }
    ]
  },
  {
    id: 'ORD-2024-002',
    orderNumber: '#002',
    customerName: 'Trần Thị Bình',
    customerPhone: '0987654321',
    customerEmail: 'tranthibinh@gmail.com',
    customerAvatar: 'https://i.pravatar.cc/150?img=2',
    customerTier: 'Bạch kim',
    status: 'shipping',
    paymentMethod: 'momo',
    paymentStatus: 'paid',
    total: 280000,
    subtotal: 260000,
    discount: 20000,
    tax: 26000,
    shippingFee: 20000,
    items: [
      { id: 1, name: 'Bánh tiramisu', quantity: 1, price: 65000, total: 65000 },
      { id: 2, name: 'Latte', quantity: 2, price: 40000, total: 80000 },
      { id: 3, name: 'Macaron', quantity: 5, price: 15000, total: 75000 }
    ],
    createdAt: '2024-01-21T10:15:00',
    updatedAt: '2024-01-21T15:20:00',
    deliveredAt: null,
    shippingAddress: 'Số 456, Đường Nguyễn Huệ, Phường Đa Kao, Quận 1, TP.HCM',
    notes: 'Liên hệ trước khi giao',
    rating: 0,
    review: '',
    timeline: [
      { time: '2024-01-21T10:15:00', status: 'pending', description: 'Đơn hàng được tạo' },
      { time: '2024-01-21T10:30:00', status: 'confirmed', description: 'Đã xác nhận đơn hàng' },
      { time: '2024-01-21T11:00:00', status: 'preparing', description: 'Bắt đầu chuẩn bị' },
      { time: '2024-01-21T15:20:00', status: 'shipping', description: 'Bắt đầu giao hàng' }
    ]
  },
  {
    id: 'ORD-2024-003',
    orderNumber: '#003',
    customerName: 'Lê Minh Cường',
    customerPhone: '0912345678',
    customerEmail: 'leminhcuong@gmail.com',
    customerAvatar: 'https://i.pravatar.cc/150?img=3',
    customerTier: 'Bạc',
    status: 'preparing',
    paymentMethod: 'cash',
    paymentStatus: 'pending',
    total: 180000,
    subtotal: 170000,
    discount: 10000,
    tax: 17000,
    shippingFee: 15000,
    items: [
      { id: 1, name: 'Americano', quantity: 2, price: 30000, total: 60000 },
      { id: 2, name: 'Bánh mì', quantity: 2, price: 25000, total: 50000 },
      { id: 3, name: 'Sinh tố', quantity: 1, price: 45000, total: 45000 }
    ],
    createdAt: '2024-01-22T07:45:00',
    updatedAt: '2024-01-22T08:15:00',
    deliveredAt: null,
    shippingAddress: 'Số 789, Đường Điện Biên Phủ, Phường 15, Quận Bình Thạnh, TP.HCM',
    notes: 'Thanh toán khi nhận hàng',
    rating: 0,
    review: '',
    timeline: [
      { time: '2024-01-22T07:45:00', status: 'pending', description: 'Đơn hàng được tạo' },
      { time: '2024-01-22T08:00:00', status: 'confirmed', description: 'Đã xác nhận đơn hàng' },
      { time: '2024-01-22T08:15:00', status: 'preparing', description: 'Bắt đầu chuẩn bị' }
    ]
  },
  {
    id: 'ORD-2024-004',
    orderNumber: '#004',
    customerName: 'Phạm Thị Diễm',
    customerPhone: '0923456789',
    customerEmail: 'phamthidiem@gmail.com',
    customerAvatar: 'https://i.pravatar.cc/150?img=4',
    customerTier: 'Đồng',
    status: 'cancelled',
    paymentMethod: 'vnpay',
    paymentStatus: 'refunded',
    total: 120000,
    subtotal: 110000,
    discount: 0,
    tax: 11000,
    shippingFee: 10000,
    items: [
      { id: 1, name: 'Bubble tea', quantity: 2, price: 35000, total: 70000 },
      { id: 2, name: 'Bánh flan', quantity: 1, price: 30000, total: 30000 }
    ],
    createdAt: '2024-01-19T16:20:00',
    updatedAt: '2024-01-19T16:45:00',
    deliveredAt: null,
    shippingAddress: 'Số 321, Đường Võ Văn Tần, Phường 6, Quận 3, TP.HCM',
    notes: 'Khách hàng hủy đơn',
    rating: 0,
    review: '',
    timeline: [
      { time: '2024-01-19T16:20:00', status: 'pending', description: 'Đơn hàng được tạo' },
      { time: '2024-01-19T16:30:00', status: 'confirmed', description: 'Đã xác nhận đơn hàng' },
      { time: '2024-01-19T16:45:00', status: 'cancelled', description: 'Khách hàng hủy đơn' }
    ]
  },
  {
    id: 'ORD-2024-005',
    orderNumber: '#005',
    customerName: 'Hoàng Minh Đức',
    customerPhone: '0934567890',
    customerEmail: 'hoangminhduc@gmail.com',
    customerAvatar: 'https://i.pravatar.cc/150?img=5',
    customerTier: 'Kim cương',
    status: 'confirmed',
    paymentMethod: 'bank',
    paymentStatus: 'paid',
    total: 680000,
    subtotal: 620000,
    discount: 100000,
    tax: 62000,
    shippingFee: 0,
    items: [
      { id: 1, name: 'Espresso', quantity: 4, price: 35000, total: 140000 },
      { id: 2, name: 'Bánh sandwich', quantity: 3, price: 45000, total: 135000 },
      { id: 3, name: 'Nước ép', quantity: 2, price: 50000, total: 100000 },
      { id: 4, name: 'Salad', quantity: 2, price: 60000, total: 120000 }
    ],
    createdAt: '2024-01-22T11:30:00',
    updatedAt: '2024-01-22T11:45:00',
    deliveredAt: null,
    shippingAddress: 'Số 654, Đường Cách Mạng Tháng 8, Phường 11, Quận 10, TP.HCM',
    notes: 'Đơn hàng VIP, ưu tiên giao nhanh',
    rating: 0,
    review: '',
    timeline: [
      { time: '2024-01-22T11:30:00', status: 'pending', description: 'Đơn hàng được tạo' },
      { time: '2024-01-22T11:45:00', status: 'confirmed', description: 'Đã xác nhận đơn hàng' }
    ]
  }
];

// Mock revenue chart data
const mockRevenueData = [
  { date: '20/01', revenue: 2400000, orders: 12 },
  { date: '21/01', revenue: 3200000, orders: 15 },
  { date: '22/01', revenue: 1800000, orders: 8 },
  { date: '23/01', revenue: 2800000, orders: 14 },
  { date: '24/01', revenue: 3600000, orders: 18 },
  { date: '25/01', revenue: 4200000, orders: 22 },
  { date: '26/01', revenue: 3800000, orders: 19 }
];

// Mock status distribution data
const mockStatusData = [
  { name: 'Chờ xác nhận', value: 15, color: '#faad14' },
  { name: 'Đã xác nhận', value: 8, color: '#1890ff' },
  { name: 'Đang chuẩn bị', value: 12, color: '#722ed1' },
  { name: 'Đang giao', value: 20, color: '#13c2c2' },
  { name: 'Đã giao', value: 45, color: '#52c41a' },
  { name: 'Đã hủy', value: 5, color: '#ff4d4f' }
];

const ModernOrderPage: React.FC = () => {
  const { setPageTitle, setBreadcrumbs } = usePage();
  
  // State management
  const [orders, setOrders] = useState(mockOrders);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // View and layout
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  
  // Search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('all');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState('all');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [sortBy, setSortBy] = useState('created-desc');
  const [amountRange, setAmountRange] = useState<[number, number]>([0, 10000000]);
  
  // Modals and drawers
  const [orderDetailVisible, setOrderDetailVisible] = useState(false);
  const [filterDrawerVisible, setFilterDrawerVisible] = useState(false);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  
  // Forms
  const [statusForm] = Form.useForm();
  
  // Debounced search
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  
  // Filtered orders
  const filteredOrders = useMemo(() => {
    let filtered = [...orders];
    
    // Search filter
    if (debouncedSearchQuery) {
      filtered = filtered.filter(order =>
        order.id.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        order.customerName.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        order.customerPhone.includes(debouncedSearchQuery) ||
        order.customerEmail.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
      );
    }
    
    // Status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(order => order.status === selectedStatus);
    }
    
    // Payment method filter
    if (selectedPaymentMethod !== 'all') {
      filtered = filtered.filter(order => order.paymentMethod === selectedPaymentMethod);
    }
    
    // Payment status filter
    if (selectedPaymentStatus !== 'all') {
      filtered = filtered.filter(order => order.paymentStatus === selectedPaymentStatus);
    }
    
    // Date range filter
    if (dateRange) {
      filtered = filtered.filter(order => {
        const orderDate = dayjs(order.createdAt);
        return orderDate.isAfter(dateRange[0]) && orderDate.isBefore(dateRange[1]);
      });
    }
    
    // Amount range filter
    filtered = filtered.filter(order => 
      order.total >= amountRange[0] && order.total <= amountRange[1]
    );
    
    // Sort
    const [sortField, sortOrder] = sortBy.split('-');
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortField) {
        case 'created':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        case 'total':
          aValue = a.total;
          bValue = b.total;
          break;
        case 'customer':
          aValue = a.customerName;
          bValue = b.customerName;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    return filtered;
  }, [orders, debouncedSearchQuery, selectedStatus, selectedPaymentMethod, selectedPaymentStatus, dateRange, sortBy, amountRange]);

  useEffect(() => {
    setPageTitle('Quản lý đơn hàng');
    setBreadcrumbs([
      { title: 'Đơn hàng' },
    ]);
  }, [setPageTitle, setBreadcrumbs]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const handleViewOrder = (order: any) => {
    setSelectedOrder(order);
    setOrderDetailVisible(true);
  };

  const handleUpdateStatus = (order: any) => {
    setSelectedOrder(order);
    statusForm.setFieldsValue({
      status: order.status,
      notes: ''
    });
    setStatusModalVisible(true);
  };

  const handleStatusUpdate = async (values: any) => {
    try {
      setSaving(true);
      
      const updatedOrder = {
        ...selectedOrder,
        status: values.status,
        updatedAt: new Date().toISOString(),
        timeline: [
          ...selectedOrder.timeline,
          {
            time: new Date().toISOString(),
            status: values.status,
            description: values.notes || `Cập nhật trạng thái: ${orderStatuses[values.status as keyof typeof orderStatuses]?.name}`
          }
        ]
      };
      
      setOrders(orders.map(order => 
        order.id === selectedOrder.id ? updatedOrder : order
      ));
      
      setStatusModalVisible(false);
      statusForm.resetFields();
      message.success('Đã cập nhật trạng thái đơn hàng');
    } catch (error) {
      message.error('Không thể cập nhật trạng thái');
    } finally {
      setSaving(false);
    }
  };

  const handlePrintOrder = (order: any) => {
    message.info('Chức năng in đơn hàng đang phát triển');
  };

  const handleCancelOrder = (order: any) => {
    Modal.confirm({
      title: 'Xác nhận hủy đơn hàng',
      content: `Bạn có chắc muốn hủy đơn hàng ${order.id}?`,
      icon: <ExclamationCircleOutlined />,
      okText: 'Hủy đơn',
      okType: 'danger',
      cancelText: 'Không',
      onOk: () => {
        const updatedOrder = {
          ...order,
          status: 'cancelled',
          updatedAt: new Date().toISOString(),
          timeline: [
            ...order.timeline,
            {
              time: new Date().toISOString(),
              status: 'cancelled',
              description: 'Đơn hàng bị hủy'
            }
          ]
        };
        
        setOrders(orders.map(o => o.id === order.id ? updatedOrder : o));
        message.success('Đã hủy đơn hàng');
      }
    });
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedStatus('all');
    setSelectedPaymentMethod('all');
    setSelectedPaymentStatus('all');
    setDateRange(null);
    setSortBy('created-desc');
    setAmountRange([0, 10000000]);
  };

  const getCurrentStep = (status: string) => {
    const steps = ['pending', 'confirmed', 'preparing', 'shipping', 'delivered'];
    return steps.indexOf(status);
  };

  // Statistics
  const totalOrders = filteredOrders.length;
  const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.total, 0);
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const pendingOrders = filteredOrders.filter(order => order.status === 'pending').length;
  const completedOrders = filteredOrders.filter(order => order.status === 'delivered').length;
  const cancelledOrders = filteredOrders.filter(order => order.status === 'cancelled').length;

  return (
    <div className="modern-order-page">
      {/* Header */}
      <div className="order-header">
        <div className="header-content">
          <div className="header-left">
            <Title level={2} className="order-title">
              <ShoppingCartOutlined className="title-icon" />
              Quản lý đơn hàng
            </Title>
            <Text className="order-subtitle">
              Theo dõi và quản lý đơn hàng với timeline chi tiết và status tracking
            </Text>
          </div>
          <div className="header-right">
            <Space size="middle">
              <Button icon={<ExportOutlined />}>
                Xuất Excel
              </Button>
              <Button icon={<PrinterOutlined />}>
                In báo cáo
              </Button>
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
              >
                Tạo đơn hàng
              </Button>
            </Space>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="stats-section">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card className="stat-card">
              <div className="stat-content">
                <div className="stat-icon orders">
                  <ShoppingCartOutlined />
                </div>
                <div className="stat-info">
                  <div className="stat-value">{totalOrders}</div>
                  <div className="stat-label">Tổng đơn hàng</div>
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="stat-card">
              <div className="stat-content">
                <div className="stat-icon revenue">
                  <DollarOutlined />
                </div>
                <div className="stat-info">
                  <div className="stat-value">{formatCurrency(totalRevenue)}</div>
                  <div className="stat-label">Tổng doanh thu</div>
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="stat-card">
              <div className="stat-content">
                <div className="stat-icon pending">
                  <ClockCircleOutlined />
                </div>
                <div className="stat-info">
                  <div className="stat-value">{pendingOrders}</div>
                  <div className="stat-label">Chờ xử lý</div>
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="stat-card">
              <div className="stat-content">
                <div className="stat-icon completed">
                  <CheckCircleOutlined />
                </div>
                <div className="stat-info">
                  <div className="stat-value">{completedOrders}</div>
                  <div className="stat-label">Hoàn thành</div>
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </div>

      {/* Charts */}
      <div className="charts-section">
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={16}>
            <Card 
              title="Doanh thu 7 ngày qua"
              className="chart-card"
              extra={<Button type="text" icon={<EyeOutlined />} size="small">Chi tiết</Button>}
            >
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={mockRevenueData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1890ff" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#1890ff" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <ChartTooltip formatter={(value) => [formatCurrency(value as number), 'Doanh thu']} />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#1890ff" 
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          </Col>
          <Col xs={24} lg={8}>
            <Card 
              title="Phân bố trạng thái"
              className="chart-card"
            >
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={mockStatusData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={100} />
                  <ChartTooltip />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Col>
        </Row>
      </div>

      {/* Main Content */}
      <Card className="main-content-card">
        {/* Toolbar */}
        <div className="toolbar">
          <div className="toolbar-left">
            <Space>
              <Search
                placeholder="Tìm đơn hàng, khách hàng..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: 300 }}
                allowClear
              />
              <Select
                value={selectedStatus}
                onChange={setSelectedStatus}
                style={{ width: 140 }}
                placeholder="Trạng thái"
              >
                <Option value="all">Tất cả</Option>
                {Object.entries(orderStatuses).map(([key, status]) => (
                  <Option key={key} value={key}>
                    {status.name}
                  </Option>
                ))}
              </Select>
              <Select
                value={sortBy}
                onChange={setSortBy}
                style={{ width: 180 }}
                placeholder="Sắp xếp"
              >
                <Option value="created-desc">Mới nhất</Option>
                <Option value="created-asc">Cũ nhất</Option>
                <Option value="total-desc">Giá trị cao nhất</Option>
                <Option value="total-asc">Giá trị thấp nhất</Option>
                <Option value="customer-asc">Khách hàng A-Z</Option>
                <Option value="status-asc">Trạng thái</Option>
              </Select>
              <Button 
                icon={<FilterOutlined />}
                onClick={() => setFilterDrawerVisible(true)}
              >
                Lọc nâng cao
              </Button>
            </Space>
          </div>
          <div className="toolbar-right">
            <Space>
              <Button.Group>
                <Button
                  type={viewMode === 'table' ? 'primary' : 'default'}
                  icon={<UnorderedListOutlined />}
                  onClick={() => setViewMode('table')}
                >
                  Bảng
                </Button>
                <Button
                  type={viewMode === 'cards' ? 'primary' : 'default'}
                  icon={<AppstoreOutlined />}
                  onClick={() => setViewMode('cards')}
                >
                  Thẻ
                </Button>
              </Button.Group>
            </Space>
          </div>
        </div>

        {/* Results Count */}
        <div className="results-info">
          <Text type="secondary">
            Hiển thị {filteredOrders.length} đơn hàng
            {searchQuery && ` cho "${searchQuery}"`}
          </Text>
        </div>

        {/* Order List */}
        <div className="order-list">
          {viewMode === 'table' ? (
            <Table
              dataSource={filteredOrders}
              rowKey="id"
              loading={loading}
              pagination={{
                pageSize: 20,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => 
                  `${range[0]}-${range[1]} của ${total} đơn hàng`,
              }}
              rowSelection={{
                selectedRowKeys,
                onChange: setSelectedRowKeys,
              }}
              columns={[
                {
                  title: 'Đơn hàng',
                  key: 'order',
                  render: (_, record) => (
                    <div className="order-cell">
                      <div className="order-info">
                        <div className="order-id">{record.id}</div>
                        <div className="order-time">
                          {dayjs(record.createdAt).format('DD/MM/YYYY HH:mm')}
                        </div>
                      </div>
                    </div>
                  ),
                },
                {
                  title: 'Khách hàng',
                  key: 'customer',
                  render: (_, record) => (
                    <div className="customer-cell">
                      <Avatar 
                        src={record.customerAvatar} 
                        size={40}
                        icon={<UserOutlined />}
                      />
                      <div className="customer-info">
                        <div className="customer-name">{record.customerName}</div>
                        <div className="customer-contact">
                          <Text type="secondary">{record.customerPhone}</Text>
                        </div>
                        <Tag size="small" color="blue">{record.customerTier}</Tag>
                      </div>
                    </div>
                  ),
                },
                {
                  title: 'Trạng thái',
                  key: 'status',
                  render: (_, record) => (
                    <div className="status-cell">
                      <Tag 
                        color={orderStatuses[record.status as keyof typeof orderStatuses]?.color}
                        icon={orderStatuses[record.status as keyof typeof orderStatuses]?.icon}
                      >
                        {orderStatuses[record.status as keyof typeof orderStatuses]?.name}
                      </Tag>
                      <div className="status-progress">
                        <Steps
                          size="small"
                          current={getCurrentStep(record.status)}
                          items={[
                            { title: 'Chờ' },
                            { title: 'Xác nhận' },
                            { title: 'Chuẩn bị' },
                            { title: 'Giao' },
                            { title: 'Hoàn thành' }
                          ]}
                        />
                      </div>
                    </div>
                  ),
                },
                {
                  title: 'Thanh toán',
                  key: 'payment',
                  render: (_, record) => (
                    <div className="payment-cell">
                      <div className="payment-method">
                        <Tag icon={paymentMethods[record.paymentMethod as keyof typeof paymentMethods]?.icon}>
                          {paymentMethods[record.paymentMethod as keyof typeof paymentMethods]?.name}
                        </Tag>
                      </div>
                      <div className="payment-status">
                        <Tag color={record.paymentStatus === 'paid' ? 'green' : 'orange'}>
                          {record.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                        </Tag>
                      </div>
                    </div>
                  ),
                },
                {
                  title: 'Tổng tiền',
                  key: 'total',
                  render: (_, record) => (
                    <div className="total-cell">
                      <div className="total-amount">{formatCurrency(record.total)}</div>
                      <div className="items-count">
                        <Text type="secondary">{record.items.length} sản phẩm</Text>
                      </div>
                    </div>
                  ),
                },
                {
                  title: 'Hành động',
                  key: 'actions',
                  width: 150,
                  render: (_, record) => (
                    <Space>
                      <Tooltip title="Xem chi tiết">
                        <Button 
                          type="text" 
                          icon={<EyeOutlined />}
                          onClick={() => handleViewOrder(record)}
                        />
                      </Tooltip>
                      <Tooltip title="Cập nhật trạng thái">
                        <Button 
                          type="text" 
                          icon={<EditOutlined />}
                          onClick={() => handleUpdateStatus(record)}
                        />
                      </Tooltip>
                      <Tooltip title="In đơn hàng">
                        <Button 
                          type="text" 
                          icon={<PrinterOutlined />}
                          onClick={() => handlePrintOrder(record)}
                        />
                      </Tooltip>
                      {record.status !== 'cancelled' && record.status !== 'delivered' && (
                        <Tooltip title="Hủy đơn">
                          <Button 
                            type="text" 
                            danger
                            icon={<CloseOutlined />}
                            onClick={() => handleCancelOrder(record)}
                          />
                        </Tooltip>
                      )}
                    </Space>
                  ),
                },
              ]}
            />
          ) : (
            <div className="order-cards">
              <Row gutter={[16, 16]}>
                {filteredOrders.map(order => (
                  <Col key={order.id} xs={24} sm={12} md={8} lg={6}>
                    <Card 
                      className="order-card"
                      hoverable
                      actions={[
                        <Tooltip title="Xem chi tiết">
                          <Button 
                            type="text" 
                            icon={<EyeOutlined />}
                            onClick={() => handleViewOrder(order)}
                          />
                        </Tooltip>,
                        <Tooltip title="Cập nhật trạng thái">
                          <Button 
                            type="text" 
                            icon={<EditOutlined />}
                            onClick={() => handleUpdateStatus(order)}
                          />
                        </Tooltip>,
                        <Tooltip title="In đơn hàng">
                          <Button 
                            type="text" 
                            icon={<PrinterOutlined />}
                            onClick={() => handlePrintOrder(order)}
                          />
                        </Tooltip>
                      ]}
                    >
                      <div className="order-card-content">
                        <div className="order-card-header">
                          <div className="order-id">{order.id}</div>
                          <Tag 
                            color={orderStatuses[order.status as keyof typeof orderStatuses]?.color}
                            icon={orderStatuses[order.status as keyof typeof orderStatuses]?.icon}
                          >
                            {orderStatuses[order.status as keyof typeof orderStatuses]?.name}
                          </Tag>
                        </div>
                        
                        <div className="order-customer">
                          <div className="customer-info">
                            <Avatar 
                              src={order.customerAvatar} 
                              size={32}
                              icon={<UserOutlined />}
                            />
                            <div className="customer-details">
                              <div className="customer-name">{order.customerName}</div>
                              <div className="customer-contact">
                                <Text type="secondary">{order.customerPhone}</Text>
                              </div>
                            </div>
                          </div>
                          <Tag size="small" color="blue">{order.customerTier}</Tag>
                        </div>
                        
                        <div className="order-progress">
                          <Steps
                            size="small"
                            current={getCurrentStep(order.status)}
                            items={[
                              { title: 'Chờ' },
                              { title: 'Xác nhận' },
                              { title: 'Chuẩn bị' },
                              { title: 'Giao' },
                              { title: 'Hoàn thành' }
                            ]}
                          />
                        </div>
                        
                        <div className="order-payment">
                          <div className="payment-method">
                            <Tag icon={paymentMethods[order.paymentMethod as keyof typeof paymentMethods]?.icon}>
                              {paymentMethods[order.paymentMethod as keyof typeof paymentMethods]?.name}
                            </Tag>
                          </div>
                          <div className="payment-status">
                            <Tag color={order.paymentStatus === 'paid' ? 'green' : 'orange'}>
                              {order.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                            </Tag>
                          </div>
                        </div>
                        
                        <div className="order-total">
                          <Text strong>Tổng tiền:</Text>
                          <Text className="total-amount">{formatCurrency(order.total)}</Text>
                        </div>
                        
                        <div className="order-time">
                          <Text type="secondary">
                            {dayjs(order.createdAt).format('DD/MM/YYYY HH:mm')}
                          </Text>
                        </div>
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
            </div>
          )}
        </div>
      </Card>

      {/* Order Detail Drawer */}
      <Drawer
        title="Chi tiết đơn hàng"
        placement="right"
        onClose={() => setOrderDetailVisible(false)}
        visible={orderDetailVisible}
        width={700}
        className="order-detail-drawer"
      >
        {selectedOrder && (
          <div className="order-detail-content">
            <div className="order-summary">
              <div className="summary-header">
                <div className="order-info">
                  <Title level={4}>{selectedOrder.id}</Title>
                  <Tag 
                    color={orderStatuses[selectedOrder.status as keyof typeof orderStatuses]?.color}
                    icon={orderStatuses[selectedOrder.status as keyof typeof orderStatuses]?.icon}
                  >
                    {orderStatuses[selectedOrder.status as keyof typeof orderStatuses]?.name}
                  </Tag>
                </div>
                <div className="order-actions">
                  <Button 
                    type="primary" 
                    icon={<EditOutlined />}
                    onClick={() => handleUpdateStatus(selectedOrder)}
                  >
                    Cập nhật trạng thái
                  </Button>
                  <Button 
                    icon={<PrinterOutlined />}
                    onClick={() => handlePrintOrder(selectedOrder)}
                  >
                    In đơn hàng
                  </Button>
                </div>
              </div>
              
              <div className="order-progress-section">
                <Title level={5}>Tiến trình đơn hàng</Title>
                <Steps
                  current={getCurrentStep(selectedOrder.status)}
                  items={[
                    { title: 'Chờ xác nhận', icon: <ClockCircleOutlined /> },
                    { title: 'Đã xác nhận', icon: <CheckCircleOutlined /> },
                    { title: 'Đang chuẩn bị', icon: <SyncOutlined /> },
                    { title: 'Đang giao', icon: <TruckOutlined /> },
                    { title: 'Hoàn thành', icon: <CheckOutlined /> }
                  ]}
                />
              </div>
            </div>
            
            <Tabs defaultActiveKey="details">
              <TabPane tab="Chi tiết" key="details">
                <div className="order-details-tab">
                  <div className="customer-section">
                    <Title level={5}>Thông tin khách hàng</Title>
                    <div className="customer-info-detail">
                      <Avatar 
                        src={selectedOrder.customerAvatar} 
                        size={60}
                        icon={<UserOutlined />}
                      />
                      <div className="customer-details">
                        <div className="customer-name">{selectedOrder.customerName}</div>
                        <div className="customer-contact">
                          <Text type="secondary">{selectedOrder.customerPhone}</Text>
                          <Text type="secondary"> • {selectedOrder.customerEmail}</Text>
                        </div>
                        <Tag color="blue">{selectedOrder.customerTier}</Tag>
                      </div>
                    </div>
                  </div>
                  
                  <div className="items-section">
                    <Title level={5}>Sản phẩm</Title>
                    <List
                      dataSource={selectedOrder.items}
                      renderItem={(item: any) => (
                        <List.Item>
                          <div className="item-info">
                            <div className="item-name">{item.name}</div>
                            <div className="item-details">
                              <Text type="secondary">Số lượng: {item.quantity}</Text>
                              <Text type="secondary"> • Đơn giá: {formatCurrency(item.price)}</Text>
                            </div>
                          </div>
                          <div className="item-total">
                            {formatCurrency(item.total)}
                          </div>
                        </List.Item>
                      )}
                    />
                  </div>
                  
                  <div className="payment-section">
                    <Title level={5}>Thanh toán</Title>
                    <Descriptions column={2}>
                      <Descriptions.Item label="Tạm tính">
                        {formatCurrency(selectedOrder.subtotal)}
                      </Descriptions.Item>
                      <Descriptions.Item label="Giảm giá">
                        {formatCurrency(selectedOrder.discount)}
                      </Descriptions.Item>
                      <Descriptions.Item label="Thuế">
                        {formatCurrency(selectedOrder.tax)}
                      </Descriptions.Item>
                      <Descriptions.Item label="Phí giao hàng">
                        {formatCurrency(selectedOrder.shippingFee)}
                      </Descriptions.Item>
                      <Descriptions.Item label="Tổng cộng" span={2}>
                        <Text strong style={{ fontSize: '1.2em' }}>
                          {formatCurrency(selectedOrder.total)}
                        </Text>
                      </Descriptions.Item>
                    </Descriptions>
                    
                    <div className="payment-method-info">
                      <Text strong>Phương thức thanh toán: </Text>
                      <Tag icon={paymentMethods[selectedOrder.paymentMethod as keyof typeof paymentMethods]?.icon}>
                        {paymentMethods[selectedOrder.paymentMethod as keyof typeof paymentMethods]?.name}
                      </Tag>
                      <Tag color={selectedOrder.paymentStatus === 'paid' ? 'green' : 'orange'}>
                        {selectedOrder.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                      </Tag>
                    </div>
                  </div>
                  
                  <div className="shipping-section">
                    <Title level={5}>Giao hàng</Title>
                    <div className="shipping-address">
                      <Text strong>Địa chỉ: </Text>
                      <Text>{selectedOrder.shippingAddress}</Text>
                    </div>
                    {selectedOrder.notes && (
                      <div className="shipping-notes">
                        <Text strong>Ghi chú: </Text>
                        <Text>{selectedOrder.notes}</Text>
                      </div>
                    )}
                  </div>
                </div>
              </TabPane>
              
              <TabPane tab="Lịch sử" key="timeline">
                <div className="order-timeline-tab">
                  <Timeline>
                    {selectedOrder.timeline.map((event: any, index: number) => (
                      <Timeline.Item 
                        key={index}
                        color={orderStatuses[event.status as keyof typeof orderStatuses]?.color}
                        dot={orderStatuses[event.status as keyof typeof orderStatuses]?.icon}
                      >
                        <div className="timeline-event">
                          <div className="event-title">
                            {orderStatuses[event.status as keyof typeof orderStatuses]?.name}
                          </div>
                          <div className="event-description">
                            {event.description}
                          </div>
                          <div className="event-time">
                            {dayjs(event.time).format('DD/MM/YYYY HH:mm')}
                          </div>
                        </div>
                      </Timeline.Item>
                    ))}
                  </Timeline>
                </div>
              </TabPane>
              
              {selectedOrder.rating > 0 && (
                <TabPane tab="Đánh giá" key="review">
                  <div className="order-review-tab">
                    <div className="review-rating">
                      <Rate disabled defaultValue={selectedOrder.rating} />
                      <Text strong> {selectedOrder.rating}/5</Text>
                    </div>
                    <div className="review-content">
                      <Text>{selectedOrder.review}</Text>
                    </div>
                    <div className="review-time">
                      <Text type="secondary">
                        Đánh giá lúc: {dayjs(selectedOrder.deliveredAt).format('DD/MM/YYYY HH:mm')}
                      </Text>
                    </div>
                  </div>
                </TabPane>
              )}
            </Tabs>
          </div>
        )}
      </Drawer>

      {/* Status Update Modal */}
      <Modal
        title="Cập nhật trạng thái đơn hàng"
        visible={statusModalVisible}
        onCancel={() => setStatusModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form
          form={statusForm}
          layout="vertical"
          onFinish={handleStatusUpdate}
        >
          <Form.Item
            label="Trạng thái"
            name="status"
            rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
          >
            <Select placeholder="Chọn trạng thái">
              {Object.entries(orderStatuses).map(([key, status]) => (
                <Option key={key} value={key}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: status.color }}>{status.icon}</span>
                    {status.name}
                  </div>
                </Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item
            label="Ghi chú"
            name="notes"
          >
            <Input.TextArea rows={3} placeholder="Nhập ghi chú (tùy chọn)" />
          </Form.Item>
          
          <div className="form-actions">
            <Space>
              <Button onClick={() => setStatusModalVisible(false)}>
                Hủy
              </Button>
              <Button type="primary" htmlType="submit" loading={saving}>
                Cập nhật
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>

      {/* Filter Drawer */}
      <Drawer
        title="Lọc nâng cao"
        placement="right"
        onClose={() => setFilterDrawerVisible(false)}
        visible={filterDrawerVisible}
        width={400}
      >
        <div className="filter-drawer-content">
          <div className="filter-section">
            <Title level={5}>Phương thức thanh toán</Title>
            <Select
              value={selectedPaymentMethod}
              onChange={setSelectedPaymentMethod}
              style={{ width: '100%' }}
            >
              <Option value="all">Tất cả</Option>
              {Object.entries(paymentMethods).map(([key, method]) => (
                <Option key={key} value={key}>
                  {method.name}
                </Option>
              ))}
            </Select>
          </div>
          
          <div className="filter-section">
            <Title level={5}>Trạng thái thanh toán</Title>
            <Select
              value={selectedPaymentStatus}
              onChange={setSelectedPaymentStatus}
              style={{ width: '100%' }}
            >
              <Option value="all">Tất cả</Option>
              <Option value="paid">Đã thanh toán</Option>
              <Option value="pending">Chưa thanh toán</Option>
              <Option value="refunded">Đã hoàn tiền</Option>
            </Select>
          </div>
          
          <div className="filter-section">
            <Title level={5}>Khoảng thời gian</Title>
            <RangePicker
              value={dateRange}
              onChange={setDateRange}
              style={{ width: '100%' }}
              placeholder={['Từ ngày', 'Đến ngày']}
            />
          </div>
          
          <div className="filter-actions">
            <Button block onClick={resetFilters}>
              Đặt lại tất cả
            </Button>
          </div>
        </div>
      </Drawer>
    </div>
  );
};

export default ModernOrderPage;