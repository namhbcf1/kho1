// Staff management hook
import { useState, useCallback } from 'react';

export const useStaff = () => {
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStaff = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/staff');
      const data = await response.json();
      setStaff(data.staff || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch staff');
    } finally {
      setLoading(false);
    }
  }, []);

  const createStaff = useCallback(async (staffData: any) => {
    setLoading(true);
    try {
      const response = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(staffData),
      });
      const data = await response.json();
      setStaff(prev => [...prev, data.staff]);
      return data.staff;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create staff');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateStaff = useCallback(async (id: string, staffData: any) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/staff/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(staffData),
      });
      const data = await response.json();
      setStaff(prev => prev.map(s => s.id === id ? data.staff : s));
      return data.staff;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update staff');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteStaff = useCallback(async (id: string) => {
    setLoading(true);
    try {
      await fetch(`/api/staff/${id}`, { method: 'DELETE' });
      setStaff(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete staff');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    staff,
    loading,
    error,
    fetchStaff,
    createStaff,
    updateStaff,
    deleteStaff,
  };
};
