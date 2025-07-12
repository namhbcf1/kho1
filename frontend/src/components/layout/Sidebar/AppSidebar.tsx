import React, { useState } from 'react';
import { Layout, Menu } from 'antd';
import { MenuItems } from './MenuItems';
import type { AppSidebarProps } from './Sidebar.types';

const { Sider } = Layout;

export const AppSidebar: React.FC<AppSidebarProps> = ({
  collapsed = false,
  onCollapse,
  selectedKey,
  onMenuSelect,
}) => {
  const [internalCollapsed, setInternalCollapsed] = useState(collapsed);

  const handleCollapse = (collapsed: boolean) => {
    setInternalCollapsed(collapsed);
    onCollapse?.(collapsed);
  };

  const handleMenuSelect = ({ key }: { key: string }) => {
    onMenuSelect?.(key);
  };

  return (
    <Sider
      collapsible
      collapsed={internalCollapsed}
      onCollapse={handleCollapse}
      theme="light"
      width={250}
      style={{
        borderRight: '1px solid #f0f0f0',
      }}
    >
      <div style={{ 
        height: '64px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        borderBottom: '1px solid #f0f0f0'
      }}>
        {!internalCollapsed && (
          <img 
            src="/logo.png" 
            alt="Logo" 
            style={{ height: '32px' }}
          />
        )}
      </div>
      
      <Menu
        mode="inline"
        selectedKeys={selectedKey ? [selectedKey] : []}
        items={MenuItems}
        onSelect={handleMenuSelect}
        style={{ borderRight: 0 }}
      />
    </Sider>
  );
};

export default AppSidebar;
