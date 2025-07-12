import React from 'react';
import { Dropdown, Avatar, Space, Typography } from 'antd';
import { UserOutlined, SettingOutlined, LogoutOutlined } from '@ant-design/icons';
import type { UserMenuProps } from './Header.types';

const { Text } = Typography;

export const UserMenu: React.FC<UserMenuProps> = ({
  user,
  onMenuClick,
}) => {
  const menuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Thông tin cá nhân',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Cài đặt',
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Đăng xuất',
      danger: true,
    },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    onMenuClick?.(key);
  };

  return (
    <Dropdown
      menu={{ items: menuItems, onClick: handleMenuClick }}
      placement="bottomRight"
      trigger={['click']}
    >
      <Space style={{ cursor: 'pointer' }}>
        <Avatar 
          src={user?.avatar} 
          icon={<UserOutlined />}
          size="small"
        />
        <Text>{user?.name || 'Người dùng'}</Text>
      </Space>
    </Dropdown>
  );
};

export default UserMenu;
