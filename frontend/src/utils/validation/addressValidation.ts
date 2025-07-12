// Vietnamese address validation
import { VIETNAMESE_PROVINCES } from '../../../../shared/src/constants/vietnamese.constants';

export const validateVietnameseAddress = (address: {
  street?: string;
  ward?: string;
  district?: string;
  province?: string;
}): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!address.street || address.street.trim().length < 5) {
    errors.push('Địa chỉ đường phố phải có ít nhất 5 ký tự');
  }
  
  if (!address.ward || address.ward.trim().length < 2) {
    errors.push('Phường/Xã không được để trống');
  }
  
  if (!address.district || address.district.trim().length < 2) {
    errors.push('Quận/Huyện không được để trống');
  }
  
  if (!address.province || address.province.trim().length < 2) {
    errors.push('Tỉnh/Thành phố không được để trống');
  } else if (!VIETNAMESE_PROVINCES.includes(address.province as any)) {
    errors.push('Tỉnh/Thành phố không hợp lệ');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
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

export const parseVietnameseAddress = (addressString: string): {
  street?: string;
  ward?: string;
  district?: string;
  province?: string;
} => {
  const parts = addressString.split(',').map(part => part.trim());
  
  if (parts.length < 2) {
    return { street: addressString };
  }
  
  // Try to identify province
  const lastPart = parts[parts.length - 1];
  const province = VIETNAMESE_PROVINCES.find(p => 
    p.toLowerCase() === lastPart.toLowerCase()
  );
  
  if (province && parts.length >= 4) {
    return {
      street: parts[0],
      ward: parts[1],
      district: parts[2],
      province: parts[3],
    };
  } else if (parts.length >= 3) {
    return {
      street: parts[0],
      ward: parts[1],
      district: parts[2],
      province: parts[3] || undefined,
    };
  } else {
    return {
      street: parts[0],
      ward: parts[1] || undefined,
    };
  }
};
