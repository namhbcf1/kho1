import {
    AppstoreOutlined,
    BankOutlined,
    BarChartOutlined,
    BellOutlined,
    DashboardOutlined,
    DatabaseOutlined,
    FileTextOutlined,
    GlobalOutlined,
    LogoutOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    MoonOutlined,
    SettingOutlined,
    ShopOutlined,
    ShoppingCartOutlined,
    SunOutlined,
    TagOutlined,
    TeamOutlined,
    UserOutlined
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Avatar, Badge, Breadcrumb, Button, Dropdown, Input, Layout, Menu, Space } from 'antd';
import React, { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import '../styles/modern-ui.css';
import { ThemeMode } from '../styles/theme';

const { Header, Sider, Content, Footer } = Layout;
const { Search } = Input;

interface ModernLayoutProps {
  themeMode: ThemeMode;
  setThemeMode: (mode: string) => void;
}

const ModernLayout: React.FC<ModernLayoutProps> = ({ themeMode, setThemeMode }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const location = useLocation();
  const navigate = useNavigate();

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    return () => clearInterval(timer);
  }, []);

  // Format date in Vietnamese style
  const formatVietnameseDate = (date: Date): string => {
    return new Intl.DateTimeFormat('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  // Menu items
  const menuItems: MenuProps['items'] = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: 'Tổng quan',
      onClick: () => navigate('/dashboard'),
    },
    {
      key: 'pos',
      icon: <ShoppingCartOutlined />,
      label: 'Bán hàng',
      onClick: () => navigate('/pos'),
    },
    {
      key: 'products',
      icon: <TagOutlined />,
      label: 'Sản phẩm',
      onClick: () => navigate('/products'),
      children: [
        {
          key: 'products/list',
          label: 'Danh sách',
          onClick: () => navigate('/products'),
        },
        {
          key: 'products/categories',
          label: 'Danh mục',
          onClick: () => navigate('/products/categories'),
        },
        {
          key: 'products/barcodes',
          label: 'Mã vạch',
          onClick: () => navigate('/products/barcodes'),
        },
      ],
    },
    {
      key: 'inventory',
      icon: <DatabaseOutlined />,
      label: 'Kho hàng',
      onClick: () => navigate('/inventory'),
      children: [
        {
          key: 'inventory/list',
          label: 'Tồn kho',
          onClick: () => navigate('/inventory'),
        },
        {
          key: 'inventory/import',
          label: 'Nhập kho',
          onClick: () => navigate('/inventory/import'),
        },
        {
          key: 'inventory/export',
          label: 'Xuất kho',
          onClick: () => navigate('/inventory/export'),
        },
      ],
    },
    {
      key: 'orders',
      icon: <FileTextOutlined />,
      label: 'Đơn hàng',
      onClick: () => navigate('/orders'),
    },
    {
      key: 'customers',
      icon: <TeamOutlined />,
      label: 'Khách hàng',
      onClick: () => navigate('/customers'),
    },
    {
      key: 'finance',
      icon: <BankOutlined />,
      label: 'Tài chính',
      children: [
        {
          key: 'finance/revenue',
          label: 'Doanh thu',
          onClick: () => navigate('/finance/revenue'),
        },
        {
          key: 'finance/expenses',
          label: 'Chi phí',
          onClick: () => navigate('/finance/expenses'),
        },
      ],
    },
    {
      key: 'analytics',
      icon: <BarChartOutlined />,
      label: 'Báo cáo',
      children: [
        {
          key: 'dashboard/reports',
          label: 'Báo cáo tổng hợp',
          onClick: () => navigate('/dashboard/reports'),
        },
        {
          key: 'dashboard/realtime',
          label: 'Theo dõi thời gian thực',
          onClick: () => navigate('/dashboard/realtime'),
        },
      ],
    },
    {
      key: 'suppliers',
      icon: <ShopOutlined />,
      label: 'Nhà cung cấp',
      onClick: () => navigate('/suppliers'),
    },
    {
      key: 'staff',
      icon: <UserOutlined />,
      label: 'Nhân viên',
      onClick: () => navigate('/staff'),
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Cài đặt',
      onClick: () => navigate('/settings'),
    },
  ];

  // User dropdown menu
  const userMenu: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Thông tin cá nhân',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Cài đặt tài khoản',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Đăng xuất',
      danger: true,
    },
  ];

  // Notifications dropdown
  const notificationItems: MenuProps['items'] = [
    {
      key: '1',
      label: (
        <div>
          <div style={{ fontWeight: 600 }}>Đơn hàng mới #1234</div>
          <div style={{ fontSize: '12px', color: 'var(--color-textSecondary)' }}>5 phút trước</div>
        </div>
      ),
    },
    {
      key: '2',
      label: (
        <div>
          <div style={{ fontWeight: 600 }}>Sản phẩm sắp hết hàng</div>
          <div style={{ fontSize: '12px', color: 'var(--color-textSecondary)' }}>30 phút trước</div>
        </div>
      ),
    },
    {
      type: 'divider',
    },
    {
      key: 'all',
      label: 'Xem tất cả thông báo',
    },
  ];

  // Theme toggle options
  const themeOptions = [
    { label: 'Sáng', value: 'light', icon: <SunOutlined /> },
    { label: 'Tối', value: 'dark', icon: <MoonOutlined /> },
    { label: 'Hiện đại', value: 'modern', icon: <AppstoreOutlined /> },
    { label: 'Hiện đại tối', value: 'modern-dark', icon: <AppstoreOutlined /> },
    { label: 'Việt Nam', value: 'vietnamese', icon: <GlobalOutlined /> },
    { label: 'Xanh', value: 'blue', icon: <GlobalOutlined /> },
  ];

  // Get current page title
  const getCurrentPageTitle = (): string => {
    const path = location.pathname.split('/')[1];
    
    switch (path) {
      case 'dashboard': return 'Tổng quan';
      case 'pos': return 'Bán hàng';
      case 'products': return 'Sản phẩm';
      case 'inventory': return 'Kho hàng';
      case 'orders': return 'Đơn hàng';
      case 'customers': return 'Khách hàng';
      case 'finance': return 'Tài chính';
      case 'analytics': return 'Báo cáo';
      case 'suppliers': return 'Nhà cung cấp';
      case 'staff': return 'Nhân viên';
      case 'settings': return 'Cài đặt';
      default: return 'Tổng quan';
    }
  };

  // Get breadcrumb items
  const getBreadcrumbItems = () => {
    const pathSnippets = location.pathname.split('/').filter(i => i);
    const breadcrumbItems = [
      { title: 'Trang chủ', path: '/' },
    ];

    let url = '';
    pathSnippets.forEach((snippet, index) => {
      url += `/${snippet}`;
      
      let title = snippet.charAt(0).toUpperCase() + snippet.slice(1);
      
      switch (snippet) {
        case 'dashboard': title = 'Tổng quan'; break;
        case 'pos': title = 'Bán hàng'; break;
        case 'products': title = 'Sản phẩm'; break;
        case 'inventory': title = 'Kho hàng'; break;
        case 'orders': title = 'Đơn hàng'; break;
        case 'customers': title = 'Khách hàng'; break;
        case 'finance': title = 'Tài chính'; break;
        case 'analytics': title = 'Báo cáo'; break;
        case 'suppliers': title = 'Nhà cung cấp'; break;
        case 'staff': title = 'Nhân viên'; break;
        case 'settings': title = 'Cài đặt'; break;
        case 'revenue': title = 'Doanh thu'; break;
        case 'expenses': title = 'Chi phí'; break;
        case 'reports': title = 'Báo cáo tổng hợp'; break;
        case 'realtime': title = 'Theo dõi thời gian thực'; break;
        case 'import': title = 'Nhập kho'; break;
        case 'export': title = 'Xuất kho'; break;
      }
      
      breadcrumbItems.push({
        title,
        path: url,
      });
    });

    return breadcrumbItems;
  };

  return (
    <Layout className="modern-layout">
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        className="modern-sidebar"
        width={250}
      >
        <div className="modern-sidebar-logo">
          {collapsed ? (
            <div style={{ fontSize: '24px', color: 'var(--color-primary)' }}>
              <ShopOutlined />
            </div>
          ) : (
            <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: 'var(--color-primary)' }}>
              KhoAugment POS
            </h1>
          )}
        </div>
        <Menu
          theme="light"
          mode="inline"
          className="modern-menu"
          defaultSelectedKeys={['dashboard']}
          selectedKeys={[location.pathname.split('/')[1]]}
          items={menuItems}
          style={{ borderRight: 'none' }}
        />
      </Sider>
      <Layout>
        <Header className="modern-header">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: '16px', width: 64, height: 64 }}
            />
            <div>
              <h1 className="modern-header-title">{getCurrentPageTitle()}</h1>
              <div style={{ fontSize: '12px', color: 'var(--color-textSecondary)' }}>
                {formatVietnameseDate(currentTime)}
              </div>
            </div>
          </div>
          <div className="modern-header-actions">
            <Search
              placeholder="Tìm kiếm..."
              style={{ width: 250 }}
              onSearch={value => console.log(value)}
            />
            <Dropdown menu={{ items: notificationItems }} placement="bottomRight" arrow>
              <Badge count={2} size="small">
                <Button type="text" icon={<BellOutlined />} style={{ fontSize: '16px' }} />
              </Badge>
            </Dropdown>
            <Dropdown 
              menu={{ 
                items: themeOptions.map(option => ({
                  key: option.value,
                  icon: option.icon,
                  label: option.label,
                  onClick: () => setThemeMode(option.value),
                }))
              }} 
              placement="bottomRight"
            >
              <Button type="text" icon={
                themeMode.includes('dark') ? <MoonOutlined /> : 
                themeMode === 'vietnamese' ? <GlobalOutlined /> : 
                themeMode === 'modern' ? <AppstoreOutlined /> : <SunOutlined />
              } />
            </Dropdown>
            <Dropdown menu={{ items: userMenu }} placement="bottomRight">
              <Space>
                <Avatar icon={<UserOutlined />} />
                <span style={{ display: 'inline-block', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  Admin
                </span>
              </Space>
            </Dropdown>
          </div>
        </Header>
        <div style={{ padding: '12px 24px', background: 'var(--color-bgPrimary)', borderBottom: '1px solid var(--color-borderLight)' }}>
          <Breadcrumb className="modern-breadcrumb">
            {getBreadcrumbItems().map((item, index) => (
              <Breadcrumb.Item key={index}>
                <span onClick={() => navigate(item.path)} style={{ cursor: 'pointer' }}>
                  {item.title}
                </span>
              </Breadcrumb.Item>
            ))}
          </Breadcrumb>
        </div>
        <Content className="modern-content">
          <Outlet />
        </Content>
        <Footer className="modern-footer">
          KhoAugment POS © {new Date().getFullYear()} - Hệ thống quản lý bán hàng chuyên nghiệp cho doanh nghiệp Việt Nam
        </Footer>
      </Layout>
    </Layout>
  );
};

export default ModernLayout; 