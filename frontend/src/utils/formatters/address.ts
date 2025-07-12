// Vietnamese address formatting utilities
export interface VietnameseAddress {
  street?: string;
  ward?: string;
  district?: string;
  province?: string;
  country?: string;
  postalCode?: string;
}

export const formatVietnameseAddress = (address: VietnameseAddress): string => {
  if (!address) return '';
  
  const parts = [
    address.street,
    address.ward,
    address.district,
    address.province,
  ].filter(Boolean);
  
  return parts.join(', ');
};

export const formatFullAddress = (address: VietnameseAddress): string => {
  if (!address) return '';
  
  const parts = [
    address.street,
    address.ward,
    address.district,
    address.province,
    address.country || 'Việt Nam',
  ].filter(Boolean);
  
  let formatted = parts.join(', ');
  
  if (address.postalCode) {
    formatted += ` ${address.postalCode}`;
  }
  
  return formatted;
};

export const formatAddressShort = (address: VietnameseAddress): string => {
  if (!address) return '';
  
  const parts = [
    address.district,
    address.province,
  ].filter(Boolean);
  
  return parts.join(', ');
};

export const parseAddressString = (addressString: string): VietnameseAddress => {
  if (!addressString) return {};
  
  const parts = addressString.split(',').map(part => part.trim());
  
  // Reverse order: street, ward, district, province
  const address: VietnameseAddress = {};
  
  if (parts.length >= 1) address.street = parts[0];
  if (parts.length >= 2) address.ward = parts[1];
  if (parts.length >= 3) address.district = parts[2];
  if (parts.length >= 4) address.province = parts[3];
  if (parts.length >= 5) address.country = parts[4];
  
  return address;
};

export const validateVietnameseAddress = (address: VietnameseAddress): boolean => {
  // At least province is required for Vietnamese addresses
  return !!address.province;
};

export const normalizeAddressPart = (part: string): string => {
  if (!part) return '';
  
  return part
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .replace(/^(phường|xã|thị trấn)\s+/i, '')
    .replace(/^(quận|huyện|thành phố|thị xã)\s+/i, '')
    .replace(/^(tỉnh|thành phố)\s+/i, '');
};

export const getAddressLevel = (address: VietnameseAddress): 'incomplete' | 'basic' | 'detailed' | 'complete' => {
  if (!address.province) return 'incomplete';
  if (!address.district) return 'basic';
  if (!address.ward) return 'detailed';
  if (!address.street) return 'detailed';
  return 'complete';
};

export const formatAddressForShipping = (address: VietnameseAddress): string => {
  const formatted = formatVietnameseAddress(address);
  
  if (address.postalCode) {
    return `${formatted}, ${address.postalCode}`;
  }
  
  return formatted;
};

export const extractPostalCode = (addressString: string): string | null => {
  // Vietnamese postal codes are 6 digits
  const postalCodeRegex = /\b\d{6}\b/;
  const match = addressString.match(postalCodeRegex);
  
  return match ? match[0] : null;
};

export const isUrbanArea = (address: VietnameseAddress): boolean => {
  if (!address.province) return false;
  
  const urbanProvinces = [
    'Hà Nội',
    'TP Hồ Chí Minh',
    'Đà Nẵng',
    'Hải Phòng',
    'Cần Thơ',
  ];
  
  return urbanProvinces.some(province => 
    address.province?.toLowerCase().includes(province.toLowerCase())
  );
};

export const getRegion = (address: VietnameseAddress): string => {
  if (!address.province) return '';
  
  const province = address.province.toLowerCase();
  
  // Northern Vietnam
  const northernProvinces = [
    'hà nội', 'hải phòng', 'quảng ninh', 'hải dương', 'hưng yên',
    'thái bình', 'nam định', 'ninh bình', 'hà nam', 'vĩnh phúc',
    'bắc ninh', 'hà giang', 'cao bằng', 'bắc kạn', 'lạng sơn',
    'thái nguyên', 'phú thọ', 'tuyên quang', 'lào cai', 'yên bái',
    'sơn la', 'hòa bình', 'lai châu', 'điện biên'
  ];
  
  // Central Vietnam
  const centralProvinces = [
    'thanh hóa', 'nghệ an', 'hà tĩnh', 'quảng bình', 'quảng trị',
    'thừa thiên huế', 'đà nẵng', 'quảng nam', 'quảng ngãi',
    'bình định', 'phú yên', 'khánh hòa', 'ninh thuận', 'bình thuận',
    'kon tum', 'gia lai', 'đắk lắk', 'đắk nông', 'lâm đồng'
  ];
  
  // Southern Vietnam
  const southernProvinces = [
    'tp hồ chí minh', 'bình dương', 'đồng nai', 'bà rịa - vũng tàu',
    'tây ninh', 'bình phước', 'long an', 'tiền giang', 'bến tre',
    'trà vinh', 'vĩnh long', 'đồng tháp', 'an giang', 'kiên giang',
    'cần thơ', 'hậu giang', 'sóc trăng', 'bạc liêu', 'cà mau'
  ];
  
  if (northernProvinces.some(p => province.includes(p))) {
    return 'Miền Bắc';
  } else if (centralProvinces.some(p => province.includes(p))) {
    return 'Miền Trung';
  } else if (southernProvinces.some(p => province.includes(p))) {
    return 'Miền Nam';
  }
  
  return '';
};

export const formatAddressForMap = (address: VietnameseAddress): string => {
  // Format address for Google Maps or other mapping services
  const parts = [
    address.street,
    address.ward,
    address.district,
    address.province,
    'Vietnam'
  ].filter(Boolean);
  
  return parts.join(', ');
};

export const compareAddresses = (address1: VietnameseAddress, address2: VietnameseAddress): boolean => {
  const normalize = (addr: VietnameseAddress) => ({
    street: normalizeAddressPart(addr.street || ''),
    ward: normalizeAddressPart(addr.ward || ''),
    district: normalizeAddressPart(addr.district || ''),
    province: normalizeAddressPart(addr.province || ''),
  });
  
  const norm1 = normalize(address1);
  const norm2 = normalize(address2);
  
  return (
    norm1.street === norm2.street &&
    norm1.ward === norm2.ward &&
    norm1.district === norm2.district &&
    norm1.province === norm2.province
  );
};

export const getShippingZone = (address: VietnameseAddress): 'inner-city' | 'suburban' | 'rural' | 'remote' => {
  if (!address.province) return 'remote';
  
  const province = address.province.toLowerCase();
  const district = address.district?.toLowerCase() || '';
  
  // Inner city areas
  if (province.includes('hà nội') || province.includes('tp hồ chí minh')) {
    if (district.includes('quận') || district.includes('thành phố')) {
      return 'inner-city';
    }
    return 'suburban';
  }
  
  // Other major cities
  if (['đà nẵng', 'hải phòng', 'cần thơ'].some(city => province.includes(city))) {
    return 'suburban';
  }
  
  // Provincial cities
  if (district.includes('thành phố') || district.includes('thị xã')) {
    return 'suburban';
  }
  
  // Rural areas
  if (district.includes('huyện')) {
    return 'rural';
  }
  
  return 'remote';
};
