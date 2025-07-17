/**
 * Vietnamese Invoice Service
 * Handles Vietnamese-compliant invoice generation with proper tax calculations
 * and business registration information
 */
import { z } from 'zod';
import VietnameseTaxService from '../vietnameseTaxService';
import QRCode from 'qrcode';
// Invoice schemas
const BusinessInfoSchema = z.object({
    name: z.string().min(1, 'Business name is required'),
    taxCode: z.string().min(10, 'Tax code must be at least 10 digits'),
    address: z.string().min(1, 'Business address is required'),
    phone: z.string().min(10, 'Phone number is required'),
    email: z.string().email().optional(),
    website: z.string().url().optional(),
    bankAccount: z.string().optional(),
    bankName: z.string().optional(),
    licenseNumber: z.string().optional(),
    representative: z.string().optional(),
});
const CustomerInfoSchema = z.object({
    name: z.string().min(1, 'Customer name is required'),
    taxCode: z.string().optional(),
    address: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email().optional(),
    isVatRegistered: z.boolean().default(false),
    customerType: z.enum(['individual', 'business']).default('individual'),
});
const InvoiceItemSchema = z.object({
    id: z.string(),
    name: z.string().min(1, 'Item name is required'),
    unit: z.string().default('cái'),
    quantity: z.number().min(1, 'Quantity must be at least 1'),
    unitPrice: z.number().min(0, 'Unit price cannot be negative'),
    category: z.string(),
    isExport: z.boolean().default(false),
    isTaxInclusive: z.boolean().default(false),
    description: z.string().optional(),
    productCode: z.string().optional(),
});
const InvoiceCreateSchema = z.object({
    business: BusinessInfoSchema,
    customer: CustomerInfoSchema,
    items: z.array(InvoiceItemSchema).min(1, 'At least one item is required'),
    invoiceType: z.enum(['retail', 'wholesale', 'export', 'vat']).default('retail'),
    paymentMethod: z.enum(['cash', 'card', 'transfer', 'vnpay', 'momo', 'zalopay']).default('cash'),
    currency: z.string().default('VND'),
    exchangeRate: z.number().default(1),
    discountAmount: z.number().default(0),
    discountType: z.enum(['percentage', 'fixed']).default('fixed'),
    discountDescription: z.string().optional(),
    notes: z.string().optional(),
    dueDate: z.string().optional(),
    issuedDate: z.string().optional(),
});
export class VietnameseInvoiceService {
    static invoiceCounter = 1;
    /**
     * Generate a new Vietnamese-compliant invoice
     */
    static async generateInvoice(params) {
        const validated = InvoiceCreateSchema.parse(params);
        // Generate invoice number
        const invoiceNumber = this.generateInvoiceNumber(validated.invoiceType);
        const invoiceDate = validated.issuedDate || new Date().toISOString();
        // Process items with tax calculations
        const processedItems = validated.items.map((item, index) => {
            const taxResult = VietnameseTaxService.calculateItemTax({
                amount: item.unitPrice,
                quantity: item.quantity,
                category: item.category,
                isExport: item.isExport,
                customerType: validated.customer.customerType,
                invoiceType: validated.invoiceType,
                isTaxInclusive: item.isTaxInclusive,
            });
            return {
                sequence: index + 1,
                name: item.name,
                unit: item.unit,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                amount: taxResult.subtotal,
                vatRate: taxResult.vatRate * 100,
                vatAmount: taxResult.vatAmount,
                exciseAmount: taxResult.exciseAmount,
                totalAmount: taxResult.totalAmount,
                description: item.description,
                productCode: item.productCode,
            };
        });
        // Calculate totals
        const subtotal = processedItems.reduce((sum, item) => sum + item.amount, 0);
        const totalVatAmount = processedItems.reduce((sum, item) => sum + item.vatAmount, 0);
        const totalExciseAmount = processedItems.reduce((sum, item) => sum + item.exciseAmount, 0);
        const totalTaxAmount = totalVatAmount + totalExciseAmount;
        const totalAmount = subtotal + totalTaxAmount;
        // Apply discount
        let discountAmount = 0;
        let discountDescription = '';
        if (validated.discountAmount > 0) {
            if (validated.discountType === 'percentage') {
                discountAmount = subtotal * (validated.discountAmount / 100);
                discountDescription = `Giảm giá ${validated.discountAmount}%`;
            }
            else {
                discountAmount = Math.min(validated.discountAmount, subtotal);
                discountDescription = validated.discountDescription ||
                    `Giảm giá ${VietnameseTaxService.formatVND(discountAmount)}`;
            }
        }
        const finalAmount = totalAmount - discountAmount;
        // Generate VAT details summary
        const vatGroups = new Map();
        processedItems.forEach(item => {
            if (item.vatAmount > 0) {
                const rate = item.vatRate;
                const existing = vatGroups.get(rate) || { taxableAmount: 0, taxAmount: 0 };
                existing.taxableAmount += item.amount;
                existing.taxAmount += item.vatAmount;
                vatGroups.set(rate, existing);
            }
        });
        const vatDetails = Array.from(vatGroups.entries()).map(([rate, data]) => ({
            rate,
            taxableAmount: data.taxableAmount,
            taxAmount: data.taxAmount,
        }));
        // Generate QR code for digital invoice
        const qrData = {
            invoiceNumber,
            businessTaxCode: validated.business.taxCode,
            totalAmount: finalAmount,
            invoiceDate,
            qrVersion: '1.0',
        };
        const qrCode = await QRCode.toDataURL(JSON.stringify(qrData));
        // Payment information
        const paymentMethods = {
            cash: 'Tiền mặt',
            card: 'Thẻ ngân hàng',
            transfer: 'Chuyển khoản',
            vnpay: 'VNPay',
            momo: 'MoMo',
            zalopay: 'ZaloPay',
        };
        let cashRoundingAmount = 0;
        let finalPaymentAmount = finalAmount;
        if (validated.paymentMethod === 'cash') {
            finalPaymentAmount = VietnameseTaxService.applyVietnamCashRounding(finalAmount);
            cashRoundingAmount = finalPaymentAmount - finalAmount;
        }
        // Create invoice data
        const invoiceData = {
            invoiceNumber,
            invoiceDate,
            dueDate: validated.dueDate,
            currency: validated.currency,
            exchangeRate: validated.exchangeRate,
            seller: {
                name: validated.business.name,
                taxCode: validated.business.taxCode,
                address: validated.business.address,
                phone: validated.business.phone,
                email: validated.business.email,
                website: validated.business.website,
                bankAccount: validated.business.bankAccount,
                bankName: validated.business.bankName,
                licenseNumber: validated.business.licenseNumber,
                representative: validated.business.representative,
            },
            buyer: {
                name: validated.customer.name,
                taxCode: validated.customer.taxCode,
                address: validated.customer.address,
                phone: validated.customer.phone,
                email: validated.customer.email,
                isVatRegistered: validated.customer.isVatRegistered,
                customerType: validated.customer.customerType,
            },
            items: processedItems,
            taxSummary: {
                totalAmountWithoutTax: subtotal,
                totalExciseAmount,
                totalVatAmount,
                totalTaxAmount,
                totalAmount,
                discountAmount,
                discountDescription,
                finalAmount: finalPaymentAmount,
                vatDetails,
            },
            payment: {
                method: validated.paymentMethod,
                methodDescription: paymentMethods[validated.paymentMethod],
                status: 'pending',
                cashRoundingAmount,
            },
            vietnamese: {
                invoiceTemplate: this.getInvoiceTemplate(validated.invoiceType),
                invoiceForm: this.getInvoiceForm(validated.invoiceType),
                invoiceSymbol: this.getInvoiceSymbol(validated.invoiceType),
                paymentMethod: paymentMethods[validated.paymentMethod],
                note: validated.notes || 'Cảm ơn quý khách hàng đã sử dụng dịch vụ',
                signature: 'Người mua hàng, Người bán hàng',
                legalNotice: 'Hóa đơn này chỉ có giá trị khi có đầy đủ chữ ký và con dấu của đơn vị bán hàng.',
                qrCode,
            },
            compliance: {
                retentionPeriod: 5, // 5 years as per Vietnamese law
                storageLocation: 'system',
                archiveDate: new Date(new Date().setFullYear(new Date().getFullYear() + 5)).toISOString(),
                complianceVersion: '2024.1',
            },
        };
        return invoiceData;
    }
    /**
     * Generate Vietnamese receipt (different from invoice)
     */
    static async generateReceipt(invoiceData) {
        const receiptNumber = this.generateReceiptNumber();
        const receiptData = {
            receiptNumber,
            receiptDate: new Date().toISOString(),
            invoiceReference: invoiceData.invoiceNumber,
            business: invoiceData.seller,
            customer: invoiceData.buyer,
            items: invoiceData.items,
            totals: invoiceData.taxSummary,
            payment: invoiceData.payment,
            qrCode: invoiceData.vietnamese.qrCode,
        };
        // Generate thermal printer data (80mm paper)
        const thermalPrintData = this.generateThermalPrintData(receiptData);
        return {
            receiptNumber,
            receiptData,
            thermalPrintData,
        };
    }
    /**
     * Generate tax reporting data by category
     */
    static generateTaxReportByCategory(invoices, period) {
        const filteredInvoices = invoices.filter(invoice => {
            const invoiceDate = new Date(invoice.invoiceDate);
            return invoiceDate >= new Date(period.startDate) &&
                invoiceDate <= new Date(period.endDate);
        });
        const summary = {
            totalInvoices: filteredInvoices.length,
            totalRevenue: filteredInvoices.reduce((sum, inv) => sum + inv.taxSummary.totalAmount, 0),
            totalVAT: filteredInvoices.reduce((sum, inv) => sum + inv.taxSummary.totalVatAmount, 0),
            totalExcise: filteredInvoices.reduce((sum, inv) => sum + inv.taxSummary.totalExciseAmount, 0),
        };
        // Group by category (would need category mapping)
        const categoryGroups = new Map();
        // Group by VAT rate
        const vatRateGroups = new Map();
        filteredInvoices.forEach(invoice => {
            invoice.items.forEach(item => {
                // Category grouping (simplified)
                const category = 'standard'; // Would map from item data
                const categoryData = categoryGroups.get(category) || {
                    count: 0, revenue: 0, vatAmount: 0, exciseAmount: 0
                };
                categoryData.count++;
                categoryData.revenue += item.totalAmount;
                categoryData.vatAmount += item.vatAmount;
                categoryData.exciseAmount += item.exciseAmount;
                categoryGroups.set(category, categoryData);
                // VAT rate grouping
                const vatRate = item.vatRate;
                const vatData = vatRateGroups.get(vatRate) || {
                    count: 0, taxableAmount: 0, vatAmount: 0
                };
                vatData.count++;
                vatData.taxableAmount += item.amount;
                vatData.vatAmount += item.vatAmount;
                vatRateGroups.set(vatRate, vatData);
            });
        });
        const byCategory = Array.from(categoryGroups.entries()).map(([category, data]) => ({
            category,
            count: data.count,
            revenue: data.revenue,
            vatAmount: data.vatAmount,
            exciseAmount: data.exciseAmount,
            averageOrderValue: data.count > 0 ? data.revenue / data.count : 0,
        }));
        const byVATRate = Array.from(vatRateGroups.entries()).map(([rate, data]) => ({
            rate,
            count: data.count,
            taxableAmount: data.taxableAmount,
            vatAmount: data.vatAmount,
        }));
        return {
            period,
            summary,
            byCategory,
            byVATRate,
        };
    }
    /**
     * Validate Vietnamese invoice compliance
     */
    static validateInvoiceCompliance(invoiceData) {
        const errors = [];
        const warnings = [];
        // Check required fields
        if (!invoiceData.seller.taxCode || !VietnameseTaxService.validateTaxCode(invoiceData.seller.taxCode)) {
            errors.push('Invalid or missing seller tax code');
        }
        if (!invoiceData.invoiceNumber || invoiceData.invoiceNumber.length < 8) {
            errors.push('Invalid invoice number format');
        }
        if (invoiceData.items.length === 0) {
            errors.push('Invoice must contain at least one item');
        }
        // Check VAT calculations
        invoiceData.items.forEach((item, index) => {
            if (item.vatAmount < 0) {
                errors.push(`Item ${index + 1}: VAT amount cannot be negative`);
            }
            if (item.quantity <= 0) {
                errors.push(`Item ${index + 1}: Quantity must be positive`);
            }
            if (item.unitPrice < 0) {
                errors.push(`Item ${index + 1}: Unit price cannot be negative`);
            }
        });
        // Check totals consistency
        const calculatedSubtotal = invoiceData.items.reduce((sum, item) => sum + item.amount, 0);
        const calculatedVAT = invoiceData.items.reduce((sum, item) => sum + item.vatAmount, 0);
        if (Math.abs(calculatedSubtotal - invoiceData.taxSummary.totalAmountWithoutTax) > 0.01) {
            errors.push('Subtotal calculation mismatch');
        }
        if (Math.abs(calculatedVAT - invoiceData.taxSummary.totalVatAmount) > 0.01) {
            errors.push('VAT calculation mismatch');
        }
        // Warnings for best practices
        if (invoiceData.buyer.customerType === 'business' && !invoiceData.buyer.taxCode) {
            warnings.push('Business customer should have tax code');
        }
        if (invoiceData.taxSummary.finalAmount > 20_000_000 && !invoiceData.buyer.taxCode) {
            warnings.push('High-value transaction should have customer tax information');
        }
        return {
            isValid: errors.length === 0,
            errors,
            warnings,
        };
    }
    // Private helper methods
    static generateInvoiceNumber(type) {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const typePrefix = {
            retail: 'HD',
            wholesale: 'HB',
            export: 'HX',
            vat: 'HV',
        }[type] || 'HD';
        const sequence = String(this.invoiceCounter++).padStart(6, '0');
        return `${typePrefix}${year}${month}${day}${sequence}`;
    }
    static generateReceiptNumber() {
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const timestamp = Date.now().toString().slice(-6);
        return `BH${year}${month}${day}${timestamp}`;
    }
    static getInvoiceTemplate(type) {
        return {
            retail: 'Hóa đơn bán lẻ',
            wholesale: 'Hóa đơn bán buôn',
            export: 'Hóa đơn xuất khẩu',
            vat: 'Hóa đơn VAT',
        }[type] || 'Hóa đơn bán hàng';
    }
    static getInvoiceForm() {
        return 'Mẫu số: 01-HĐ/2024';
    }
    static getInvoiceSymbol(type) {
        return {
            retail: 'AA/24E',
            wholesale: 'BB/24E',
            export: 'CC/24E',
            vat: 'VV/24E',
        }[type] || 'AA/24E';
    }
    static generateThermalPrintData(receiptData) {
        // Generate thermal printer commands for 80mm paper
        const ESC = '\x1B';
        const GS = '\x1D';
        let printData = '';
        // Initialize printer
        printData += ESC + '@'; // Initialize
        printData += ESC + 'a' + '\x01'; // Center align
        // Header
        printData += ESC + '!' + '\x30'; // Double height and width
        printData += receiptData.business.name + '\n';
        printData += ESC + '!' + '\x00'; // Normal size
        // Business info
        printData += receiptData.business.address + '\n';
        printData += 'Tel: ' + receiptData.business.phone + '\n';
        printData += 'MST: ' + receiptData.business.taxCode + '\n';
        printData += '--------------------------------\n';
        // Receipt info
        printData += ESC + 'a' + '\x00'; // Left align
        printData += 'Phieu: ' + receiptData.receiptNumber + '\n';
        printData += 'Ngay: ' + new Date(receiptData.receiptDate).toLocaleString('vi-VN') + '\n';
        printData += '--------------------------------\n';
        // Items
        receiptData.items.forEach((item) => {
            printData += item.name + '\n';
            printData += `${item.quantity} x ${VietnameseTaxService.formatVND(item.unitPrice)} = ${VietnameseTaxService.formatVND(item.totalAmount)}\n`;
        });
        printData += '--------------------------------\n';
        // Totals
        printData += `Tong tien: ${VietnameseTaxService.formatVND(receiptData.totals.totalAmount)}\n`;
        if (receiptData.totals.discountAmount > 0) {
            printData += `Giam gia: ${VietnameseTaxService.formatVND(receiptData.totals.discountAmount)}\n`;
        }
        printData += `Thanh toan: ${VietnameseTaxService.formatVND(receiptData.totals.finalAmount)}\n`;
        printData += '--------------------------------\n';
        printData += ESC + 'a' + '\x01'; // Center align
        printData += 'Cam on quy khach!\n';
        printData += 'Hen gap lai!\n';
        // QR Code (if supported)
        if (receiptData.qrCode) {
            printData += GS + 'k' + '\x51'; // QR code command
            // QR code data would be added here
        }
        // Cut paper
        printData += GS + 'V' + '\x41' + '\x03'; // Partial cut
        return printData;
    }
}
export default VietnameseInvoiceService;
