// Vietnamese-specific validation utilities
export const validateVietnamesePhone = (phone: string): boolean => {
  // Vietnamese phone number patterns
  const phoneRegex = /^(\+84|84|0)(3[2-9]|5[2689]|7[06-9]|8[1-9]|9[0-9])[0-9]{7}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

export const formatVietnamesePhone = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  
  // Convert to standard format
  if (cleaned.startsWith('84')) {
    return '+84' + cleaned.substring(2);
  } else if (cleaned.startsWith('0')) {
    return '+84' + cleaned.substring(1);
  } else if (cleaned.length === 9) {
    return '+84' + cleaned;
  }
  
  return phone;
};

export const validateVietnameseTaxCode = (taxCode: string): boolean => {
  // Vietnamese tax code: 10 digits or 10 digits + 3 digits
  const taxCodeRegex = /^[0-9]{10}(-[0-9]{3})?$/;
  return taxCodeRegex.test(taxCode);
};

export const validateVietnameseIdCard = (idCard: string): boolean => {
  // CMND: 9 or 12 digits, CCCD: 12 digits
  const idCardRegex = /^[0-9]{9}$|^[0-9]{12}$/;
  return idCardRegex.test(idCard);
};

export const validateVietnamesePostalCode = (postalCode: string): boolean => {
  // Vietnamese postal code: 6 digits
  const postalCodeRegex = /^[0-9]{6}$/;
  return postalCodeRegex.test(postalCode);
};

export const validateVietnameseBankAccount = (accountNumber: string): boolean => {
  // Vietnamese bank account: 6-19 digits
  const bankAccountRegex = /^[0-9]{6,19}$/;
  return bankAccountRegex.test(accountNumber);
};

export const validateVietnameseBusinessLicense = (license: string): boolean => {
  // Vietnamese business license: various formats
  const licenseRegex = /^[0-9]{10,13}$/;
  return licenseRegex.test(license);
};

export const normalizeVietnameseText = (text: string): string => {
  // Remove Vietnamese diacritics for search
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
};

export const validateVietnameseAddress = (address: {
  street?: string;
  ward?: string;
  district?: string;
  province?: string;
}): boolean => {
  // At least province is required
  return !!address.province;
};

export const formatVietnameseAddress = (address: {
  street?: string;
  ward?: string;
  district?: string;
  province?: string;
}): string => {
  const parts = [
    address.street,
    address.ward,
    address.district,
    address.province,
  ].filter(Boolean);
  
  return parts.join(', ');
};

export const validateVietnameseName = (name: string): boolean => {
  // Vietnamese name: letters, spaces, and Vietnamese characters
  const nameRegex = /^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂưăạảấầẩẫậắằẳẵặẹẻẽềềểỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵýỷỹ\s]+$/;
  return nameRegex.test(name) && name.trim().length >= 2;
};

export const capitalizeVietnameseName = (name: string): string => {
  return name
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export const validateVietnameseEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const parseVietnameseDate = (dateString: string): Date | null => {
  // Support Vietnamese date formats: dd/mm/yyyy, dd-mm-yyyy
  const formats = [
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
    /^(\d{1,2})-(\d{1,2})-(\d{4})$/,
  ];
  
  for (const format of formats) {
    const match = dateString.match(format);
    if (match) {
      const [, day, month, year] = match;
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      
      // Validate the date
      if (
        date.getFullYear() === parseInt(year) &&
        date.getMonth() === parseInt(month) - 1 &&
        date.getDate() === parseInt(day)
      ) {
        return date;
      }
    }
  }
  
  return null;
};

export const formatVietnameseDate = (date: Date): string => {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  
  return `${day}/${month}/${year}`;
};

export const validateVietnameseBarcode = (barcode: string): boolean => {
  // Support common barcode formats in Vietnam
  const barcodeRegex = /^[0-9]{8,13}$/;
  return barcodeRegex.test(barcode);
};

export const generateVietnameseSlug = (text: string): string => {
  return normalizeVietnameseText(text)
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .replace(/^-|-$/g, '');
};

// Vietnamese provinces for validation
export const VIETNAMESE_PROVINCES = [
  'An Giang', 'Bà Rịa - Vũng Tàu', 'Bắc Giang', 'Bắc Kạn', 'Bạc Liêu',
  'Bắc Ninh', 'Bến Tre', 'Bình Định', 'Bình Dương', 'Bình Phước',
  'Bình Thuận', 'Cà Mau', 'Cao Bằng', 'Đắk Lắk', 'Đắk Nông',
  'Điện Biên', 'Đồng Nai', 'Đồng Tháp', 'Gia Lai', 'Hà Giang',
  'Hà Nam', 'Hà Tĩnh', 'Hải Dương', 'Hậu Giang', 'Hòa Bình',
  'Hưng Yên', 'Khánh Hòa', 'Kiên Giang', 'Kon Tum', 'Lai Châu',
  'Lâm Đồng', 'Lạng Sơn', 'Lào Cai', 'Long An', 'Nam Định',
  'Nghệ An', 'Ninh Bình', 'Ninh Thuận', 'Phú Thọ', 'Quảng Bình',
  'Quảng Nam', 'Quảng Ngãi', 'Quảng Ninh', 'Quảng Trị', 'Sóc Trăng',
  'Sơn La', 'Tây Ninh', 'Thái Bình', 'Thái Nguyên', 'Thanh Hóa',
  'Thừa Thiên Huế', 'Tiền Giang', 'Trà Vinh', 'Tuyên Quang', 'Vĩnh Long',
  'Vĩnh Phúc', 'Yên Bái', 'Phú Yên', 'Cần Thơ', 'Đà Nẵng',
  'Hải Phòng', 'Hà Nội', 'TP Hồ Chí Minh'
];

export const validateVietnameseProvince = (province: string): boolean => {
  return VIETNAMESE_PROVINCES.includes(province);
};
