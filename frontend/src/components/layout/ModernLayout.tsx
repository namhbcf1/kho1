// Modern Layout Component for Vietnamese POS System
import React, { useState, useEffect } from 'react';
import { Layout, Menu, Avatar, Dropdown, Badge, Button, Drawer, Grid } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DashboardOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  BellOutlined,
  SearchOutlined,
  MenuOutlined,
  ShopOutlined,
  TeamOutlined,
  BarChartOutlined,
  DatabaseOutlined,
  WalletOutlined,
  FileTextOutlined,
  GlobalOutlined,
  MoonOutlined,
  SunOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES } from '../../constants/routes';
import '../../styles/modern-theme.css';

const { Header, Sider, Content } = Layout;
const { useBreakpoint } = Grid;

interface ModernLayoutProps {
  children: React.ReactNode;
}

const ModernLayout: React.FC<ModernLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const screens = useBreakpoint();

  const isMobile = !screens.lg;

  // Get current time for Vietnamese display
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatVietnameseTime = (date: Date) => {
    return date.toLocaleTimeString('vi-VN', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit',
      hour12: false 
    });
  };

  const formatVietnameseDate = (date: Date) => {
    return date.toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Navigation items with Vietnamese labels
  const navigationItems = [
    {
      key: ROUTES.DASHBOARD,
      icon: <DashboardOutlined />,
      label: 'Tổng quan',
      onClick: () => navigate(ROUTES.DASHBOARD),
    },
    {
      key: ROUTES.POS.ROOT,
      icon: <ShoppingCartOutlined />,
      label: 'Bán hàng',
      onClick: () => navigate(ROUTES.POS.ROOT),
    },
    {
      key: ROUTES.PRODUCTS.ROOT,
      icon: <ShopOutlined />,
      label: 'Sản phẩm',
      onClick: () => navigate(ROUTES.PRODUCTS.ROOT),
    },
    {
      key: ROUTES.INVENTORY.ROOT,
      icon: <DatabaseOutlined />,
      label: 'Kho hàng',
      onClick: () => navigate(ROUTES.INVENTORY.ROOT),
    },
    {
      key: ROUTES.ORDERS.ROOT,
      icon: <FileTextOutlined />,
      label: 'Đơn hàng',
      onClick: () => navigate(ROUTES.ORDERS.ROOT),
    },
    {
      key: ROUTES.CUSTOMERS.ROOT,
      icon: <UserOutlined />,
      label: 'Khách hàng',
      onClick: () => navigate(ROUTES.CUSTOMERS.ROOT),
    },
    {
      key: ROUTES.ANALYTICS.ROOT,
      icon: <BarChartOutlined />,
      label: 'Báo cáo',
      onClick: () => navigate(ROUTES.ANALYTICS.ROOT),
    },
    {
      key: ROUTES.STAFF.ROOT,
      icon: <TeamOutlined />,
      label: 'Nhân viên',
      onClick: () => navigate(ROUTES.STAFF.ROOT),
      visible: user?.role === 'admin' || user?.role === 'manager',
    },
    {
      key: ROUTES.SETTINGS.ROOT,
      icon: <SettingOutlined />,
      label: 'Cài đặt',
      onClick: () => navigate(ROUTES.SETTINGS.ROOT),
    },
  ].filter(item => item.visible !== false);

  // User menu items
  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Hồ sơ cá nhân',
      onClick: () => navigate(ROUTES.PROFILE),
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Cài đặt tài khoản',
      onClick: () => navigate(ROUTES.SETTINGS.ROOT),
    },
    {
      key: 'divider',
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Đăng xuất',
      onClick: logout,
      danger: true,
    },
  ];

  const handleMenuClick = (item: any) => {
    if (item.onClick) {
      item.onClick();
    }
    if (isMobile) {
      setDrawerVisible(false);
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark', !darkMode);
  };

  const currentMenuItem = navigationItems.find(item => 
    location.pathname.startsWith(item.key)
  );

  const sidebarContent = (
    <div className="h-full flex flex-col">
      {/* Logo Section */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-orange-500 rounded-lg flex items-center justify-center">
            <ShopOutlined className="text-white text-lg" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="text-lg font-bold text-gray-800 vietnamese-text">
                KhoAugment
              </h1>
              <p className="text-xs text-gray-500 vietnamese-text">
                Hệ thống POS Việt Nam
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="flex-1 overflow-y-auto">
        <Menu
          mode="inline"
          selectedKeys={[currentMenuItem?.key || '']}
          items={navigationItems.map(item => ({
            key: item.key,
            icon: item.icon,
            label: item.label,
            onClick: () => handleMenuClick(item),
          }))}
          className="border-0"
        />
      </div>

      {/* User Info Section */}
      {!collapsed && (
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3">
            <Avatar size={40} icon={<UserOutlined />} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate vietnamese-text">
                {user?.name || 'Người dùng'}
              </p>
              <p className="text-xs text-gray-500 truncate vietnamese-text">
                {user?.role === 'admin' ? 'Quản trị viên' :
                 user?.role === 'manager' ? 'Quản lý' :
                 user?.role === 'cashier' ? 'Thu ngân' : 'Nhân viên'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <Layout className="min-h-screen">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          width={280}
          theme="light"
          className="shadow-lg"
        >
          {sidebarContent}
        </Sider>
      )}

      {/* Mobile Drawer */}
      {isMobile && (
        <Drawer
          title="Menu"
          placement="left"
          closable={false}
          onClose={() => setDrawerVisible(false)}
          open={drawerVisible}
          bodyStyle={{ padding: 0 }}
          width={280}
        >
          {sidebarContent}
        </Drawer>
      )}

      <Layout>
        {/* Header */}
        <Header className="bg-white shadow-sm px-4 flex items-center justify-between">
          {/* Left Section */}
          <div className="flex items-center gap-4">
            {isMobile ? (
              <Button
                type="text"
                icon={<MenuOutlined />}
                onClick={() => setDrawerVisible(true)}
                className="lg:hidden"
              />
            ) : (
              <Button
                type="text"
                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={() => setCollapsed(!collapsed)}
                className="hidden lg:flex"
              />
            )}
            
            <div className="vietnamese-text">
              <h2 className="text-lg font-semibold text-gray-800 m-0">
                {currentMenuItem?.label || 'Tổng quan'}
              </h2>
              <p className="text-xs text-gray-500 m-0">
                {formatVietnameseDate(currentTime)}
              </p>
            </div>
          </div>

          {/* Center Section - Search (hidden on mobile) */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <SearchOutlined className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm sản phẩm, đơn hàng..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent vietnamese-text"
              />
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            {/* Current Time */}
            <div className="hidden sm:block text-sm text-gray-600 vietnamese-text">
              {formatVietnameseTime(currentTime)}
            </div>

            {/* Dark Mode Toggle */}
            <Button
              type="text"
              icon={darkMode ? <SunOutlined /> : <MoonOutlined />}
              onClick={toggleDarkMode}
              className="hidden sm:flex"
            />

            {/* Language Toggle */}
            <Button
              type="text"
              icon={<GlobalOutlined />}
              className="hidden sm:flex"
              title="Ngôn ngữ"
            />

            {/* Notifications */}
            <Badge count={5} size="small">
              <Button
                type="text"
                icon={<BellOutlined />}
                className="flex items-center justify-center"
              />
            </Badge>

            {/* User Menu */}
            <Dropdown
              menu={{ items: userMenuItems }}
              trigger={['click']}
              placement="bottomRight"
            >
              <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 rounded-lg p-2">
                <Avatar size={32} icon={<UserOutlined />} />
                <div className="hidden sm:block vietnamese-text">
                  <p className="text-sm font-medium text-gray-800 m-0">
                    {user?.name || 'Người dùng'}
                  </p>
                  <p className="text-xs text-gray-500 m-0">
                    {user?.role === 'admin' ? 'Quản trị viên' :
                     user?.role === 'manager' ? 'Quản lý' :
                     user?.role === 'cashier' ? 'Thu ngân' : 'Nhân viên'}
                  </p>
                </div>
              </div>
            </Dropdown>
          </div>
        </Header>

        {/* Main Content */}
        <Content className="p-6 bg-gray-50 overflow-auto">
          <div className="modern-container">
            {children}
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default ModernLayout;