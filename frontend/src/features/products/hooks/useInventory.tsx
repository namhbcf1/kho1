// Inventory tracking hook
import { useState, useCallback } from 'react';

export const useInventory = () => {
  const [inventory, setInventory] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/inventory');
      const data = await response.json();
      setInventory(data.inventory || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch inventory');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateStock = useCallback(async (productId: string, quantity: number, type: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/inventory/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity, type }),
      });
      const data = await response.json();
      setInventory(prev => prev.map(item => 
        item.productId === productId 
          ? { ...item, stock: data.newStock }
          : item
      ));
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update stock');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getTransactions = useCallback(async (productId?: string) => {
    setLoading(true);
    try {
      const url = productId ? `/api/inventory/transactions?productId=${productId}` : '/api/inventory/transactions';
      const response = await fetch(url);
      const data = await response.json();
      setTransactions(data.transactions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  }, []);

  const getLowStockItems = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/inventory/low-stock');
      const data = await response.json();
      return data.items || [];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch low stock items');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    inventory,
    transactions,
    loading,
    error,
    fetchInventory,
    updateStock,
    getTransactions,
    getLowStockItems,
  };
};
