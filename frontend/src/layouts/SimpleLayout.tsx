import {
    ApiOutlined,
    AuditOutlined,
    BankOutlined,
    BarChartOutlined,
    BarcodeOutlined,
    BellOutlined,
    BgColorsOutlined,
    BookOutlined,
    CalendarOutlined,
    ClockCircleOutlined,
    CloudOutlined,
    CloudUploadOutlined,
    CreditCardOutlined,
    CrownOutlined,
    DashboardOutlined,
    DatabaseOutlined,
    DesktopOutlined,
    EyeOutlined,
    FileTextOutlined,
    FundOutlined,
    GiftOutlined,
    HeartOutlined,
    HistoryOutlined,
    LineChartOutlined,
    LogoutOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    PieChartOutlined,
    RocketOutlined,
    SafetyOutlined,
    SettingOutlined,
    ShopOutlined,
    ShoppingCartOutlined,
    StockOutlined,
    SyncOutlined,
    TagsOutlined,
    TeamOutlined,
    ThunderboltOutlined,
    TrophyOutlined,
    UserOutlined,
    WalletOutlined,
    WarningOutlined
} from '@ant-design/icons';
import {
    Avatar, Badge,
    Breadcrumb,
    Button,
    Descriptions,
    Divider,
    Drawer,
    Dropdown, Layout, Menu,
    Modal,
    notification, Space,
    Switch,
    theme,
    Tooltip,
    Typography
} from 'antd';
import React, { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

// Import missing icon

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;
const { useToken } = theme;

interface SimpleLayoutProps {
  themeMode?: string;
  setThemeMode?: (mode: string) => void;
}

const SimpleLayout: React.FC<SimpleLayoutProps> = ({ themeMode = 'light', setThemeMode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [blueTheme, setBlueTheme] = useState(false);
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
        { key: '/dashboard', label: 'Dashboard chính', icon: <BarChartOutlined /> },
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
        { key: '/settings/backup', label: 'Sao lưu & Khôi phục', icon: <CloudUploadOutlined /> },
        { key: '/settings/integrations', label: 'Tích hợp API', icon: <ApiOutlined /> },
        { key: '/settings/monitoring', label: 'Giám sát hệ thống', icon: <DesktopOutlined /> },
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
    } else if (savedTheme === 'blue') {
      setBlueTheme(true);
      // Apply blue theme class to body
      document.body.classList.add('blue-theme');
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

    return () => {
      clearInterval(interval);
      // Clean up blue theme
      document.body.classList.remove('blue-theme');
    };
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
        // Redirect to login page
        navigate('/login');
      }
    });
  };

  const handleThemeToggle = (checked: boolean) => {
    setDarkMode(checked);
    setBlueTheme(false);
    
    if (checked) {
      setThemeMode?.('dark');
      document.body.classList.remove('blue-theme');
    } else {
      setThemeMode?.('light');
      document.body.classList.remove('blue-theme');
    }
  };

  const handleBlueThemeToggle = (checked: boolean) => {
    setBlueTheme(checked);
    setDarkMode(false);
    
    if (checked) {
      setThemeMode?.('blue');
      document.body.classList.add('blue-theme');
    } else {
      setThemeMode?.('light');
      document.body.classList.remove('blue-theme');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order': return <ShoppingCartOutlined style={{ color: '#1890ff' }} />;
      case 'inventory': return <DatabaseOutlined style={{ color: '#52c41a' }} />;
      case 'payment': return <CreditCardOutlined style={{ color: '#722ed1' }} />;
      case 'customer': return <UserOutlined style={{ color: '#faad14' }} />;
      case 'system': return <SettingOutlined style={{ color: '#13c2c2' }} />;
      case 'error': return <WarningOutlined style={{ color: '#f5222d' }} />;
      default: return <BellOutlined />;
    }
  };

  const getNotificationColor = (type: string, priority: string) => {
    if (priority === 'high') return '#f5222d';
    if (priority === 'medium') return '#faad14';
    if (priority === 'low') return '#52c41a';
    
    switch (type) {
      case 'order': return '#1890ff';
      case 'inventory': return '#52c41a';
      case 'payment': return '#722ed1';
      case 'customer': return '#faad14';
      case 'system': return '#13c2c2';
      case 'error': return '#f5222d';
      default: return '#d9d9d9';
    }
  };
  
  // Format Vietnamese currency
  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };
  
  const notificationMenu = (
    <Menu
      items={notifications.map(notification => ({
        key: notification.id,
        label: (
          <div style={{ padding: '0 8px' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center',
              borderLeft: `3px solid ${getNotificationColor(notification.type, notification.priority)}`,
              paddingLeft: '8px',
              opacity: notification.read ? 0.6 : 1
            }}>
              <Avatar 
                icon={getNotificationIcon(notification.type)} 
                style={{ 
                  backgroundColor: notification.read ? '#f0f0f0' : 'white',
                  marginRight: '12px'
                }} 
              />
              <div>
                <div style={{ fontWeight: notification.read ? 'normal' : 'bold' }}>{notification.title}</div>
                <div style={{ fontSize: '12px' }}>{notification.message}</div>
                <div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>
                  <ClockCircleOutlined style={{ marginRight: '4px' }} />
                  {notification.time}
                </div>
              </div>
            </div>
          </div>
        )
      }))}
      style={{ width: '360px' }}
    />
  );

  const userMenu = (
    <Menu
      items={[
        {
          key: 'profile',
          label: 'Thông tin tài khoản',
          icon: <UserOutlined />,
          onClick: () => setProfileModalVisible(true)
        },
        {
          key: 'settings',
          label: 'Cài đặt',
          icon: <SettingOutlined />,
          onClick: () => setSettingsDrawerVisible(true)
        },
        {
          key: 'divider',
          type: 'divider'
        },
        {
          key: 'logout',
          label: 'Đăng xuất',
          icon: <LogoutOutlined />,
          danger: true,
          onClick: handleLogout
        }
      ]}
    />
  );

  const layoutClass = `${darkMode ? 'dark-mode' : ''} ${blueTheme ? 'blue-theme' : ''}`;

  return (
    <Layout className={layoutClass} style={{ minHeight: '100vh' }}>
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        width={260}
        style={{
          boxShadow: '2px 0 8px rgba(0,0,0,0.15)',
          overflowY: 'auto',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 1000
        }}
      >
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: collapsed ? 'center' : 'flex-start',
          padding: collapsed ? '16px 0' : '16px 24px',
          height: '64px',
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}>
          {collapsed ? (
            <ShopOutlined style={{ fontSize: '24px', color: '#fff' }} />
          ) : (
            <Space>
              <ShopOutlined style={{ fontSize: '24px', color: '#fff' }} />
              <Title level={4} style={{ margin: 0, color: '#fff' }}>KhoAugment POS</Title>
            </Space>
          )}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          defaultOpenKeys={['dashboard']}
          selectedKeys={[location.pathname]}
          onClick={({ key }) => navigate(key as string)}
          items={menuItems}
          style={{ padding: '8px 0', marginTop: '8px' }}
        />

        <div style={{ 
          position: 'absolute', 
          bottom: 0, 
          width: '100%', 
          padding: '16px', 
          borderTop: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <Tooltip title="Chế độ ban đêm">
              <Switch
                checked={darkMode}
                onChange={handleThemeToggle}
                checkedChildren="🌙"
                unCheckedChildren="☀️"
                size="small"
              />
            </Tooltip>
            <Tooltip title="Giao diện màu xanh">
              <Switch
                checked={blueTheme}
                onChange={handleBlueThemeToggle}
                checkedChildren={<BgColorsOutlined />}
                unCheckedChildren={<BgColorsOutlined />}
                size="small"
              />
            </Tooltip>
          </div>
          {!collapsed && (
            <Text style={{ fontSize: '11px', color: 'rgba(255,255,255,0.65)' }}>
              {/* Footer information */}
              KhoAugment POS v1.0.0
            </Text>
          )}
        </div>
      </Sider>

      <Layout style={{ 
        marginLeft: collapsed ? 80 : 260,
        transition: 'margin-left 0.2s'
      }}>
        <Header style={{ 
          padding: '0 24px', 
          background: '#fff', 
          boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 999,
          height: '64px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{
                fontSize: '16px',
                width: 64,
                height: 64,
              }}
            />
            <Breadcrumb style={{ marginLeft: '16px' }}>
              <Breadcrumb.Item>Trang chủ</Breadcrumb.Item>
              <Breadcrumb.Item>{location.pathname.split('/')[1]}</Breadcrumb.Item>
              {location.pathname.split('/')[2] && (
                <Breadcrumb.Item>{location.pathname.split('/')[2]}</Breadcrumb.Item>
              )}
            </Breadcrumb>
          </div>
          <Space size="large">
            <Dropdown overlay={notificationMenu} placement="bottomRight" arrow trigger={['click']}>
              <Badge count={notifications.filter(n => !n.read).length}>
                <Button type="text" icon={<BellOutlined />} size="large" />
              </Badge>
            </Dropdown>
            <Dropdown overlay={userMenu} placement="bottomRight" arrow trigger={['click']}>
              <Button type="text" icon={<UserOutlined />} size="large" />
            </Dropdown>
          </Space>
        </Header>
        <Content style={{ padding: '16px', position: 'relative' }}>
          <Outlet />
        </Content>
      </Layout>

      {/* Profile Modal */}
      <Modal 
        title="Thông tin tài khoản" 
        open={profileModalVisible} 
        footer={null}
        onCancel={() => setProfileModalVisible(false)}
      >
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <Avatar size={80} icon={<UserOutlined />} />
          <div style={{ marginTop: '16px' }}>
            <Title level={4} style={{ margin: 0 }}>Nguyễn Văn Admin</Title>
            <Text type="secondary">admin@khoaugment.com</Text>
          </div>
        </div>
        <Divider />
        <Descriptions column={1}>
          <Descriptions.Item label="Chức vụ">Quản trị viên</Descriptions.Item>
          <Descriptions.Item label="Điện thoại">0901234567</Descriptions.Item>
          <Descriptions.Item label="Đăng nhập cuối">16/07/2024, 08:30</Descriptions.Item>
        </Descriptions>
        <Divider />
        <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button type="default" onClick={() => setProfileModalVisible(false)}>Đóng</Button>
          <Button type="primary">Cập nhật thông tin</Button>
        </Space>
      </Modal>

      {/* Settings Drawer */}
      <Drawer 
        title="Cài đặt hệ thống" 
        placement="right"
        width={360}
        onClose={() => setSettingsDrawerVisible(false)} 
        open={settingsDrawerVisible}
      >
        <div>
          <Title level={5}>Giao diện</Title>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <Text>Chế độ tối</Text>
              <Switch checked={darkMode} onChange={handleThemeToggle} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text>Giao diện màu xanh</Text>
              <Switch checked={blueTheme} onChange={handleBlueThemeToggle} />
            </div>
          </div>
          
          <Divider />
          <Title level={5}>Thông báo</Title>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <Text>Thông báo đơn hàng</Text>
              <Switch defaultChecked />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <Text>Thông báo hệ thống</Text>
              <Switch defaultChecked />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text>Âm thanh</Text>
              <Switch defaultChecked />
            </div>
          </div>
        </div>
      </Drawer>
    </Layout>
  );
};

export default SimpleLayout;