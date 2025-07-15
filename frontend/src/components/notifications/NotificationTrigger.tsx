// Notification trigger button component
import React from 'react';
import { Badge, Button, Tooltip } from 'antd';
import { BellOutlined } from '@ant-design/icons';
import { useNotifications, useNotificationActions } from '../../stores/notificationStore';

interface NotificationTriggerProps {
  className?: string;
  size?: 'small' | 'middle' | 'large';
  type?: 'default' | 'primary' | 'ghost' | 'dashed' | 'link' | 'text';
  shape?: 'default' | 'circle' | 'round';
}

const NotificationTrigger: React.FC<NotificationTriggerProps> = ({
  className,
  size = 'middle',
  type = 'text',
  shape = 'circle'
}) => {
  const { unreadCount } = useNotifications();
  const { togglePanel } = useNotificationActions();

  return (
    <Tooltip title="Thông báo">
      <Badge count={unreadCount} size="small" offset={[-2, 2]}>
        <Button
          type={type}
          shape={shape}
          size={size}
          icon={<BellOutlined />}
          onClick={togglePanel}
          className={className}
        />
      </Badge>
    </Tooltip>
  );
};

export default NotificationTrigger;