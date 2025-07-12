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
] as const;

export const VIETNAMESE_PHONE_PREFIXES = [
  '032', '033', '034', '035', '036', '037', '038', '039', // Viettel
  '070', '079', '077', '076', '078', // Mobifone
  '083', '084', '085', '081', '082', // Vinaphone
  '056', '058', // Vietnamobile
  '059', // Gmobile
] as const;

export const VIETNAMESE_HOLIDAYS = [
  { date: '01-01', name: 'Tết Dương lịch', type: 'public' },
  { date: '02-14', name: 'Lễ Tình nhân', type: 'international' },
  { date: '03-08', name: 'Quốc tế Phụ nữ', type: 'international' },
  { date: '04-30', name: 'Ngày Giải phóng miền Nam', type: 'public' },
  { date: '05-01', name: 'Quốc tế Lao động', type: 'public' },
  { date: '09-02', name: 'Quốc khánh', type: 'public' },
  { date: '10-20', name: 'Ngày Phụ nữ Việt Nam', type: 'traditional' },
  { date: '11-20', name: 'Ngày Nhà giáo Việt Nam', type: 'traditional' },
  { date: '12-25', name: 'Lễ Giáng sinh', type: 'international' },
] as const;

export const VIETNAMESE_CURRENCY = {
  CODE: 'VND',
  SYMBOL: '₫',
  NAME: 'Việt Nam Đồng',
  DECIMAL_PLACES: 0,
  THOUSANDS_SEPARATOR: '.',
  DECIMAL_SEPARATOR: ',',
} as const;

export const VIETNAMESE_DATE_FORMATS = {
  SHORT: 'DD/MM/YYYY',
  LONG: 'DD/MM/YYYY HH:mm',
  FULL: 'dddd, DD/MM/YYYY HH:mm:ss',
  TIME_ONLY: 'HH:mm',
  DATE_ONLY: 'DD/MM/YYYY',
} as const;

export const VIETNAMESE_BUSINESS_TYPES = [
  'Cửa hàng tạp hóa',
  'Nhà hàng',
  'Quán cà phê',
  'Cửa hàng thời trang',
  'Cửa hàng điện tử',
  'Siêu thị mini',
  'Cửa hàng sách',
  'Cửa hàng mỹ phẩm',
  'Cửa hàng thể thao',
  'Hiệu thuốc',
  'Cửa hàng xe máy',
  'Cửa hàng điện máy',
  'Khác',
] as const;

export const VIETNAMESE_PAYMENT_METHODS = {
  CASH: { id: 'cash', name: 'Tiền mặt', nameEn: 'Cash' },
  CARD: { id: 'card', name: 'Thẻ', nameEn: 'Card' },
  VNPAY: { id: 'vnpay', name: 'VNPay', nameEn: 'VNPay' },
  MOMO: { id: 'momo', name: 'MoMo', nameEn: 'MoMo' },
  ZALOPAY: { id: 'zalopay', name: 'ZaloPay', nameEn: 'ZaloPay' },
  BANK_TRANSFER: { id: 'bank_transfer', name: 'Chuyển khoản', nameEn: 'Bank Transfer' },
} as const;

export const VIETNAMESE_ORDER_STATUSES = {
  PENDING: { id: 'pending', name: 'Chờ xử lý', nameEn: 'Pending' },
  PROCESSING: { id: 'processing', name: 'Đang xử lý', nameEn: 'Processing' },
  COMPLETED: { id: 'completed', name: 'Hoàn thành', nameEn: 'Completed' },
  CANCELLED: { id: 'cancelled', name: 'Đã hủy', nameEn: 'Cancelled' },
  REFUNDED: { id: 'refunded', name: 'Đã hoàn tiền', nameEn: 'Refunded' },
} as const;

export const VIETNAMESE_LOYALTY_TIERS = {
  BRONZE: { id: 'bronze', name: 'Đồng', nameEn: 'Bronze', color: '#CD7F32' },
  SILVER: { id: 'silver', name: 'Bạc', nameEn: 'Silver', color: '#C0C0C0' },
  GOLD: { id: 'gold', name: 'Vàng', nameEn: 'Gold', color: '#FFD700' },
  PLATINUM: { id: 'platinum', name: 'Bạch kim', nameEn: 'Platinum', color: '#E5E4E2' },
  DIAMOND: { id: 'diamond', name: 'Kim cương', nameEn: 'Diamond', color: '#B9F2FF' },
} as const;

export const VIETNAMESE_UNITS_OF_MEASURE = [
  'Cái', 'Chiếc', 'Hộp', 'Chai', 'Lon', 'Gói', 'Kg', 'Gram', 'Lít', 'Ml',
  'Mét', 'Cm', 'Tá', 'Chục', 'Trăm', 'Bộ', 'Đôi', 'Thùng', 'Bao', 'Túi'
] as const;
