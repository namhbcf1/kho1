import React, { useState, useEffect } from 'react';
import { Button, notification, Typography, Space } from 'antd';
import { 
  ReloadOutlined, 
  UpOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { useRegisterSW } from 'virtual:pwa-register/react';

const { Text } = Typography;

interface PWAUpdatePromptProps {
  onUpdate?: () => void;
}

export default function PWAUpdatePrompt({ onUpdate }: PWAUpdatePromptProps) {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ' + r);
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
    setUpdateAvailable(false);
  };

  const handleUpdate = () => {
    updateServiceWorker(true);
    onUpdate?.();
    close();
  };

  useEffect(() => {
    if (offlineReady) {
      notification.success({
        message: 'Ứng dụng sẵn sàng offline',
        description: (
          <div>
            <Text>KhoAugment POS đã được tải xuống và có thể hoạt động offline.</Text>
            <br />
            <Text type="secondary">Bạn có thể sử dụng ứng dụng ngay cả khi mất kết nối mạng.</Text>
          </div>
        ),
        icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
        placement: 'bottomRight',
        duration: 6,
        key: 'offline-ready'
      });
    }
  }, [offlineReady]);

  useEffect(() => {
    if (needRefresh) {
      setUpdateAvailable(true);
      
      notification.info({
        message: 'Cập nhật mới có sẵn',
        description: (
          <div>
            <Text>Phiên bản mới của KhoAugment POS đã sẵn sàng.</Text>
            <br />
            <Space style={{ marginTop: 8 }}>
              <Button
                type="primary"
                size="small"
                icon={<ReloadOutlined />}
                onClick={handleUpdate}
              >
                Cập nhật ngay
              </Button>
              <Button size="small" onClick={close}>
                Để sau
              </Button>
            </Space>
          </div>
        ),
        icon: <UpOutlined style={{ color: '#1890ff' }} />,
        placement: 'bottomRight',
        duration: 0, // Keep open until user action
        key: 'update-available',
        onClose: close
      });
    }
  }, [needRefresh]);

  // Show persistent update button if update is available
  if (updateAvailable && needRefresh) {
    return (
      <div
        style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          zIndex: 1000,
          background: '#fff',
          borderRadius: 8,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          padding: 16,
          border: '1px solid #1890ff',
          maxWidth: 300
        }}
      >
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <InfoCircleOutlined style={{ color: '#1890ff', marginRight: 8 }} />
            <Text strong>Cập nhật mới</Text>
          </div>
          <Text style={{ fontSize: '14px' }}>
            Phiên bản mới của KhoAugment POS đã sẵn sàng với các tính năng cải tiến.
          </Text>
          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button size="small" onClick={close}>
              Bỏ qua
            </Button>
            <Button
              type="primary"
              size="small"
              icon={<ReloadOutlined />}
              onClick={handleUpdate}
            >
              Cập nhật
            </Button>
          </Space>
        </Space>
      </div>
    );
  }

  return null;
}