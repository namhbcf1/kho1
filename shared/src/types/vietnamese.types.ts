// Vietnam-specific types
export interface VietnameseAddress {
  street: string;
  ward: string; // Phường/Xã
  district: string; // Quận/Huyện
  province: string; // Tỉnh/Thành phố
  postalCode?: string;
}

export interface VietnamesePhoneNumber {
  countryCode: '+84';
  number: string; // Without country code
  formatted: string; // With formatting
  carrier?: 'viettel' | 'mobifone' | 'vinaphone' | 'vietnamobile' | 'gmobile';
}

export interface VietnameseCurrency {
  amount: number;
  currency: 'VND';
  formatted: string; // "1.234.567 ₫"
  inWords?: string; // "Một triệu hai trăm ba mươi tư nghìn năm trăm sáu mươi bảy đồng"
}

export interface VietnameseTaxInfo {
  taxCode: string; // Mã số thuế
  vatRate: number; // Thuế VAT (usually 10%)
  vatIncluded: boolean;
  taxOffice?: string; // Cục thuế quản lý
}

export interface VietnameseBusinessInfo {
  name: string;
  address: VietnameseAddress;
  phone: VietnamesePhoneNumber;
  email: string;
  taxInfo: VietnameseTaxInfo;
  businessType?: string;
  licenseNumber?: string; // Số giấy phép kinh doanh
  representativeName?: string; // Người đại diện pháp luật
}

export interface VietnamesePaymentMethod {
  type: 'cash' | 'card' | 'vnpay' | 'momo' | 'zalopay' | 'bank_transfer';
  name: string;
  nameVi: string;
  enabled: boolean;
  config?: {
    merchantId?: string;
    secretKey?: string;
    returnUrl?: string;
    callbackUrl?: string;
  };
}

export interface VietnameseReceipt {
  header: string;
  footer: string;
  businessInfo: VietnameseBusinessInfo;
  orderInfo: {
    orderNumber: string;
    date: string;
    cashier: string;
    customer?: string;
  };
  items: Array<{
    name: string;
    quantity: number;
    price: VietnameseCurrency;
    total: VietnameseCurrency;
  }>;
  summary: {
    subtotal: VietnameseCurrency;
    discount?: VietnameseCurrency;
    tax: VietnameseCurrency;
    total: VietnameseCurrency;
  };
  payment: {
    method: string;
    received?: VietnameseCurrency;
    change?: VietnameseCurrency;
  };
}

export interface VietnameseWorkingHours {
  monday: { start: string; end: string; closed?: boolean };
  tuesday: { start: string; end: string; closed?: boolean };
  wednesday: { start: string; end: string; closed?: boolean };
  thursday: { start: string; end: string; closed?: boolean };
  friday: { start: string; end: string; closed?: boolean };
  saturday: { start: string; end: string; closed?: boolean };
  sunday: { start: string; end: string; closed?: boolean };
}

export interface VietnameseLoyaltyProgram {
  tiers: Array<{
    id: string;
    name: string;
    nameVi: string;
    minimumSpent: VietnameseCurrency;
    discountPercentage: number;
    pointsMultiplier: number;
    benefits: string[];
    benefitsVi: string[];
  }>;
  pointsPerVND: number; // Points earned per VND spent
  pointsExpiryDays: number;
}

export interface VietnameseHoliday {
  date: string;
  name: string;
  nameVi: string;
  type: 'public' | 'traditional' | 'international';
  description?: string;
}

export interface VietnameseProvince {
  code: string;
  name: string;
  nameEn: string;
  region: 'north' | 'central' | 'south';
  districts: VietnameseDistrict[];
}

export interface VietnameseDistrict {
  code: string;
  name: string;
  nameEn: string;
  provinceCode: string;
  wards: VietnameseWard[];
}

export interface VietnameseWard {
  code: string;
  name: string;
  nameEn: string;
  districtCode: string;
}

export interface VietnamMobileCarrier {
  name: string;
  code: string;
  prefixes: string[];
  color: string;
}
