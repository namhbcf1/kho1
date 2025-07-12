// Vietnamese phone number formatting utilities
export const formatVietnamesePhone = (phone: string): string => {
  if (!phone) return '';
  
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Handle different input formats
  let formatted = cleaned;
  
  // Convert to standard format
  if (cleaned.startsWith('84')) {
    formatted = '+84' + cleaned.substring(2);
  } else if (cleaned.startsWith('0')) {
    formatted = '+84' + cleaned.substring(1);
  } else if (cleaned.length === 9) {
    formatted = '+84' + cleaned;
  } else if (cleaned.length === 10 && cleaned.startsWith('0')) {
    formatted = '+84' + cleaned.substring(1);
  }
  
  return formatted;
};

export const formatPhoneDisplay = (phone: string): string => {
  if (!phone) return '';
  
  const cleaned = phone.replace(/\D/g, '');
  
  // Format for display (with spaces)
  if (cleaned.startsWith('84')) {
    const number = cleaned.substring(2);
    if (number.length === 9) {
      return `+84 ${number.substring(0, 3)} ${number.substring(3, 6)} ${number.substring(6)}`;
    }
  } else if (cleaned.startsWith('0') && cleaned.length === 10) {
    return `${cleaned.substring(0, 4)} ${cleaned.substring(4, 7)} ${cleaned.substring(7)}`;
  }
  
  return phone;
};

export const formatPhoneForSMS = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.startsWith('84')) {
    return '+' + cleaned;
  } else if (cleaned.startsWith('0')) {
    return '+84' + cleaned.substring(1);
  } else if (cleaned.length === 9) {
    return '+84' + cleaned;
  }
  
  return phone;
};

export const getPhoneCarrier = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  let number = cleaned;
  
  // Normalize to 9-digit format
  if (number.startsWith('84')) {
    number = number.substring(2);
  } else if (number.startsWith('0')) {
    number = number.substring(1);
  }
  
  if (number.length !== 9) return 'Unknown';
  
  const prefix = number.substring(0, 3);
  
  // Viettel
  if (['032', '033', '034', '035', '036', '037', '038', '039'].includes(prefix) ||
      ['086', '096', '097', '098'].includes(prefix)) {
    return 'Viettel';
  }
  
  // Vinaphone
  if (['088', '091', '094'].includes(prefix) ||
      ['083', '084', '085'].includes(prefix)) {
    return 'Vinaphone';
  }
  
  // Mobifone
  if (['089', '090', '093'].includes(prefix) ||
      ['070', '079', '077', '076', '078'].includes(prefix)) {
    return 'Mobifone';
  }
  
  // Vietnamobile
  if (['092', '056', '058'].includes(prefix)) {
    return 'Vietnamobile';
  }
  
  // Gmobile
  if (['099', '059'].includes(prefix)) {
    return 'Gmobile';
  }
  
  return 'Unknown';
};

export const isValidVietnamesePhone = (phone: string): boolean => {
  const cleaned = phone.replace(/\D/g, '');
  let number = cleaned;
  
  // Normalize to 9-digit format
  if (number.startsWith('84')) {
    number = number.substring(2);
  } else if (number.startsWith('0')) {
    number = number.substring(1);
  }
  
  // Must be exactly 9 digits
  if (number.length !== 9) return false;
  
  // Check valid prefixes
  const validPrefixes = [
    // Viettel
    '032', '033', '034', '035', '036', '037', '038', '039',
    '086', '096', '097', '098',
    // Vinaphone
    '088', '091', '094', '083', '084', '085',
    // Mobifone
    '089', '090', '093', '070', '079', '077', '076', '078',
    // Vietnamobile
    '092', '056', '058',
    // Gmobile
    '099', '059'
  ];
  
  const prefix = number.substring(0, 3);
  return validPrefixes.includes(prefix);
};

export const maskPhoneNumber = (phone: string, maskChar: string = '*'): string => {
  if (!phone) return '';
  
  const formatted = formatPhoneDisplay(phone);
  
  // Mask middle digits
  if (formatted.includes('+84')) {
    // +84 xxx xxx xxx -> +84 xxx *** xxx
    const parts = formatted.split(' ');
    if (parts.length === 4) {
      return `${parts[0]} ${parts[1]} ${maskChar.repeat(3)} ${parts[3]}`;
    }
  } else if (formatted.length >= 10) {
    // 0xxx xxx xxx -> 0xxx *** xxx
    const start = formatted.substring(0, 4);
    const end = formatted.substring(formatted.length - 3);
    const middle = maskChar.repeat(formatted.length - 7);
    return start + middle + end;
  }
  
  return formatted;
};

export const extractPhoneFromText = (text: string): string[] => {
  const phoneRegex = /(\+84|84|0)(3[2-9]|5[2689]|7[06-9]|8[1-9]|9[0-9])[0-9]{7}/g;
  const matches = text.match(phoneRegex);
  
  return matches ? matches.map(formatVietnamesePhone) : [];
};

export const generatePhoneLink = (phone: string, type: 'tel' | 'sms' = 'tel'): string => {
  const formatted = formatPhoneForSMS(phone);
  return `${type}:${formatted}`;
};

export const comparePhoneNumbers = (phone1: string, phone2: string): boolean => {
  const normalized1 = formatVietnamesePhone(phone1);
  const normalized2 = formatVietnamesePhone(phone2);
  
  return normalized1 === normalized2;
};
