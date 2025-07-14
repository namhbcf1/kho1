// Real customer service with Vietnamese loyalty program
import { apiClient } from './client';
import { API_ENDPOINTS } from '../../constants/api';

export type LoyaltyTier = 'dong' | 'bac' | 'vang' | 'bachkim' | 'kimcuong';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: {
    street: string;
    ward: string;
    district: string;
    province: string;
    postalCode?: string;
  };
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  loyaltyTier: LoyaltyTier;
  loyaltyPoints: number;
  totalSpent: number;
  totalOrders: number;
  averageOrderValue: number;
  lastOrderDate?: string;
  registrationDate: string;
  lastActivityDate: string;
  tags: string[];
  notes?: string;
  isActive: boolean;
  isVip: boolean;
  preferredLanguage: 'vi' | 'en';
  communicationPreferences: {
    sms: boolean;
    email: boolean;
    push: boolean;
  };
  socialProfiles?: {
    facebook?: string;
    zalo?: string;
    telegram?: string;
  };
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

export interface LoyaltyTierConfig {
  tier: LoyaltyTier;
  name: string;
  nameEn: string;
  color: string;
  icon: string;
  minSpent: number;
  discountPercent: number;
  pointsMultiplier: number;
  benefits: string[];
  perks: {
    freeShipping: boolean;
    prioritySupport: boolean;
    specialOffers: boolean;
    birthdayBonus: number;
    tetBonus: number;
  };
}

export interface LoyaltyTransaction {
  id: string;
  customerId: string;
  type: 'earn' | 'redeem' | 'expire' | 'bonus' | 'penalty';
  points: number;
  description: string;
  orderId?: string;
  createdAt: string;
  expiryDate?: string;
}

export interface CustomerFilters {
  search?: string;
  loyaltyTier?: LoyaltyTier[];
  province?: string;
  district?: string;
  minSpent?: number;
  maxSpent?: number;
  minPoints?: number;
  maxPoints?: number;
  isActive?: boolean;
  isVip?: boolean;
  hasOrders?: boolean;
  lastOrderDays?: number;
  registrationDateStart?: string;
  registrationDateEnd?: string;
  tags?: string[];
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CustomerCreateData {
  name: string;
  phone: string;
  email?: string;
  address?: {
    street: string;
    ward: string;
    district: string;
    province: string;
    postalCode?: string;
  };
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  tags?: string[];
  notes?: string;
  preferredLanguage?: 'vi' | 'en';
  communicationPreferences?: {
    sms: boolean;
    email: boolean;
    push: boolean;
  };
  socialProfiles?: {
    facebook?: string;
    zalo?: string;
    telegram?: string;
  };
}

export interface CustomerUpdateData extends Partial<CustomerCreateData> {
  id: string;
}

class CustomerService {
  // Customer CRUD operations
  async getCustomers(filters?: CustomerFilters): Promise<{
    customers: Customer[];
    total: number;
    page: number;
    pageSize: number;
    stats: {
      totalCustomers: number;
      activeCustomers: number;
      vipCustomers: number;
      tierDistribution: Record<LoyaltyTier, number>;
    };
  }> {
    const response = await apiClient.get(API_ENDPOINTS.CUSTOMERS.LIST, {
      params: filters
    });
    return response.data;
  }

  async getCustomer(id: string): Promise<Customer> {
    const response = await apiClient.get(`${API_ENDPOINTS.CUSTOMERS.LIST}/${id}`);
    return response.data;
  }

  async createCustomer(data: CustomerCreateData): Promise<Customer> {
    // Validate Vietnamese phone number
    if (!this.isValidVietnamesePhone(data.phone)) {
      throw new Error('Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại Việt Nam.');
    }

    const response = await apiClient.post(API_ENDPOINTS.CUSTOMERS.CREATE, data);
    return response.data;
  }

  async updateCustomer(data: CustomerUpdateData): Promise<Customer> {
    if (data.phone && !this.isValidVietnamesePhone(data.phone)) {
      throw new Error('Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại Việt Nam.');
    }

    const response = await apiClient.put(`${API_ENDPOINTS.CUSTOMERS.UPDATE}/${data.id}`, data);
    return response.data;
  }

  async deleteCustomer(id: string): Promise<void> {
    await apiClient.delete(`${API_ENDPOINTS.CUSTOMERS.DELETE}/${id}`);
  }

  // Customer search and filtering
  async searchCustomers(query: string, limit = 20): Promise<Customer[]> {
    const response = await apiClient.get(`${API_ENDPOINTS.CUSTOMERS.LIST}/search`, {
      params: { q: query, limit }
    });
    return response.data;
  }

  async getCustomerByPhone(phone: string): Promise<Customer | null> {
    try {
      const response = await apiClient.get(`${API_ENDPOINTS.CUSTOMERS.LIST}/phone/${phone}`);
      return response.data;
    } catch (error) {
      return null;
    }
  }

  async getCustomerByEmail(email: string): Promise<Customer | null> {
    try {
      const response = await apiClient.get(`${API_ENDPOINTS.CUSTOMERS.LIST}/email/${email}`);
      return response.data;
    } catch (error) {
      return null;
    }
  }

  // Vietnamese 5-tier loyalty program
  async getLoyaltyTierConfig(): Promise<LoyaltyTierConfig[]> {
    const response = await apiClient.get(`${API_ENDPOINTS.CUSTOMERS.LOYALTY}/tiers`);
    return response.data;
  }

  async getLoyaltyProgram(customerId: string): Promise<{
    customer: Customer;
    currentTier: LoyaltyTierConfig;
    nextTier?: LoyaltyTierConfig;
    progressToNextTier: number;
    availableRewards: Array<{
      id: string;
      name: string;
      description: string;
      pointsCost: number;
      type: 'discount' | 'gift' | 'service';
      isAvailable: boolean;
    }>;
    recentTransactions: LoyaltyTransaction[];
  }> {
    const response = await apiClient.get(`${API_ENDPOINTS.CUSTOMERS.LOYALTY}/${customerId}`);
    return response.data;
  }

  async addLoyaltyPoints(customerId: string, points: number, description: string, orderId?: string): Promise<LoyaltyTransaction> {
    const response = await apiClient.post(`${API_ENDPOINTS.CUSTOMERS.LOYALTY}/${customerId}/points`, {
      points,
      description,
      orderId,
      type: 'earn'
    });
    return response.data;
  }

  async redeemLoyaltyPoints(customerId: string, points: number, rewardId: string, description: string): Promise<LoyaltyTransaction> {
    const response = await apiClient.post(`${API_ENDPOINTS.CUSTOMERS.LOYALTY}/${customerId}/redeem`, {
      points,
      rewardId,
      description,
      type: 'redeem'
    });
    return response.data;
  }

  async getLoyaltyHistory(customerId: string, page = 1, pageSize = 20): Promise<{
    transactions: LoyaltyTransaction[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const response = await apiClient.get(`${API_ENDPOINTS.CUSTOMERS.LOYALTY}/${customerId}/history`, {
      params: { page, pageSize }
    });
    return response.data;
  }

  // Vietnamese specific features
  async getCustomersByProvince(province: string): Promise<Customer[]> {
    const response = await apiClient.get(`${API_ENDPOINTS.CUSTOMERS.LIST}/province/${province}`);
    return response.data;
  }

  async getCustomersByLoyaltyTier(tier: LoyaltyTier): Promise<Customer[]> {
    const response = await apiClient.get(`${API_ENDPOINTS.CUSTOMERS.LIST}/tier/${tier}`);
    return response.data;
  }

  // Birthday promotions (Vietnamese calendar support)
  async getBirthdayCustomers(month: number, includeVietnameseCalendar = true): Promise<Customer[]> {
    const response = await apiClient.get(`${API_ENDPOINTS.CUSTOMERS.LIST}/birthday`, {
      params: { month, includeVietnameseCalendar }
    });
    return response.data;
  }

  async sendBirthdayPromotions(customerIds: string[], promotionData: {
    discountPercent?: number;
    bonusPoints?: number;
    giftId?: string;
    message: string;
  }): Promise<void> {
    await apiClient.post(`${API_ENDPOINTS.CUSTOMERS.LIST}/birthday-promotions`, {
      customerIds,
      ...promotionData
    });
  }

  // Tet holiday promotions
  async getTetPromotionEligibleCustomers(minSpent?: number, loyaltyTiers?: LoyaltyTier[]): Promise<Customer[]> {
    const response = await apiClient.get(`${API_ENDPOINTS.CUSTOMERS.LIST}/tet-eligible`, {
      params: { minSpent, loyaltyTiers }
    });
    return response.data;
  }

  async sendTetPromotions(customerIds: string[], promotionData: {
    discountPercent?: number;
    bonusPoints?: number;
    luckyMoneyAmount?: number;
    message: string;
  }): Promise<void> {
    await apiClient.post(`${API_ENDPOINTS.CUSTOMERS.LIST}/tet-promotions`, {
      customerIds,
      ...promotionData
    });
  }

  // Customer segmentation for Vietnamese market
  async getCustomerSegmentation(): Promise<{
    byAge: Record<string, number>;
    byLocation: Record<string, number>;
    bySpending: Record<string, number>;
    byLoyaltyTier: Record<LoyaltyTier, number>;
    byOrderFrequency: Record<string, number>;
  }> {
    const response = await apiClient.get(`${API_ENDPOINTS.CUSTOMERS.LIST}/segmentation`);
    return response.data;
  }

  async getCustomerInsights(customerId: string): Promise<{
    orderHistory: Array<{
      orderId: string;
      date: string;
      amount: number;
      items: number;
      status: string;
    }>;
    preferences: {
      categories: Array<{ name: string; count: number; percentage: number }>;
      paymentMethods: Array<{ method: string; count: number; percentage: number }>;
      orderTimes: Array<{ hour: number; count: number }>;
    };
    behavior: {
      averageTimeBetweenOrders: number;
      seasonalPatterns: Record<string, number>;
      pricesensitivity: 'high' | 'medium' | 'low';
      brandLoyalty: 'high' | 'medium' | 'low';
    };
    predictions: {
      nextOrderProbability: number;
      churnRisk: 'high' | 'medium' | 'low';
      estimatedLifetimeValue: number;
    };
  }> {
    const response = await apiClient.get(`${API_ENDPOINTS.CUSTOMERS.LIST}/${customerId}/insights`);
    return response.data;
  }

  // Communication methods
  async sendSMSToCustomers(customerIds: string[], message: string, scheduledAt?: string): Promise<{
    sent: number;
    failed: number;
    scheduled: number;
  }> {
    const response = await apiClient.post(`${API_ENDPOINTS.CUSTOMERS.LIST}/sms`, {
      customerIds,
      message,
      scheduledAt
    });
    return response.data;
  }

  async sendEmailToCustomers(customerIds: string[], subject: string, content: string, scheduledAt?: string): Promise<{
    sent: number;
    failed: number;
    scheduled: number;
  }> {
    const response = await apiClient.post(`${API_ENDPOINTS.CUSTOMERS.LIST}/email`, {
      customerIds,
      subject,
      content,
      scheduledAt
    });
    return response.data;
  }

  // Export/Import for Vietnamese data
  async exportCustomers(format: 'csv' | 'xlsx', filters?: CustomerFilters): Promise<Blob> {
    const response = await apiClient.get(`${API_ENDPOINTS.CUSTOMERS.LIST}/export`, {
      params: { format, ...filters },
      responseType: 'blob'
    });
    return response.data;
  }

  async importCustomers(file: File): Promise<{
    success: number;
    failed: number;
    errors: Array<{ row: number; error: string }>;
  }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post(`${API_ENDPOINTS.CUSTOMERS.LIST}/import`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // Utility methods
  private isValidVietnamesePhone(phone: string): boolean {
    // Vietnamese phone number validation
    const phoneRegex = /^(\+84|84|0)?[3-9][0-9]{8}$/;
    return phoneRegex.test(phone.replace(/\s+/g, ''));
  }

  formatVietnamesePhone(phone: string): string {
    const cleaned = phone.replace(/\s+/g, '').replace(/^\+84/, '0').replace(/^84/, '0');
    if (cleaned.length === 10) {
      return cleaned.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3');
    }
    return phone;
  }

  getLoyaltyTierName(tier: LoyaltyTier): string {
    const tierNames: Record<LoyaltyTier, string> = {
      dong: 'Đồng',
      bac: 'Bạc',
      vang: 'Vàng',
      bachkim: 'Bạch kim',
      kimcuong: 'Kim cương'
    };
    return tierNames[tier];
  }

  getLoyaltyTierColor(tier: LoyaltyTier): string {
    const tierColors: Record<LoyaltyTier, string> = {
      dong: '#cd7f32',
      bac: '#c0c0c0',
      vang: '#ffd700',
      bachkim: '#e5e4e2',
      kimcuong: '#b9f2ff'
    };
    return tierColors[tier];
  }
}

export const customerService = new CustomerService();