// ZaloPay payment hook
import { useState, useCallback } from 'react';

export const useZaloPay = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPayment = useCallback(async (paymentData: any) => {
    setLoading(true);
    try {
      const response = await fetch('/api/payments/zalopay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData),
      });
      const data = await response.json();
      
      if (data.success) {
        window.open(data.data.paymentUrl, '_blank');
        return data.data;
      } else {
        throw new Error(data.error.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ZaloPay payment failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    createPayment,
  };
};
