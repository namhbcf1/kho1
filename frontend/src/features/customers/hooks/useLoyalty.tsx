// Loyalty program logic hook
import { useState, useCallback } from 'react';

export const useLoyalty = () => {
  const [loyaltyData, setLoyaltyData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getLoyaltyInfo = useCallback(async (customerId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/customers/${customerId}/loyalty`);
      const data = await response.json();
      setLoyaltyData(data.loyalty);
      return data.loyalty;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch loyalty info');
    } finally {
      setLoading(false);
    }
  }, []);

  const addPoints = useCallback(async (customerId: string, points: number, orderId?: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/customers/${customerId}/loyalty/add-points`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ points, orderId }),
      });
      const data = await response.json();
      setLoyaltyData(prev => ({ ...prev, points: data.newPoints }));
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add points');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const redeemPoints = useCallback(async (customerId: string, points: number) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/customers/${customerId}/loyalty/redeem-points`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ points }),
      });
      const data = await response.json();
      setLoyaltyData(prev => ({ ...prev, points: data.newPoints }));
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to redeem points');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const calculateTierProgress = useCallback((totalSpent: number, currentTier: string) => {
    const tiers = [
      { id: 'bronze', requirement: 0 },
      { id: 'silver', requirement: 5000000 },
      { id: 'gold', requirement: 20000000 },
      { id: 'platinum', requirement: 50000000 },
      { id: 'diamond', requirement: 100000000 },
    ];

    const currentIndex = tiers.findIndex(t => t.id === currentTier);
    const nextTier = tiers[currentIndex + 1];

    if (!nextTier) {
      return { progress: 100, nextTier: null, remaining: 0 };
    }

    const progress = (totalSpent / nextTier.requirement) * 100;
    const remaining = nextTier.requirement - totalSpent;

    return { progress, nextTier, remaining };
  }, []);

  return {
    loyaltyData,
    loading,
    error,
    getLoyaltyInfo,
    addPoints,
    redeemPoints,
    calculateTierProgress,
  };
};
