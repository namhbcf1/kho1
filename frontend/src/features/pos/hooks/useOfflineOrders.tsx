// Offline order management hook
import { useState, useCallback } from 'react';

export const useOfflineOrders = () => {
  const [offlineOrders, setOfflineOrders] = useState<any[]>([]);
  const [syncing, setSyncing] = useState(false);

  const addOfflineOrder = useCallback((order: any) => {
    setOfflineOrders(prev => [...prev, { ...order, offline: true, timestamp: Date.now() }]);
  }, []);

  const syncOfflineOrders = useCallback(async () => {
    setSyncing(true);
    try {
      // Sync logic with backend
      setOfflineOrders([]);
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setSyncing(false);
    }
  }, []);

  return {
    offlineOrders,
    syncing,
    addOfflineOrder,
    syncOfflineOrders,
  };
};
