import React, { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Badge, Button, Typography } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  DashboardOutlined,
  ShopOutlined, 
  ProductOutlined,
  TeamOutlined,
  FileTextOutlined,
  BarChartOutlined,
  SettingOutlined,
  BellOutlined,
  UserOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined
} from '@ant-design/icons';
import { routes } from '../../routes/index';
import './MainLayout.css';

const { Header, Sider, Content, Footer } = Layout;
const { Title } = Typography;

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    { 
      key: routes.DASHBOARD, 
      icon: <DashboardOutlined />, 
      label: 'Dashboard',
      onClick: () => navigate(routes.DASHBOARD)
    },
    { 
      key: routes.POS, 
      icon: <ShopOutlined />, 
      label: 'Điểm bán hàng',
      onClick: () => navigate(routes.POS)
    },
    { 
      key: routes.PRODUCTS, 
      icon: <ProductOutlined />, 
      label: 'Sản phẩm',
      onClick: () => navigate(routes.PRODUCTS)
    },
    { 
      key: routes.CUSTOMERS, 
      icon: <TeamOutlined />, 
      label: 'Khách hàng',
      onClick: () => navigate(routes.CUSTOMERS)
    },
    { 
      key: routes.ORDERS, 
      icon: <FileTextOutlined />, 
      label: 'Đơn hàng',
      onClick: () => navigate(routes.ORDERS)
    },
    { 
      key: routes.REPORTS, 
      icon: <BarChartOutlined />, 
      label: 'Báo cáo',
      onClick: () => navigate(routes.REPORTS)
    },
    { 
      key: routes.SETTINGS, 
      icon: <SettingOutlined />, 
      label: 'Cài đặt',
      onClick: () => navigate(routes.SETTINGS)
    }
  ];

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Thông tin cá nhân'
    },
    {
      type: 'divider' as const
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Đăng xuất',
      danger: true
    }
  ];

  const handleUserMenuClick = ({ key }: { key: string }) => {
    switch (key) {
      case 'logout':
        // TODO: Implement logout logic
        console.log('Logout clicked');
        break;
      case 'profile':
        // TODO: Navigate to profile page
        console.log('Profile clicked');
        break;
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }} className="main-layout">
      <Sider 
        theme="light" 
        width={250}
        collapsed={collapsed}
        collapsible
        trigger={null}
        className="main-sider"
        breakpoint="lg"
        collapsedWidth={0}
        onBreakpoint={(broken) => {
          setCollapsed(broken);
        }}
      >
        <div className="logo-container">
          <div className="logo-icon">🏪</div>
          {!collapsed && (
            <Title level={4} className="logo-text">
              KhoAugment POS
            </Title>
          )}
        </div>
        
        <Menu 
          items={menuItems} 
          selectedKeys={[location.pathname]}
          className="main-menu"
          theme="light"
        />
      </Sider>
      
      <Layout>
        <Header className="main-header">
          <div className="header-left">
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: '16px', width: 64, height: 64 }}
              className="collapse-button"
            />
          </div>
          
          <div className="header-right">
            <Badge count={5} size="small">
              <Button 
                type="text" 
                icon={<BellOutlined />} 
                style={{ fontSize: '18px' }}
                title="Thông báo"
                className="notification-button"
              />
            </Badge>
            
            <Dropdown 
              menu={{ 
                items: userMenuItems,
                onClick: handleUserMenuClick
              }}
              placement="bottomRight"
            >
              <div className="user-info">
                <Avatar size="small" icon={<UserOutlined />} />
                <span className="user-name">Admin</span>
              </div>
            </Dropdown>
          </div>
        </Header>
        
        <Content className="main-content">
          <div className="content-wrapper">
            {children}
          </div>
        </Content>
        
        <Footer className="main-footer">
          <div className="footer-text">
            KhoAugment POS ©2024 - Hệ thống bán hàng thông minh cho doanh nghiệp Việt Nam
          </div>
        </Footer>
      </Layout>
    </Layout>
  );
}