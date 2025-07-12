// Vietnamese tax calculation utilities
export interface TaxConfig {
  rate: number; // Tax rate as decimal (0.1 for 10%)
  inclusive: boolean; // Whether tax is included in price
  name: string;
  code: string;
}

export interface TaxCalculationResult {
  subtotal: number;
  taxAmount: number;
  total: number;
  taxRate: number;
  taxInclusive: boolean;
}

// Vietnamese VAT rates
export const VIETNAM_VAT_RATES = {
  STANDARD: { rate: 0.1, name: 'VAT 10%', code: 'VAT10' },
  REDUCED: { rate: 0.05, name: 'VAT 5%', code: 'VAT5' },
  ZERO: { rate: 0, name: 'VAT 0%', code: 'VAT0' },
  EXEMPT: { rate: 0, name: 'Miễn thuế', code: 'EXEMPT' },
} as const;

// Default tax configuration for Vietnam
export const DEFAULT_TAX_CONFIG: TaxConfig = {
  rate: VIETNAM_VAT_RATES.STANDARD.rate,
  inclusive: false,
  name: VIETNAM_VAT_RATES.STANDARD.name,
  code: VIETNAM_VAT_RATES.STANDARD.code,
};

export class TaxCalculator {
  private config: TaxConfig;

  constructor(config: TaxConfig = DEFAULT_TAX_CONFIG) {
    this.config = config;
  }

  public calculateTax(amount: number): TaxCalculationResult {
    if (amount < 0) {
      throw new Error('Amount cannot be negative');
    }

    if (this.config.rate === 0) {
      return {
        subtotal: amount,
        taxAmount: 0,
        total: amount,
        taxRate: 0,
        taxInclusive: this.config.inclusive,
      };
    }

    if (this.config.inclusive) {
      // Tax is included in the amount
      const subtotal = amount / (1 + this.config.rate);
      const taxAmount = amount - subtotal;

      return {
        subtotal: this.roundToVND(subtotal),
        taxAmount: this.roundToVND(taxAmount),
        total: amount,
        taxRate: this.config.rate,
        taxInclusive: true,
      };
    } else {
      // Tax is added to the amount
      const taxAmount = amount * this.config.rate;
      const total = amount + taxAmount;

      return {
        subtotal: amount,
        taxAmount: this.roundToVND(taxAmount),
        total: this.roundToVND(total),
        taxRate: this.config.rate,
        taxInclusive: false,
      };
    }
  }

  public calculateMultipleItems(items: Array<{ amount: number; taxConfig?: TaxConfig }>): TaxCalculationResult {
    let totalSubtotal = 0;
    let totalTaxAmount = 0;

    for (const item of items) {
      const itemTaxConfig = item.taxConfig || this.config;
      const calculator = new TaxCalculator(itemTaxConfig);
      const result = calculator.calculateTax(item.amount);

      totalSubtotal += result.subtotal;
      totalTaxAmount += result.taxAmount;
    }

    return {
      subtotal: this.roundToVND(totalSubtotal),
      taxAmount: this.roundToVND(totalTaxAmount),
      total: this.roundToVND(totalSubtotal + totalTaxAmount),
      taxRate: this.config.rate, // Primary tax rate
      taxInclusive: this.config.inclusive,
    };
  }

  public reverseTax(totalAmount: number): TaxCalculationResult {
    if (totalAmount < 0) {
      throw new Error('Total amount cannot be negative');
    }

    if (this.config.rate === 0) {
      return {
        subtotal: totalAmount,
        taxAmount: 0,
        total: totalAmount,
        taxRate: 0,
        taxInclusive: this.config.inclusive,
      };
    }

    // Calculate subtotal from total (reverse calculation)
    const subtotal = totalAmount / (1 + this.config.rate);
    const taxAmount = totalAmount - subtotal;

    return {
      subtotal: this.roundToVND(subtotal),
      taxAmount: this.roundToVND(taxAmount),
      total: totalAmount,
      taxRate: this.config.rate,
      taxInclusive: false,
    };
  }

  public getTaxConfig(): TaxConfig {
    return { ...this.config };
  }

  public setTaxConfig(config: Partial<TaxConfig>): void {
    this.config = { ...this.config, ...config };
  }

  private roundToVND(amount: number): number {
    // Round to nearest VND (no decimal places)
    return Math.round(amount);
  }
}

// Convenience functions
export const calculateVAT = (amount: number, rate: number = 0.1, inclusive: boolean = false): TaxCalculationResult => {
  const calculator = new TaxCalculator({
    rate,
    inclusive,
    name: `VAT ${rate * 100}%`,
    code: `VAT${rate * 100}`,
  });
  
  return calculator.calculateTax(amount);
};

export const calculateStandardVAT = (amount: number, inclusive: boolean = false): TaxCalculationResult => {
  return calculateVAT(amount, VIETNAM_VAT_RATES.STANDARD.rate, inclusive);
};

export const calculateReducedVAT = (amount: number, inclusive: boolean = false): TaxCalculationResult => {
  return calculateVAT(amount, VIETNAM_VAT_RATES.REDUCED.rate, inclusive);
};

export const calculateZeroVAT = (amount: number): TaxCalculationResult => {
  return calculateVAT(amount, VIETNAM_VAT_RATES.ZERO.rate, false);
};

// Tax exemption utilities
export const isVATExempt = (productCategory: string): boolean => {
  const exemptCategories = [
    'medical',
    'education',
    'books',
    'newspapers',
    'agricultural-products',
    'essential-foods',
  ];
  
  return exemptCategories.includes(productCategory.toLowerCase());
};

export const getVATRateByCategory = (category: string): number => {
  const categoryRates: Record<string, number> = {
    'food': VIETNAM_VAT_RATES.REDUCED.rate,
    'beverages': VIETNAM_VAT_RATES.STANDARD.rate,
    'electronics': VIETNAM_VAT_RATES.STANDARD.rate,
    'clothing': VIETNAM_VAT_RATES.STANDARD.rate,
    'books': VIETNAM_VAT_RATES.ZERO.rate,
    'medical': VIETNAM_VAT_RATES.ZERO.rate,
    'education': VIETNAM_VAT_RATES.ZERO.rate,
    'agricultural': VIETNAM_VAT_RATES.REDUCED.rate,
  };
  
  return categoryRates[category.toLowerCase()] || VIETNAM_VAT_RATES.STANDARD.rate;
};

// Tax reporting utilities
export const formatTaxReport = (calculation: TaxCalculationResult): string => {
  const lines = [
    `Tạm tính: ${calculation.subtotal.toLocaleString('vi-VN')} ₫`,
    `Thuế VAT (${(calculation.taxRate * 100).toFixed(1)}%): ${calculation.taxAmount.toLocaleString('vi-VN')} ₫`,
    `Tổng cộng: ${calculation.total.toLocaleString('vi-VN')} ₫`,
  ];
  
  if (calculation.taxInclusive) {
    lines.unshift('(Đã bao gồm thuế VAT)');
  }
  
  return lines.join('\n');
};

export const generateTaxInvoiceData = (calculation: TaxCalculationResult, invoiceNumber: string) => {
  return {
    invoiceNumber,
    date: new Date().toISOString(),
    subtotal: calculation.subtotal,
    taxRate: calculation.taxRate,
    taxAmount: calculation.taxAmount,
    total: calculation.total,
    taxInclusive: calculation.taxInclusive,
    currency: 'VND',
    taxAuthority: 'Tổng cục Thuế Việt Nam',
  };
};

// Discount and tax interaction
export const calculateTaxAfterDiscount = (
  originalAmount: number,
  discountAmount: number,
  taxConfig: TaxConfig = DEFAULT_TAX_CONFIG
): TaxCalculationResult => {
  const discountedAmount = Math.max(0, originalAmount - discountAmount);
  const calculator = new TaxCalculator(taxConfig);
  return calculator.calculateTax(discountedAmount);
};

export const calculateDiscountBeforeTax = (
  originalAmount: number,
  discountPercentage: number,
  taxConfig: TaxConfig = DEFAULT_TAX_CONFIG
): { discountAmount: number; taxCalculation: TaxCalculationResult } => {
  const discountAmount = originalAmount * (discountPercentage / 100);
  const discountedAmount = originalAmount - discountAmount;
  
  const calculator = new TaxCalculator(taxConfig);
  const taxCalculation = calculator.calculateTax(discountedAmount);
  
  return {
    discountAmount: Math.round(discountAmount),
    taxCalculation,
  };
};

// Default calculator instance
export const defaultTaxCalculator = new TaxCalculator();
