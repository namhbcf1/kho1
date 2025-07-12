// Unit tests for utility functions
import { describe, it, expect } from 'vitest';
import {
  formatVND,
  formatVNDCompact,
  parseVND,
  validateVNDAmount,
  convertToVNDWords,
} from '../../src/utils/formatters/vndCurrency';
import {
  validateVietnamesePhone,
  formatVietnamesePhone,
  validateVietnameseTaxCode,
  validateVietnameseIdCard,
  normalizeVietnameseText,
  capitalizeVietnameseName,
  validateVietnameseName,
} from '../../src/utils/validators/vietnameseValidators';

describe('VND Currency Utilities', () => {
  describe('formatVND', () => {
    it('should format positive numbers correctly', () => {
      expect(formatVND(1000)).toBe('1.000 ₫');
      expect(formatVND(1000000)).toBe('1.000.000 ₫');
      expect(formatVND(1234567)).toBe('1.234.567 ₫');
    });

    it('should format zero correctly', () => {
      expect(formatVND(0)).toBe('0 ₫');
    });

    it('should handle NaN', () => {
      expect(formatVND(NaN)).toBe('0 ₫');
    });

    it('should format decimal numbers', () => {
      expect(formatVND(1000.5)).toBe('1.001 ₫'); // Rounded
    });
  });

  describe('formatVNDCompact', () => {
    it('should format large numbers with suffixes', () => {
      expect(formatVNDCompact(1000000)).toBe('1.0M ₫');
      expect(formatVNDCompact(1000000000)).toBe('1.0B ₫');
      expect(formatVNDCompact(1500000)).toBe('1.5M ₫');
    });

    it('should format small numbers normally', () => {
      expect(formatVNDCompact(999)).toBe('999 ₫');
      expect(formatVNDCompact(1500)).toBe('1.5K ₫');
    });
  });

  describe('parseVND', () => {
    it('should parse formatted VND strings', () => {
      expect(parseVND('1.000 ₫')).toBe(1000);
      expect(parseVND('1.234.567 ₫')).toBe(1234567);
    });

    it('should handle plain numbers', () => {
      expect(parseVND('1000')).toBe(1000);
    });

    it('should handle invalid input', () => {
      expect(parseVND('invalid')).toBe(0);
      expect(parseVND('')).toBe(0);
    });
  });

  describe('validateVNDAmount', () => {
    it('should validate positive amounts', () => {
      expect(validateVNDAmount(1000)).toBe(true);
      expect(validateVNDAmount(0)).toBe(true);
    });

    it('should reject negative amounts', () => {
      expect(validateVNDAmount(-1000)).toBe(false);
    });

    it('should reject NaN', () => {
      expect(validateVNDAmount(NaN)).toBe(false);
    });

    it('should reject amounts over limit', () => {
      expect(validateVNDAmount(1000000000000)).toBe(false); // Over 999 billion
    });
  });

  describe('convertToVNDWords', () => {
    it('should convert numbers to Vietnamese words', () => {
      expect(convertToVNDWords(0)).toBe('không đồng');
      expect(convertToVNDWords(1)).toBe('một đồng');
      expect(convertToVNDWords(1000)).toBe('một nghìn đồng');
      expect(convertToVNDWords(1000000)).toBe('một triệu đồng');
    });

    it('should handle complex numbers', () => {
      expect(convertToVNDWords(1234)).toContain('một nghìn');
      expect(convertToVNDWords(1234)).toContain('hai trăm');
    });
  });
});

describe('Vietnamese Validators', () => {
  describe('validateVietnamesePhone', () => {
    it('should validate correct Vietnamese phone numbers', () => {
      expect(validateVietnamesePhone('0901234567')).toBe(true);
      expect(validateVietnamesePhone('84901234567')).toBe(true);
      expect(validateVietnamesePhone('+84901234567')).toBe(true);
      expect(validateVietnamesePhone('0321234567')).toBe(true); // Viettel
      expect(validateVietnamesePhone('0521234567')).toBe(true); // Vietnamobile
      expect(validateVietnamesePhone('0701234567')).toBe(true); // Gmobile
      expect(validateVietnamesePhone('0881234567')).toBe(true); // Vinaphone
    });

    it('should reject invalid phone numbers', () => {
      expect(validateVietnamesePhone('123456789')).toBe(false);
      expect(validateVietnamesePhone('0123456789')).toBe(false); // Invalid prefix
      expect(validateVietnamesePhone('090123456')).toBe(false); // Too short
      expect(validateVietnamesePhone('09012345678')).toBe(false); // Too long
    });

    it('should handle phone numbers with spaces', () => {
      expect(validateVietnamesePhone('090 123 4567')).toBe(true);
      expect(validateVietnamesePhone('+84 90 123 4567')).toBe(true);
    });
  });

  describe('formatVietnamesePhone', () => {
    it('should format phone numbers to international format', () => {
      expect(formatVietnamesePhone('0901234567')).toBe('+84901234567');
      expect(formatVietnamesePhone('84901234567')).toBe('+84901234567');
      expect(formatVietnamesePhone('901234567')).toBe('+84901234567');
    });

    it('should return original if already formatted', () => {
      expect(formatVietnamesePhone('+84901234567')).toBe('+84901234567');
    });
  });

  describe('validateVietnameseTaxCode', () => {
    it('should validate correct tax codes', () => {
      expect(validateVietnameseTaxCode('1234567890')).toBe(true);
      expect(validateVietnameseTaxCode('1234567890-123')).toBe(true);
    });

    it('should reject invalid tax codes', () => {
      expect(validateVietnameseTaxCode('123456789')).toBe(false); // Too short
      expect(validateVietnameseTaxCode('12345678901')).toBe(false); // Too long
      expect(validateVietnameseTaxCode('123456789a')).toBe(false); // Contains letter
    });
  });

  describe('validateVietnameseIdCard', () => {
    it('should validate CMND and CCCD', () => {
      expect(validateVietnameseIdCard('123456789')).toBe(true); // CMND 9 digits
      expect(validateVietnameseIdCard('123456789012')).toBe(true); // CCCD 12 digits
    });

    it('should reject invalid ID cards', () => {
      expect(validateVietnameseIdCard('12345678')).toBe(false); // Too short
      expect(validateVietnameseIdCard('1234567890')).toBe(false); // 10 digits not valid
      expect(validateVietnameseIdCard('12345678901')).toBe(false); // 11 digits not valid
      expect(validateVietnameseIdCard('1234567890123')).toBe(false); // Too long
    });
  });

  describe('normalizeVietnameseText', () => {
    it('should remove Vietnamese diacritics', () => {
      expect(normalizeVietnameseText('Nguyễn Văn Á')).toBe('nguyen van a');
      expect(normalizeVietnameseText('Hồ Chí Minh')).toBe('ho chi minh');
      expect(normalizeVietnameseText('Đà Nẵng')).toBe('da nang');
    });

    it('should convert to lowercase', () => {
      expect(normalizeVietnameseText('HELLO WORLD')).toBe('hello world');
    });
  });

  describe('validateVietnameseName', () => {
    it('should validate correct Vietnamese names', () => {
      expect(validateVietnameseName('Nguyễn Văn A')).toBe(true);
      expect(validateVietnameseName('Trần Thị Bình')).toBe(true);
      expect(validateVietnameseName('Lê Hoàng Minh')).toBe(true);
    });

    it('should reject invalid names', () => {
      expect(validateVietnameseName('A')).toBe(false); // Too short
      expect(validateVietnameseName('Nguyen123')).toBe(false); // Contains numbers
      expect(validateVietnameseName('Nguyen@Van')).toBe(false); // Contains special chars
      expect(validateVietnameseName('')).toBe(false); // Empty
      expect(validateVietnameseName('   ')).toBe(false); // Only spaces
    });
  });

  describe('capitalizeVietnameseName', () => {
    it('should capitalize each word', () => {
      expect(capitalizeVietnameseName('nguyễn văn a')).toBe('Nguyễn Văn A');
      expect(capitalizeVietnameseName('TRẦN THỊ BÌNH')).toBe('Trần Thị Bình');
      expect(capitalizeVietnameseName('lê hoàng minh')).toBe('Lê Hoàng Minh');
    });

    it('should handle single names', () => {
      expect(capitalizeVietnameseName('minh')).toBe('Minh');
    });

    it('should handle extra spaces', () => {
      expect(capitalizeVietnameseName('nguyễn  văn   a')).toBe('Nguyễn  Văn   A');
    });
  });
});
