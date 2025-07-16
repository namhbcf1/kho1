import { useState, useEffect, useMemo } from 'react';
import { 
  formatVND, 
  calculateVAT, 
  calculateAmountWithVAT,
  isBusinessHours,
  isWorkingDay,
  isVietnameseHoliday,
  calculateLoyaltyTier,
  calculateLoyaltyPoints,
  vietnameseLoyaltyTiers,
  vietnamesePaymentMethods,
  vietnameseBanks
} from '../utils/vietnamese';

/**
 * Hook for Vietnamese business logic
 */
export function useVietnameseBusiness() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000); // Update every minute
    return () => clearInterval(timer);
  }, []);

  // Business status
  const businessStatus = useMemo(() => ({
    isBusinessHours: isBusinessHours(currentTime),
    isWorkingDay: isWorkingDay(currentTime),
    isHoliday: isVietnameseHoliday(currentTime),
  }), [currentTime]);

  // Currency and VAT utilities
  const currency = {
    format: formatVND,
    calculateVAT,
    calculateWithVAT: calculateAmountWithVAT,
    VAT_RATE: 0.1
  };

  // Loyalty system utilities
  const loyalty = {
    tiers: vietnameseLoyaltyTiers,
    calculateTier: calculateLoyaltyTier,
    calculatePoints: calculateLoyaltyPoints,
    getTierBySpent: (totalSpent: number) => {
      const tierId = calculateLoyaltyTier(totalSpent);
      return vietnameseLoyaltyTiers.find(t => t.id === tierId);
    }
  };

  // Payment methods
  const payments = vietnamesePaymentMethods;

  // Banking
  const banking = {
    banks: vietnameseBanks,
    getBankByCode: (code: string) => vietnameseBanks.find(b => b.code === code)
  };

  return {
    businessStatus,
    currency,
    loyalty,
    payments,
    banking,
    currentTime
  };
}

/**
 * Hook for Vietnamese invoice generation
 */
export function useVietnameseInvoice() {
  const generateInvoiceData = (orderData: any) => {
    const subtotal = orderData.items.reduce((sum: number, item: any) => sum + item.total, 0);
    const vatAmount = calculateVAT(subtotal);
    const total = subtotal + vatAmount;

    return {
      ...orderData,
      subtotal,
      vatAmount,
      vatRate: 10, // 10% VAT
      total,
      formattedSubtotal: formatVND(subtotal),
      formattedVATAmount: formatVND(vatAmount),
      formattedTotal: formatVND(total),
      invoiceDate: new Date().toISOString(),
      // Vietnamese invoice requirements
      sellerInfo: {
        name: 'KhoAugment POS',
        address: 'Địa chỉ cửa hàng',
        taxCode: '0123456789',
        phone: '1900-xxxx'
      }
    };
  };

  return { generateInvoiceData };
}

/**
 * Hook for Vietnamese working hours management
 */
export function useWorkingHours() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const checkWorkingHours = () => {
      const now = new Date();
      const isWorking = isBusinessHours(now) && isWorkingDay(now) && !isVietnameseHoliday(now);
      setIsOpen(isWorking);
    };

    checkWorkingHours();
    const timer = setInterval(checkWorkingHours, 60000); // Check every minute

    return () => clearInterval(timer);
  }, []);

  return {
    isOpen,
    isBusinessHours: isBusinessHours(),
    isWorkingDay: isWorkingDay(),
    isHoliday: isVietnameseHoliday(new Date())
  };
}

/**
 * Hook for Vietnamese customer management
 */
export function useVietnameseCustomer() {
  const calculateCustomerValue = (customer: any) => {
    const tier = calculateLoyaltyTier(customer.totalSpent);
    const tierInfo = vietnameseLoyaltyTiers.find(t => t.id === tier);
    
    return {
      ...customer,
      tier,
      tierInfo,
      formattedTotalSpent: formatVND(customer.totalSpent),
      nextTier: getNextTier(tier),
      amountToNextTier: getAmountToNextTier(customer.totalSpent, tier)
    };
  };

  const getNextTier = (currentTier: string) => {
    const currentIndex = vietnameseLoyaltyTiers.findIndex(t => t.id === currentTier);
    return currentIndex < vietnameseLoyaltyTiers.length - 1 
      ? vietnameseLoyaltyTiers[currentIndex + 1]
      : null;
  };

  const getAmountToNextTier = (totalSpent: number, currentTier: string) => {
    const nextTier = getNextTier(currentTier);
    return nextTier ? Math.max(0, nextTier.minSpent - totalSpent) : 0;
  };

  return {
    calculateCustomerValue,
    getNextTier,
    getAmountToNextTier,
    loyaltyTiers: vietnameseLoyaltyTiers
  };
}

/**
 * Hook for Vietnamese tax calculations
 */
export function useVietnameseTax() {
  const calculateOrderTax = (items: any[]) => {
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const vatAmount = calculateVAT(subtotal);
    const total = subtotal + vatAmount;

    return {
      subtotal,
      vatAmount,
      total,
      vatRate: 10,
      formattedSubtotal: formatVND(subtotal),
      formattedVATAmount: formatVND(vatAmount),
      formattedTotal: formatVND(total)
    };
  };

  const calculateProductPrice = (basePrice: number, includeVAT: boolean = true) => {
    if (includeVAT) {
      return {
        basePrice,
        vatAmount: calculateVAT(basePrice),
        finalPrice: calculateAmountWithVAT(basePrice),
        formattedFinalPrice: formatVND(calculateAmountWithVAT(basePrice))
      };
    } else {
      return {
        basePrice,
        vatAmount: 0,
        finalPrice: basePrice,
        formattedFinalPrice: formatVND(basePrice)
      };
    }
  };

  return {
    calculateOrderTax,
    calculateProductPrice,
    VAT_RATE: 0.1
  };
}

/**
 * Hook for Vietnamese address management
 */
export function useVietnameseAddress() {
  const [provinces] = useState([
    'An Giang', 'Bà Rịa - Vũng Tàu', 'Bắc Giang', 'Bắc Kạn', 'Bạc Liêu', 'Bắc Ninh',
    'Bến Tre', 'Bình Định', 'Bình Dương', 'Bình Phước', 'Bình Thuận', 'Cà Mau',
    'Cao Bằng', 'Đắk Lắk', 'Đắk Nông', 'Điện Biên', 'Đồng Nai', 'Đồng Tháp',
    'Gia Lai', 'Hà Giang', 'Hà Nam', 'Hà Tĩnh', 'Hải Dương', 'Hậu Giang',
    'Hòa Bình', 'Hưng Yên', 'Khánh Hòa', 'Kiên Giang', 'Kon Tum', 'Lai Châu',
    'Lâm Đồng', 'Lạng Sơn', 'Lào Cai', 'Long An', 'Nam Định', 'Nghệ An',
    'Ninh Bình', 'Ninh Thuận', 'Phú Thọ', 'Quảng Bình', 'Quảng Nam', 'Quảng Ngãi',
    'Quảng Ninh', 'Quảng Trị', 'Sóc Trăng', 'Sơn La', 'Tây Ninh', 'Thái Bình',
    'Thái Nguyên', 'Thanh Hóa', 'Thừa Thiên Huế', 'Tiền Giang', 'Trà Vinh',
    'Tuyên Quang', 'Vĩnh Long', 'Vĩnh Phúc', 'Yên Bái',
    'Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ'
  ]);

  const formatAddress = (address: any) => {
    const parts = [
      address.street,
      address.ward,
      address.district,
      address.province
    ].filter(Boolean);
    
    return parts.join(', ');
  };

  const parseAddress = (fullAddress: string) => {
    // Simple parsing - in real app you'd use a more sophisticated address API
    const parts = fullAddress.split(',').map(part => part.trim());
    return {
      street: parts[0] || '',
      ward: parts[1] || '',
      district: parts[2] || '',
      province: parts[3] || ''
    };
  };

  return {
    provinces,
    formatAddress,
    parseAddress
  };
}

export default useVietnameseBusiness;