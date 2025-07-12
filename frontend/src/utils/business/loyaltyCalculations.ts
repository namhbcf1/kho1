// Vietnamese loyalty program calculations
export interface LoyaltyTier {
  id: string;
  name: string;
  minimumSpent: number;
  pointsMultiplier: number;
  discountPercentage: number;
  benefits: string[];
}

export interface LoyaltyCalculationResult {
  pointsEarned: number;
  pointsRedeemed: number;
  pointsBalance: number;
  discountAmount: number;
  tierUpgrade?: LoyaltyTier;
  nextTierProgress: number;
}

export interface LoyaltyTransaction {
  type: 'earn' | 'redeem' | 'expire' | 'adjust';
  points: number;
  orderId?: string;
  description?: string;
  expiresAt?: Date;
}

// Vietnamese loyalty tiers
export const VIETNAM_LOYALTY_TIERS: LoyaltyTier[] = [
  {
    id: 'bronze',
    name: 'Đồng',
    minimumSpent: 0,
    pointsMultiplier: 1,
    discountPercentage: 0,
    benefits: ['Tích điểm cơ bản'],
  },
  {
    id: 'silver',
    name: 'Bạc',
    minimumSpent: 5000000, // 5 million VND
    pointsMultiplier: 1.2,
    discountPercentage: 2,
    benefits: ['Tích điểm x1.2', 'Giảm giá 2%', 'Ưu tiên hỗ trợ'],
  },
  {
    id: 'gold',
    name: 'Vàng',
    minimumSpent: 20000000, // 20 million VND
    pointsMultiplier: 1.5,
    discountPercentage: 5,
    benefits: ['Tích điểm x1.5', 'Giảm giá 5%', 'Miễn phí giao hàng', 'Quà sinh nhật'],
  },
  {
    id: 'platinum',
    name: 'Bạch kim',
    minimumSpent: 50000000, // 50 million VND
    pointsMultiplier: 2,
    discountPercentage: 8,
    benefits: ['Tích điểm x2', 'Giảm giá 8%', 'Ưu tiên đặc biệt', 'Sự kiện VIP'],
  },
  {
    id: 'diamond',
    name: 'Kim cương',
    minimumSpent: 100000000, // 100 million VND
    pointsMultiplier: 2.5,
    discountPercentage: 10,
    benefits: ['Tích điểm x2.5', 'Giảm giá 10%', 'Quản lý tài khoản riêng', 'Ưu đãi độc quyền'],
  },
];

export class LoyaltyCalculator {
  private tiers: LoyaltyTier[];
  private pointsPerVND: number;
  private pointsExpiryDays: number;

  constructor(
    tiers: LoyaltyTier[] = VIETNAM_LOYALTY_TIERS,
    pointsPerVND: number = 0.01, // 1 point per 100 VND
    pointsExpiryDays: number = 365
  ) {
    this.tiers = tiers.sort((a, b) => a.minimumSpent - b.minimumSpent);
    this.pointsPerVND = pointsPerVND;
    this.pointsExpiryDays = pointsExpiryDays;
  }

  public calculatePointsEarned(
    orderAmount: number,
    currentTier: LoyaltyTier,
    excludeTax: boolean = true
  ): number {
    if (orderAmount <= 0) return 0;

    // Calculate base points
    const basePoints = orderAmount * this.pointsPerVND;
    
    // Apply tier multiplier
    const pointsWithMultiplier = basePoints * currentTier.pointsMultiplier;
    
    return Math.floor(pointsWithMultiplier);
  }

  public calculateTierDiscount(orderAmount: number, tier: LoyaltyTier): number {
    if (orderAmount <= 0 || tier.discountPercentage <= 0) return 0;
    
    const discountAmount = orderAmount * (tier.discountPercentage / 100);
    return Math.round(discountAmount);
  }

  public calculatePointsRedemption(
    pointsToRedeem: number,
    pointsValue: number = 1000 // 1000 points = 1000 VND
  ): number {
    if (pointsToRedeem <= 0) return 0;
    
    return Math.floor(pointsToRedeem / pointsValue) * pointsValue;
  }

  public getCurrentTier(totalSpent: number): LoyaltyTier {
    for (let i = this.tiers.length - 1; i >= 0; i--) {
      if (totalSpent >= this.tiers[i].minimumSpent) {
        return this.tiers[i];
      }
    }
    return this.tiers[0]; // Default to lowest tier
  }

  public getNextTier(currentTier: LoyaltyTier): LoyaltyTier | null {
    const currentIndex = this.tiers.findIndex(tier => tier.id === currentTier.id);
    if (currentIndex === -1 || currentIndex === this.tiers.length - 1) {
      return null; // Already at highest tier
    }
    return this.tiers[currentIndex + 1];
  }

  public calculateTierProgress(totalSpent: number, currentTier: LoyaltyTier): number {
    const nextTier = this.getNextTier(currentTier);
    if (!nextTier) return 100; // Already at max tier

    const currentTierMin = currentTier.minimumSpent;
    const nextTierMin = nextTier.minimumSpent;
    const progress = (totalSpent - currentTierMin) / (nextTierMin - currentTierMin);
    
    return Math.min(100, Math.max(0, progress * 100));
  }

  public processLoyaltyTransaction(
    orderAmount: number,
    currentPoints: number,
    currentTotalSpent: number,
    pointsToRedeem: number = 0
  ): LoyaltyCalculationResult {
    const currentTier = this.getCurrentTier(currentTotalSpent);
    const newTotalSpent = currentTotalSpent + orderAmount;
    const newTier = this.getCurrentTier(newTotalSpent);
    
    // Calculate points earned
    const pointsEarned = this.calculatePointsEarned(orderAmount, currentTier);
    
    // Calculate tier discount
    const discountAmount = this.calculateTierDiscount(orderAmount, currentTier);
    
    // Calculate new points balance
    const pointsBalance = currentPoints + pointsEarned - pointsToRedeem;
    
    // Calculate tier progress
    const nextTierProgress = this.calculateTierProgress(newTotalSpent, newTier);
    
    return {
      pointsEarned,
      pointsRedeemed: pointsToRedeem,
      pointsBalance,
      discountAmount,
      tierUpgrade: newTier.id !== currentTier.id ? newTier : undefined,
      nextTierProgress,
    };
  }

  public calculatePointsExpiry(transactions: LoyaltyTransaction[]): LoyaltyTransaction[] {
    const now = new Date();
    const expiringTransactions: LoyaltyTransaction[] = [];

    for (const transaction of transactions) {
      if (transaction.type === 'earn' && transaction.expiresAt) {
        if (transaction.expiresAt <= now) {
          expiringTransactions.push({
            type: 'expire',
            points: -transaction.points,
            description: `Điểm hết hạn từ giao dịch ${transaction.orderId}`,
          });
        }
      }
    }

    return expiringTransactions;
  }

  public generateLoyaltyReport(
    customerId: string,
    transactions: LoyaltyTransaction[],
    currentTier: LoyaltyTier
  ) {
    const totalEarned = transactions
      .filter(t => t.type === 'earn')
      .reduce((sum, t) => sum + t.points, 0);
    
    const totalRedeemed = transactions
      .filter(t => t.type === 'redeem')
      .reduce((sum, t) => sum + Math.abs(t.points), 0);
    
    const totalExpired = transactions
      .filter(t => t.type === 'expire')
      .reduce((sum, t) => sum + Math.abs(t.points), 0);
    
    const currentBalance = totalEarned - totalRedeemed - totalExpired;

    return {
      customerId,
      currentTier: currentTier.name,
      currentBalance,
      totalEarned,
      totalRedeemed,
      totalExpired,
      transactionCount: transactions.length,
      reportDate: new Date().toISOString(),
    };
  }

  public getTiers(): LoyaltyTier[] {
    return [...this.tiers];
  }

  public getPointsPerVND(): number {
    return this.pointsPerVND;
  }

  public getPointsExpiryDays(): number {
    return this.pointsExpiryDays;
  }
}

// Convenience functions
export const calculateLoyaltyPoints = (
  orderAmount: number,
  tier: LoyaltyTier,
  pointsPerVND: number = 0.01
): number => {
  const calculator = new LoyaltyCalculator();
  return calculator.calculatePointsEarned(orderAmount, tier);
};

export const getTierBySpending = (totalSpent: number): LoyaltyTier => {
  const calculator = new LoyaltyCalculator();
  return calculator.getCurrentTier(totalSpent);
};

export const calculateTierDiscount = (orderAmount: number, tier: LoyaltyTier): number => {
  const calculator = new LoyaltyCalculator();
  return calculator.calculateTierDiscount(orderAmount, tier);
};

export const formatLoyaltyBenefits = (tier: LoyaltyTier): string => {
  return tier.benefits.join(' • ');
};

export const formatTierProgress = (progress: number): string => {
  return `${progress.toFixed(1)}%`;
};

export const formatPointsBalance = (points: number): string => {
  return `${points.toLocaleString('vi-VN')} điểm`;
};

export const getPointsValue = (points: number, valuePerPoint: number = 1): number => {
  return points * valuePerPoint;
};

export const formatPointsValue = (points: number, valuePerPoint: number = 1): string => {
  const value = getPointsValue(points, valuePerPoint);
  return `${value.toLocaleString('vi-VN')} ₫`;
};

// Default calculator instance
export const defaultLoyaltyCalculator = new LoyaltyCalculator();
