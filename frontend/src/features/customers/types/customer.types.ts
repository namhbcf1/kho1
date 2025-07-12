// Customer TypeScript types
export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: {
    street: string;
    ward: string;
    district: string;
    province: string;
  };
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  loyaltyPoints: number;
  totalSpent: number;
  totalOrders: number;
  tier?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoyaltyTransaction {
  id: string;
  customerId: string;
  type: 'earn' | 'redeem' | 'expire';
  points: number;
  description: string;
  orderId?: string;
  createdAt: string;
}

export interface CustomerFormData {
  name: string;
  email?: string;
  phone?: string;
  address?: {
    street: string;
    ward: string;
    district: string;
    province: string;
  };
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
}
