// Modern notification panel component
import React from 'react';
import { 
  Drawer, 
  List, 
  Button, 
  Typography, 
  Space, 
  Badge, 
  Tag, 
  Empty,
  Divider,
  Tooltip,
  Avatar,
  Dropdown,
  Menu
} from 'antd';
import {
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  DeleteOutlined,
  CheckOutlined,
  ClearOutlined,
  MoreOutlined,
  FilterOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { useNotifications, useNotificationActions, type Notification } from '../../stores/notificationStore';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';
import './NotificationPanel.css';

dayjs.extend(relativeTime);
dayjs.locale('vi');

const { Title, Text } = Typography;

const NotificationPanel: React.FC = () => {
  const { notifications, unreadCount, isOpen } = useNotifications();
  const { 
    removeNotification, 
    markAsRead, 
    markAllAsRead, 
    clearAll, 
    clearRead, 
    setOpen 
  } = useNotificationActions();

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircleOutlined className="notification-icon success" />;
      case 'error':
        return <ExclamationCircleOutlined className="notification-icon error" />;
      case 'warning':
        return <WarningOutlined className="notification-icon warning" />;
      case 'info':
        return <InfoCircleOutlined className="notification-icon info" />;
      default:
        return <InfoCircleOutlined className="notification-icon info" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success':
        return '#52c41a';
      case 'error':
        return '#ff4d4f';
      case 'warning':
        return '#faad14';
      case 'info':
        return '#1890ff';
      default:
        return '#1890ff';
    }
  };

  const handleItemClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
  };

  const handleActionClick = (action: any, notification: Notification) => {
    action.handler();
    removeNotification(notification.id);
  };

  const headerActions = (
    <Menu>
      <Menu.Item key="mark-all-read" icon={<CheckOutlined />} onClick={markAllAsRead}>
        Đánh dấu tất cả đã đọc
      </Menu.Item>
      <Menu.Item key="clear-read" icon={<ClearOutlined />} onClick={clearRead}>
        Xóa đã đọc
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="clear-all" icon={<DeleteOutlined />} onClick={clearAll} danger>
        Xóa tất cả
      </Menu.Item>
    </Menu>
  );

  return (
    <Drawer
      title={
        <div className="notification-header">
          <div className="header-title">
            <Title level={4} style={{ margin: 0 }}>
              Thông báo
            </Title>
            {unreadCount > 0 && (
              <Badge 
                count={unreadCount} 
                style={{ backgroundColor: '#1890ff' }}
                showZero={false}
              />
            )}
          </div>
          <div className="header-actions">
            <Dropdown overlay={headerActions} trigger={['click']}>
              <Button type="text" icon={<MoreOutlined />} />
            </Dropdown>
          </div>
        </div>
      }
      placement="right"
      onClose={() => setOpen(false)}
      open={isOpen}
      width={400}
      className="notification-panel"
    >
      <div className="notification-content">
        {notifications.length === 0 ? (
          <Empty 
            description="Chưa có thông báo nào"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            style={{ marginTop: '2rem' }}
          />
        ) : (
          <List
            dataSource={notifications}
            renderItem={(notification) => (
              <List.Item 
                className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                onClick={() => handleItemClick(notification)}
              >
                <div className="notification-item-content">
                  <div className="notification-item-header">
                    <div className="notification-item-icon">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="notification-item-main">
                      <div className="notification-item-title">
                        {notification.title}
                        {!notification.read && (
                          <div className="unread-indicator" />
                        )}
                      </div>
                      <div className="notification-item-time">
                        {dayjs(notification.timestamp).fromNow()}
                      </div>
                    </div>
                    <div className="notification-item-actions">
                      <Tooltip title="Xóa">
                        <Button
                          type="text"
                          size="small"
                          icon={<DeleteOutlined />}
                          onClick={(e) => {
                            e.stopPropagation();
                            removeNotification(notification.id);
                          }}
                        />
                      </Tooltip>
                    </div>
                  </div>
                  
                  {notification.message && (
                    <div className="notification-item-message">
                      {notification.message}
                    </div>
                  )}
                  
                  {notification.actions && notification.actions.length > 0 && (
                    <div className="notification-item-buttons">
                      <Space size="small">
                        {notification.actions.map((action, index) => (
                          <Button
                            key={index}
                            type="primary"
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleActionClick(action, notification);
                            }}
                          >
                            {action.label}
                          </Button>
                        ))}
                      </Space>
                    </div>
                  )}
                </div>
              </List.Item>
            )}
          />
        )}
      </div>
    </Drawer>
  );
};

export default NotificationPanel;