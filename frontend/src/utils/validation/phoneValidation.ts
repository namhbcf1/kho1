// Vietnamese phone number validation
import { VIETNAMESE_PHONE_PREFIXES } from '../../../../shared/src/constants/vietnamese.constants';

export const validateVietnamesePhone = (phone: string): boolean => {
  if (!phone) return false;
  
  // Remove all non-digit characters
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Check length (10-11 digits)
  if (cleanPhone.length < 10 || cleanPhone.length > 11) {
    return false;
  }
  
  // Handle different formats
  let normalizedPhone = cleanPhone;
  
  // If starts with +84, remove it
  if (normalizedPhone.startsWith('84')) {
    normalizedPhone = '0' + normalizedPhone.substring(2);
  }
  
  // Must start with 0 and be 10 digits
  if (!normalizedPhone.startsWith('0') || normalizedPhone.length !== 10) {
    return false;
  }
  
  // Check if prefix is valid
  const prefix = normalizedPhone.substring(0, 3);
  return VIETNAMESE_PHONE_PREFIXES.includes(prefix as any);
};

export const formatVietnamesePhone = (phone: string): string => {
  if (!phone) return '';
  
  const cleanPhone = phone.replace(/\D/g, '');
  let normalizedPhone = cleanPhone;
  
  // Handle +84 format
  if (normalizedPhone.startsWith('84')) {
    normalizedPhone = '0' + normalizedPhone.substring(2);
  }
  
  // Format as 0xxx xxx xxx
  if (normalizedPhone.length === 10 && normalizedPhone.startsWith('0')) {
    return normalizedPhone.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3');
  }
  
  return phone;
};

export const getPhoneCarrier = (phone: string): string | null => {
  const cleanPhone = phone.replace(/\D/g, '');
  let normalizedPhone = cleanPhone;
  
  if (normalizedPhone.startsWith('84')) {
    normalizedPhone = '0' + normalizedPhone.substring(2);
  }
  
  if (normalizedPhone.length !== 10 || !normalizedPhone.startsWith('0')) {
    return null;
  }
  
  const prefix = normalizedPhone.substring(0, 3);
  
  const carrierMap: Record<string, string> = {
    '032': 'viettel', '033': 'viettel', '034': 'viettel', '035': 'viettel',
    '036': 'viettel', '037': 'viettel', '038': 'viettel', '039': 'viettel',
    '070': 'mobifone', '079': 'mobifone', '077': 'mobifone', '076': 'mobifone', '078': 'mobifone',
    '083': 'vinaphone', '084': 'vinaphone', '085': 'vinaphone', '081': 'vinaphone', '082': 'vinaphone',
    '056': 'vietnamobile', '058': 'vietnamobile',
    '059': 'gmobile',
  };
  
  return carrierMap[prefix] || null;
};
