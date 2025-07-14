// Vietnamese address and phone number validation utilities
import { Rule } from 'antd/lib/form';

// Vietnamese provinces and cities (63 provinces/cities)
export const VIETNAMESE_PROVINCES = [
  { code: 'AG', name: 'An Giang', region: 'south' },
  { code: 'VT', name: 'Bà Rịa - Vũng Tàu', region: 'south' },
  { code: 'BL', name: 'Bạc Liêu', region: 'south' },
  { code: 'BG', name: 'Bắc Giang', region: 'north' },
  { code: 'BK', name: 'Bắc Kạn', region: 'north' },
  { code: 'BN', name: 'Bắc Ninh', region: 'north' },
  { code: 'BT', name: 'Bến Tre', region: 'south' },
  { code: 'BD', name: 'Bình Định', region: 'central' },
  { code: 'BI', name: 'Bình Dương', region: 'south' },
  { code: 'BP', name: 'Bình Phước', region: 'south' },
  { code: 'BU', name: 'Bình Thuận', region: 'central' },
  { code: 'CM', name: 'Cà Mau', region: 'south' },
  { code: 'CT', name: 'Cần Thơ', region: 'south' },
  { code: 'CB', name: 'Cao Bằng', region: 'north' },
  { code: 'DN', name: 'Đà Nẵng', region: 'central' },
  { code: 'DL', name: 'Đắk Lắk', region: 'central' },
  { code: 'DG', name: 'Đắk Nông', region: 'central' },
  { code: 'DB', name: 'Điện Biên', region: 'north' },
  { code: 'DNA', name: 'Đồng Nai', region: 'south' },
  { code: 'DT', name: 'Đồng Tháp', region: 'south' },
  { code: 'GL', name: 'Gia Lai', region: 'central' },
  { code: 'HG', name: 'Hà Giang', region: 'north' },
  { code: 'HNM', name: 'Hà Nam', region: 'north' },
  { code: 'HN', name: 'Hà Nội', region: 'north' },
  { code: 'HT', name: 'Hà Tĩnh', region: 'central' },
  { code: 'HD', name: 'Hải Dương', region: 'north' },
  { code: 'HP', name: 'Hải Phòng', region: 'north' },
  { code: 'AU', name: 'Hậu Giang', region: 'south' },
  { code: 'HB', name: 'Hòa Bình', region: 'north' },
  { code: 'HY', name: 'Hưng Yên', region: 'north' },
  { code: 'KH', name: 'Khánh Hòa', region: 'central' },
  { code: 'KG', name: 'Kiên Giang', region: 'south' },
  { code: 'KT', name: 'Kon Tum', region: 'central' },
  { code: 'LC', name: 'Lai Châu', region: 'north' },
  { code: 'LM', name: 'Lâm Đồng', region: 'central' },
  { code: 'LS', name: 'Lạng Sơn', region: 'north' },
  { code: 'LO', name: 'Lào Cai', region: 'north' },
  { code: 'LA', name: 'Long An', region: 'south' },
  { code: 'ND', name: 'Nam Định', region: 'north' },
  { code: 'NA', name: 'Nghệ An', region: 'central' },
  { code: 'NB', name: 'Ninh Bình', region: 'north' },
  { code: 'NT', name: 'Ninh Thuận', region: 'central' },
  { code: 'PT', name: 'Phú Thọ', region: 'north' },
  { code: 'PY', name: 'Phú Yên', region: 'central' },
  { code: 'QB', name: 'Quảng Bình', region: 'central' },
  { code: 'QM', name: 'Quảng Nam', region: 'central' },
  { code: 'QG', name: 'Quảng Ngãi', region: 'central' },
  { code: 'QN', name: 'Quảng Ninh', region: 'north' },
  { code: 'QT', name: 'Quảng Trị', region: 'central' },
  { code: 'ST', name: 'Sóc Trăng', region: 'south' },
  { code: 'SL', name: 'Sơn La', region: 'north' },
  { code: 'TN', name: 'Tây Ninh', region: 'south' },
  { code: 'TB', name: 'Thái Bình', region: 'north' },
  { code: 'TG', name: 'Thái Nguyên', region: 'north' },
  { code: 'TH', name: 'Thanh Hóa', region: 'central' },
  { code: 'HUE', name: 'Thừa Thiên Huế', region: 'central' },
  { code: 'TGG', name: 'Tiền Giang', region: 'south' },
  { code: 'HCM', name: 'TP. Hồ Chí Minh', region: 'south' },
  { code: 'TV', name: 'Trà Vinh', region: 'south' },
  { code: 'TQ', name: 'Tuyên Quang', region: 'north' },
  { code: 'VL', name: 'Vĩnh Long', region: 'south' },
  { code: 'VP', name: 'Vĩnh Phúc', region: 'north' },
  { code: 'YB', name: 'Yên Bái', region: 'north' }
];

// Vietnamese phone number patterns
const VIETNAMESE_PHONE_PATTERNS = {
  // Mobile networks
  VIETTEL: /^(\+84|84|0)?(3[2-9]|9[6-8])\d{7}$/,
  VINAPHONE: /^(\+84|84|0)?(9[1-4]|8[1-5])\d{7}$/,
  MOBIFONE: /^(\+84|84|0)?(7[0-9]|9[0-1])\d{7}$/,
  VIETNAMOBILE: /^(\+84|84|0)?(5[2-9]|59)\d{7}$/,
  GMOBILE: /^(\+84|84|0)?99\d{7}$/,
  
  // Landline patterns by region
  HANOI: /^(\+84|84|0)?24\d{8}$/,
  HCM: /^(\+84|84|0)?28\d{8}$/,
  LANDLINE_GENERAL: /^(\+84|84|0)?(2[0-9])\d{8}$/
};

// Business license patterns (Vietnam)
const BUSINESS_LICENSE_PATTERNS = {
  // Mã số thuế doanh nghiệp (10-13 digits)
  TAX_CODE: /^\d{10,13}$/,
  
  // Giấy phép kinh doanh
  BUSINESS_LICENSE: /^[0-9]{4,}[A-Z]{0,3}[0-9]{2,}$/,
  
  // Mã số đăng ký kinh doanh
  BUSINESS_REGISTRATION: /^\d{10,13}[-]?\d{3}$/
};

/**
 * Validate Vietnamese phone number
 */
export const validateVietnamesePhone = (phone: string): boolean => {
  if (!phone) return false;
  
  // Clean phone number
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  
  // Check against all patterns
  return Object.values(VIETNAMESE_PHONE_PATTERNS).some(pattern => 
    pattern.test(cleanPhone)
  );
};

/**
 * Get mobile network provider from phone number
 */
export const getPhoneProvider = (phone: string): string | null => {
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  
  if (VIETNAMESE_PHONE_PATTERNS.VIETTEL.test(cleanPhone)) return 'Viettel';
  if (VIETNAMESE_PHONE_PATTERNS.VINAPHONE.test(cleanPhone)) return 'VinaPhone';
  if (VIETNAMESE_PHONE_PATTERNS.MOBIFONE.test(cleanPhone)) return 'MobiFone';
  if (VIETNAMESE_PHONE_PATTERNS.VIETNAMOBILE.test(cleanPhone)) return 'Vietnamobile';
  if (VIETNAMESE_PHONE_PATTERNS.GMOBILE.test(cleanPhone)) return 'Gmobile';
  if (VIETNAMESE_PHONE_PATTERNS.HANOI.test(cleanPhone)) return 'Bưu điện Hà Nội';
  if (VIETNAMESE_PHONE_PATTERNS.HCM.test(cleanPhone)) return 'Bưu điện TP.HCM';
  if (VIETNAMESE_PHONE_PATTERNS.LANDLINE_GENERAL.test(cleanPhone)) return 'Điện thoại bàn';
  
  return null;
};

/**
 * Format Vietnamese phone number
 */
export const formatVietnamesePhone = (phone: string): string => {
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  
  // Convert to domestic format
  let domesticPhone = cleanPhone;
  if (cleanPhone.startsWith('+84')) {
    domesticPhone = '0' + cleanPhone.substring(3);
  } else if (cleanPhone.startsWith('84')) {
    domesticPhone = '0' + cleanPhone.substring(2);
  }
  
  // Format based on phone type
  if (domesticPhone.length === 10) {
    // Mobile: 0xxx xxx xxx
    return domesticPhone.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3');
  } else if (domesticPhone.length === 11 && domesticPhone.startsWith('024')) {
    // Hanoi landline: 024 xxxx xxxx
    return domesticPhone.replace(/(\d{3})(\d{4})(\d{4})/, '$1 $2 $3');
  } else if (domesticPhone.length === 11 && domesticPhone.startsWith('028')) {
    // HCM landline: 028 xxxx xxxx
    return domesticPhone.replace(/(\d{3})(\d{4})(\d{4})/, '$1 $2 $3');
  } else if (domesticPhone.length === 11) {
    // Other landline: 0xx xxxx xxxx
    return domesticPhone.replace(/(\d{3})(\d{4})(\d{4})/, '$1 $2 $3');
  }
  
  return phone;
};

/**
 * Validate Vietnamese address
 */
export const validateVietnameseAddress = (address: {
  street?: string;
  ward?: string;
  district?: string;
  province?: string;
}): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!address.province) {
    errors.push('Tỉnh/Thành phố là bắt buộc');
  } else if (!VIETNAMESE_PROVINCES.find(p => p.name === address.province)) {
    errors.push('Tỉnh/Thành phố không hợp lệ');
  }
  
  if (!address.district) {
    errors.push('Quận/Huyện là bắt buộc');
  }
  
  if (!address.ward) {
    errors.push('Phường/Xã là bắt buộc');
  }
  
  if (!address.street) {
    errors.push('Địa chỉ chi tiết là bắt buộc');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate Vietnamese business license
 */
export const validateBusinessLicense = (license: string, type: 'tax' | 'business' | 'registration'): boolean => {
  if (!license) return false;
  
  switch (type) {
    case 'tax':
      return BUSINESS_LICENSE_PATTERNS.TAX_CODE.test(license);
    case 'business':
      return BUSINESS_LICENSE_PATTERNS.BUSINESS_LICENSE.test(license);
    case 'registration':
      return BUSINESS_LICENSE_PATTERNS.BUSINESS_REGISTRATION.test(license);
    default:
      return false;
  }
};

/**
 * Validate Vietnamese national ID (CCCD/CMND)
 */
export const validateVietnameseNationalId = (id: string): boolean => {
  if (!id) return false;
  
  // Clean ID
  const cleanId = id.replace(/[\s\-]/g, '');
  
  // CCCD (12 digits) or CMND (9 digits)
  const cccdPattern = /^\d{12}$/;
  const cmndPattern = /^\d{9}$/;
  
  return cccdPattern.test(cleanId) || cmndPattern.test(cleanId);
};

/**
 * Get region from province
 */
export const getProvinceRegion = (provinceName: string): 'north' | 'central' | 'south' | null => {
  const province = VIETNAMESE_PROVINCES.find(p => p.name === provinceName);
  return province ? province.region : null;
};

/**
 * Ant Design validation rules for Vietnamese data
 */

// Vietnamese phone validation rule
export const vietnamesePhoneRule: Rule = {
  validator: (_, value) => {
    if (!value) {
      return Promise.resolve();
    }
    
    if (!validateVietnamesePhone(value)) {
      return Promise.reject(new Error('Số điện thoại không đúng định dạng Việt Nam'));
    }
    
    return Promise.resolve();
  },
};

// Vietnamese address validation rules
export const vietnameseAddressRules = {
  province: [
    { required: true, message: 'Vui lòng chọn Tỉnh/Thành phố' },
    {
      validator: (_, value) => {
        if (value && !VIETNAMESE_PROVINCES.find(p => p.name === value)) {
          return Promise.reject(new Error('Tỉnh/Thành phố không hợp lệ'));
        }
        return Promise.resolve();
      },
    },
  ],
  district: [
    { required: true, message: 'Vui lòng nhập Quận/Huyện' },
    { min: 2, message: 'Quận/Huyện phải có ít nhất 2 ký tự' },
  ],
  ward: [
    { required: true, message: 'Vui lòng nhập Phường/Xã' },
    { min: 2, message: 'Phường/Xã phải có ít nhất 2 ký tự' },
  ],
  street: [
    { required: true, message: 'Vui lòng nhập địa chỉ chi tiết' },
    { min: 5, message: 'Địa chỉ phải có ít nhất 5 ký tự' },
  ],
};

// Business license validation rule
export const businessLicenseRule = (type: 'tax' | 'business' | 'registration'): Rule => ({
  validator: (_, value) => {
    if (!value) {
      return Promise.resolve();
    }
    
    if (!validateBusinessLicense(value, type)) {
      const typeNames = {
        tax: 'Mã số thuế',
        business: 'Giấy phép kinh doanh',
        registration: 'Mã đăng ký kinh doanh'
      };
      return Promise.reject(new Error(`${typeNames[type]} không đúng định dạng`));
    }
    
    return Promise.resolve();
  },
});

// National ID validation rule
export const vietnameseNationalIdRule: Rule = {
  validator: (_, value) => {
    if (!value) {
      return Promise.resolve();
    }
    
    if (!validateVietnameseNationalId(value)) {
      return Promise.reject(new Error('CCCD/CMND không đúng định dạng'));
    }
    
    return Promise.resolve();
  },
};

// Vietnamese name validation rule
export const vietnameseNameRule: Rule = {
  validator: (_, value) => {
    if (!value) {
      return Promise.resolve();
    }
    
    // Vietnamese name pattern (allows Vietnamese characters)
    const vietnameseNamePattern = /^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂẾưăạảấầẩẫậắằẳẵặẹẻẽềềểếỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵýỷỹ\s]+$/;
    
    if (!vietnameseNamePattern.test(value)) {
      return Promise.reject(new Error('Tên chỉ được chứa chữ cái và khoảng trắng'));
    }
    
    if (value.length < 2) {
      return Promise.reject(new Error('Tên phải có ít nhất 2 ký tự'));
    }
    
    if (value.length > 50) {
      return Promise.reject(new Error('Tên không được quá 50 ký tự'));
    }
    
    return Promise.resolve();
  },
};