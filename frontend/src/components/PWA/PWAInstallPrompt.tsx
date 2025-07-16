import React, { useState, useEffect } from 'react';
import { Button, Modal, Space, Typography, Card } from 'antd';
import { 
  DownloadOutlined, 
  MobileOutlined, 
  DesktopOutlined,
  CheckCircleOutlined,
  CloseOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PWAInstallPromptProps {
  onInstall?: () => void;
  onDismiss?: () => void;
}

export default function PWAInstallPrompt({ onInstall, onDismiss }: PWAInstallPromptProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [installSource, setInstallSource] = useState<string>('');

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      
      // Don't show immediately, wait for user interaction
      setTimeout(() => {
        const lastDismissed = localStorage.getItem('pwa-install-dismissed');
        const daysSinceDismissed = lastDismissed 
          ? (Date.now() - parseInt(lastDismissed)) / (1000 * 60 * 60 * 24)
          : 7;
        
        if (daysSinceDismissed >= 7) { // Show again after 7 days
          setShowInstallPrompt(true);
        }
      }, 3000); // Wait 3 seconds after page load
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
      onInstall?.();
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [onInstall]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        setInstallSource(choiceResult.platform);
        setShowInstallPrompt(false);
        onInstall?.();
      }
      
      setDeferredPrompt(null);
    } catch (error) {
      console.error('Error installing PWA:', error);
    }
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    onDismiss?.();
  };

  const getDeviceIcon = () => {
    const userAgent = navigator.userAgent;
    if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
      return <MobileOutlined style={{ fontSize: '48px', color: '#1890ff' }} />;
    }
    return <DesktopOutlined style={{ fontSize: '48px', color: '#1890ff' }} />;
  };

  const getInstallInstructions = () => {
    const userAgent = navigator.userAgent;
    
    if (/iPhone|iPad|iPod/i.test(userAgent)) {
      return (
        <div>
          <Paragraph>
            Để cài đặt ứng dụng trên iOS:
          </Paragraph>
          <ol>
            <li>Nhấn nút <strong>Chia sẻ</strong> ở dưới trình duyệt</li>
            <li>Chọn <strong>"Thêm vào Màn hình chính"</strong></li>
            <li>Nhấn <strong>"Thêm"</strong> để hoàn tất</li>
          </ol>
        </div>
      );
    }
    
    if (/Android/i.test(userAgent)) {
      return (
        <div>
          <Paragraph>
            Để cài đặt ứng dụng trên Android:
          </Paragraph>
          <ol>
            <li>Nhấn nút <strong>"Cài đặt"</strong> bên dưới</li>
            <li>Hoặc nhấn menu ⋮ và chọn <strong>"Cài đặt ứng dụng"</strong></li>
            <li>Xác nhận cài đặt</li>
          </ol>
        </div>
      );
    }

    return (
      <div>
        <Paragraph>
          Để cài đặt ứng dụng trên máy tính:
        </Paragraph>
        <ol>
          <li>Nhấn nút <strong>"Cài đặt"</strong> bên dưới</li>
          <li>Hoặc tìm biểu tượng cài đặt trên thanh địa chỉ</li>
          <li>Xác nhận cài đặt</li>
        </ol>
      </div>
    );
  };

  if (isInstalled) {
    return null;
  }

  return (
    <Modal
      title={
        <Space>
          {getDeviceIcon()}
          <Title level={4} style={{ margin: 0 }}>
            Cài đặt KhoAugment POS
          </Title>
        </Space>
      }
      open={showInstallPrompt}
      onCancel={handleDismiss}
      width={480}
      footer={[
        <Button key="dismiss" onClick={handleDismiss}>
          Để sau
        </Button>,
        deferredPrompt && (
          <Button 
            key="install" 
            type="primary" 
            icon={<DownloadOutlined />}
            onClick={handleInstallClick}
          >
            Cài đặt ngay
          </Button>
        )
      ]}
      closeIcon={<CloseOutlined />}
    >
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <Paragraph>
          Cài đặt <strong>KhoAugment POS</strong> để có trải nghiệm tốt nhất:
        </Paragraph>
        
        <Card size="small" style={{ marginBottom: 16 }}>
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <div>
              <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
              <Text>Truy cập nhanh từ màn hình chính</Text>
            </div>
            <div>
              <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
              <Text>Hoạt động offline khi mất mạng</Text>
            </div>
            <div>
              <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
              <Text>Hiệu suất tốt hơn ứng dụng web</Text>
            </div>
            <div>
              <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
              <Text>Không tốn bộ nhớ như app thông thường</Text>
            </div>
          </Space>
        </Card>
      </div>

      {getInstallInstructions()}
      
      <Paragraph style={{ fontSize: '12px', color: '#666', marginTop: 16 }}>
        * Ứng dụng này được tối ưu hóa cho doanh nghiệp Việt Nam với đầy đủ tính năng POS chuyên nghiệp.
      </Paragraph>
    </Modal>
  );
}