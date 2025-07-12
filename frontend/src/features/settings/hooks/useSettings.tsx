// Settings management hook
import { useState, useCallback } from 'react';

export const useSettings = () => {
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getSettings = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/settings');
      const data = await response.json();
      setSettings(data.settings || {});
      return data.settings;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateBusinessSettings = useCallback(async (businessData: any) => {
    setLoading(true);
    try {
      const response = await fetch('/api/settings/business', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(businessData),
      });
      const data = await response.json();
      setSettings(prev => ({ ...prev, business: data.business }));
      return data.business;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update business settings');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateTaxSettings = useCallback(async (taxData: any) => {
    setLoading(true);
    try {
      const response = await fetch('/api/settings/tax', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taxData),
      });
      const data = await response.json();
      setSettings(prev => ({ ...prev, tax: data.tax }));
      return data.tax;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update tax settings');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updatePaymentSettings = useCallback(async (paymentData: any) => {
    setLoading(true);
    try {
      const response = await fetch('/api/settings/payment', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData),
      });
      const data = await response.json();
      setSettings(prev => ({ ...prev, payment: data.payment }));
      return data.payment;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update payment settings');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateReceiptSettings = useCallback(async (receiptData: any) => {
    setLoading(true);
    try {
      const response = await fetch('/api/settings/receipt', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(receiptData),
      });
      const data = await response.json();
      setSettings(prev => ({ ...prev, receipt: data.receipt }));
      return data.receipt;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update receipt settings');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createBackup = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/backup/create', {
        method: 'POST',
      });
      const data = await response.json();
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create backup');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getBackupHistory = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/backup/history');
      const data = await response.json();
      return data.backups || [];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch backup history');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    settings,
    loading,
    error,
    getSettings,
    updateBusinessSettings,
    updateTaxSettings,
    updatePaymentSettings,
    updateReceiptSettings,
    createBackup,
    getBackupHistory,
  };
};
