// Performance tracking hook
import { useState, useCallback } from 'react';

export const usePerformance = () => {
  const [performance, setPerformance] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getPerformanceData = useCallback(async (staffId: string, period: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/staff/${staffId}/performance?period=${period}`);
      const data = await response.json();
      setPerformance(data.performance || []);
      return data.performance;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch performance data');
    } finally {
      setLoading(false);
    }
  }, []);

  const getCommissionData = useCallback(async (staffId: string, month: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/staff/${staffId}/commission?month=${month}`);
      const data = await response.json();
      return data.commission || [];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch commission data');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const updatePerformanceTarget = useCallback(async (staffId: string, targets: any) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/staff/${staffId}/targets`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(targets),
      });
      const data = await response.json();
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update targets');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getShiftData = useCallback(async (staffId: string, date: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/staff/${staffId}/shifts?date=${date}`);
      const data = await response.json();
      return data.shifts || [];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch shift data');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    performance,
    loading,
    error,
    getPerformanceData,
    getCommissionData,
    updatePerformanceTarget,
    getShiftData,
  };
};
