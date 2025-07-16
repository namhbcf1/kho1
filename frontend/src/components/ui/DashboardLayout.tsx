/**
 * Enhanced Dashboard Layout with Modern UI/UX
 * Fixes: Poor navigation, outdated UI, accessibility issues
 * Implements: Modern design, responsive layout, improved navigation
 */

import React, { useState, useEffect } from 'react';
import { 
  Layout, 
  Menu, 
  Avatar, 
  Dropdown, 
  Badge, 
  Button, 
  Drawer, 
  Space,
  Typography,
  Card,
  Statistic,
  Progress,
  Tooltip,
  Switch,
  Breadcrumb
} from 'antd';
import {
  DashboardOutlined,
  ShoppingCartOutlined,
  ProductOutlined,
  BarChartOutlined,
  SettingOutlined,
  UserOutlined,
  BellOutlined,
  SearchOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LogoutOutlined,
  SecurityScanOutlined,
  WalletOutlined,
  TeamOutlined,
  FileTextOutlined,
  CloudOutlined,
  MoonOutlined,
  SunOutlined,
  GlobalOutlined,
  MonitorOutlined
} from '@ant-design/icons';

const { Header, Sider, Content, Footer } = Layout;
const { Title, Text } = Typography;

export interface DashboardLayoutProps {
  children: React.ReactNode;
  currentPath: string;
  userInfo?: {
    name: string;
    email: string;
    role: string;
    avatar?: string;
  };
  notifications?: Array<{
    id: string;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'error' | 'success';
    timestamp: Date;
    read: boolean;
  }>;
  onNavigate: (path: string) => void;
  onLogout: () => void;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  currentPath,
  userInfo,
  notifications = [],
  onNavigate,
  onLogout
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuVisible, setMobileMenuVisible] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [notificationDrawerVisible, setNotificationDrawerVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // System stats (would come from API in real implementation)
  const [systemStats, setSystemStats] = useState({
    performance: 95,
    uptime: 99.9,
    activeUsers: 1247,
    todayRevenue: 15420000,
    transactions: 89,
    alerts: 3
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Menu items with enhanced icons and structure
  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
      description: 'Overview and analytics'
    },
    {
      key: '/transactions',
      icon: <ShoppingCartOutlined />,
      label: 'Transactions',
      description: 'Sales and payments',
      children: [
        { key: '/transactions/new', label: 'New Sale' },
        { key: '/transactions/history', label: 'History' },
        { key: '/transactions/refunds', label: 'Refunds' }
      ]
    },
    {
      key: '/products',
      icon: <ProductOutlined />,
      label: 'Products',
      description: 'Inventory management',
      children: [
        { key: '/products/catalog', label: 'Catalog' },
        { key: '/products/inventory', label: 'Inventory' },
        { key: '/products/categories', label: 'Categories' }
      ]
    },
    {
      key: '/customers',
      icon: <TeamOutlined />,
      label: 'Customers',
      description: 'Customer management',
      children: [
        { key: '/customers/list', label: 'All Customers' },
        { key: '/customers/loyalty', label: 'Loyalty Program' },
        { key: '/customers/groups', label: 'Customer Groups' }
      ]
    },
    {
      key: '/reports',
      icon: <BarChartOutlined />,
      label: 'Reports',
      description: 'Analytics and insights',
      children: [
        { key: '/reports/sales', label: 'Sales Reports' },
        { key: '/reports/financial', label: 'Financial Reports' },
        { key: '/reports/vat', label: 'VAT Reports' },
        { key: '/reports/inventory', label: 'Inventory Reports' }
      ]
    },
    {
      key: '/finance',
      icon: <WalletOutlined />,
      label: 'Finance',
      description: 'Financial management',
      children: [
        { key: '/finance/vat', label: 'VAT Management' },
        { key: '/finance/declarations', label: 'Tax Declarations' },
        { key: '/finance/compliance', label: 'Compliance' },
        { key: '/finance/audit', label: 'Audit Trail' }
      ]
    },
    {
      key: '/monitoring',
      icon: <MonitorOutlined />,
      label: 'Monitoring',
      description: 'System health',
      children: [
        { key: '/monitoring/performance', label: 'Performance' },
        { key: '/monitoring/security', label: 'Security' },
        { key: '/monitoring/deployment', label: 'Deployment' },
        { key: '/monitoring/alerts', label: 'Alerts' }
      ]
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: 'Settings',
      description: 'System configuration',
      children: [
        { key: '/settings/general', label: 'General' },
        { key: '/settings/users', label: 'Users & Roles' },
        { key: '/settings/payment', label: 'Payment Methods' },
        { key: '/settings/integrations', label: 'Integrations' }
      ]
    }
  ];

  // User dropdown menu
  const userMenu = (
    <Menu>
      <Menu.Item key="profile" icon={<UserOutlined />}>
        Profile Settings
      </Menu.Item>
      <Menu.Item key="security" icon={<SecurityScanOutlined />}>
        Security Settings
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={onLogout}>
        Logout
      </Menu.Item>
    </Menu>
  );

  // Notification count
  const unreadNotifications = notifications.filter(n => !n.read).length;

  // Breadcrumb generation
  const generateBreadcrumb = () => {
    const pathSegments = currentPath.split('/').filter(Boolean);
    const breadcrumbItems = [
      <Breadcrumb.Item key="dashboard">
        <DashboardOutlined />
        <span>Dashboard</span>
      </Breadcrumb.Item>
    ];

    pathSegments.forEach((segment, index) => {
      const path = `/${pathSegments.slice(0, index + 1).join('/')}`;
      const menuItem = menuItems.find(item => item.key === path || 
        item.children?.some(child => child.key === path));
      
      if (menuItem) {
        breadcrumbItems.push(
          <Breadcrumb.Item key={path}>
            <a onClick={() => onNavigate(path)}>
              {menuItem.label}
            </a>
          </Breadcrumb.Item>
        );
      }
    });

    return breadcrumbItems;
  };

  // System health indicator
  const getHealthColor = (value: number) => {
    if (value >= 95) return '#52c41a';
    if (value >= 85) return '#faad14';
    return '#ff4d4f';
  };

  return (
    <Layout className={`dashboard-layout ${darkMode ? 'dark-theme' : 'light-theme'}`}>
      {/* Mobile Drawer */}
      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="logo-container">
              <div className="logo-icon">🏪</div>
              <Title level={4} style={{ margin: 0, color: '#1890ff' }}>
                KhoAugment POS
              </Title>
            </div>
          </div>
        }
        placement="left"
        onClose={() => setMobileMenuVisible(false)}
        open={mobileMenuVisible}
        bodyStyle={{ padding: 0 }}
        width={280}
      >
        <Menu
          mode="inline"
          selectedKeys={[currentPath]}
          style={{ border: 'none' }}
          items={menuItems.map(item => ({
            key: item.key,
            icon: item.icon,
            label: item.label,
            children: item.children?.map(child => ({
              key: child.key,
              label: child.label
            }))
          }))}
          onClick={({ key }) => {
            onNavigate(key);
            setMobileMenuVisible(false);
          }}
        />
      </Drawer>

      {/* Desktop Sidebar */}
      {!isMobile && (
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          width={280}
          style={{
            background: darkMode ? '#001529' : '#ffffff',
            borderRight: `1px solid ${darkMode ? '#303030' : '#f0f0f0'}`
          }}
        >
          {/* Logo */}
          <div className="logo-container" style={{ 
            padding: '16px', 
            borderBottom: `1px solid ${darkMode ? '#303030' : '#f0f0f0'}`,
            display: 'flex',
            alignItems: 'center',
            gap: collapsed ? '0' : '12px',
            justifyContent: collapsed ? 'center' : 'flex-start'
          }}>
            <div className="logo-icon" style={{ fontSize: '24px' }}>🏪</div>
            {!collapsed && (
              <Title level={4} style={{ 
                margin: 0, 
                color: darkMode ? '#ffffff' : '#1890ff',
                fontWeight: 600
              }}>
                KhoAugment POS
              </Title>
            )}
          </div>

          {/* System Health Card */}
          {!collapsed && (
            <Card 
              size="small" 
              style={{ 
                margin: '16px', 
                background: darkMode ? '#1f1f1f' : '#fafafa',
                border: 'none'
              }}
            >
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text strong style={{ color: darkMode ? '#ffffff' : undefined }}>
                    System Health
                  </Text>
                  <Badge 
                    status={systemStats.performance >= 95 ? 'success' : 'warning'} 
                    text={`${systemStats.performance}%`}
                  />
                </div>
                <Progress 
                  percent={systemStats.performance} 
                  showInfo={false} 
                  strokeColor={getHealthColor(systemStats.performance)}
                  size="small"
                />
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    Uptime: {systemStats.uptime}%
                  </Text>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    Users: {systemStats.activeUsers}
                  </Text>
                </div>
              </Space>
            </Card>
          )}

          {/* Navigation Menu */}
          <Menu
            mode="inline"
            selectedKeys={[currentPath]}
            style={{ 
              border: 'none',
              background: 'transparent'
            }}
            items={menuItems.map(item => ({
              key: item.key,
              icon: <Tooltip title={collapsed ? item.label : undefined} placement="right">
                {item.icon}
              </Tooltip>,
              label: item.label,
              children: item.children?.map(child => ({
                key: child.key,
                label: child.label
              }))
            }))}
            onClick={({ key }) => onNavigate(key)}
          />
        </Sider>
      )}

      {/* Main Layout */}
      <Layout>
        {/* Header */}
        <Header style={{ 
          padding: '0 24px', 
          background: darkMode ? '#001529' : '#ffffff',
          borderBottom: `1px solid ${darkMode ? '#303030' : '#f0f0f0'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          {/* Left side */}
          <Space align="center">
            {isMobile ? (
              <Button
                type="text"
                icon={<MenuUnfoldOutlined />}
                onClick={() => setMobileMenuVisible(true)}
                style={{ color: darkMode ? '#ffffff' : undefined }}
              />
            ) : (
              <Button
                type="text"
                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={() => setCollapsed(!collapsed)}
                style={{ color: darkMode ? '#ffffff' : undefined }}
              />
            )}
            
            {/* Search */}
            <Button
              type="text"
              icon={<SearchOutlined />}
              style={{ color: darkMode ? '#ffffff' : undefined }}
            >
              {!isMobile && 'Search...'}
            </Button>
          </Space>

          {/* Center - Quick Stats */}
          {!isMobile && (
            <Space size="large">
              <Statistic
                title="Today's Revenue"
                value={systemStats.todayRevenue}
                precision={0}
                valueStyle={{ fontSize: '16px', color: darkMode ? '#ffffff' : undefined }}
                prefix="₫"
                suffix=""
              />
              <Statistic
                title="Transactions"
                value={systemStats.transactions}
                valueStyle={{ fontSize: '16px', color: darkMode ? '#ffffff' : undefined }}
              />
            </Space>
          )}

          {/* Right side */}
          <Space align="center">
            {/* Dark mode toggle */}
            <Tooltip title={darkMode ? 'Light Mode' : 'Dark Mode'}>
              <Switch
                checked={darkMode}
                onChange={setDarkMode}
                checkedChildren={<MoonOutlined />}
                unCheckedChildren={<SunOutlined />}
              />
            </Tooltip>

            {/* Language selector */}
            <Tooltip title="Language">
              <Button
                type="text"
                icon={<GlobalOutlined />}
                style={{ color: darkMode ? '#ffffff' : undefined }}
              />
            </Tooltip>

            {/* Notifications */}
            <Badge count={unreadNotifications} offset={[-2, 2]}>
              <Button
                type="text"
                icon={<BellOutlined />}
                onClick={() => setNotificationDrawerVisible(true)}
                style={{ color: darkMode ? '#ffffff' : undefined }}
              />
            </Badge>

            {/* Cloud status */}
            <Tooltip title="Cloud Status: Connected">
              <Badge status="success">
                <CloudOutlined style={{ color: darkMode ? '#ffffff' : undefined }} />
              </Badge>
            </Tooltip>

            {/* User avatar */}
            <Dropdown overlay={userMenu} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }}>
                <Avatar 
                  src={userInfo?.avatar} 
                  icon={<UserOutlined />}
                  style={{ backgroundColor: '#1890ff' }}
                />
                {!isMobile && (
                  <Space direction="vertical" size={0}>
                    <Text strong style={{ color: darkMode ? '#ffffff' : undefined }}>
                      {userInfo?.name || 'User'}
                    </Text>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {userInfo?.role || 'Role'}
                    </Text>
                  </Space>
                )}
              </Space>
            </Dropdown>
          </Space>
        </Header>

        {/* Content */}
        <Content style={{ 
          margin: '16px',
          background: darkMode ? '#1f1f1f' : '#ffffff',
          borderRadius: '8px',
          overflow: 'auto'
        }}>
          {/* Breadcrumb */}
          <div style={{ 
            padding: '16px 24px 0',
            background: 'transparent'
          }}>
            <Breadcrumb style={{ marginBottom: '16px' }}>
              {generateBreadcrumb()}
            </Breadcrumb>
          </div>

          {/* Page Content */}
          <div style={{ padding: '0 24px 24px' }}>
            {children}
          </div>
        </Content>

        {/* Footer */}
        <Footer style={{ 
          textAlign: 'center',
          background: darkMode ? '#001529' : '#fafafa',
          borderTop: `1px solid ${darkMode ? '#303030' : '#f0f0f0'}`,
          padding: '12px 50px'
        }}>
          <Text type="secondary">
            KhoAugment POS ©2024 - Enterprise Edition | 
            <a href="#" style={{ marginLeft: '8px' }}>Support</a> |
            <a href="#" style={{ marginLeft: '8px' }}>Documentation</a> |
            <Text type="secondary" style={{ marginLeft: '8px' }}>
              v2.1.0
            </Text>
          </Text>
        </Footer>
      </Layout>

      {/* Notification Drawer */}
      <Drawer
        title="Notifications"
        placement="right"
        onClose={() => setNotificationDrawerVisible(false)}
        open={notificationDrawerVisible}
        width={400}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          {notifications.length === 0 ? (
            <Card>
              <Text type="secondary">No notifications</Text>
            </Card>
          ) : (
            notifications.map(notification => (
              <Card
                key={notification.id}
                size="small"
                style={{ 
                  borderLeft: `4px solid ${
                    notification.type === 'error' ? '#ff4d4f' :
                    notification.type === 'warning' ? '#faad14' :
                    notification.type === 'success' ? '#52c41a' : '#1890ff'
                  }`
                }}
              >
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text strong>{notification.title}</Text>
                    {!notification.read && <Badge status="processing" />}
                  </div>
                  <Text>{notification.message}</Text>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {notification.timestamp.toLocaleString()}
                  </Text>
                </Space>
              </Card>
            ))
          )}
        </Space>
      </Drawer>

      {/* Custom Styles */}
      <style jsx>{`
        .dashboard-layout {
          min-height: 100vh;
        }

        .light-theme {
          background: #f0f2f5;
        }

        .dark-theme {
          background: #141414;
        }

        .logo-container {
          transition: all 0.3s;
        }

        .logo-icon {
          transition: all 0.3s;
        }

        .ant-menu-item,
        .ant-menu-submenu-title {
          border-radius: 6px !important;
          margin: 4px 8px !important;
        }

        .ant-menu-item-selected {
          background: linear-gradient(135deg, #1890ff, #40a9ff) !important;
          color: white !important;
        }

        .ant-menu-item:hover,
        .ant-menu-submenu-title:hover {
          background: rgba(24, 144, 255, 0.1) !important;
        }

        @media (max-width: 768px) {
          .ant-layout-header {
            padding: 0 16px !important;
          }
          
          .ant-layout-content {
            margin: 8px !important;
          }
        }

        .ant-card-small > .ant-card-head {
          min-height: 40px;
          padding: 0 12px;
        }

        .ant-card-small > .ant-card-body {
          padding: 12px;
        }

        .ant-progress-line {
          margin: 4px 0 !important;
        }

        .ant-statistic-title {
          font-size: 12px !important;
          margin-bottom: 2px !important;
        }

        .ant-badge-status-dot {
          width: 8px !important;
          height: 8px !important;
        }
      `}</style>
    </Layout>
  );
};