import React, { useState, useEffect } from 'react';
import { Alert, Typography, Space } from 'antd';
import { 
  WifiOutlined, 
  DisconnectOutlined,
  SyncOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';

const { Text } = Typography;

interface OfflineIndicatorProps {
  className?: string;
}

export default function OfflineIndicator({ className }: OfflineIndicatorProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineMessage, setShowOfflineMessage] = useState(false);
  const [showBackOnlineMessage, setShowBackOnlineMessage] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineMessage(false);
      setShowBackOnlineMessage(true);
      
      // Hide "back online" message after 3 seconds
      setTimeout(() => {
        setShowBackOnlineMessage(false);
      }, 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineMessage(true);
      setShowBackOnlineMessage(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Show offline message immediately if already offline
    if (!navigator.onLine) {
      setShowOfflineMessage(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (showBackOnlineMessage) {
    return (
      <div 
        className={className}
        style={{
          position: 'fixed',
          top: 70,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1001,
          width: 'auto',
          maxWidth: '90vw'
        }}
      >
        <Alert
          message={
            <Space>
              <CheckCircleOutlined />
              <Text>Đã kết nối lại mạng</Text>
            </Space>
          }
          description="Tất cả tính năng đã hoạt động bình thường"
          type="success"
          showIcon={false}
          closable
          onClose={() => setShowBackOnlineMessage(false)}
        />
      </div>
    );
  }

  if (showOfflineMessage && !isOnline) {
    return (
      <div 
        className={className}
        style={{
          position: 'fixed',
          top: 70,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1001,
          width: 'auto',
          maxWidth: '90vw'
        }}
      >
        <Alert
          message={
            <Space>
              <DisconnectOutlined />
              <Text>Đang offline</Text>
            </Space>
          }
          description={
            <div>
              <Text>Bạn đang offline. Ứng dụng vẫn hoạt động với dữ liệu đã lưu.</Text>
              <br />
              <Text type="secondary">
                Các thay đổi sẽ được đồng bộ khi có kết nối mạng.
              </Text>
            </div>
          }
          type="warning"
          showIcon={false}
          closable
          onClose={() => setShowOfflineMessage(false)}
          action={
            <Space>
              <SyncOutlined 
                spin 
                style={{ color: '#faad14' }}
                title="Đang thử kết nối lại..."
              />
            </Space>
          }
        />
      </div>
    );
  }

  return null;
}

// Connection status hook for other components to use
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}