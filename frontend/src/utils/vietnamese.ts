import dayjs from 'dayjs';
import 'dayjs/locale/vi';

// Set Vietnamese locale as default
dayjs.locale('vi');

/**
 * Vietnamese currency formatting
 */
export const formatVND = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('vi-VN').format(num);
};

/**
 * Vietnamese VAT calculation (10%)
 */
export const VAT_RATE = 0.1; // 10% VAT in Vietnam

export const calculateVAT = (amount: number): number => {
  return amount * VAT_RATE;
};

export const calculateAmountWithVAT = (amount: number): number => {
  return amount * (1 + VAT_RATE);
};

export const calculateAmountWithoutVAT = (amountWithVAT: number): number => {
  return amountWithVAT / (1 + VAT_RATE);
};

/**
 * Vietnamese date and time formatting
 */
export const formatDate = (date: string | Date): string => {
  return dayjs(date).format('DD/MM/YYYY');
};

export const formatDateTime = (date: string | Date): string => {
  return dayjs(date).format('DD/MM/YYYY HH:mm');
};

export const formatDateTimeDetailed = (date: string | Date): string => {
  return dayjs(date).format('dddd, DD/MM/YYYY lúc HH:mm');
};

export const formatTimeAgo = (date: string | Date): string => {
  const now = dayjs();
  const target = dayjs(date);
  const diffMinutes = now.diff(target, 'minute');
  const diffHours = now.diff(target, 'hour');
  const diffDays = now.diff(target, 'day');

  if (diffMinutes < 1) return 'Vừa xong';
  if (diffMinutes < 60) return `${diffMinutes} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays < 30) return `${diffDays} ngày trước`;
  
  return formatDate(date);
};

/**
 * Vietnamese phone number validation and formatting
 */
export const isValidVietnamesePhone = (phone: string): boolean => {
  // Vietnamese phone patterns:
  // Mobile: 09x, 08x, 07x, 05x, 03x (10-11 digits)
  // Landline: 02x (9-11 digits)
  const mobilePattern = /^(09|08|07|05|03)[0-9]{8,9}$/;
  const landlinePattern = /^(02)[0-9]{7,9}$/;
  
  const cleanPhone = phone.replace(/\D/g, '');
  return mobilePattern.test(cleanPhone) || landlinePattern.test(cleanPhone);
};

export const formatVietnamesePhone = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 10) {
    // Mobile: 0xxx xxx xxx
    return cleaned.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3');
  } else if (cleaned.length === 11) {
    // Mobile: 0xxx xxxx xxx
    return cleaned.replace(/(\d{4})(\d{4})(\d{3})/, '$1 $2 $3');
  } else if (cleaned.length === 9 && cleaned.startsWith('02')) {
    // Landline: 02x xxx xxxx
    return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
  }
  
  return phone; // Return original if doesn't match patterns
};

/**
 * Vietnamese address components
 */
export const vietnameseProvinces = [
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
  // Thành phố trực thuộc TW
  'Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ'
];

/**
 * Vietnamese business registration validation
 */
export const isValidBusinessLicense = (license: string): boolean => {
  // Vietnamese business license format: XXXXXXXXXX (10 digits)
  const pattern = /^[0-9]{10}$/;
  return pattern.test(license.replace(/\D/g, ''));
};

export const isValidTaxCode = (taxCode: string): boolean => {
  // Vietnamese tax code format: XXXXXXXXXX or XXXXXXXXXXXX (10 or 13 digits)
  const pattern = /^[0-9]{10}([0-9]{3})?$/;
  return pattern.test(taxCode.replace(/\D/g, ''));
};

/**
 * Vietnamese payment methods
 */
export const vietnamesePaymentMethods = [
  { value: 'cash', label: 'Tiền mặt', icon: '💵' },
  { value: 'bank_transfer', label: 'Chuyển khoản ngân hàng', icon: '🏦' },
  { value: 'vnpay', label: 'VNPay', icon: '💳' },
  { value: 'momo', label: 'MoMo', icon: '📱' },
  { value: 'zalopay', label: 'ZaloPay', icon: '🅿️' },
  { value: 'shopee_pay', label: 'ShopeePay', icon: '🛒' },
  { value: 'grab_pay', label: 'GrabPay', icon: '🚗' },
  { value: 'credit_card', label: 'Thẻ tín dụng', icon: '💳' },
  { value: 'debit_card', label: 'Thẻ ghi nợ', icon: '💳' },
];

/**
 * Vietnamese business hours
 */
export const vietnameseBusinessHours = {
  morning: { start: '07:00', end: '11:30' },
  afternoon: { start: '13:30', end: '18:00' },
  evening: { start: '18:00', end: '22:00' },
};

export const isBusinessHours = (time?: Date): boolean => {
  const now = dayjs(time);
  const hour = now.hour();
  const minute = now.minute();
  const timeValue = hour * 100 + minute;

  return (
    (timeValue >= 700 && timeValue <= 1130) || // Morning
    (timeValue >= 1330 && timeValue <= 1800) || // Afternoon
    (timeValue >= 1800 && timeValue <= 2200) // Evening
  );
};

/**
 * Vietnamese working days
 */
export const isWorkingDay = (date?: Date): boolean => {
  const day = dayjs(date).day();
  return day >= 1 && day <= 6; // Monday to Saturday
};

/**
 * Vietnamese holidays (simplified list)
 */
export const vietnameseHolidays = [
  { date: '01-01', name: 'Tết Dương lịch' },
  { date: '04-30', name: 'Ngày Giải phóng miền Nam' },
  { date: '05-01', name: 'Ngày Quốc tế Lao động' },
  { date: '09-02', name: 'Ngày Quốc khánh' },
  // Lunar calendar holidays would need separate handling
];

export const isVietnameseHoliday = (date: Date): boolean => {
  const month = dayjs(date).format('MM');
  const day = dayjs(date).format('DD');
  const dateKey = `${month}-${day}`;
  
  return vietnameseHolidays.some(holiday => holiday.date === dateKey);
};

/**
 * Vietnamese text processing
 */
export const removeVietnameseAccents = (str: string): string => {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
};

export const vietnameseSort = (a: string, b: string): number => {
  return a.localeCompare(b, 'vi', { sensitivity: 'base' });
};

/**
 * Vietnamese invoice numbering
 */
export const generateVietnameseInvoiceNumber = (
  prefix: string = 'HD',
  sequence: number,
  date?: Date
): string => {
  const year = dayjs(date).format('YY');
  const month = dayjs(date).format('MM');
  const paddedSequence = sequence.toString().padStart(6, '0');
  
  return `${prefix}${year}${month}${paddedSequence}`;
};

/**
 * Vietnamese banking
 */
export const vietnameseBanks = [
  { code: 'VCB', name: 'Vietcombank', fullName: 'Ngân hàng TMCP Ngoại thương Việt Nam' },
  { code: 'VTB', name: 'Vietinbank', fullName: 'Ngân hàng TMCP Công thương Việt Nam' },
  { code: 'BIDV', name: 'BIDV', fullName: 'Ngân hàng TMCP Đầu tư và Phát triển Việt Nam' },
  { code: 'ACB', name: 'ACB', fullName: 'Ngân hàng TMCP Á Châu' },
  { code: 'TCB', name: 'Techcombank', fullName: 'Ngân hàng TMCP Kỹ thương Việt Nam' },
  { code: 'MBB', name: 'MB Bank', fullName: 'Ngân hàng TMCP Quân đội' },
  { code: 'VPB', name: 'VPBank', fullName: 'Ngân hàng TMCP Việt Nam Thịnh vượng' },
  { code: 'TPB', name: 'TPBank', fullName: 'Ngân hàng TMCP Tiên Phong' },
  { code: 'STB', name: 'Sacombank', fullName: 'Ngân hàng TMCP Sài Gòn Thương tín' },
  { code: 'EIB', name: 'Eximbank', fullName: 'Ngân hàng TMCP Xuất Nhập khẩu Việt Nam' },
];

export const isValidVietnameseBankAccount = (accountNumber: string, bankCode?: string): boolean => {
  const cleaned = accountNumber.replace(/\D/g, '');
  
  // Basic validation: 6-20 digits
  if (cleaned.length < 6 || cleaned.length > 20) return false;
  
  // Bank-specific validation could be added here
  return true;
};

/**
 * Vietnamese loyalty system
 */
export const vietnameseLoyaltyTiers = [
  { 
    id: 'bronze', 
    name: 'Đồng', 
    minSpent: 0, 
    color: '#cd7f32',
    benefits: ['Tích điểm cơ bản', 'Thông báo khuyến mãi']
  },
  { 
    id: 'silver', 
    name: 'Bạc', 
    minSpent: 2000000, 
    color: '#c0c0c0',
    benefits: ['Tích điểm x1.2', 'Giảm giá 5%', 'Hỗ trợ ưu tiên']
  },
  { 
    id: 'gold', 
    name: 'Vàng', 
    minSpent: 5000000, 
    color: '#ffd700',
    benefits: ['Tích điểm x1.5', 'Giảm giá 10%', 'Miễn phí giao hàng']
  },
  { 
    id: 'platinum', 
    name: 'Bạch Kim', 
    minSpent: 10000000, 
    color: '#e5e4e2',
    benefits: ['Tích điểm x2', 'Giảm giá 15%', 'Quà sinh nhật']
  },
  { 
    id: 'diamond', 
    name: 'Kim Cương', 
    minSpent: 20000000, 
    color: '#b9f2ff',
    benefits: ['Tích điểm x2.5', 'Giảm giá 20%', 'Dịch vụ VIP']
  },
];

export const calculateLoyaltyTier = (totalSpent: number): string => {
  const tiers = [...vietnameseLoyaltyTiers].reverse(); // Start from highest tier
  const tier = tiers.find(t => totalSpent >= t.minSpent);
  return tier?.id || 'bronze';
};

export const calculateLoyaltyPoints = (amount: number, tier: string): number => {
  const tierData = vietnameseLoyaltyTiers.find(t => t.id === tier);
  const multiplier = tierData?.id === 'bronze' ? 1 :
                   tierData?.id === 'silver' ? 1.2 :
                   tierData?.id === 'gold' ? 1.5 :
                   tierData?.id === 'platinum' ? 2 :
                   tierData?.id === 'diamond' ? 2.5 : 1;
  
  // 1 point per 1000 VND spent
  return Math.floor((amount / 1000) * multiplier);
};