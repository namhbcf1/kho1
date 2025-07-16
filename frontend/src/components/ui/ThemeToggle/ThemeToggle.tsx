// Theme Toggle Component - Vietnamese POS System 2025
import React from 'react';
import { Button, Dropdown, Space, Badge } from 'antd';
import { 
  BgColorsOutlined, 
  SunOutlined, 
  MoonOutlined, 
  GlobalOutlined,
  CheckOutlined
} from '@ant-design/icons';
import { useTheme } from '../../../contexts/ThemeContext';
import './ThemeToggle.css';

interface ThemeToggleProps {
  size?: 'small' | 'middle' | 'large';
  type?: 'dropdown' | 'button' | 'switcher';
  showLabel?: boolean;
  position?: 'left' | 'right';
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
  size = 'middle',
  type = 'dropdown',
  showLabel = false,
  position = 'right'
}) => {
  const { 
    themeMode, 
    setThemeMode, 
    toggleTheme, 
    setVietnameseTheme, 
    setLightTheme, 
    setDarkTheme,
    isDark,
    isVietnamese
  } = useTheme();

  const getThemeIcon = (mode: string) => {
    switch (mode) {
      case 'light':
        return <SunOutlined />;
      case 'dark':
        return <MoonOutlined />;
      case 'vietnamese':
        return <GlobalOutlined />;
      default:
        return <BgColorsOutlined />;
    }
  };

  const getThemeLabel = (mode: string) => {
    switch (mode) {
      case 'light':
        return 'Sáng';
      case 'dark':
        return 'Tối';
      case 'vietnamese':
        return 'Việt Nam';
      default:
        return 'Chủ đề';
    }
  };

  const dropdownItems = [
    {
      key: 'light',
      label: (
        <Space>
          <SunOutlined style={{ color: '#faad14' }} />
          <span>Chủ đề sáng</span>
          {themeMode === 'light' && <CheckOutlined style={{ color: '#52c41a' }} />}
        </Space>
      ),
      onClick: () => setLightTheme()
    },
    {
      key: 'dark',
      label: (
        <Space>
          <MoonOutlined style={{ color: '#722ed1' }} />
          <span>Chủ đề tối</span>
          {themeMode === 'dark' && <CheckOutlined style={{ color: '#52c41a' }} />}
        </Space>
      ),
      onClick: () => setDarkTheme()
    },
    {
      key: 'vietnamese',
      label: (
        <Space>
          <GlobalOutlined style={{ color: '#d4af37' }} />
          <span>Chủ đề Việt Nam</span>
          {themeMode === 'vietnamese' && <CheckOutlined style={{ color: '#52c41a' }} />}
        </Space>
      ),
      onClick: () => setVietnameseTheme()
    }
  ];

  if (type === 'button') {
    return (
      <Button
        type="text"
        size={size}
        icon={getThemeIcon(themeMode)}
        onClick={toggleTheme}
        className="theme-toggle-button"
        title={`Chuyển sang chủ đề ${isDark ? 'sáng' : 'tối'}`}
      >
        {showLabel && getThemeLabel(themeMode)}
      </Button>
    );
  }

  if (type === 'switcher') {
    return (
      <div className="theme-switcher">
        <Button.Group size={size}>
          <Button
            type={themeMode === 'light' ? 'primary' : 'default'}
            icon={<SunOutlined />}
            onClick={setLightTheme}
            className="theme-switcher-button"
            title="Chủ đề sáng"
          />
          <Button
            type={themeMode === 'dark' ? 'primary' : 'default'}
            icon={<MoonOutlined />}
            onClick={setDarkTheme}
            className="theme-switcher-button"
            title="Chủ đề tối"
          />
          <Button
            type={themeMode === 'vietnamese' ? 'primary' : 'default'}
            icon={<GlobalOutlined />}
            onClick={setVietnameseTheme}
            className="theme-switcher-button theme-switcher-vietnamese"
            title="Chủ đề Việt Nam"
          />
        </Button.Group>
      </div>
    );
  }

  // Default dropdown type
  return (
    <Dropdown
      menu={{ items: dropdownItems }}
      trigger={['click']}
      placement={position === 'left' ? 'bottomLeft' : 'bottomRight'}
      overlayClassName="theme-dropdown"
    >
      <Button
        type="text"
        size={size}
        className="theme-toggle-dropdown"
        title="Chọn chủ đề"
      >
        <Space>
          <Badge 
            dot={isVietnamese} 
            color="#d4af37"
            offset={[2, 2]}
          >
            {getThemeIcon(themeMode)}
          </Badge>
          {showLabel && getThemeLabel(themeMode)}
        </Space>
      </Button>
    </Dropdown>
  );
};

export default ThemeToggle;