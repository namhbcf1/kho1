// Modern Customer Management with profile cards, history, and beautiful UI
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
  Form, 
  InputNumber, 
  Typography,
  Row,
  Col,
  Statistic,
  Badge,
  Avatar,
  DatePicker,
  Drawer,
  Timeline,
  Progress,
  Tabs,
  Rate,
  Switch,
  Radio,
  Divider,
  List,
  Empty,
  Tooltip,
  Popconfirm,
  message,
  notification
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
  HomeOutlined,
  CalendarOutlined,
  GiftOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
  StarOutlined,
  HeartOutlined,
  EyeOutlined,
  HistoryOutlined,
  BellOutlined,
  TrophyOutlined,
  FireOutlined,
  ThunderboltOutlined,
  TeamOutlined,
  EnvironmentOutlined,
  FilterOutlined,
  ReloadOutlined,
  SettingOutlined,
  MoreOutlined,
  ManOutlined,
  WomanOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  WarningOutlined,
  SortAscendingOutlined,
  SortDescendingOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  LineChartOutlined,
  BarChartOutlined,
  PieChartOutlined,
  TransactionOutlined,
  WalletOutlined,
  CreditCardOutlined,
  BankOutlined,
  MobileOutlined,
  PrinterOutlined,
  ShareAltOutlined,
  DownloadOutlined,
  UploadOutlined,
  CloudOutlined,
  SafetyOutlined,
  LockOutlined,
  UnlockOutlined,
  SyncOutlined,
  LoadingOutlined,
  CheckOutlined,
  CloseOutlined,
  MenuOutlined
} from '@ant-design/icons';
import { LineChart, Line, AreaChart, Area, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip } from 'recharts';
import { formatVND } from '../../utils/formatters/vndCurrency';
import { usePage } from '../../stores';
import { useDebounce } from '../../hooks/useDebounce';
import dayjs from 'dayjs';
import './ModernCustomerPage.css';

const { Search } = Input;
const { Option } = Select;
const { Title, Text } = Typography;
const { confirm } = Modal;
const { TabPane } = Tabs;

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
    tierColor: '#faad14',
    loyaltyPoints: 1500,
    totalSpent: 5000000,
    totalOrders: 25,
    lastVisit: '2024-01-20',
    birthDate: '1985-05-15',
    gender: 'Nam',
    status: 'active',
    notes: 'Khách hàng thân thiết, thích cà phê đen',
    avatar: 'https://i.pravatar.cc/150?img=1',
    joinDate: '2023-03-15',
    lastOrderDate: '2024-01-18',
    averageOrderValue: 200000,
    favoriteProducts: ['Cà phê đen', 'Bánh croissant', 'Trà sữa'],
    preferredPayment: 'Thẻ tín dụng',
    rating: 4.8,
    reviews: 12,
    referrals: 3,
    location: { lat: 10.762622, lng: 106.660172 },
    tags: ['VIP', 'Thường xuyên', 'Cà phê'],
    socialMedia: {
      facebook: 'nguyenvananh',
      instagram: '@vananh85'
    }
  },
  {
    id: '2',
    name: 'Trần Thị Bình',
    phone: '0987654321',
    email: 'tranthibinh@gmail.com',
    address: 'Số 456, Đường Nguyễn Huệ, Phường Đa Kao, Quận 1, TP.HCM',
    tier: 'Bạch kim',
    tierId: 'platinum',
    tierColor: '#722ed1',
    loyaltyPoints: 3200,
    totalSpent: 12000000,
    totalOrders: 68,
    lastVisit: '2024-01-22',
    birthDate: '1990-08-22',
    gender: 'Nữ',
    status: 'active',
    notes: 'Thường đặt hàng online, ưa thích bánh ngọt',
    avatar: 'https://i.pravatar.cc/150?img=2',
    joinDate: '2022-11-08',
    lastOrderDate: '2024-01-21',
    averageOrderValue: 176470,
    favoriteProducts: ['Bánh tiramisu', 'Latte', 'Macaron'],
    preferredPayment: 'Chuyển khoản',
    rating: 4.9,
    reviews: 25,
    referrals: 8,
    location: { lat: 10.773228, lng: 106.700806 },
    tags: ['Platinum', 'Online', 'Bánh ngọt'],
    socialMedia: {
      facebook: 'thibinhh',
      instagram: '@binh_sweet'
    }
  },
  {
    id: '3',
    name: 'Lê Minh Cường',
    phone: '0912345678',
    email: 'leminhcuong@gmail.com',
    address: 'Số 789, Đường Điện Biên Phủ, Phường 15, Quận Bình Thạnh, TP.HCM',
    tier: 'Bạc',
    tierId: 'silver',
    tierColor: '#8c8c8c',
    loyaltyPoints: 850,
    totalSpent: 2500000,
    totalOrders: 15,
    lastVisit: '2024-01-18',
    birthDate: '1988-12-03',
    gender: 'Nam',
    status: 'active',
    notes: 'Làm việc gần quán, thường ghé buổi sáng',
    avatar: 'https://i.pravatar.cc/150?img=3',
    joinDate: '2023-09-20',
    lastOrderDate: '2024-01-16',
    averageOrderValue: 166666,
    favoriteProducts: ['Americano', 'Bánh mì', 'Sinh tố'],
    preferredPayment: 'Tiền mặt',
    rating: 4.5,
    reviews: 8,
    referrals: 1,
    location: { lat: 10.801589, lng: 106.711264 },
    tags: ['Buổi sáng', 'Gần văn phòng', 'Nhanh'],
    socialMedia: {
      facebook: 'minhcuong88'
    }
  },
  {
    id: '4',
    name: 'Phạm Thị Diễm',
    phone: '0923456789',
    email: 'phamthidiem@gmail.com',
    address: 'Số 321, Đường Võ Văn Tần, Phường 6, Quận 3, TP.HCM',
    tier: 'Đồng',
    tierId: 'bronze',
    tierColor: '#d4844b',
    loyaltyPoints: 420,
    totalSpent: 1200000,
    totalOrders: 8,
    lastVisit: '2024-01-15',
    birthDate: '1995-03-10',
    gender: 'Nữ',
    status: 'active',
    notes: 'Khách hàng mới, thích thử các món mới',
    avatar: 'https://i.pravatar.cc/150?img=4',
    joinDate: '2023-12-01',
    lastOrderDate: '2024-01-14',
    averageOrderValue: 150000,
    favoriteProducts: ['Bubble tea', 'Bánh flan', 'Smoothie'],
    preferredPayment: 'MoMo',
    rating: 4.3,
    reviews: 3,
    referrals: 0,
    location: { lat: 10.768917, lng: 106.691064 },
    tags: ['Mới', 'Thích thử', 'Trẻ'],
    socialMedia: {
      instagram: '@diem_pham95',
      tiktok: '@diempham'
    }
  },
  {
    id: '5',
    name: 'Hoàng Minh Đức',
    phone: '0934567890',
    email: 'hoangminhduc@gmail.com',
    address: 'Số 654, Đường Cách Mạng Tháng 8, Phường 11, Quận 10, TP.HCM',
    tier: 'Kim cương',
    tierId: 'diamond',
    tierColor: '#1890ff',
    loyaltyPoints: 5800,
    totalSpent: 25000000,
    totalOrders: 120,
    lastVisit: '2024-01-22',
    birthDate: '1982-07-28',
    gender: 'Nam',
    status: 'active',
    notes: 'CEO công ty, thường tổ chức họp tại quán',
    avatar: 'https://i.pravatar.cc/150?img=5',
    joinDate: '2022-05-15',
    lastOrderDate: '2024-01-22',
    averageOrderValue: 208333,
    favoriteProducts: ['Espresso', 'Bánh sandwich', 'Nước ép'],
    preferredPayment: 'Thẻ công ty',
    rating: 5.0,
    reviews: 35,
    referrals: 15,
    location: { lat: 10.773228, lng: 106.667683 },
    tags: ['Diamond', 'CEO', 'Họp nhóm', 'VIP'],
    socialMedia: {
      linkedin: 'hoangminhduc',
      facebook: 'duc.hoang.ceo'
    }
  }
];

// Customer tier configuration
const customerTiers = {
  bronze: {
    name: 'Đồng',
    color: '#d4844b',
    icon: <TrophyOutlined />,
    minSpent: 0,
    benefits: ['Tích điểm cơ bản', 'Ưu đãi sinh nhật']
  },
  silver: {
    name: 'Bạc',
    color: '#8c8c8c',
    icon: <CrownOutlined />,
    minSpent: 2000000,
    benefits: ['Giảm giá 5%', 'Ưu tiên đặt bàn', 'Quà tặng đặc biệt']
  },
  gold: {
    name: 'Vàng',
    color: '#faad14',
    icon: <StarOutlined />,
    minSpent: 5000000,
    benefits: ['Giảm giá 10%', 'Giao hàng miễn phí', 'Tích điểm x2']
  },
  platinum: {
    name: 'Bạch kim',
    color: '#722ed1',
    icon: <GiftOutlined />,
    minSpent: 10000000,
    benefits: ['Giảm giá 15%', 'Dịch vụ cá nhân hóa', 'Sự kiện độc quyền']
  },
  diamond: {
    name: 'Kim cương',
    color: '#1890ff',
    icon: <ThunderboltOutlined />,
    minSpent: 20000000,
    benefits: ['Giảm giá 20%', 'Quản lý tài khoản riêng', 'Ưu đãi đặc biệt']
  }
};

// Mock order history data
const mockOrderHistory = [
  {
    id: 'ORD-2024-001',
    customerId: '1',
    date: '2024-01-20',
    total: 250000,
    status: 'completed',
    items: [
      { name: 'Cà phê đen', quantity: 2, price: 25000 },
      { name: 'Bánh croissant', quantity: 1, price: 35000 },
      { name: 'Trà sữa', quantity: 1, price: 45000 }
    ],
    paymentMethod: 'Thẻ tín dụng'
  },
  {
    id: 'ORD-2024-002',
    customerId: '2',
    date: '2024-01-21',
    total: 180000,
    status: 'completed',
    items: [
      { name: 'Bánh tiramisu', quantity: 1, price: 65000 },
      { name: 'Latte', quantity: 2, price: 40000 },
      { name: 'Macaron', quantity: 3, price: 15000 }
    ],
    paymentMethod: 'Chuyển khoản'
  }
];

// Mock spending chart data
const mockSpendingData = [
  { month: 'T1', amount: 450000 },
  { month: 'T2', amount: 380000 },
  { month: 'T3', amount: 520000 },
  { month: 'T4', amount: 490000 },
  { month: 'T5', amount: 610000 },
  { month: 'T6', amount: 580000 },
  { month: 'T7', amount: 650000 },
  { month: 'T8', amount: 720000 },
  { month: 'T9', amount: 680000 },
  { month: 'T10', amount: 750000 },
  { month: 'T11', amount: 820000 },
  { month: 'T12', amount: 890000 }
];

const ModernCustomerPage: React.FC = () => {
  const { setPageTitle, setBreadcrumbs } = usePage();
  
  // State management
  const [customers, setCustomers] = useState(mockCustomers);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // View and layout
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  
  // Search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTier, setSelectedTier] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedGender, setSelectedGender] = useState('all');
  const [sortBy, setSortBy] = useState('name-asc');
  const [spendingRange, setSpendingRange] = useState<[number, number]>([0, 50000000]);
  
  // Modals and drawers
  const [customerModalVisible, setCustomerModalVisible] = useState(false);
  const [customerDetailVisible, setCustomerDetailVisible] = useState(false);
  const [filterDrawerVisible, setFilterDrawerVisible] = useState(false);
  const [bulkModalVisible, setBulkModalVisible] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  
  // Forms
  const [form] = Form.useForm();
  const [bulkForm] = Form.useForm();
  
  // Debounced search
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  
  // Filtered customers
  const filteredCustomers = useMemo(() => {
    let filtered = [...customers];
    
    // Search filter
    if (debouncedSearchQuery) {
      filtered = filtered.filter(customer =>
        customer.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        customer.phone.includes(debouncedSearchQuery) ||
        customer.email.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
      );
    }
    
    // Tier filter
    if (selectedTier !== 'all') {
      filtered = filtered.filter(customer => customer.tierId === selectedTier);
    }
    
    // Status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(customer => customer.status === selectedStatus);
    }
    
    // Gender filter
    if (selectedGender !== 'all') {
      filtered = filtered.filter(customer => customer.gender === selectedGender);
    }
    
    // Spending range filter
    filtered = filtered.filter(customer => 
      customer.totalSpent >= spendingRange[0] && customer.totalSpent <= spendingRange[1]
    );
    
    // Sort
    const [sortField, sortOrder] = sortBy.split('-');
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortField) {
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'spent':
          aValue = a.totalSpent;
          bValue = b.totalSpent;
          break;
        case 'orders':
          aValue = a.totalOrders;
          bValue = b.totalOrders;
          break;
        case 'points':
          aValue = a.loyaltyPoints;
          bValue = b.loyaltyPoints;
          break;
        case 'lastVisit':
          aValue = new Date(a.lastVisit);
          bValue = new Date(b.lastVisit);
          break;
        default:
          aValue = a.name;
          bValue = b.name;
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    return filtered;
  }, [customers, debouncedSearchQuery, selectedTier, selectedStatus, selectedGender, sortBy, spendingRange]);

  useEffect(() => {
    setPageTitle('Quản lý khách hàng');
    setBreadcrumbs([
      { title: 'Khách hàng' },
    ]);
  }, [setPageTitle, setBreadcrumbs]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const handleAddCustomer = () => {
    setEditingCustomer(null);
    form.resetFields();
    form.setFieldsValue({
      status: 'active',
      tier: 'bronze',
      gender: 'Nam',
      loyaltyPoints: 0
    });
    setCustomerModalVisible(true);
  };

  const handleEditCustomer = (customer: any) => {
    setEditingCustomer(customer);
    form.setFieldsValue({
      ...customer,
      birthDate: customer.birthDate ? dayjs(customer.birthDate) : null
    });
    setCustomerModalVisible(true);
  };

  const handleViewCustomer = (customer: any) => {
    setSelectedCustomer(customer);
    setCustomerDetailVisible(true);
  };

  const handleDeleteCustomer = (customer: any) => {
    confirm({
      title: 'Xác nhận xóa khách hàng',
      content: `Bạn có chắc muốn xóa khách hàng "${customer.name}"?`,
      icon: <ExclamationCircleOutlined />,
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: () => {
        setCustomers(customers.filter(c => c.id !== customer.id));
        message.success('Đã xóa khách hàng thành công');
      },
    });
  };

  const handleSaveCustomer = async (values: any) => {
    try {
      setSaving(true);
      
      const customerData = {
        ...values,
        id: editingCustomer?.id || Date.now().toString(),
        birthDate: values.birthDate ? values.birthDate.format('YYYY-MM-DD') : null,
        joinDate: editingCustomer?.joinDate || new Date().toISOString().split('T')[0],
        totalSpent: editingCustomer?.totalSpent || 0,
        totalOrders: editingCustomer?.totalOrders || 0,
        lastVisit: editingCustomer?.lastVisit || new Date().toISOString().split('T')[0],
        avatar: editingCustomer?.avatar || `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70) + 1}`,
        rating: editingCustomer?.rating || 0,
        reviews: editingCustomer?.reviews || 0,
        referrals: editingCustomer?.referrals || 0,
        tierColor: customerTiers[values.tierId as keyof typeof customerTiers]?.color || '#8c8c8c',
        tags: editingCustomer?.tags || [],
        favoriteProducts: editingCustomer?.favoriteProducts || [],
        socialMedia: editingCustomer?.socialMedia || {}
      };

      if (editingCustomer) {
        setCustomers(customers.map(c => c.id === editingCustomer.id ? customerData : c));
        message.success('Đã cập nhật khách hàng thành công');
      } else {
        setCustomers([...customers, customerData]);
        message.success('Đã thêm khách hàng mới thành công');
      }
      
      setCustomerModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error('Không thể lưu khách hàng');
    } finally {
      setSaving(false);
    }
  };

  const handleBulkAction = (action: string) => {
    if (selectedRowKeys.length === 0) {
      message.warning('Vui lòng chọn ít nhất một khách hàng');
      return;
    }

    switch (action) {
      case 'delete':
        confirm({
          title: 'Xác nhận xóa khách hàng',
          content: `Bạn có chắc muốn xóa ${selectedRowKeys.length} khách hàng đã chọn?`,
          icon: <ExclamationCircleOutlined />,
          okText: 'Xóa',
          okType: 'danger',
          cancelText: 'Hủy',
          onOk: () => {
            setCustomers(customers.filter(c => !selectedRowKeys.includes(c.id)));
            setSelectedRowKeys([]);
            message.success(`Đã xóa ${selectedRowKeys.length} khách hàng`);
          },
        });
        break;
      case 'activate':
        setCustomers(customers.map(c => 
          selectedRowKeys.includes(c.id) ? { ...c, status: 'active' } : c
        ));
        setSelectedRowKeys([]);
        message.success(`Đã kích hoạt ${selectedRowKeys.length} khách hàng`);
        break;
      case 'deactivate':
        setCustomers(customers.map(c => 
          selectedRowKeys.includes(c.id) ? { ...c, status: 'inactive' } : c
        ));
        setSelectedRowKeys([]);
        message.success(`Đã vô hiệu hóa ${selectedRowKeys.length} khách hàng`);
        break;
      case 'bulk-edit':
        setBulkModalVisible(true);
        break;
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedTier('all');
    setSelectedStatus('all');
    setSelectedGender('all');
    setSortBy('name-asc');
    setSpendingRange([0, 50000000]);
  };

  // Statistics
  const totalCustomers = filteredCustomers.length;
  const totalSpent = filteredCustomers.reduce((sum, c) => sum + c.totalSpent, 0);
  const totalOrders = filteredCustomers.reduce((sum, c) => sum + c.totalOrders, 0);
  const avgSpending = totalCustomers > 0 ? totalSpent / totalCustomers : 0;
  const activeCustomers = filteredCustomers.filter(c => c.status === 'active').length;
  const vipCustomers = filteredCustomers.filter(c => ['gold', 'platinum', 'diamond'].includes(c.tierId)).length;

  return (
    <div className="modern-customer-page">
      {/* Header */}
      <div className="customer-header">
        <div className="header-content">
          <div className="header-left">
            <Title level={2} className="customer-title">
              <TeamOutlined className="title-icon" />
              Quản lý khách hàng
            </Title>
            <Text className="customer-subtitle">
              Quản lý thông tin khách hàng với hệ thống tier và lịch sử mua hàng
            </Text>
          </div>
          <div className="header-right">
            <Space size="middle">
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
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="stats-section">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card className="stat-card">
              <div className="stat-content">
                <div className="stat-icon customers">
                  <TeamOutlined />
                </div>
                <div className="stat-info">
                  <div className="stat-value">{totalCustomers}</div>
                  <div className="stat-label">Khách hàng</div>
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
                  <div className="stat-value">{formatCurrency(totalSpent)}</div>
                  <div className="stat-label">Tổng chi tiêu</div>
                </div>
              </div>
            </Card>
          </Col>
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
                <div className="stat-icon vip">
                  <CrownOutlined />
                </div>
                <div className="stat-info">
                  <div className="stat-value">{vipCustomers}</div>
                  <div className="stat-label">VIP</div>
                </div>
              </div>
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
                placeholder="Tìm khách hàng..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: 300 }}
                allowClear
              />
              <Select
                value={selectedTier}
                onChange={setSelectedTier}
                style={{ width: 120 }}
                placeholder="Tier"
              >
                <Option value="all">Tất cả</Option>
                {Object.entries(customerTiers).map(([key, tier]) => (
                  <Option key={key} value={key}>
                    {tier.name}
                  </Option>
                ))}
              </Select>
              <Select
                value={sortBy}
                onChange={setSortBy}
                style={{ width: 180 }}
                placeholder="Sắp xếp"
              >
                <Option value="name-asc">Tên A-Z</Option>
                <Option value="name-desc">Tên Z-A</Option>
                <Option value="spent-desc">Chi tiêu cao nhất</Option>
                <Option value="spent-asc">Chi tiêu thấp nhất</Option>
                <Option value="orders-desc">Đơn hàng nhiều nhất</Option>
                <Option value="lastVisit-desc">Ghé thăm gần nhất</Option>
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
                  type={viewMode === 'cards' ? 'primary' : 'default'}
                  icon={<AppstoreOutlined />}
                  onClick={() => setViewMode('cards')}
                >
                  Thẻ
                </Button>
                <Button
                  type={viewMode === 'table' ? 'primary' : 'default'}
                  icon={<UnorderedListOutlined />}
                  onClick={() => setViewMode('table')}
                >
                  Bảng
                </Button>
              </Button.Group>
            </Space>
          </div>
        </div>

        {/* Results Count */}
        <div className="results-info">
          <Text type="secondary">
            Hiển thị {filteredCustomers.length} khách hàng
            {searchQuery && ` cho "${searchQuery}"`}
          </Text>
        </div>

        {/* Customer List */}
        <div className="customer-list">
          {viewMode === 'cards' ? (
            <div className="customer-cards">
              <Row gutter={[16, 16]}>
                {filteredCustomers.map(customer => (
                  <Col key={customer.id} xs={24} sm={12} md={8} lg={6}>
                    <Card 
                      className="customer-card"
                      hoverable
                      actions={[
                        <Tooltip title="Xem chi tiết">
                          <Button 
                            type="text" 
                            icon={<EyeOutlined />}
                            onClick={() => handleViewCustomer(customer)}
                          />
                        </Tooltip>,
                        <Tooltip title="Chỉnh sửa">
                          <Button 
                            type="text" 
                            icon={<EditOutlined />}
                            onClick={() => handleEditCustomer(customer)}
                          />
                        </Tooltip>,
                        <Tooltip title="Xóa">
                          <Button 
                            type="text" 
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => handleDeleteCustomer(customer)}
                          />
                        </Tooltip>
                      ]}
                    >
                      <div className="customer-card-content">
                        <div className="customer-card-header">
                          <div className="customer-avatar">
                            <Avatar 
                              src={customer.avatar} 
                              size={64}
                              icon={<UserOutlined />}
                            />
                            <div className="tier-badge" style={{ backgroundColor: customer.tierColor }}>
                              {customerTiers[customer.tierId as keyof typeof customerTiers]?.icon}
                            </div>
                          </div>
                          <div className="customer-basic-info">
                            <Title level={5} className="customer-name">
                              {customer.name}
                            </Title>
                            <Text type="secondary" className="customer-contact">
                              {customer.phone}
                            </Text>
                            <div className="customer-tier">
                              <Tag color={customer.tierColor}>
                                {customer.tier}
                              </Tag>
                            </div>
                          </div>
                        </div>
                        
                        <div className="customer-stats">
                          <Row gutter={8}>
                            <Col span={12}>
                              <div className="stat-item">
                                <div className="stat-value">{customer.totalOrders}</div>
                                <div className="stat-label">Đơn hàng</div>
                              </div>
                            </Col>
                            <Col span={12}>
                              <div className="stat-item">
                                <div className="stat-value">{customer.loyaltyPoints}</div>
                                <div className="stat-label">Điểm</div>
                              </div>
                            </Col>
                          </Row>
                        </div>
                        
                        <div className="customer-spending">
                          <Text strong>Tổng chi tiêu:</Text>
                          <Text className="spending-amount">
                            {formatCurrency(customer.totalSpent)}
                          </Text>
                        </div>
                        
                        <div className="customer-rating">
                          <Rate disabled defaultValue={customer.rating} />
                          <Text type="secondary">({customer.reviews} đánh giá)</Text>
                        </div>
                        
                        <div className="customer-status">
                          <Tag color={customer.status === 'active' ? 'green' : 'red'}>
                            {customer.status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
                          </Tag>
                          <Text type="secondary">
                            Lần cuối: {dayjs(customer.lastVisit).format('DD/MM/YYYY')}
                          </Text>
                        </div>
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
            </div>
          ) : (
            <Table
              dataSource={filteredCustomers}
              rowKey="id"
              loading={loading}
              pagination={{
                pageSize: 20,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => 
                  `${range[0]}-${range[1]} của ${total} khách hàng`,
              }}
              rowSelection={{
                selectedRowKeys,
                onChange: setSelectedRowKeys,
              }}
              columns={[
                {
                  title: 'Khách hàng',
                  key: 'customer',
                  render: (_, record) => (
                    <div className="customer-cell">
                      <Avatar 
                        src={record.avatar} 
                        size={40}
                        icon={<UserOutlined />}
                      />
                      <div className="customer-info">
                        <div className="customer-name">{record.name}</div>
                        <div className="customer-contact">
                          <Text type="secondary">{record.phone}</Text>
                          <Text type="secondary"> • {record.email}</Text>
                        </div>
                      </div>
                    </div>
                  ),
                },
                {
                  title: 'Tier',
                  key: 'tier',
                  render: (_, record) => (
                    <div className="tier-cell">
                      <Tag color={record.tierColor} icon={customerTiers[record.tierId as keyof typeof customerTiers]?.icon}>
                        {record.tier}
                      </Tag>
                      <div className="loyalty-points">
                        <Text type="secondary">{record.loyaltyPoints} điểm</Text>
                      </div>
                    </div>
                  ),
                },
                {
                  title: 'Chi tiêu',
                  key: 'spending',
                  render: (_, record) => (
                    <div className="spending-cell">
                      <div className="total-spent">{formatCurrency(record.totalSpent)}</div>
                      <div className="avg-order">
                        <Text type="secondary">TB: {formatCurrency(record.averageOrderValue)}</Text>
                      </div>
                    </div>
                  ),
                },
                {
                  title: 'Đơn hàng',
                  key: 'orders',
                  render: (_, record) => (
                    <div className="orders-cell">
                      <div className="total-orders">{record.totalOrders}</div>
                      <div className="last-order">
                        <Text type="secondary">Cuối: {dayjs(record.lastOrderDate).format('DD/MM')}</Text>
                      </div>
                    </div>
                  ),
                },
                {
                  title: 'Đánh giá',
                  key: 'rating',
                  render: (_, record) => (
                    <div className="rating-cell">
                      <Rate disabled defaultValue={record.rating} />
                      <Text type="secondary">({record.reviews})</Text>
                    </div>
                  ),
                },
                {
                  title: 'Trạng thái',
                  key: 'status',
                  render: (_, record) => (
                    <div className="status-cell">
                      <Tag color={record.status === 'active' ? 'green' : 'red'}>
                        {record.status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
                      </Tag>
                      <div className="last-visit">
                        <Text type="secondary">Lần cuối: {dayjs(record.lastVisit).format('DD/MM/YYYY')}</Text>
                      </div>
                    </div>
                  ),
                },
                {
                  title: 'Hành động',
                  key: 'actions',
                  width: 120,
                  render: (_, record) => (
                    <Space>
                      <Tooltip title="Xem chi tiết">
                        <Button 
                          type="text" 
                          icon={<EyeOutlined />}
                          onClick={() => handleViewCustomer(record)}
                        />
                      </Tooltip>
                      <Tooltip title="Chỉnh sửa">
                        <Button 
                          type="text" 
                          icon={<EditOutlined />}
                          onClick={() => handleEditCustomer(record)}
                        />
                      </Tooltip>
                      <Tooltip title="Xóa">
                        <Button 
                          type="text" 
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => handleDeleteCustomer(record)}
                        />
                      </Tooltip>
                    </Space>
                  ),
                },
              ]}
            />
          )}
        </div>
      </Card>

      {/* Customer Detail Drawer */}
      <Drawer
        title="Chi tiết khách hàng"
        placement="right"
        onClose={() => setCustomerDetailVisible(false)}
        visible={customerDetailVisible}
        width={600}
        className="customer-detail-drawer"
      >
        {selectedCustomer && (
          <div className="customer-detail-content">
            <div className="customer-profile">
              <div className="profile-header">
                <Avatar 
                  src={selectedCustomer.avatar} 
                  size={80}
                  icon={<UserOutlined />}
                />
                <div className="profile-info">
                  <Title level={4}>{selectedCustomer.name}</Title>
                  <Tag color={selectedCustomer.tierColor} icon={customerTiers[selectedCustomer.tierId as keyof typeof customerTiers]?.icon}>
                    {selectedCustomer.tier}
                  </Tag>
                  <div className="profile-meta">
                    <Text type="secondary">{selectedCustomer.phone}</Text>
                    <Text type="secondary"> • {selectedCustomer.email}</Text>
                  </div>
                </div>
              </div>
              
              <div className="profile-stats">
                <Row gutter={16}>
                  <Col span={8}>
                    <Statistic
                      title="Tổng chi tiêu"
                      value={selectedCustomer.totalSpent}
                      formatter={(value) => formatCurrency(Number(value))}
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic
                      title="Đơn hàng"
                      value={selectedCustomer.totalOrders}
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic
                      title="Điểm tích lũy"
                      value={selectedCustomer.loyaltyPoints}
                    />
                  </Col>
                </Row>
              </div>
            </div>
            
            <Tabs defaultActiveKey="info">
              <TabPane tab="Thông tin" key="info">
                <div className="customer-info-tab">
                  <Row gutter={[16, 16]}>
                    <Col span={12}>
                      <div className="info-item">
                        <Text strong>Giới tính:</Text>
                        <Text>{selectedCustomer.gender}</Text>
                      </div>
                    </Col>
                    <Col span={12}>
                      <div className="info-item">
                        <Text strong>Sinh nhật:</Text>
                        <Text>{dayjs(selectedCustomer.birthDate).format('DD/MM/YYYY')}</Text>
                      </div>
                    </Col>
                    <Col span={24}>
                      <div className="info-item">
                        <Text strong>Địa chỉ:</Text>
                        <Text>{selectedCustomer.address}</Text>
                      </div>
                    </Col>
                    <Col span={12}>
                      <div className="info-item">
                        <Text strong>Ngày tham gia:</Text>
                        <Text>{dayjs(selectedCustomer.joinDate).format('DD/MM/YYYY')}</Text>
                      </div>
                    </Col>
                    <Col span={12}>
                      <div className="info-item">
                        <Text strong>Lần cuối ghé thăm:</Text>
                        <Text>{dayjs(selectedCustomer.lastVisit).format('DD/MM/YYYY')}</Text>
                      </div>
                    </Col>
                    <Col span={24}>
                      <div className="info-item">
                        <Text strong>Ghi chú:</Text>
                        <Text>{selectedCustomer.notes}</Text>
                      </div>
                    </Col>
                  </Row>
                </div>
              </TabPane>
              
              <TabPane tab="Lịch sử" key="history">
                <div className="customer-history-tab">
                  <div className="spending-chart">
                    <Title level={5}>Biểu đồ chi tiêu</Title>
                    <ResponsiveContainer width="100%" height={200}>
                      <AreaChart data={mockSpendingData}>
                        <defs>
                          <linearGradient id="colorSpending" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#1890ff" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#1890ff" stopOpacity={0.1}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <ChartTooltip formatter={(value) => [formatCurrency(value as number), 'Chi tiêu']} />
                        <Area 
                          type="monotone" 
                          dataKey="amount" 
                          stroke="#1890ff" 
                          fillOpacity={1} 
                          fill="url(#colorSpending)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="order-history">
                    <Title level={5}>Đơn hàng gần đây</Title>
                    <Timeline>
                      {mockOrderHistory.filter(order => order.customerId === selectedCustomer.id).map(order => (
                        <Timeline.Item key={order.id}>
                          <div className="order-item">
                            <div className="order-header">
                              <Text strong>{order.id}</Text>
                              <Text type="secondary">{dayjs(order.date).format('DD/MM/YYYY')}</Text>
                            </div>
                            <div className="order-details">
                              <Text>Tổng tiền: {formatCurrency(order.total)}</Text>
                              <Tag color="green">Hoàn thành</Tag>
                            </div>
                            <div className="order-items">
                              {order.items.map((item, index) => (
                                <Text key={index} type="secondary">
                                  {item.name} x{item.quantity}
                                </Text>
                              ))}
                            </div>
                          </div>
                        </Timeline.Item>
                      ))}
                    </Timeline>
                  </div>
                </div>
              </TabPane>
              
              <TabPane tab="Sở thích" key="preferences">
                <div className="customer-preferences-tab">
                  <div className="favorite-products">
                    <Title level={5}>Sản phẩm yêu thích</Title>
                    <List
                      dataSource={selectedCustomer.favoriteProducts}
                      renderItem={(product: string) => (
                        <List.Item>
                          <Text>{product}</Text>
                        </List.Item>
                      )}
                    />
                  </div>
                  
                  <div className="preferences-info">
                    <Row gutter={[16, 16]}>
                      <Col span={12}>
                        <div className="info-item">
                          <Text strong>Thanh toán ưa thích:</Text>
                          <Text>{selectedCustomer.preferredPayment}</Text>
                        </div>
                      </Col>
                      <Col span={12}>
                        <div className="info-item">
                          <Text strong>Số lần giới thiệu:</Text>
                          <Text>{selectedCustomer.referrals}</Text>
                        </div>
                      </Col>
                    </Row>
                  </div>
                  
                  <div className="customer-tags">
                    <Title level={5}>Thẻ gắn</Title>
                    <Space wrap>
                      {selectedCustomer.tags.map((tag: string) => (
                        <Tag key={tag} color="blue">{tag}</Tag>
                      ))}
                    </Space>
                  </div>
                </div>
              </TabPane>
            </Tabs>
          </div>
        )}
      </Drawer>

      {/* Customer Modal */}
      <Modal
        title={editingCustomer ? 'Chỉnh sửa khách hàng' : 'Thêm khách hàng mới'}
        visible={customerModalVisible}
        onCancel={() => setCustomerModalVisible(false)}
        footer={null}
        width={600}
        className="customer-modal"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveCustomer}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Tên khách hàng"
                name="name"
                rules={[{ required: true, message: 'Vui lòng nhập tên khách hàng' }]}
              >
                <Input placeholder="Nhập tên khách hàng" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Số điện thoại"
                name="phone"
                rules={[{ required: true, message: 'Vui lòng nhập số điện thoại' }]}
              >
                <Input placeholder="Nhập số điện thoại" />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Email"
                name="email"
                rules={[{ type: 'email', message: 'Email không hợp lệ' }]}
              >
                <Input placeholder="Nhập email" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Giới tính"
                name="gender"
              >
                <Select placeholder="Chọn giới tính">
                  <Option value="Nam">Nam</Option>
                  <Option value="Nữ">Nữ</Option>
                  <Option value="Khác">Khác</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item
            label="Địa chỉ"
            name="address"
          >
            <Input.TextArea rows={3} placeholder="Nhập địa chỉ" />
          </Form.Item>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Sinh nhật"
                name="birthDate"
              >
                <DatePicker style={{ width: '100%' }} placeholder="Chọn ngày sinh" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Tier"
                name="tierId"
              >
                <Select placeholder="Chọn tier">
                  {Object.entries(customerTiers).map(([key, tier]) => (
                    <Option key={key} value={key}>
                      {tier.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Điểm tích lũy"
                name="loyaltyPoints"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  placeholder="0"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Trạng thái"
                name="status"
              >
                <Select placeholder="Chọn trạng thái">
                  <Option value="active">Hoạt động</Option>
                  <Option value="inactive">Không hoạt động</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item
            label="Ghi chú"
            name="notes"
          >
            <Input.TextArea rows={3} placeholder="Ghi chú về khách hàng" />
          </Form.Item>
          
          <div className="form-actions">
            <Space>
              <Button onClick={() => setCustomerModalVisible(false)}>
                Hủy
              </Button>
              <Button type="primary" htmlType="submit" loading={saving}>
                {editingCustomer ? 'Cập nhật' : 'Thêm mới'}
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default ModernCustomerPage;