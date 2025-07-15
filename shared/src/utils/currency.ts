// Precise currency calculations for Vietnamese Dong (VND)
// Prevents floating point arithmetic errors in financial calculations

/**
 * Converts VND to smallest unit (dong) for precise calculations
 * VND doesn't have decimal places, so we work with integers
 */
export class VNDCalculator {
  private static readonly PRECISION = 0; // VND has no decimal places
  
  /**
   * Ensure a number is a valid VND amount (integer)
   */
  static validateVNDAmount(amount: number): number {
    if (!Number.isFinite(amount)) {
      throw new Error('Invalid amount: must be a finite number');
    }
    
    if (amount < 0) {
      throw new Error('Invalid amount: cannot be negative');
    }
    
    // Round to nearest integer (VND doesn't have decimal places)
    return Math.round(amount);
  }

  /**
   * Add two VND amounts precisely
   */
  static add(a: number, b: number): number {
    const validA = this.validateVNDAmount(a);
    const validB = this.validateVNDAmount(b);
    
    return validA + validB;
  }

  /**
   * Subtract two VND amounts precisely
   */
  static subtract(a: number, b: number): number {
    const validA = this.validateVNDAmount(a);
    const validB = this.validateVNDAmount(b);
    
    const result = validA - validB;
    
    if (result < 0) {
      throw new Error('Subtraction result cannot be negative');
    }
    
    return result;
  }

  /**
   * Multiply VND amount by a factor precisely
   */
  static multiply(amount: number, factor: number): number {
    const validAmount = this.validateVNDAmount(amount);
    
    if (!Number.isFinite(factor)) {
      throw new Error('Invalid factor: must be a finite number');
    }
    
    if (factor < 0) {
      throw new Error('Invalid factor: cannot be negative');
    }
    
    // Use integer arithmetic to avoid floating point errors
    const result = Math.round(validAmount * factor);
    
    return result;
  }

  /**
   * Divide VND amount by a factor precisely
   */
  static divide(amount: number, factor: number): number {
    const validAmount = this.validateVNDAmount(amount);
    
    if (!Number.isFinite(factor)) {
      throw new Error('Invalid factor: must be a finite number');
    }
    
    if (factor <= 0) {
      throw new Error('Invalid factor: must be positive');
    }
    
    // Use integer arithmetic to avoid floating point errors
    const result = Math.round(validAmount / factor);
    
    return result;
  }

  /**
   * Calculate VAT amount for Vietnamese tax rates
   */
  static calculateVAT(amount: number, vatRate: number): number {
    const validAmount = this.validateVNDAmount(amount);
    
    // Vietnamese VAT rates: 0%, 5%, 10%
    const validVATRates = [0, 5, 10];
    
    if (!validVATRates.includes(vatRate)) {
      throw new Error(`Invalid VAT rate: ${vatRate}%. Valid rates are: ${validVATRates.join(', ')}%`);
    }
    
    if (vatRate === 0) {
      return 0;
    }
    
    // Calculate VAT using integer arithmetic
    // VAT = amount * (vatRate / 100)
    const vatAmount = Math.round(validAmount * vatRate / 100);
    
    return vatAmount;
  }

  /**
   * Calculate total amount including VAT
   */
  static calculateTotalWithVAT(amount: number, vatRate: number): number {
    const validAmount = this.validateVNDAmount(amount);
    const vatAmount = this.calculateVAT(validAmount, vatRate);
    
    return this.add(validAmount, vatAmount);
  }

  /**
   * Calculate discount amount
   */
  static calculateDiscount(amount: number, discountType: 'percentage' | 'fixed', discountValue: number): number {
    const validAmount = this.validateVNDAmount(amount);
    
    if (discountType === 'fixed') {
      const validDiscount = this.validateVNDAmount(discountValue);
      
      if (validDiscount > validAmount) {
        throw new Error('Discount amount cannot exceed total amount');
      }
      
      return validDiscount;
    } else {
      // Percentage discount
      if (discountValue < 0 || discountValue > 100) {
        throw new Error('Discount percentage must be between 0 and 100');
      }
      
      const discountAmount = Math.round(validAmount * discountValue / 100);
      
      return discountAmount;
    }
  }

  /**
   * Calculate order total with discount and VAT
   */
  static calculateOrderTotal(
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
    const validSubtotal = this.validateVNDAmount(subtotal);
    
    // Calculate discount
    const discountAmount = this.calculateDiscount(validSubtotal, discountType, discountValue);
    
    // Calculate taxable amount (after discount)
    const taxableAmount = this.subtract(validSubtotal, discountAmount);
    
    // Calculate VAT on taxable amount
    const vatAmount = this.calculateVAT(taxableAmount, vatRate);
    
    // Calculate final total
    const total = this.add(taxableAmount, vatAmount);
    
    return {
      subtotal: validSubtotal,
      discountAmount,
      taxableAmount,
      vatAmount,
      total
    };
  }

  /**
   * Calculate change amount for cash payments
   */
  static calculateChange(totalAmount: number, cashReceived: number): number {
    const validTotal = this.validateVNDAmount(totalAmount);
    const validCash = this.validateVNDAmount(cashReceived);
    
    if (validCash < validTotal) {
      throw new Error('Cash received is less than total amount');
    }
    
    return this.subtract(validCash, validTotal);
  }

  /**
   * Round amount to nearest valid VND denomination
   * Vietnamese dong uses 1000, 2000, 5000, 10000, 20000, 50000, 100000, 200000, 500000 denominations
   */
  static roundToNearestDenomination(amount: number): number {
    const validAmount = this.validateVNDAmount(amount);
    
    // For amounts less than 1000, round to nearest 100
    if (validAmount < 1000) {
      return Math.round(validAmount / 100) * 100;
    }
    
    // For amounts 1000 and above, round to nearest 1000
    return Math.round(validAmount / 1000) * 1000;
  }

  /**
   * Format VND amount for display
   */
  static formatVND(amount: number, options: {
    showSymbol?: boolean;
    showDecimals?: boolean;
    locale?: string;
  } = {}): string {
    const validAmount = this.validateVNDAmount(amount);
    
    const {
      showSymbol = true,
      showDecimals = false,
      locale = 'vi-VN'
    } = options;
    
    const formatter = new Intl.NumberFormat(locale, {
      style: showSymbol ? 'currency' : 'decimal',
      currency: 'VND',
      minimumFractionDigits: showDecimals ? 0 : 0,
      maximumFractionDigits: showDecimals ? 0 : 0
    });
    
    return formatter.format(validAmount);
  }

  /**
   * Parse VND string to number
   */
  static parseVND(vndString: string): number {
    // Remove currency symbols and formatting
    const cleanString = vndString
      .replace(/[₫\s]/g, '') // Remove VND symbol and spaces
      .replace(/[,.]/g, '') // Remove thousands separators
      .trim();
    
    const amount = parseInt(cleanString, 10);
    
    if (isNaN(amount)) {
      throw new Error(`Invalid VND string: ${vndString}`);
    }
    
    return this.validateVNDAmount(amount);
  }

  /**
   * Calculate loyalty points for Vietnamese system
   * Common rate: 1 point per 1000 VND spent
   */
  static calculateLoyaltyPoints(amount: number, pointsPerVND: number = 0.001): number {
    const validAmount = this.validateVNDAmount(amount);
    
    if (pointsPerVND < 0) {
      throw new Error('Points per VND rate cannot be negative');
    }
    
    const points = Math.floor(validAmount * pointsPerVND);
    
    return points;
  }

  /**
   * Convert loyalty points to VND value
   */
  static convertPointsToVND(points: number, vndPerPoint: number = 1000): number {
    if (!Number.isInteger(points) || points < 0) {
      throw new Error('Points must be a non-negative integer');
    }
    
    if (vndPerPoint <= 0) {
      throw new Error('VND per point rate must be positive');
    }
    
    const vndValue = Math.round(points * vndPerPoint);
    
    return vndValue;
  }

  /**
   * Validate and calculate tip amount (if applicable)
   */
  static calculateTip(amount: number, tipPercentage: number): number {
    const validAmount = this.validateVNDAmount(amount);
    
    if (tipPercentage < 0 || tipPercentage > 100) {
      throw new Error('Tip percentage must be between 0 and 100');
    }
    
    const tipAmount = Math.round(validAmount * tipPercentage / 100);
    
    return tipAmount;
  }

  /**
   * Split bill among multiple people
   */
  static splitBill(totalAmount: number, numberOfPeople: number): {
    perPerson: number;
    remainder: number;
  } {
    const validTotal = this.validateVNDAmount(totalAmount);
    
    if (!Number.isInteger(numberOfPeople) || numberOfPeople <= 0) {
      throw new Error('Number of people must be a positive integer');
    }
    
    const perPerson = Math.floor(validTotal / numberOfPeople);
    const remainder = validTotal % numberOfPeople;
    
    return {
      perPerson,
      remainder
    };
  }

  /**
   * Calculate compound totals for multiple items
   */
  static calculateItemsTotal(items: Array<{
    price: number;
    quantity: number;
    discountType?: 'percentage' | 'fixed';
    discountValue?: number;
  }>): {
    subtotal: number;
    totalDiscount: number;
    finalTotal: number;
  } {
    let subtotal = 0;
    let totalDiscount = 0;
    
    for (const item of items) {
      const validPrice = this.validateVNDAmount(item.price);
      const validQuantity = this.validateVNDAmount(item.quantity);
      
      const itemTotal = this.multiply(validPrice, validQuantity);
      subtotal = this.add(subtotal, itemTotal);
      
      if (item.discountType && item.discountValue) {
        const itemDiscount = this.calculateDiscount(itemTotal, item.discountType, item.discountValue);
        totalDiscount = this.add(totalDiscount, itemDiscount);
      }
    }
    
    const finalTotal = this.subtract(subtotal, totalDiscount);
    
    return {
      subtotal,
      totalDiscount,
      finalTotal
    };
  }
}

// Export convenience functions for common operations
export const formatVND = (amount: number, options?: Parameters<typeof VNDCalculator.formatVND>[1]) => 
  VNDCalculator.formatVND(amount, options);

export const parseVND = (vndString: string) => VNDCalculator.parseVND(vndString);

export const calculateVAT = (amount: number, vatRate: number) => 
  VNDCalculator.calculateVAT(amount, vatRate);

export const calculateOrderTotal = (
  subtotal: number,
  discountType: 'percentage' | 'fixed',
  discountValue: number,
  vatRate: number
) => VNDCalculator.calculateOrderTotal(subtotal, discountType, discountValue, vatRate);

export const calculateChange = (totalAmount: number, cashReceived: number) => 
  VNDCalculator.calculateChange(totalAmount, cashReceived);

export const roundToNearestDenomination = (amount: number) => 
  VNDCalculator.roundToNearestDenomination(amount);

// Export the main class
export default VNDCalculator; 