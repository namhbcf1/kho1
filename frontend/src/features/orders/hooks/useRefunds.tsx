// Refund processing hook
import { useState, useCallback } from 'react';

export const useRefunds = () => {
  const [refunds, setRefunds] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processRefund = useCallback(async (orderId: string, refundData: any) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/orders/${orderId}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(refundData),
      });
      const data = await response.json();
      setRefunds(prev => [data.refund, ...prev]);
      return data.refund;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process refund');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getRefunds = useCallback(async (orderId?: string) => {
    setLoading(true);
    try {
      const url = orderId ? `/api/refunds?orderId=${orderId}` : '/api/refunds';
      const response = await fetch(url);
      const data = await response.json();
      setRefunds(data.refunds || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch refunds');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    refunds,
    loading,
    error,
    processRefund,
    getRefunds,
  };
};
