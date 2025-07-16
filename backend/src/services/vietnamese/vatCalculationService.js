/**
 * Vietnamese VAT Calculation Service
 * Fixes: Vietnamese Financial Regulations Violations
 * Implements: Circular 219/2013/TT-BTC compliance, proper VAT handling
 */
import { z } from 'zod';
/**
 * Vietnamese VAT Calculation Engine
 * Compliant with Circular 219/2013/TT-BTC
 */
export class VietnameseVATService {
    vatRates = new Map();
    productCategories = new Map();
    constructor() {
        this.initializeVATRates();
        this.initializeProductCategories();
    }
    /**
     * Calculate VAT for a single item
     */
    calculateItemVAT(productId, preTaxPrice, quantity = 1, customerType = 'individual') {
        const category = this.productCategories.get(productId);
        if (!category) {
            throw new Error(`Product category not found for product: ${productId}`);
        }
        const vatRate = this.getVATRate(category.vatType);
        const preTaxAmount = preTaxPrice * quantity;
        let vatAmount = 0;
        let vatPercentage = 0;
        if (category.vatType !== 'exempt') {
            vatPercentage = vatRate.rate;
            vatAmount = (preTaxAmount * vatRate.rate) / 100;
        }
        const postTaxAmount = preTaxAmount + vatAmount;
        const breakdown = {
            standardVAT: category.vatType === 'standard' ? vatAmount : 0,
            reducedVAT: category.vatType === 'reduced' ? vatAmount : 0,
            exemptAmount: category.vatType === 'exempt' ? preTaxAmount : 0,
            zeroRatedAmount: category.vatType === 'zero' ? preTaxAmount : 0
        };
        const compliance = this.getComplianceRequirements(category, preTaxAmount, customerType);
        return {
            preTaxAmount,
            vatAmount,
            postTaxAmount,
            vatRate: vatPercentage,
            vatType: category.vatType,
            breakdown,
            compliance
        };
    }
    /**
     * Calculate VAT for an entire order
     */
    calculateOrderVAT(items, customerType = 'individual', customerTaxId) {
        let totalPreTax = 0;
        let totalVAT = 0;
        let totalPostTax = 0;
        const breakdown = {
            standardVAT: 0,
            reducedVAT: 0,
            exemptAmount: 0,
            zeroRatedAmount: 0
        };
        const complianceNotes = [];
        let requiresDeclaration = false;
        for (const item of items) {
            const itemResult = this.calculateItemVAT(item.productId, item.preTaxPrice, item.quantity, customerType);
            totalPreTax += itemResult.preTaxAmount;
            totalVAT += itemResult.vatAmount;
            totalPostTax += itemResult.postTaxAmount;
            breakdown.standardVAT += itemResult.breakdown.standardVAT;
            breakdown.reducedVAT += itemResult.breakdown.reducedVAT;
            breakdown.exemptAmount += itemResult.breakdown.exemptAmount;
            breakdown.zeroRatedAmount += itemResult.breakdown.zeroRatedAmount;
            if (itemResult.compliance.requiresDeclaration) {
                requiresDeclaration = true;
            }
            complianceNotes.push(...itemResult.compliance.regulatoryNotes);
        }
        // Additional compliance checks for large orders
        if (totalPostTax > 20000000) { // 20 million VND threshold
            requiresDeclaration = true;
            complianceNotes.push('High-value transaction requires additional VAT documentation');
        }
        if (customerType === 'business' && !customerTaxId) {
            complianceNotes.push('Business customer requires valid tax ID for VAT compliance');
        }
        // Determine overall VAT type based on breakdown
        let dominantVATType = 'standard';
        if (breakdown.exemptAmount > totalPreTax * 0.5) {
            dominantVATType = 'exempt';
        }
        else if (breakdown.reducedVAT > breakdown.standardVAT) {
            dominantVATType = 'reduced';
        }
        const overallVATRate = totalVAT > 0 ? (totalVAT / totalPreTax) * 100 : 0;
        return {
            preTaxAmount: totalPreTax,
            vatAmount: totalVAT,
            postTaxAmount: totalPostTax,
            vatRate: overallVATRate,
            vatType: dominantVATType,
            breakdown,
            compliance: {
                requiresDeclaration,
                declarationType: requiresDeclaration ? 'monthly' : undefined,
                regulatoryNotes: Array.from(new Set(complianceNotes)) // Remove duplicates
            }
        };
    }
    /**
     * Generate VAT declaration for tax authorities
     */
    generateVATDeclaration(period, businessTaxId, transactions) {
        const declarations = [];
        let totalRevenue = 0;
        let totalVATCollected = 0;
        for (const transaction of transactions) {
            for (const item of transaction.items) {
                const vatResult = this.calculateItemVAT(item.productId, item.preTaxPrice, item.quantity, transaction.customerType);
                const category = this.productCategories.get(item.productId);
                declarations.push({
                    itemCode: item.productId,
                    itemName: item.productName,
                    quantity: item.quantity,
                    unitPrice: item.preTaxPrice,
                    totalValue: vatResult.preTaxAmount,
                    vatRate: vatResult.vatRate,
                    vatAmount: vatResult.vatAmount,
                    category: category?.categoryName || 'Unknown'
                });
                totalRevenue += vatResult.preTaxAmount;
                totalVATCollected += vatResult.vatAmount;
            }
        }
        // Calculate VAT payable (collected VAT minus input VAT - simplified)
        const totalVATPayable = totalVATCollected; // In practice, would subtract input VAT
        return {
            period,
            businessTaxId,
            declarations,
            totals: {
                totalRevenue,
                totalVATCollected,
                totalVATPayable
            },
            submissionDate: new Date(),
            status: 'draft'
        };
    }
    /**
     * Validate VAT calculation compliance
     */
    validateCompliance(vatResult) {
        const violations = [];
        const recommendations = [];
        // Check VAT rate validity
        if (vatResult.vatRate < 0 || vatResult.vatRate > 15) {
            violations.push(`Invalid VAT rate: ${vatResult.vatRate}%. Must be between 0% and 15%`);
        }
        // Check calculation accuracy
        const expectedVAT = (vatResult.preTaxAmount * vatResult.vatRate) / 100;
        const tolerance = 0.01; // 1 cent tolerance
        if (Math.abs(vatResult.vatAmount - expectedVAT) > tolerance) {
            violations.push('VAT calculation accuracy issue detected');
        }
        // Check breakdown consistency
        const breakdownTotal = vatResult.breakdown.standardVAT +
            vatResult.breakdown.reducedVAT +
            vatResult.breakdown.exemptAmount +
            vatResult.breakdown.zeroRatedAmount;
        if (Math.abs(breakdownTotal - vatResult.preTaxAmount) > tolerance) {
            violations.push('VAT breakdown does not match total amount');
        }
        // Recommendations
        if (vatResult.compliance.requiresDeclaration) {
            recommendations.push('Prepare monthly VAT declaration for tax authorities');
        }
        if (vatResult.breakdown.exemptAmount > 0) {
            recommendations.push('Ensure exempt items are properly documented');
        }
        return {
            isCompliant: violations.length === 0,
            violations,
            recommendations
        };
    }
    /**
     * Get current VAT rates for display
     */
    getCurrentVATRates() {
        const rates = [];
        for (const [type, rate] of this.vatRates) {
            const categoryCount = Array.from(this.productCategories.values())
                .filter(cat => cat.vatType === type).length;
            rates.push({
                ...rate,
                categoryCount
            });
        }
        return rates;
    }
    /**
     * Update product VAT category
     */
    updateProductVATCategory(productId, category) {
        this.productCategories.set(productId, {
            categoryId: productId,
            ...category
        });
    }
    initializeVATRates() {
        // Current Vietnamese VAT rates as of 2024
        this.vatRates.set('standard', {
            type: 'standard',
            rate: 10,
            description: 'Standard VAT rate for most goods and services',
            effectiveFrom: new Date('2009-01-01')
        });
        this.vatRates.set('reduced', {
            type: 'reduced',
            rate: 5,
            description: 'Reduced VAT rate for essential goods, education, healthcare',
            effectiveFrom: new Date('2009-01-01')
        });
        this.vatRates.set('exempt', {
            type: 'exempt',
            rate: 0,
            description: 'VAT exempt goods and services',
            effectiveFrom: new Date('2009-01-01')
        });
        this.vatRates.set('zero', {
            type: 'zero',
            rate: 0,
            description: 'Zero-rated exports and specific transactions',
            effectiveFrom: new Date('2009-01-01')
        });
    }
    initializeProductCategories() {
        // Essential food items - Reduced VAT
        this.productCategories.set('food-essential', {
            categoryId: 'food-essential',
            categoryName: 'Essential Food Items',
            vatType: 'reduced',
            isEssential: true,
            requiresDeclaration: false
        });
        // Medical supplies - Exempt
        this.productCategories.set('medical', {
            categoryId: 'medical',
            categoryName: 'Medical Supplies and Pharmaceuticals',
            vatType: 'exempt',
            isEssential: true,
            requiresDeclaration: true
        });
        // Educational materials - Reduced VAT
        this.productCategories.set('education', {
            categoryId: 'education',
            categoryName: 'Educational Materials',
            vatType: 'reduced',
            isEssential: true,
            requiresDeclaration: false
        });
        // General merchandise - Standard VAT
        this.productCategories.set('general', {
            categoryId: 'general',
            categoryName: 'General Merchandise',
            vatType: 'standard',
            isEssential: false,
            requiresDeclaration: false
        });
        // Luxury goods - Standard VAT
        this.productCategories.set('luxury', {
            categoryId: 'luxury',
            categoryName: 'Luxury Goods',
            vatType: 'standard',
            isEssential: false,
            requiresDeclaration: true
        });
    }
    getVATRate(type) {
        const rate = this.vatRates.get(type);
        if (!rate) {
            throw new Error(`VAT rate not found for type: ${type}`);
        }
        return rate;
    }
    getComplianceRequirements(category, amount, customerType) {
        const notes = [];
        let requiresDeclaration = category.requiresDeclaration;
        // High-value transaction thresholds
        if (amount > 20000000) { // 20 million VND
            requiresDeclaration = true;
            notes.push('High-value transaction - additional documentation required');
        }
        // Business customer requirements
        if (customerType === 'business') {
            notes.push('Business transaction - ensure valid tax ID is provided');
            if (amount > 1000000) { // 1 million VND
                requiresDeclaration = true;
            }
        }
        // Category-specific requirements
        if (category.vatType === 'exempt') {
            notes.push('VAT exempt item - ensure proper exemption documentation');
        }
        if (category.isEssential && category.vatType === 'reduced') {
            notes.push('Essential goods with reduced VAT - verify eligibility');
        }
        return {
            requiresDeclaration,
            declarationType: requiresDeclaration ? 'monthly' : undefined,
            regulatoryNotes: notes
        };
    }
}
/**
 * VAT Rate Schema for validation
 */
export const VATRateSchema = z.object({
    type: z.enum(['standard', 'reduced', 'exempt', 'zero']),
    rate: z.number().min(0).max(100),
    description: z.string(),
    effectiveFrom: z.date(),
    effectiveTo: z.date().optional()
});
/**
 * Product VAT Category Schema
 */
export const ProductVATCategorySchema = z.object({
    categoryId: z.string(),
    categoryName: z.string(),
    vatType: z.enum(['standard', 'reduced', 'exempt', 'zero']),
    isEssential: z.boolean(),
    requiresDeclaration: z.boolean()
});
/**
 * VAT Declaration Schema
 */
export const VATDeclarationSchema = z.object({
    period: z.string().regex(/^\d{4}-\d{2}$/),
    businessTaxId: z.string().min(10),
    declarations: z.array(z.object({
        itemCode: z.string(),
        itemName: z.string(),
        quantity: z.number().positive(),
        unitPrice: z.number().positive(),
        totalValue: z.number().positive(),
        vatRate: z.number().min(0).max(100),
        vatAmount: z.number().min(0),
        category: z.string()
    })),
    totals: z.object({
        totalRevenue: z.number().min(0),
        totalVATCollected: z.number().min(0),
        totalVATPayable: z.number().min(0)
    }),
    submissionDate: z.date(),
    status: z.enum(['draft', 'submitted', 'approved', 'rejected'])
});
