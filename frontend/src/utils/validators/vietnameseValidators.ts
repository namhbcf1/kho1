// Vietnamese phone validation
export const validateVietnamesePhone = (phone: string): boolean => {
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  const phoneRegex = /^0[3-9]\d{8,9}$/;
  return phoneRegex.test(cleanPhone);
};

// Vietnamese ID validation
export const validateVietnameseID = (id: string): boolean => {
  const cleanId = id.replace(/\s/g, '');
  const idRegex = /^\d{9}$|^\d{12}$/;
  return idRegex.test(cleanId);
};

// Format phone for display
export const formatVietnamesePhone = (phone: string): string => {
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  if (cleanPhone.length === 10) {
    return cleanPhone.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3');
  }
  if (cleanPhone.length === 11) {
    return cleanPhone.replace(/(\d{4})(\d{4})(\d{3})/, '$1 $2 $3');
  }
  return phone;
};

// Vietnamese address validation
export const validateVietnameseAddress = (address: {
  province?: string;
  district?: string;
  ward?: string;
  street?: string;
}): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!address.province) {
    errors.push('Tỉnh/Thành phố là bắt buộc');
  }
  
  if (!address.district) {
    errors.push('Quận/Huyện là bắt buộc');
  }
  
  if (!address.ward) {
    errors.push('Phường/Xã là bắt buộc');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Vietnamese business license validation
export const validateBusinessLicense = (license: string): boolean => {
  const cleanLicense = license.replace(/[\s\-]/g, '');
  const licenseRegex = /^\d{10}$|^\d{13}$/;
  return licenseRegex.test(cleanLicense);
};

// Vietnamese tax code validation
export const validateTaxCode = (taxCode: string): boolean => {
  const cleanTaxCode = taxCode.replace(/[\s\-]/g, '');
  const taxCodeRegex = /^\d{10}$|^\d{13}$/;
  return taxCodeRegex.test(cleanTaxCode);
};