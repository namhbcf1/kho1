import React from 'react';
import { Layout, Space, Typography, Avatar } from 'antd';
import { UserOutlined, BellOutlined } from '@ant-design/icons';
import { UserMenu } from './UserMenu';
import type { AppHeaderProps } from './Header.types';

const { Header } = Layout;
const { Title } = Typography;

export const AppHeader: React.FC<AppHeaderProps> = ({
  title = 'KhoAugment POS',
  user,
  onMenuClick,
}) => {
  return (
    <Header style={{ 
      background: '#fff', 
      padding: '0 24px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottom: '1px solid #f0f0f0'
    }}>
      <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
        {title}
      </Title>
      
      <Space size="large">
        <BellOutlined style={{ fontSize: '18px', cursor: 'pointer' }} />
        <UserMenu user={user} onMenuClick={onMenuClick} />
      </Space>
    </Header>
  );
};

export default AppHeader;
