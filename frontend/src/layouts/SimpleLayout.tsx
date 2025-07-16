import {
    AnalyticsOutlined,
    BarcodeOutlined,
    BellOutlined,
    CreditCardOutlined,
    CustomerServiceOutlined,
    DashboardOutlined,
    DatabaseOutlined,
    FileTextOutlined,
    GlobalOutlined,
    LogoutOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    SettingOutlined,
    ShopOutlined,
    ShoppingCartOutlined,
    TeamOutlined,
    UserOutlined,
    WarningOutlined,
    ClockCircleOutlined,
    CrownOutlined,
    SafetyOutlined,
    CloudOutlined,
    RocketOutlined,
    TrophyOutlined,
    HeartOutlined,
    BookOutlined,
    ThunderboltOutlined,
    BugOutlined,
    ApiOutlined,
    EyeOutlined,
    LineChartOutlined,
    BarChartOutlined,
    PieChartOutlined,
    FundOutlined,
    StockOutlined,
    WalletOutlined,
    BankOutlined,
    GiftOutlined,
    TagsOutlined,
    CalendarOutlined,
    MailOutlined,
    PhoneOutlined,
    PrinterOutlined,
    ScanOutlined,
    QrcodeOutlined,
    WifiOutlined,
    SecurityScanOutlined,
    KeyOutlined,
    AuditOutlined,
    HistoryOutlined,
    BackupOutlined,
    MonitorOutlined,
    AlertOutlined,
    SyncOutlined,
    LoadingOutlined,
    CheckCircleOutlined,
    ExclamationCircleOutlined
} from '@ant-design/icons';
import { Avatar, Badge, Button, Dropdown, Layout, Menu, notification, Space, theme, Typography, Tooltip, Switch, Divider, Progress, Statistic, Card, Row, Col, Alert, Tag, List, Modal, Form, Input, Select, DatePicker, TimePicker, Slider, Rate, Checkbox, Radio, Upload, Transfer, Tree, Cascader, AutoComplete, Mentions, ConfigProvider, Affix, BackTop, Drawer, Tabs, Collapse, Steps, Timeline, Calendar, Popover, Empty, Skeleton, Spin, Result, Breadcrumb, Anchor, PageHeader } from 'antd';
import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import dayjs from 'dayjs';

// Import missing icon
import { QuestionCircleOutlined } from '@ant-design/icons';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;
const { useToken } = theme;

const SimpleLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [systemHealth, setSystemHealth] = useState({ status: 'healthy', uptime: '99.9%', load: 67 });
  const [realTimeStats, setRealTimeStats] = useState({ users: 127, orders: 45, revenue: 2450000 });
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [settingsDrawerVisible, setSettingsDrawerVisible] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const { token } = useToken();

  // Enhanced menu with admin features
  const menuItems = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: 'Tổng quan',
      children: [
        { key: '/dashboard', label: 'Dashboard chính', icon: <AnalyticsOutlined /> },
        { key: '/dashboard/admin', label: 'Admin Dashboard', icon: <CrownOutlined /> },
        { key: '/dashboard/reports', label: 'Báo cáo tổng hợp', icon: <LineChartOutlined /> },
        { key: '/dashboard/realtime', label: 'Theo dõi thời gian thực', icon: <SyncOutlined /> }
      ]
    },
    {
      key: 'business',
      icon: <ShopOutlined />,
      label: 'Kinh doanh',
      children: [
        { key: '/pos', label: 'Bán hàng (POS)', icon: <ShoppingCartOutlined /> },
        { key: '/orders', label: 'Quản lý đơn hàng', icon: <FileTextOutlined /> },
        { key: '/orders/tracking', label: 'Theo dõi đơn hàng', icon: <EyeOutlined /> },
        { key: '/orders/returns', label: 'Trả hàng & Hoàn tiền', icon: <HistoryOutlined /> }
      ]
    },
    {
      key: 'inventory',
      icon: <DatabaseOutlined />,
      label: 'Kho hàng',
      children: [
        { key: '/products', label: 'Quản lý sản phẩm', icon: <BarcodeOutlined /> },
        { key: '/inventory', label: 'Tồn kho', icon: <StockOutlined /> },
        { key: '/inventory/import', label: 'Nhập hàng', icon: <CloudOutlined /> },
        { key: '/inventory/export', label: 'Xuất hàng', icon: <RocketOutlined /> },
        { key: '/suppliers', label: 'Nhà cung cấp', icon: <BookOutlined /> }
      ]
    },
    {
      key: 'customers',
      icon: <UserOutlined />,
      label: 'Khách hàng',
      children: [
        { key: '/customers', label: 'Danh sách khách hàng', icon: <TeamOutlined /> },
        { key: '/customers/loyalty', label: 'Chương trình tích điểm', icon: <GiftOutlined /> },
        { key: '/customers/segments', label: 'Phân khúc khách hàng', icon: <TagsOutlined /> },
        { key: '/customers/feedback', label: 'Phản hồi khách hàng', icon: <HeartOutlined /> }
      ]
    },
    {
      key: 'finance',
      icon: <WalletOutlined />,
      label: 'Tài chính',
      children: [
        { key: '/payments', label: 'Thanh toán', icon: <CreditCardOutlined /> },
        { key: '/finance/revenue', label: 'Doanh thu', icon: <FundOutlined /> },
        { key: '/finance/expenses', label: 'Chi phí', icon: <BankOutlined /> },
        { key: '/finance/taxes', label: 'Thuế VAT', icon: <AuditOutlined /> },
        { key: '/finance/reports', label: 'Báo cáo tài chính', icon: <PieChartOutlined /> }
      ]
    },
    {
      key: 'analytics',
      icon: <BarChartOutlined />,
      label: 'Phân tích',
      children: [
        { key: '/analytics', label: 'Thống kê tổng quan', icon: <LineChartOutlined /> },
        { key: '/analytics/sales', label: 'Phân tích bán hàng', icon: <TrophyOutlined /> },
        { key: '/analytics/products', label: 'Phân tích sản phẩm', icon: <BarcodeOutlined /> },
        { key: '/analytics/customers', label: 'Phân tích khách hàng', icon: <UserOutlined /> },
        { key: '/analytics/performance', label: 'Hiệu suất nhân viên', icon: <ThunderboltOutlined /> }
      ]
    },
    {
      key: 'staff',
      icon: <TeamOutlined />,
      label: 'Nhân sự',
      children: [
        { key: '/staff', label: 'Quản lý nhân viên', icon: <UserOutlined /> },
        { key: '/staff/performance', label: 'Đánh giá hiệu suất', icon: <TrophyOutlined /> },
        { key: '/staff/schedule', label: 'Lịch làm việc', icon: <CalendarOutlined /> },
        { key: '/staff/payroll', label: 'Bảng lương', icon: <WalletOutlined /> },
        { key: '/staff/training', label: 'Đào tạo', icon: <BookOutlined /> }
      ]
    },
    {
      key: 'system',
      icon: <SettingOutlined />,
      label: 'Hệ thống',
      children: [
        { key: '/settings', label: 'Cài đặt chung', icon: <SettingOutlined /> },
        { key: '/settings/security', label: 'Bảo mật', icon: <SafetyOutlined /> },
        { key: '/settings/backup', label: 'Sao lưu & Khôi phục', icon: <BackupOutlined /> },
        { key: '/settings/integrations', label: 'Tích hợp API', icon: <ApiOutlined /> },
        { key: '/settings/monitoring', label: 'Giám sát hệ thống', icon: <MonitorOutlined /> },
        { key: '/settings/logs', label: 'Nhật ký hệ thống', icon: <AuditOutlined /> }
      ]
    }
  ];

  // Enhanced notifications with more data
  const notifications = [
    { id: 1, title: 'Đơn hàng mới #DH2025001', message: 'Nguyễn Văn A - 2.450.000₫', time: '2 phút trước', read: false, type: 'order', priority: 'high' },
    { id: 2, title: 'Sản phẩm sắp hết hàng', message: 'iPhone 15 Pro Max chỉ còn 5 chiếc', time: '15 phút trước', read: false, type: 'inventory', priority: 'medium' },
    { id: 3, title: 'Thanh toán thành công', message: 'VNPay - 1.890.000₫', time: '45 phút trước', read: true, type: 'payment', priority: 'low' },
    { id: 4, title: 'Khách hàng VIP mới', message: 'Trần Thị B - Tích điểm 1.500', time: '1 giờ trước', read: false, type: 'customer', priority: 'medium' },
    { id: 5, title: 'Backup hoàn thành', message: 'Sao lưu ngày 16/01/2025 thành công', time: '2 giờ trước', read: true, type: 'system', priority: 'low' },
    { id: 6, title: 'Lỗi thanh toán', message: 'Giao dịch MoMo #MM789 thất bại', time: '3 giờ trước', read: false, type: 'error', priority: 'high' }
  ];

  // Initialize component
  useEffect(() => {
    // Load user info from localStorage
    const userInfo = localStorage.getItem('user');
    if (userInfo) {
      try {
        setCurrentUser(JSON.parse(userInfo));
      } catch (error) {
        console.error('Error parsing user info:', error);
      }
    }

    // Load theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setDarkMode(true);
    }

    // Simulate real-time updates
    const interval = setInterval(() => {
      setRealTimeStats(prev => ({
        users: Math.max(prev.users + Math.floor(Math.random() * 10) - 5, 50),
        orders: Math.max(prev.orders + Math.floor(Math.random() * 5) - 2, 0),
        revenue: prev.revenue + Math.floor(Math.random() * 500000) - 250000
      }));

      setSystemHealth(prev => ({
        ...prev,
        load: Math.min(Math.max(prev.load + Math.floor(Math.random() * 10) - 5, 30), 90)
      }));
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    Modal.confirm({
      title: 'Xác nhận đăng xuất',
      content: 'Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?',
      onOk: () => {
        // Clear any stored auth data
        localStorage.removeItem('auth');
        localStorage.removeItem('user');
        // Show notification
        notification.success({
          message: 'Đăng xuất thành công',
          description: 'Bạn đã đăng xuất khỏi hệ thống an toàn.',
          duration: 3
        });
        // Redirect to login
        navigate('/auth/login');
      }
    });
  };

  const handleThemeToggle = (checked: boolean) => {
    setDarkMode(checked);
    localStorage.setItem('theme', checked ? 'dark' : 'light');
    notification.info({
      message: 'Thay đổi giao diện',
      description: `Đã chuyển sang chế độ ${checked ? 'tối' : 'sáng'}`,
      duration: 2
    });
  };

  const handleMenuClick = useCallback((key: string) => {
    navigate(key);
  }, [navigate]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order': return <ShoppingCartOutlined />;
      case 'inventory': return <WarningOutlined />;
      case 'payment': return <CreditCardOutlined />;
      case 'customer': return <UserOutlined />;
      case 'system': return <SettingOutlined />;
      case 'error': return <ExclamationCircleOutlined />;
      default: return <BellOutlined />;
    }
  };

  const getNotificationColor = (type: string, priority: string) => {
    if (priority === 'high') return '#ff4d4f';
    if (priority === 'medium') return '#fa8c16';
    switch (type) {
      case 'order': return '#52c41a';
      case 'payment': return '#1890ff';
      case 'customer': return '#722ed1';
      case 'system': return '#13c2c2';
      case 'error': return '#ff4d4f';
      default: return '#8c8c8c';
    }
  };

  const notificationMenu = (
    <div style={{ width: 400, maxHeight: 500, overflowY: 'auto' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography.Title level={5} style={{ margin: 0 }}>Thông báo</Typography.Title>
        <Space>
          <Tag color="blue">{notifications.filter(n => !n.read).length} mới</Tag>
          <Button type="link" size="small" onClick={() => notification.info({ message: 'Đánh dấu tất cả đã đọc' })}>Đánh dấu đã đọc</Button>
        </Space>
      </div>
      <List
        itemLayout="horizontal"
        dataSource={notifications}
        renderItem={(item) => (
          <List.Item
            style={{ 
              padding: '12px 16px',
              backgroundColor: item.read ? 'transparent' : '#f6f8ff',
              borderLeft: `3px solid ${getNotificationColor(item.type, item.priority)}`,
              cursor: 'pointer'
            }}
            onClick={() => {
              notification.info({ message: 'Xem chi tiết thông báo', description: item.title });
            }}
          >
            <List.Item.Meta
              avatar={
                <Avatar 
                  style={{ backgroundColor: getNotificationColor(item.type, item.priority) }}
                  icon={getNotificationIcon(item.type)}
                  size="small"
                />
              }
              title={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: item.read ? 'normal' : 'bold', fontSize: '14px' }}>{item.title}</span>
                  <span style={{ fontSize: '11px', color: '#8c8c8c' }}>{item.time}</span>
                </div>
              }
              description={
                <div>
                  <span style={{ fontSize: '12px', color: '#666' }}>{item.message}</span>
                  <div style={{ marginTop: 4 }}>
                    <Tag size="small" color={item.priority === 'high' ? 'red' : item.priority === 'medium' ? 'orange' : 'default'}>
                      {item.priority === 'high' ? 'Quan trọng' : item.priority === 'medium' ? 'Trung bình' : 'Thấp'}
                    </Tag>
                  </div>
                </div>
              }
            />
          </List.Item>
        )}
      />
      <div style={{ padding: '8px 16px', borderTop: '1px solid #f0f0f0', textAlign: 'center' }}>
        <Button type="link" block onClick={() => navigate('/notifications')}>Xem tất cả thông báo</Button>
      </div>
    </div>
  );

  return (
    <ConfigProvider
      theme={{
        algorithm: darkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: '#1890ff',
          borderRadius: 8,
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }
      }}
    >
      <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        style={{
          boxShadow: '2px 0 8px rgba(0,0,0,0.15)',
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 10
        }}
      >
        <div style={{ 
          height: '64px', 
          padding: '16px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          background: `linear-gradient(135deg, ${token.colorPrimary} 0%, ${token.colorPrimaryDark || '#096dd9'} 100%)`,
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
        }}>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <ShopOutlined style={{ fontSize: '24px', color: 'white' }} />
          </motion.div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 'auto', opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Title level={4} style={{ color: 'white', margin: '0 0 0 8px', whiteSpace: 'nowrap' }}>
                  KhoAugment
                </Title>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* System Health Indicator */}
        <div style={{ padding: '8px 16px', borderBottom: '1px solid #303030' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ 
                width: 8, 
                height: 8, 
                borderRadius: '50%', 
                backgroundColor: systemHealth.status === 'healthy' ? '#52c41a' : '#ff4d4f',
                marginRight: 8
              }}></div>
              {!collapsed && (
                <span style={{ color: 'white', fontSize: '11px' }}>
                  {systemHealth.status === 'healthy' ? 'Hoạt động tốt' : 'Có vấn đề'}
                </span>
              )}
            </div>
            {!collapsed && (
              <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px' }}>
                {systemHealth.uptime}
              </span>
            )}
          </div>
          {!collapsed && (
            <div style={{ marginTop: 4 }}>
              <Progress 
                percent={systemHealth.load} 
                size="small" 
                showInfo={false}
                strokeColor={systemHealth.load > 80 ? '#ff4d4f' : '#52c41a'}
              />
            </div>
          )}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          style={{ border: 'none', background: 'transparent' }}
        >
          {menuItems.map(item => (
            item.children ? (
              <Menu.SubMenu
                key={item.key}
                icon={item.icon}
                title={item.label}
                style={{ 
                  borderRadius: collapsed ? 0 : '8px',
                  margin: collapsed ? 0 : '4px 8px',
                  overflow: 'hidden'
                }}
              >
                {item.children.map(child => (
                  <Menu.Item
                    key={child.key}
                    icon={child.icon}
                    onClick={() => handleMenuClick(child.key)}
                    style={{ 
                      borderRadius: '6px',
                      margin: '2px 4px',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {child.label}
                  </Menu.Item>
                ))}
              </Menu.SubMenu>
            ) : (
              <Menu.Item
                key={item.key}
                icon={item.icon}
                onClick={() => handleMenuClick(item.key)}
                style={{ 
                  borderRadius: collapsed ? 0 : '8px',
                  margin: collapsed ? 0 : '4px 8px',
                  transition: 'all 0.3s ease'
                }}
              >
                {item.label}
              </Menu.Item>
            )
          ))}
        </Menu>
        
        {/* Real-time Stats */}
        {!collapsed && (
          <div style={{ padding: '16px', borderTop: '1px solid #303030', marginTop: 'auto' }}>
            <div style={{ marginBottom: 8 }}>
              <Row gutter={8}>
                <Col span={12}>
                  <Statistic
                    title="Users"
                    value={realTimeStats.users}
                    valueStyle={{ color: '#52c41a', fontSize: '14px' }}
                    prefix={<UserOutlined />}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="Orders"
                    value={realTimeStats.orders}
                    valueStyle={{ color: '#1890ff', fontSize: '14px' }}
                    prefix={<ShoppingCartOutlined />}
                  />
                </Col>
              </Row>
            </div>
            <div style={{ textAlign: 'center', marginTop: 8 }}>
              <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px' }}>
                Doanh thu: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(realTimeStats.revenue)}
              </span>
            </div>
          </div>
        )}
      </Sider>
      <Layout style={{ marginLeft: collapsed ? 80 : 200, transition: 'all 0.2s' }}>
        <Header style={{ 
          padding: '0 16px', 
          background: 'white', 
          display: 'flex', 
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 2px 8px rgba(0,0,0,0.09)',
          position: 'sticky',
          top: 0,
          zIndex: 9,
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: '16px', width: 64, height: 64 }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <Title level={4} style={{ margin: 0, color: token.colorPrimary }}>
                KhoAugment POS System
              </Title>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <GlobalOutlined style={{ fontSize: 16, color: token.colorPrimary }} />
                <Text style={{ fontSize: '14px' }}>Tiếng Việt</Text>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <WifiOutlined style={{ fontSize: 16, color: '#52c41a' }} />
                <Text style={{ fontSize: '12px', color: '#52c41a' }}>Online</Text>
              </div>
            </div>
            
            {/* Real-time indicators */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <Tooltip title="Người dùng đang online">
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 8, height: 8, backgroundColor: '#52c41a', borderRadius: '50%', animation: 'pulse 2s infinite' }}></div>
                  <span style={{ fontSize: '12px', color: '#52c41a' }}>{realTimeStats.users}</span>
                </div>
              </Tooltip>
              <Tooltip title="Đơn hàng đang xử lý">
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <SyncOutlined spin style={{ fontSize: 12, color: '#1890ff' }} />
                  <span style={{ fontSize: '12px', color: '#1890ff' }}>{realTimeStats.orders}</span>
                </div>
              </Tooltip>
            </div>
          </div>
          <Space size="large">
            <Dropdown overlay={notificationMenu} placement="bottomRight" arrow trigger={['click']} overlayStyle={{ padding: 0 }}>
              <Badge count={2} overflowCount={99}>
                <Button 
                  type="text" 
                  icon={<BellOutlined style={{ fontSize: '18px' }}/>}
                  style={{ height: 40, width: 40 }}
                />
              </Badge>
            </Dropdown>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Tooltip title="Chuyển chế độ tối/sáng">
                <Switch
                  checked={darkMode}
                  onChange={handleThemeToggle}
                  size="small"
                  checkedChildren={<span style={{ fontSize: '10px' }}>🌙</span>}
                  unCheckedChildren={<span style={{ fontSize: '10px' }}>☀️</span>}
                />
              </Tooltip>
              
              <Dropdown
                menu={{
                  items: [
                    {
                      key: '1',
                      icon: <UserOutlined />,
                      label: 'Thông tin cá nhân',
                      onClick: () => setProfileModalVisible(true)
                    },
                    {
                      key: '2',
                      icon: <SettingOutlined />,
                      label: 'Cài đặt',
                      onClick: () => setSettingsDrawerVisible(true)
                    },
                    {
                      key: '3',
                      icon: <CustomerServiceOutlined />,
                      label: 'Hỗ trợ',
                      onClick: () => navigate('/help')
                    },
                    {
                      key: '4',
                      icon: <QuestionCircleOutlined />,
                      label: 'Hướng dẫn',
                      onClick: () => navigate('/guide')
                    },
                    {
                      type: 'divider',
                    },
                    {
                      key: '5',
                      icon: <LogoutOutlined />,
                      label: 'Đăng xuất',
                      onClick: handleLogout
                    },
                  ]
                }}
              >
                <Space style={{ cursor: 'pointer' }}>
                  <Avatar 
                    style={{ backgroundColor: token.colorPrimary }} 
                    icon={<UserOutlined />}
                    size="small"
                  />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '14px', fontWeight: 500 }}>
                      {currentUser?.name || 'Admin'}
                    </span>
                    <span style={{ fontSize: '11px', color: '#8c8c8c' }}>
                      {currentUser?.role || 'admin'}
                    </span>
                  </div>
                </Space>
              </Dropdown>
            </div>
          </Space>
        </Header>
        <Content style={{ 
          margin: '24px 16px', 
          padding: 0, 
          background: 'transparent',
          minHeight: 280 
        }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            style={{ height: '100%' }}
          >
            <Outlet />
          </motion.div>
        </Content>
        
        {/* Profile Modal */}
        <Modal
          title="Thông tin cá nhân"
          open={profileModalVisible}
          onCancel={() => setProfileModalVisible(false)}
          footer={null}
          width={500}
        >
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <Avatar size={80} style={{ backgroundColor: token.colorPrimary }} icon={<UserOutlined />} />
            <Title level={4} style={{ margin: '16px 0 8px' }}>
              {currentUser?.name || 'Admin'}
            </Title>
            <Text type="secondary">{currentUser?.email || 'admin@khoaugment.com'}</Text>
          </div>
          
          <Descriptions bordered size="small">
            <Descriptions.Item label="Vai trò" span={3}>
              <Tag color="blue">{currentUser?.role || 'admin'}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Email" span={3}>
              {currentUser?.email || 'admin@khoaugment.com'}
            </Descriptions.Item>
            <Descriptions.Item label="Đăng nhập cuối">
              {dayjs().format('DD/MM/YYYY HH:mm')}
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              <Badge status="success" text="Đang hoạt động" />
            </Descriptions.Item>
          </Descriptions>
          
          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <Space>
              <Button type="primary" onClick={() => navigate('/profile/edit')}>Chỉnh sửa thông tin</Button>
              <Button onClick={() => navigate('/profile/security')}>Bảo mật</Button>
            </Space>
          </div>
        </Modal>
        
        {/* Settings Drawer */}
        <Drawer
          title="Cài đặt hệ thống"
          placement="right"
          onClose={() => setSettingsDrawerVisible(false)}
          open={settingsDrawerVisible}
          width={400}
        >
          <Collapse defaultActiveKey={['1']} ghost>
            <Panel header="Giao diện" key="1">
              <Form layout="vertical">
                <Form.Item label="Chế độ hiển thị">
                  <Radio.Group defaultValue="light">
                    <Radio value="light">Sáng</Radio>
                    <Radio value="dark">Tối</Radio>
                    <Radio value="auto">Tự động</Radio>
                  </Radio.Group>
                </Form.Item>
                <Form.Item label="Ngôn ngữ">
                  <Select defaultValue="vi" style={{ width: '100%' }}>
                    <Select.Option value="vi">Tiếng Việt</Select.Option>
                    <Select.Option value="en">English</Select.Option>
                  </Select>
                </Form.Item>
                <Form.Item label="Kích thước font">
                  <Slider defaultValue={14} min={12} max={18} marks={{ 12: '12px', 14: '14px', 16: '16px', 18: '18px' }} />
                </Form.Item>
              </Form>
            </Panel>
            
            <Panel header="Thông báo" key="2">
              <Form layout="vertical">
                <Form.Item label="Thông báo desktop">
                  <Switch defaultChecked />
                </Form.Item>
                <Form.Item label="Âm thanh thông báo">
                  <Switch />
                </Form.Item>
                <Form.Item label="Thông báo email">
                  <Switch defaultChecked />
                </Form.Item>
                <Form.Item label="Tần suất kiểm tra">
                  <Select defaultValue="5" style={{ width: '100%' }}>
                    <Select.Option value="1">1 phút</Select.Option>
                    <Select.Option value="5">5 phút</Select.Option>
                    <Select.Option value="10">10 phút</Select.Option>
                    <Select.Option value="30">30 phút</Select.Option>
                  </Select>
                </Form.Item>
              </Form>
            </Panel>
            
            <Panel header="Hệ thống" key="3">
              <Form layout="vertical">
                <Form.Item label="Tự động sao lưu">
                  <Switch defaultChecked />
                </Form.Item>
                <Form.Item label="Tự động cập nhật">
                  <Switch />
                </Form.Item>
                <Form.Item label="Chế độ bảo trì">
                  <Switch />
                </Form.Item>
                <Form.Item label="Log level">
                  <Select defaultValue="info" style={{ width: '100%' }}>
                    <Select.Option value="error">Error</Select.Option>
                    <Select.Option value="warn">Warning</Select.Option>
                    <Select.Option value="info">Info</Select.Option>
                    <Select.Option value="debug">Debug</Select.Option>
                  </Select>
                </Form.Item>
              </Form>
            </Panel>
          </Collapse>
          
          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <Space>
              <Button type="primary" onClick={() => notification.success({ message: 'Cài đặt đã được lưu' })}>
                Lưu cài đặt
              </Button>
              <Button onClick={() => setSettingsDrawerVisible(false)}>Hủy</Button>
            </Space>
          </div>
        </Drawer>
        
        {/* Back to Top */}
        <BackTop />
        
        {/* System Status */}
        <div style={{ 
          position: 'fixed', 
          bottom: 16, 
          right: 16, 
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          gap: 8
        }}>
          <Tooltip title={`Tải hệ thống: ${systemHealth.load}%`}>
            <Card size="small" style={{ width: 120, textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: '#666' }}>System Load</div>
              <Progress 
                percent={systemHealth.load} 
                size="small" 
                format={() => `${systemHealth.load}%`}
                strokeColor={systemHealth.load > 80 ? '#ff4d4f' : '#52c41a'}
              />
            </Card>
          </Tooltip>
        </div>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
};

export default SimpleLayout;