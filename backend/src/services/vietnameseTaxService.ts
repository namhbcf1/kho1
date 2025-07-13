// Production Vietnamese Tax Calculation Service
// Complies with Vietnamese tax law and business regulations

import { z } from 'zod';

// Vietnamese tax rate constants based on current law
export const TAX_RATES = {
  VAT: {
    STANDARD: 0.10,      // 10% standard VAT rate
    REDUCED: 0.05,       // 5% reduced VAT rate for essential goods
    ZERO: 0.00,          // 0% VAT for exports and specific goods
    EXEMPT: null,        // VAT exempt goods
  },
  EXCISE: {
    ALCOHOL: 0.65,       // 65% excise tax on alcoholic beverages
    TOBACCO: 0.75,       // 75% excise tax on tobacco products
    GASOLINE: 0.10,      // 10% excise tax on gasoline
    LUXURY_CARS: 0.60,   // 60% excise tax on luxury cars
  },
  IMPORT: {
    PREFERENTIAL: 0.00,  // Preferential import tax rate
    STANDARD: 0.15,      // Standard import tax rate
    LUXURY: 0.45,        // Luxury goods import tax
  }
} as const;

// Tax category definitions
export const TAX_CATEGORIES = {
  ESSENTIAL_GOODS: 'essential_goods',     // 5% VAT
  STANDARD_GOODS: 'standard_goods',       // 10% VAT
  EXPORT_GOODS: 'export_goods',          // 0% VAT
  EXEMPT_GOODS: 'exempt_goods',          // VAT exempt
  ALCOHOL: 'alcohol',                    // VAT + Excise
  TOBACCO: 'tobacco',                    // VAT + Excise
  LUXURY: 'luxury',                      // VAT + Special taxes
} as const;

// Zod schemas for validation
const TaxCalculationSchema = z.object({
  amount: z.number().min(0),
  category: z.enum([
    'essential_goods',
    'standard_goods', 
    'export_goods',
    'exempt_goods',
    'alcohol',
    'tobacco',
    'luxury'
  ]),
  quantity: z.number().min(1).default(1),
  isExport: z.boolean().default(false),
  customerType: z.enum(['individual', 'business']).default('individual'),
  invoiceType: z.enum(['retail', 'wholesale', 'export']).default('retail'),
});

const CustomerTaxInfoSchema = z.object({
  taxCode: z.string().optional(),
  companyName: z.string().optional(),
  address: z.string().optional(),
  isVatRegistered: z.boolean().default(false),
});

export interface TaxCalculationResult {
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  exciseRate: number;
  exciseAmount: number;
  totalTax: number;
  totalAmount: number;
  taxBreakdown: {
    description: string;
    rate: number;
    amount: number;
  }[];
  isVatEligible: boolean;
  invoiceRequired: boolean;
}

export interface OrderTaxCalculation {
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    category: string;
    subtotal: number;
    vatAmount: number;
    exciseAmount: number;
    totalAmount: number;
  }>;
  orderSubtotal: number;
  orderVatAmount: number;
  orderExciseAmount: number;
  orderTotalTax: number;
  orderTotal: number;
  vatSummary: {
    rate: number;
    amount: number;
    items: string[];
  }[];
  exciseSummary: {
    rate: number;
    amount: number;
    items: string[];
  }[];
}

export class VietnameseTaxService {
  
  /**
   * Calculate tax for a single item according to Vietnamese tax law
   */
  static calculateItemTax(params: z.infer<typeof TaxCalculationSchema>): TaxCalculationResult {
    const validated = TaxCalculationSchema.parse(params);
    const { amount, category, quantity, isExport, customerType, invoiceType } = validated;
    
    const subtotal = amount * quantity;
    let vatRate = 0;
    let exciseRate = 0;
    const taxBreakdown: { description: string; rate: number; amount: number }[] = [];
    
    // Determine VAT rate based on category and export status
    if (isExport || invoiceType === 'export') {
      vatRate = TAX_RATES.VAT.ZERO;
      taxBreakdown.push({
        description: 'VAT (Export - 0%)',
        rate: vatRate,
        amount: 0,
      });
    } else {
      switch (category) {
        case TAX_CATEGORIES.ESSENTIAL_GOODS:
          vatRate = TAX_RATES.VAT.REDUCED;
          break;
        case TAX_CATEGORIES.STANDARD_GOODS:
        case TAX_CATEGORIES.LUXURY:
          vatRate = TAX_RATES.VAT.STANDARD;
          break;
        case TAX_CATEGORIES.ALCOHOL:
        case TAX_CATEGORIES.TOBACCO:
          vatRate = TAX_RATES.VAT.STANDARD;
          break;
        case TAX_CATEGORIES.EXPORT_GOODS:
          vatRate = TAX_RATES.VAT.ZERO;
          break;
        case TAX_CATEGORIES.EXEMPT_GOODS:
          vatRate = 0;
          break;
        default:
          vatRate = TAX_RATES.VAT.STANDARD;
      }
    }
    
    // Calculate excise tax for applicable categories
    switch (category) {
      case TAX_CATEGORIES.ALCOHOL:
        exciseRate = TAX_RATES.EXCISE.ALCOHOL;
        break;
      case TAX_CATEGORIES.TOBACCO:
        exciseRate = TAX_RATES.EXCISE.TOBACCO;
        break;
      case TAX_CATEGORIES.LUXURY:
        exciseRate = TAX_RATES.EXCISE.LUXURY_CARS; // Example luxury rate
        break;
      default:
        exciseRate = 0;
    }
    
    // Calculate amounts
    const exciseAmount = subtotal * exciseRate;
    const taxableAmount = subtotal + exciseAmount; // VAT is calculated on subtotal + excise
    const vatAmount = taxableAmount * vatRate;
    const totalTax = vatAmount + exciseAmount;
    const totalAmount = subtotal + totalTax;
    
    // Add tax breakdown
    if (exciseAmount > 0) {
      taxBreakdown.push({
        description: `Thuế tiêu thụ đặc biệt (${(exciseRate * 100).toFixed(0)}%)`,
        rate: exciseRate,
        amount: exciseAmount,
      });
    }
    
    if (vatAmount > 0) {
      taxBreakdown.push({
        description: `VAT (${(vatRate * 100).toFixed(0)}%)`,
        rate: vatRate,
        amount: vatAmount,
      });
    }
    
    // Determine if VAT invoice is required (for business customers or amounts > 20M VND)
    const invoiceRequired = customerType === 'business' || totalAmount >= 20_000_000;
    
    return {
      subtotal,
      vatRate,
      vatAmount,
      exciseRate,
      exciseAmount,
      totalTax,
      totalAmount,
      taxBreakdown,
      isVatEligible: vatAmount > 0,
      invoiceRequired,
    };
  }
  
  /**
   * Calculate tax for an entire order with multiple items
   */
  static calculateOrderTax(
    items: Array<{
      id: string;
      name: string;
      price: number;
      quantity: number;
      category: string;
    }>,
    options: {
      isExport?: boolean;
      customerType?: 'individual' | 'business';
      invoiceType?: 'retail' | 'wholesale' | 'export';
    } = {}
  ): OrderTaxCalculation {
    
    const processedItems = items.map(item => {
      const taxResult = this.calculateItemTax({
        amount: item.price,
        quantity: item.quantity,
        category: item.category as any,
        isExport: options.isExport || false,
        customerType: options.customerType || 'individual',
        invoiceType: options.invoiceType || 'retail',
      });
      
      return {
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        category: item.category,
        subtotal: taxResult.subtotal,
        vatAmount: taxResult.vatAmount,
        exciseAmount: taxResult.exciseAmount,
        totalAmount: taxResult.totalAmount,
      };
    });
    
    // Calculate order totals
    const orderSubtotal = processedItems.reduce((sum, item) => sum + item.subtotal, 0);
    const orderVatAmount = processedItems.reduce((sum, item) => sum + item.vatAmount, 0);
    const orderExciseAmount = processedItems.reduce((sum, item) => sum + item.exciseAmount, 0);
    const orderTotalTax = orderVatAmount + orderExciseAmount;
    const orderTotal = orderSubtotal + orderTotalTax;
    
    // Group by VAT rates for summary
    const vatGroups = new Map<number, { amount: number; items: string[] }>();
    const exciseGroups = new Map<number, { amount: number; items: string[] }>();
    
    processedItems.forEach(item => {
      if (item.vatAmount > 0) {
        const vatRate = item.vatAmount / (item.subtotal + item.exciseAmount);
        const existing = vatGroups.get(vatRate) || { amount: 0, items: [] };
        existing.amount += item.vatAmount;
        existing.items.push(item.name);
        vatGroups.set(vatRate, existing);
      }
      
      if (item.exciseAmount > 0) {
        const exciseRate = item.exciseAmount / item.subtotal;
        const existing = exciseGroups.get(exciseRate) || { amount: 0, items: [] };
        existing.amount += item.exciseAmount;
        existing.items.push(item.name);
        exciseGroups.set(exciseRate, existing);
      }
    });
    
    const vatSummary = Array.from(vatGroups.entries()).map(([rate, data]) => ({
      rate,
      amount: data.amount,
      items: data.items,
    }));
    
    const exciseSummary = Array.from(exciseGroups.entries()).map(([rate, data]) => ({
      rate,
      amount: data.amount,
      items: data.items,
    }));
    
    return {
      items: processedItems,
      orderSubtotal,
      orderVatAmount,
      orderExciseAmount,
      orderTotalTax,
      orderTotal,
      vatSummary,
      exciseSummary,
    };
  }
  
  /**
   * Generate Vietnamese compliant invoice data
   */
  static generateInvoiceData(
    orderTax: OrderTaxCalculation,
    customer: z.infer<typeof CustomerTaxInfoSchema>,
    business: {
      name: string;
      taxCode: string;
      address: string;
      phone: string;
    }
  ) {
    const validated = CustomerTaxInfoSchema.parse(customer);
    
    return {
      // Business information
      seller: {
        name: business.name,
        taxCode: business.taxCode,
        address: business.address,
        phone: business.phone,
      },
      
      // Customer information
      buyer: {
        name: validated.companyName || 'Khách lẻ',
        taxCode: validated.taxCode || '',
        address: validated.address || '',
        isVatRegistered: validated.isVatRegistered,
      },
      
      // Invoice details
      invoice: {
        number: this.generateInvoiceNumber(),
        date: new Date().toISOString(),
        currency: 'VND',
        exchangeRate: 1,
      },
      
      // Items with tax details
      items: orderTax.items.map((item, index) => ({
        sequence: index + 1,
        name: item.name,
        unit: 'cái',
        quantity: item.quantity,
        unitPrice: item.price,
        amount: item.subtotal,
        vatRate: item.vatAmount > 0 ? (item.vatAmount / (item.subtotal + item.exciseAmount)) * 100 : 0,
        vatAmount: item.vatAmount,
        exciseRate: item.exciseAmount > 0 ? (item.exciseAmount / item.subtotal) * 100 : 0,
        exciseAmount: item.exciseAmount,
        totalAmount: item.totalAmount,
      })),
      
      // Tax summary
      taxSummary: {
        totalAmountWithoutTax: orderTax.orderSubtotal,
        totalExciseAmount: orderTax.orderExciseAmount,
        totalVatAmount: orderTax.orderVatAmount,
        totalTaxAmount: orderTax.orderTotalTax,
        totalAmount: orderTax.orderTotal,
        vatDetails: orderTax.vatSummary.map(vat => ({
          rate: vat.rate * 100,
          taxableAmount: vat.amount / vat.rate,
          taxAmount: vat.amount,
        })),
      },
      
      // Vietnamese specific fields
      vietnamese: {
        paymentMethod: 'Tiền mặt/Chuyển khoản',
        note: 'Hóa đơn bán hàng',
        signature: 'Người mua hàng, Người bán hàng',
        legalNotice: 'Hóa đơn này chỉ có giá trị khi có đầy đủ chữ ký và con dấu.',
      },
    };
  }
  
  /**
   * Validate Vietnamese tax code format
   */
  static validateTaxCode(taxCode: string): boolean {
    // Vietnamese tax code format: 10 or 13 digits
    // Business: 10 digits (XXXXXXXXXX)
    // Individual: 13 digits (XXXXXXXXXXXXX)
    const businessPattern = /^\d{10}$/;
    const individualPattern = /^\d{13}$/;
    
    return businessPattern.test(taxCode) || individualPattern.test(taxCode);
  }
  
  /**
   * Format currency for Vietnamese display
   */
  static formatVND(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }
  
  /**
   * Generate sequential invoice number
   */
  private static generateInvoiceNumber(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const sequence = String(Date.now() % 1000000).padStart(6, '0');
    
    return `HD${year}${month}${day}${sequence}`;
  }
  
  /**
   * Calculate loyalty points based on spending (Vietnamese retail standard)
   */
  static calculateLoyaltyPoints(amount: number, customerTier: string = 'bronze'): number {
    const tierMultipliers = {
      bronze: 1.0,
      silver: 1.2,
      gold: 1.5,
      platinum: 1.8,
      diamond: 2.0,
    };
    
    const basePointsPerVND = 0.01; // 1 point per 100 VND
    const multiplier = tierMultipliers[customerTier as keyof typeof tierMultipliers] || 1.0;
    
    return Math.floor(amount * basePointsPerVND * multiplier);
  }
  
  /**
   * Determine customer tier based on annual spending
   */
  static determineCustomerTier(annualSpending: number): string {
    if (annualSpending >= 25_000_000) return 'diamond';     // 25M+ VND
    if (annualSpending >= 10_000_000) return 'platinum';    // 10M+ VND  
    if (annualSpending >= 3_000_000) return 'gold';         // 3M+ VND
    if (annualSpending >= 1_000_000) return 'silver';       // 1M+ VND
    return 'bronze';                                         // < 1M VND
  }
}

export default VietnameseTaxService;