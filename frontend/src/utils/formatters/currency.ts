// Vietnamese currency formatting utilities with precise calculations
import { VNDCalculator } from '../../../../shared/src/utils/currency';

/**
 * Format VND amount for display in Vietnamese locale
 */
export function formatVND(
  amount: number,
  options: {
    showSymbol?: boolean;
    showDecimals?: boolean;
    locale?: string;
    compact?: boolean;
  } = {}
): string {
  const {
    showSymbol = true,
    showDecimals = false,
    locale = 'vi-VN',
    compact = false
  } = options;

  try {
    // Use VNDCalculator for precise amount validation
    const validAmount = VNDCalculator.validateVNDAmount(amount);

    if (compact && validAmount >= 1000000) {
      // Format large amounts compactly (e.g., 1.5M ₫)
      const millions = validAmount / 1000000;
      const formatted = millions.toFixed(millions % 1 === 0 ? 0 : 1);
      return showSymbol ? `${formatted}M ₫` : `${formatted}M`;
    }

    return VNDCalculator.formatVND(validAmount, {
      showSymbol,
      showDecimals,
      locale
    });
  } catch (error) {
    console.error('Currency formatting error:', error);
    return showSymbol ? '0 ₫' : '0';
  }
}

/**
 * Parse VND string to number with validation
 */
export function parseVND(vndString: string): number {
  try {
    return VNDCalculator.parseVND(vndString);
  } catch (error) {
    console.error('Currency parsing error:', error);
    return 0;
  }
}

/**
 * Calculate VAT with Vietnamese tax rates
 */
export function calculateVAT(amount: number, vatRate: number): number {
  try {
    return VNDCalculator.calculateVAT(amount, vatRate);
  } catch (error) {
    console.error('VAT calculation error:', error);
    return 0;
  }
}

/**
 * Calculate order total with discount and VAT
 */
export function calculateOrderTotal(
  subtotal: number,
  discountType: 'percentage' | 'fixed',
  discountValue: number,
  vatRate: number
): {
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  vatAmount: number;
  total: number;
} {
  try {
    return VNDCalculator.calculateOrderTotal(subtotal, discountType, discountValue, vatRate);
  } catch (error) {
    console.error('Order total calculation error:', error);
    return {
      subtotal: 0,
      discountAmount: 0,
      taxableAmount: 0,
      vatAmount: 0,
      total: 0
    };
  }
}

/**
 * Calculate change for cash payments
 */
export function calculateChange(totalAmount: number, cashReceived: number): number {
  try {
    return VNDCalculator.calculateChange(totalAmount, cashReceived);
  } catch (error) {
    console.error('Change calculation error:', error);
    return 0;
  }
}

/**
 * Round to nearest Vietnamese denomination
 */
export function roundToNearestDenomination(amount: number): number {
  try {
    return VNDCalculator.roundToNearestDenomination(amount);
  } catch (error) {
    console.error('Denomination rounding error:', error);
    return Math.round(amount);
  }
}

/**
 * Calculate loyalty points for Vietnamese system
 */
export function calculateLoyaltyPoints(amount: number, pointsPerVND: number = 0.001): number {
  try {
    return VNDCalculator.calculateLoyaltyPoints(amount, pointsPerVND);
  } catch (error) {
    console.error('Loyalty points calculation error:', error);
    return 0;
  }
}

/**
 * Convert loyalty points to VND value
 */
export function convertPointsToVND(points: number, vndPerPoint: number = 1000): number {
  try {
    return VNDCalculator.convertPointsToVND(points, vndPerPoint);
  } catch (error) {
    console.error('Points to VND conversion error:', error);
    return 0;
  }
}

/**
 * Format currency input for form fields
 */
export function formatCurrencyInput(value: string): string {
  // Remove non-numeric characters except decimal point
  const numericValue = value.replace(/[^\d]/g, '');
  
  if (!numericValue) {
    return '';
  }
  
  // Parse and format
  const amount = parseInt(numericValue, 10);
  
  if (isNaN(amount)) {
    return '';
  }
  
  // Format with thousands separators but no currency symbol
  return formatVND(amount, { showSymbol: false });
}

/**
 * Parse currency input from form fields
 */
export function parseCurrencyInput(value: string): number {
  if (!value) {
    return 0;
  }
  
  // Remove formatting and parse
  const numericValue = value.replace(/[^\d]/g, '');
  const amount = parseInt(numericValue, 10);
  
  return isNaN(amount) ? 0 : amount;
}

/**
 * Validate currency amount for Vietnamese business rules
 */
export function validateCurrencyAmount(amount: number): {
  isValid: boolean;
  error?: string;
} {
  try {
    VNDCalculator.validateVNDAmount(amount);
    
    // Additional Vietnamese business rules
    if (amount > 10000000000) { // 10 billion VND limit
      return {
        isValid: false,
        error: 'Số tiền vượt quá giới hạn cho phép (10 tỷ VND)'
      };
    }
    
    if (amount < 0) {
      return {
        isValid: false,
        error: 'Số tiền không thể âm'
      };
    }
    
    return {
      isValid: true
    };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Số tiền không hợp lệ'
    };
  }
}

/**
 * Calculate item total with quantity
 */
export function calculateItemTotal(price: number, quantity: number): number {
  try {
    return VNDCalculator.multiply(price, quantity);
  } catch (error) {
    console.error('Item total calculation error:', error);
    return 0;
  }
}

/**
 * Calculate discount amount
 */
export function calculateDiscount(
  amount: number,
  discountType: 'percentage' | 'fixed',
  discountValue: number
): number {
  try {
    return VNDCalculator.calculateDiscount(amount, discountType, discountValue);
  } catch (error) {
    console.error('Discount calculation error:', error);
    return 0;
  }
}

/**
 * Split bill among multiple people
 */
export function splitBill(totalAmount: number, numberOfPeople: number): {
  perPerson: number;
  remainder: number;
} {
  try {
    return VNDCalculator.splitBill(totalAmount, numberOfPeople);
  } catch (error) {
    console.error('Bill splitting error:', error);
    return {
      perPerson: 0,
      remainder: 0
    };
  }
}

/**
 * Format currency for receipts (Vietnamese format)
 */
export function formatReceiptCurrency(amount: number): string {
  try {
    const validAmount = VNDCalculator.validateVNDAmount(amount);
    
    // Vietnamese receipt format: "123.456 đ"
    const formatted = new Intl.NumberFormat('vi-VN', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(validAmount);
    
    return `${formatted} đ`;
  } catch (error) {
    console.error('Receipt currency formatting error:', error);
    return '0 đ';
  }
}

/**
 * Format currency for display in tables
 */
export function formatTableCurrency(amount: number): string {
  try {
    const validAmount = VNDCalculator.validateVNDAmount(amount);
    
    // Compact format for tables
    if (validAmount >= 1000000) {
      const millions = validAmount / 1000000;
      return `${millions.toFixed(millions % 1 === 0 ? 0 : 1)}M ₫`;
    }
    
    if (validAmount >= 1000) {
      const thousands = validAmount / 1000;
      return `${thousands.toFixed(thousands % 1 === 0 ? 0 : 1)}K ₫`;
    }
    
    return `${validAmount} ₫`;
  } catch (error) {
    console.error('Table currency formatting error:', error);
    return '0 ₫';
  }
}

/**
 * Calculate multiple items total
 */
export function calculateItemsTotal(items: Array<{
  price: number;
  quantity: number;
  discountType?: 'percentage' | 'fixed';
  discountValue?: number;
}>): {
  subtotal: number;
  totalDiscount: number;
  finalTotal: number;
} {
  try {
    return VNDCalculator.calculateItemsTotal(items);
  } catch (error) {
    console.error('Items total calculation error:', error);
    return {
      subtotal: 0,
      totalDiscount: 0,
      finalTotal: 0
    };
  }
}

// Export all functions for convenience
export {
    VNDCalculator
};

// Default export for main formatter
export default formatVND; 