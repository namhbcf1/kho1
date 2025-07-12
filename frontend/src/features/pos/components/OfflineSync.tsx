// PWA offline sync component
import React from 'react';
import { Card, Button, Badge } from 'antd';
import { SyncOutlined, WifiOutlined } from '@ant-design/icons';

export const OfflineSync: React.FC = () => {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);
  const [pendingSync, setPendingSync] = React.useState(0);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <Card size="small">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge status={isOnline ? 'success' : 'error'} />
          <WifiOutlined />
          <span>{isOnline ? 'Đã kết nối' : 'Offline'}</span>
        </div>
        
        {pendingSync > 0 && (
          <Button
            type="primary"
            size="small"
            icon={<SyncOutlined />}
            onClick={() => {
              // Sync logic
            }}
          >
            Đồng bộ ({pendingSync})
          </Button>
        )}
      </div>
    </Card>
  );
};

export default OfflineSync;
