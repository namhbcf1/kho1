// Real-Time Notification System for Vietnamese POS Dashboard
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  notification, 
  Badge, 
  Card, 
  List, 
  Button, 
  Space, 
  Typography, 
  Tag, 
  Divider,
  Popover,
  Avatar,
  Switch,
  Select,
  Tooltip
} from 'antd';
import { 
  BellOutlined, 
  CheckOutlined, 
  CloseOutlined, 
  WarningOutlined,
  InfoCircleOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  SettingOutlined,
  ClearOutlined
} from '@ant-design/icons';
import { useEnhancedWebSocket } from '../../hooks/useEnhancedWebSocket';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { SystemAlert, RealTimeMessage, InventoryUpdate, OrderStatusUpdate } from '../../types/realtime';
import { formatVND } from '../../utils/formatters/vietnameseCurrency';
import './RealTimeNotificationSystem.css';

const { Text, Title } = Typography;
const { Option } = Select;

interface NotificationSettings {
  enabled: boolean;
  sound: boolean;
  desktop: boolean;
  lowStock: boolean;
  orders: boolean;
  payments: boolean;
  system: boolean;
  autoHide: boolean;
  priority: 'all' | 'high' | 'critical';
}

interface NotificationItem extends SystemAlert {
  read: boolean;
  category: 'system' | 'inventory' | 'orders' | 'payments' | 'user';
  priority: 'low' | 'medium' | 'high' | 'critical';
  actions?: Array<{
    label: string;
    action: () => void;
    type?: 'primary' | 'default' | 'danger';
  }>;
}

interface RealTimeNotificationSystemProps {
  websocketUrl: string;
  maxNotifications?: number;
  showBadge?: boolean;
  enableSound?: boolean;
  enableDesktop?: boolean;
  onNotificationClick?: (notification: NotificationItem) => void;
}

export default function RealTimeNotificationSystem({
  websocketUrl,
  maxNotifications = 50,
  showBadge = true,
  enableSound = true,
  enableDesktop = true,
  onNotificationClick
}: RealTimeNotificationSystemProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [settings, setSettings] = useLocalStorage<NotificationSettings>('notification-settings', {
    enabled: true,
    sound: enableSound,
    desktop: enableDesktop,
    lowStock: true,
    orders: true,
    payments: true,
    system: true,
    autoHide: true,
    priority: 'all'
  });
  const [popoverVisible, setPopoverVisible] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(enableSound);

  // WebSocket connection
  const {
    connected,
    subscribe,
    unsubscribe,
    sendMessage
  } = useEnhancedWebSocket({
    url: websocketUrl,
    onMessage: handleWebSocketMessage,
    onOpen: () => {
      // Subscribe to notification channels
      subscribe('alerts');
      subscribe('inventory');
      subscribe('orders');
      subscribe('payments');
      subscribe('system');
    },
    enableLogging: true
  });

  // Handle WebSocket messages
  function handleWebSocketMessage(message: RealTimeMessage) {
    switch (message.type) {
      case 'data':
        handleDataMessage(message);
        break;
      default:
        break;
    }
  }

  // Handle data messages from different channels
  const handleDataMessage = useCallback((message: RealTimeMessage) => {
    if (!message.channel || !message.data) return;

    let notification: NotificationItem | null = null;

    switch (message.channel) {
      case 'alerts':
        notification = createAlertNotification(message.data);
        break;
      case 'inventory':
        notification = createInventoryNotification(message.data);
        break;
      case 'orders':
        notification = createOrderNotification(message.data);
        break;
      case 'payments':
        notification = createPaymentNotification(message.data);
        break;
      case 'system':
        notification = createSystemNotification(message.data);
        break;
    }

    if (notification && shouldShowNotification(notification)) {
      addNotification(notification);
    }
  }, []);

  // Create different types of notifications
  const createAlertNotification = useCallback((data: any): NotificationItem => ({
    id: `alert-${Date.now()}`,
    type: data.type || 'warning',
    title: data.title || 'Cảnh báo',
    message: data.message || 'Có cảnh báo mới',
    read: false,
    category: 'system',
    priority: data.priority || 'medium',
    dismissible: true,
    autoHide: settings.autoHide,
    timestamp: new Date().toISOString(),
    actions: data.actions || []
  }), [settings.autoHide]);

  const createInventoryNotification = useCallback((data: InventoryUpdate): NotificationItem => ({
    id: `inventory-${data.productId}-${Date.now()}`,
    type: data.stockStatus === 'out_of_stock' ? 'error' : 'warning',
    title: 'Cập nhật tồn kho',
    message: `${data.productName}: ${data.newStock} sản phẩm${data.stockStatus === 'low_stock' ? ' (sắp hết)' : ''}`,
    read: false,
    category: 'inventory',
    priority: data.stockStatus === 'out_of_stock' ? 'high' : 'medium',
    dismissible: true,
    autoHide: settings.autoHide,
    timestamp: data.timestamp,
    actions: [
      {
        label: 'Nhập thêm',
        action: () => console.log('Restock', data.productId),
        type: 'primary'
      }
    ]
  }), [settings.autoHide]);

  const createOrderNotification = useCallback((data: OrderStatusUpdate): NotificationItem => ({
    id: `order-${data.orderId}-${Date.now()}`,
    type: data.newStatus === 'completed' ? 'success' : 'info',
    title: 'Cập nhật đơn hàng',
    message: `Đơn hàng #${data.orderId} - ${data.customerName}: ${getOrderStatusText(data.newStatus)}`,
    read: false,
    category: 'orders',
    priority: data.newStatus === 'cancelled' ? 'high' : 'low',
    dismissible: true,
    autoHide: settings.autoHide,
    timestamp: data.timestamp,
    actions: [
      {
        label: 'Xem chi tiết',
        action: () => console.log('View order', data.orderId),
        type: 'primary'
      }
    ]
  }), [settings.autoHide]);

  const createPaymentNotification = useCallback((data: any): NotificationItem => ({
    id: `payment-${data.transactionId}-${Date.now()}`,
    type: data.status === 'completed' ? 'success' : data.status === 'failed' ? 'error' : 'info',
    title: 'Thanh toán',
    message: `${data.paymentMethod.toUpperCase()}: ${formatVND(data.amount)} - ${getPaymentStatusText(data.status)}`,
    read: false,
    category: 'payments',
    priority: data.status === 'failed' ? 'high' : 'low',
    dismissible: true,
    autoHide: settings.autoHide,
    timestamp: data.timestamp
  }), [settings.autoHide]);

  const createSystemNotification = useCallback((data: any): NotificationItem => ({
    id: `system-${Date.now()}`,
    type: data.type || 'info',
    title: 'Hệ thống',
    message: data.message || 'Thông báo hệ thống',
    read: false,
    category: 'system',
    priority: data.priority || 'low',
    dismissible: true,
    autoHide: settings.autoHide,
    timestamp: new Date().toISOString()
  }), [settings.autoHide]);

  // Helper functions
  const getOrderStatusText = (status: string): string => {
    const statusMap: Record<string, string> = {
      'pending': 'Chờ xử lý',
      'processing': 'Đang xử lý',
      'preparing': 'Đang chuẩn bị',
      'ready': 'Sẵn sàng',
      'completed': 'Hoàn thành',
      'cancelled': 'Đã hủy'
    };
    return statusMap[status] || status;
  };

  const getPaymentStatusText = (status: string): string => {
    const statusMap: Record<string, string> = {
      'pending': 'Chờ thanh toán',
      'processing': 'Đang xử lý',
      'completed': 'Thành công',
      'failed': 'Thất bại',
      'refunded': 'Đã hoàn tiền'
    };
    return statusMap[status] || status;
  };

  // Check if notification should be shown
  const shouldShowNotification = useCallback((notification: NotificationItem): boolean => {
    if (!settings.enabled) return false;
    
    // Check category settings
    switch (notification.category) {
      case 'inventory':
        if (!settings.lowStock) return false;
        break;
      case 'orders':
        if (!settings.orders) return false;
        break;
      case 'payments':
        if (!settings.payments) return false;
        break;
      case 'system':
        if (!settings.system) return false;
        break;
    }

    // Check priority settings
    if (settings.priority === 'high' && !['high', 'critical'].includes(notification.priority)) {
      return false;
    }
    if (settings.priority === 'critical' && notification.priority !== 'critical') {
      return false;
    }

    return true;
  }, [settings]);

  // Add notification
  const addNotification = useCallback((notification: NotificationItem) => {
    setNotifications(prev => {
      const updated = [notification, ...prev].slice(0, maxNotifications);
      
      // Show system notification
      showSystemNotification(notification);
      
      // Play sound if enabled
      if (settings.sound && soundEnabled) {
        playNotificationSound(notification.priority);
      }
      
      // Show desktop notification
      if (settings.desktop && 'Notification' in window) {
        showDesktopNotification(notification);
      }
      
      return updated;
    });
  }, [maxNotifications, settings.sound, settings.desktop, soundEnabled]);

  // Show system notification (Ant Design)
  const showSystemNotification = useCallback((notif: NotificationItem) => {
    const icon = {
      'success': <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      'info': <InfoCircleOutlined style={{ color: '#1890ff' }} />,
      'warning': <WarningOutlined style={{ color: '#faad14' }} />,
      'error': <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
    }[notif.type];

    notification[notif.type as keyof typeof notification]({
      message: notif.title,
      description: notif.message,
      icon,
      duration: notif.autoHide ? 4 : 0,
      placement: 'topRight',
      onClick: () => onNotificationClick?.(notif)
    });
  }, [onNotificationClick]);

  // Play notification sound
  const playNotificationSound = useCallback((priority: string) => {
    if (!soundEnabled) return;
    
    const context = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    
    // Different sounds for different priorities
    const frequency = priority === 'critical' ? 800 : priority === 'high' ? 600 : 400;
    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.1, context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.2);
    
    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + 0.2);
  }, [soundEnabled]);

  // Show desktop notification
  const showDesktopNotification = useCallback((notif: NotificationItem) => {
    if (!settings.desktop || !('Notification' in window)) return;
    
    if (Notification.permission === 'granted') {
      new Notification(notif.title, {
        body: notif.message,
        icon: '/icons/icon-192x192.png',
        tag: notif.id,
        requireInteraction: notif.priority === 'critical'
      });
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          showDesktopNotification(notif);
        }
      });
    }
  }, [settings.desktop]);

  // Mark notification as read
  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  }, []);

  // Clear all notifications
  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Clear read notifications
  const clearRead = useCallback(() => {
    setNotifications(prev => prev.filter(notif => !notif.read));
  }, []);

  // Get notification counts
  const notificationCounts = useMemo(() => {
    const unread = notifications.filter(n => !n.read).length;
    const critical = notifications.filter(n => n.priority === 'critical' && !n.read).length;
    const high = notifications.filter(n => n.priority === 'high' && !n.read).length;
    
    return { unread, critical, high };
  }, [notifications]);

  // Get notification icon
  const getNotificationIcon = useCallback((notification: NotificationItem) => {
    const iconMap = {
      'success': <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      'info': <InfoCircleOutlined style={{ color: '#1890ff' }} />,
      'warning': <WarningOutlined style={{ color: '#faad14' }} />,
      'error': <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
    };
    return iconMap[notification.type] || <InfoCircleOutlined />;
  }, []);

  // Get priority color
  const getPriorityColor = useCallback((priority: string) => {
    const colorMap: Record<string, string> = {
      'critical': 'red',
      'high': 'orange',
      'medium': 'yellow',
      'low': 'blue'
    };
    return colorMap[priority] || 'default';
  }, []);

  // Settings panel
  const settingsPanel = (
    <Card title="Cài đặt thông báo" style={{ width: 320 }}>
      <Space direction="vertical" style={{ width: '100%' }}>
        <div>
          <Text strong>Bật thông báo</Text>
          <Switch 
            checked={settings.enabled} 
            onChange={(checked) => setSettings(prev => ({ ...prev, enabled: checked }))}
            style={{ float: 'right' }}
          />
        </div>
        
        <div>
          <Text strong>Âm thanh</Text>
          <Switch 
            checked={settings.sound} 
            onChange={(checked) => setSettings(prev => ({ ...prev, sound: checked }))}
            style={{ float: 'right' }}
          />
        </div>
        
        <div>
          <Text strong>Thông báo desktop</Text>
          <Switch 
            checked={settings.desktop} 
            onChange={(checked) => setSettings(prev => ({ ...prev, desktop: checked }))}
            style={{ float: 'right' }}
          />
        </div>
        
        <Divider />
        
        <div>
          <Text strong>Mức độ ưu tiên</Text>
          <Select 
            value={settings.priority} 
            onChange={(value) => setSettings(prev => ({ ...prev, priority: value }))}
            style={{ width: '100%', marginTop: 8 }}
          >
            <Option value="all">Tất cả</Option>
            <Option value="high">Cao và khẩn cấp</Option>
            <Option value="critical">Chỉ khẩn cấp</Option>
          </Select>
        </div>
        
        <Divider />
        
        <div>
          <Text strong>Loại thông báo</Text>
          <div style={{ marginTop: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text>Tồn kho</Text>
              <Switch 
                size="small"
                checked={settings.lowStock} 
                onChange={(checked) => setSettings(prev => ({ ...prev, lowStock: checked }))}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text>Đơn hàng</Text>
              <Switch 
                size="small"
                checked={settings.orders} 
                onChange={(checked) => setSettings(prev => ({ ...prev, orders: checked }))}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text>Thanh toán</Text>
              <Switch 
                size="small"
                checked={settings.payments} 
                onChange={(checked) => setSettings(prev => ({ ...prev, payments: checked }))}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Text>Hệ thống</Text>
              <Switch 
                size="small"
                checked={settings.system} 
                onChange={(checked) => setSettings(prev => ({ ...prev, system: checked }))}
              />
            </div>
          </div>
        </div>
      </Space>
    </Card>
  );

  // Notification list
  const notificationList = (
    <Card 
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Thông báo ({notificationCounts.unread})</span>
          <Space>
            <Button 
              type="text" 
              size="small" 
              icon={<ClearOutlined />}
              onClick={clearRead}
              disabled={notifications.filter(n => n.read).length === 0}
            >
              Xóa đã đọc
            </Button>
            <Button 
              type="text" 
              size="small" 
              icon={<CloseOutlined />}
              onClick={clearAll}
              disabled={notifications.length === 0}
            >
              Xóa tất cả
            </Button>
          </Space>
        </div>
      }
      style={{ width: 400, maxHeight: 500, overflow: 'auto' }}
    >
      <List
        dataSource={notifications.slice(0, 20)}
        renderItem={(notification) => (
          <List.Item
            className={`notification-item ${notification.read ? 'read' : 'unread'}`}
            actions={[
              !notification.read && (
                <Button 
                  type="text" 
                  size="small"
                  icon={<CheckOutlined />}
                  onClick={() => markAsRead(notification.id)}
                />
              )
            ].filter(Boolean)}
            onClick={() => {
              if (!notification.read) {
                markAsRead(notification.id);
              }
              onNotificationClick?.(notification);
            }}
          >
            <List.Item.Meta
              avatar={
                <Avatar 
                  icon={getNotificationIcon(notification)}
                  style={{ backgroundColor: 'transparent' }}
                />
              }
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>{notification.title}</span>
                  <Tag 
                    color={getPriorityColor(notification.priority)}
                    size="small"
                  >
                    {notification.priority}
                  </Tag>
                  {!notification.read && (
                    <Badge status="processing" />
                  )}
                </div>
              }
              description={
                <div>
                  <div>{notification.message}</div>
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    {new Date(notification.timestamp).toLocaleString('vi-VN')}
                  </Text>
                </div>
              }
            />
          </List.Item>
        )}
        locale={{
          emptyText: 'Không có thông báo nào'
        }}
      />
    </Card>
  );

  return (
    <div className="real-time-notification-system">
      <Popover
        content={notificationList}
        trigger="click"
        placement="bottomRight"
        visible={popoverVisible}
        onVisibleChange={setPopoverVisible}
      >
        <Badge 
          count={showBadge ? notificationCounts.unread : 0}
          dot={notificationCounts.critical > 0}
        >
          <Button 
            type="text" 
            icon={<BellOutlined />}
            className={`notification-bell ${connected ? 'connected' : 'disconnected'}`}
          />
        </Badge>
      </Popover>
      
      <Popover
        content={settingsPanel}
        trigger="click"
        placement="bottomRight"
      >
        <Tooltip title="Cài đặt thông báo">
          <Button 
            type="text" 
            icon={<SettingOutlined />}
            size="small"
            style={{ marginLeft: 8 }}
          />
        </Tooltip>
      </Popover>
    </div>
  );
}