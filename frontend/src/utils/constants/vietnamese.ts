// Vietnamese constants
export const VIETNAMESE_PROVINCES = [
  'An Giang',
  'Bà Rịa - Vũng Tàu',
  'Bắc Giang',
  'Bắc Kạn',
  'Bạc Liêu',
  'Bắc Ninh',
  'Bến Tre',
  'Bình Định',
  'Bình Dương',
  'Bình Phước',
  'Bình Thuận',
  'Cà Mau',
  'Cao Bằng',
  'Đắk Lắk',
  'Đắk Nông',
  'Điện Biên',
  'Đồng Nai',
  'Đồng Tháp',
  'Gia Lai',
  'Hà Giang',
  'Hà Nam',
  'Hà Tĩnh',
  'Hải Dương',
  'Hậu Giang',
  'Hòa Bình',
  'Hưng Yên',
  'Khánh Hòa',
  'Kiên Giang',
  'Kon Tum',
  'Lai Châu',
  'Lâm Đồng',
  'Lạng Sơn',
  'Lào Cai',
  'Long An',
  'Nam Định',
  'Nghệ An',
  'Ninh Bình',
  'Ninh Thuận',
  'Phú Thọ',
  'Quảng Bình',
  'Quảng Nam',
  'Quảng Ngãi',
  'Quảng Ninh',
  'Quảng Trị',
  'Sóc Trăng',
  'Sơn La',
  'Tây Ninh',
  'Thái Bình',
  'Thái Nguyên',
  'Thanh Hóa',
  'Thừa Thiên Huế',
  'Tiền Giang',
  'Trà Vinh',
  'Tuyên Quang',
  'Vĩnh Long',
  'Vĩnh Phúc',
  'Yên Bái',
  'Phú Yên',
  'Cần Thơ',
  'Đà Nẵng',
  'Hải Phòng',
  'Hà Nội',
  'TP Hồ Chí Minh'
];

export const VIETNAMESE_PHONE_PREFIXES = [
  '032', '033', '034', '035', '036', '037', '038', '039', // Viettel
  '070', '079', '077', '076', '078', // Mobifone
  '083', '084', '085', '081', '082', // Vinaphone
  '056', '058', // Vietnamobile
  '059', // Gmobile
];

export const PAYMENT_METHODS = {
  CASH: 'cash',
  CARD: 'card',
  VNPAY: 'vnpay',
  MOMO: 'momo',
  ZALOPAY: 'zalopay',
} as const;

export const PAYMENT_METHOD_LABELS = {
  [PAYMENT_METHODS.CASH]: 'Tiền mặt',
  [PAYMENT_METHODS.CARD]: 'Thẻ',
  [PAYMENT_METHODS.VNPAY]: 'VNPay',
  [PAYMENT_METHODS.MOMO]: 'MoMo',
  [PAYMENT_METHODS.ZALOPAY]: 'ZaloPay',
} as const;

export const ORDER_STATUSES = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
} as const;

export const ORDER_STATUS_LABELS = {
  [ORDER_STATUSES.PENDING]: 'Chờ xử lý',
  [ORDER_STATUSES.PROCESSING]: 'Đang xử lý',
  [ORDER_STATUSES.COMPLETED]: 'Hoàn thành',
  [ORDER_STATUSES.CANCELLED]: 'Đã hủy',
  [ORDER_STATUSES.REFUNDED]: 'Đã hoàn tiền',
} as const;

export const LOYALTY_TIERS = {
  BRONZE: 'bronze',
  SILVER: 'silver',
  GOLD: 'gold',
  PLATINUM: 'platinum',
  DIAMOND: 'diamond',
} as const;

export const LOYALTY_TIER_LABELS = {
  [LOYALTY_TIERS.BRONZE]: 'Đồng',
  [LOYALTY_TIERS.SILVER]: 'Bạc',
  [LOYALTY_TIERS.GOLD]: 'Vàng',
  [LOYALTY_TIERS.PLATINUM]: 'Bạch kim',
  [LOYALTY_TIERS.DIAMOND]: 'Kim cương',
} as const;

export const VIETNAMESE_CURRENCY = {
  CODE: 'VND',
  SYMBOL: '₫',
  NAME: 'Việt Nam Đồng',
} as const;

export const VIETNAMESE_DATE_FORMATS = {
  SHORT: 'DD/MM/YYYY',
  LONG: 'DD/MM/YYYY HH:mm',
  FULL: 'dddd, DD/MM/YYYY HH:mm:ss',
} as const;

export const BUSINESS_TYPES = [
  'Cửa hàng tạp hóa',
  'Nhà hàng',
  'Quán cà phê',
  'Cửa hàng thời trang',
  'Cửa hàng điện tử',
  'Siêu thị mini',
  'Cửa hàng sách',
  'Cửa hàng mỹ phẩm',
  'Cửa hàng thể thao',
  'Khác',
] as const;
