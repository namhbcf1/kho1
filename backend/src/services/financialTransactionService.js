/**
 * Financial Transaction Service with Event Sourcing
 * Fixes: ACID compliance, audit trail, financial reconciliation
 * Implements: Vietnamese financial regulations compliance
 */
import { EventStore, FinancialTransaction, EventSourcedRepository } from './eventSourcing/eventStore';
import { vietnameseTaxService } from './vietnameseTaxService';
import { z } from 'zod';
const TransactionRequestSchema = z.object({
    orderId: z.string(),
    amount: z.number().positive(),
    currency: z.string().default('VND'),
    paymentMethod: z.enum(['vnpay', 'momo', 'zalopay', 'cash', 'card']),
    customerId: z.string(),
    items: z.array(z.object({
        productId: z.number(),
        name: z.string(),
        price: z.number().positive(),
        quantity: z.number().positive(),
        category: z.string()
    })),
    vatBreakdown: z.object({
        subtotal: z.number(),
        vatAmount: z.number(),
        total: z.number(),
        breakdown: z.array(z.object({
            category: z.string(),
            amount: z.number(),
            vatRate: z.number(),
            vatAmount: z.number()
        }))
    }),
    metadata: z.record(z.any()).optional()
});
/**
 * Vietnamese Financial Compliance Service
 */
export class VietnameseFinancialService {
    db;
    constructor(db) {
        this.db = db;
    }
    /**
     * Validate transaction against Vietnamese regulations
     */
    async validateTransaction(request) {
        const errors = [];
        const warnings = [];
        // Validate VAT calculation
        const calculatedTax = vietnameseTaxService.calculateOrderTax(request.items, {
            customerType: 'individual', // TODO: Get from customer data
            invoiceType: 'retail'
        });
        // Check VAT calculation accuracy
        const vatTolerance = 1; // 1 VND tolerance
        if (Math.abs(calculatedTax.orderVatAmount - request.vatBreakdown.vatAmount) > vatTolerance) {
            errors.push(`VAT calculation mismatch. Expected: ${calculatedTax.orderVatAmount}, Provided: ${request.vatBreakdown.vatAmount}`);
        }
        if (Math.abs(calculatedTax.orderTotal - request.vatBreakdown.total) > vatTolerance) {
            errors.push(`Total amount mismatch. Expected: ${calculatedTax.orderTotal}, Provided: ${request.vatBreakdown.total}`);
        }
        // Validate against Vietnamese business limits
        if (request.amount > 500_000_000) { // 500M VND limit for cash transactions
            if (request.paymentMethod === 'cash') {
                errors.push('Cash transactions over 500M VND require special approval');
            }
        }
        // Check for suspicious patterns
        if (request.amount > 100_000_000) { // 100M VND threshold
            warnings.push('Large transaction requires additional verification');
        }
        // Currency validation
        if (request.currency !== 'VND') {
            errors.push('Only VND currency is supported for domestic transactions');
        }
        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }
    /**
     * Generate Vietnamese compliant invoice number
     */
    generateInvoiceNumber() {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const sequence = String(Date.now() % 1000000).padStart(6, '0');
        return `HD${year}${month}${day}${sequence}`;
    }
    /**
     * Generate compliance report for tax authorities
     */
    async generateComplianceReport(startDate, endDate) {
        // Implementation for Vietnamese tax authority reports
        const transactions = await this.db.prepare(`
      SELECT 
        ft.id,
        ft.order_id,
        ft.amount,
        ft.payment_method,
        ft.created_at,
        o.invoice_number,
        o.customer_id,
        o.items,
        o.vat_breakdown
      FROM financial_transactions_projection ft
      JOIN orders o ON ft.order_id = o.id
      WHERE ft.status = 'completed'
      AND DATE(ft.created_at) BETWEEN ? AND ?
      ORDER BY ft.created_at
    `).bind(startDate, endDate).all();
        // Process and format for Vietnamese compliance
        const reportId = `RPT_${Date.now()}`;
        return {
            reportId,
            period: { start: startDate, end: endDate },
            summary: {
                totalTransactions: transactions.results.length,
                totalAmount: transactions.results.reduce((sum, t) => sum + t.amount, 0),
                totalVAT: 0, // Calculate from order data
                vatBreakdown: []
            },
            transactions: transactions.results.map((t) => ({
                invoiceNumber: t.invoice_number,
                date: t.created_at,
                customerInfo: {}, // Get from customer table
                items: JSON.parse(t.items || '[]'),
                vatDetails: JSON.parse(t.vat_breakdown || '{}'),
                paymentMethod: t.payment_method
            }))
        };
    }
}
/**
 * Main Financial Transaction Service
 */
export class FinancialTransactionService {
    eventStore;
    repository;
    complianceService;
    constructor(database) {
        this.eventStore = new EventStore(database);
        this.repository = new EventSourcedRepository(this.eventStore, 'FinancialTransaction', (id) => new FinancialTransaction(id));
        this.complianceService = new VietnameseFinancialService(database);
    }
    /**
     * Create financial transaction with full audit trail
     */
    async createTransaction(request, userId, ipAddress) {
        try {
            // Validate request
            const validated = TransactionRequestSchema.parse(request);
            // Vietnamese compliance validation
            const compliance = await this.complianceService.validateTransaction(validated);
            if (!compliance.valid) {
                return {
                    success: false,
                    error: `Compliance violations: ${compliance.errors.join(', ')}`,
                    status: 'failed',
                    auditTrail: [`Compliance validation failed: ${compliance.errors.join(', ')}`]
                };
            }
            // Generate transaction ID
            const transactionId = this.generateTransactionId(validated.paymentMethod);
            // Create aggregate
            const transaction = FinancialTransaction.createNew(transactionId, validated.orderId, validated.amount, validated.paymentMethod, userId);
            // Save to event store
            const saveResult = await this.repository.save(transaction);
            if (!saveResult.success) {
                return {
                    success: false,
                    error: saveResult.error || 'Failed to save transaction',
                    status: 'failed',
                    auditTrail: ['Transaction creation failed']
                };
            }
            // Log audit trail
            await this.logAuditEvent({
                transactionId,
                userId,
                ipAddress,
                action: 'TRANSACTION_CREATED',
                details: {
                    orderId: validated.orderId,
                    amount: validated.amount,
                    paymentMethod: validated.paymentMethod,
                    complianceWarnings: compliance.warnings
                },
                riskLevel: validated.amount > 100_000_000 ? 'high' : 'medium'
            });
            return {
                success: true,
                transactionId,
                status: 'pending',
                auditTrail: [
                    `Transaction created: ${transactionId}`,
                    `Compliance validated: ${compliance.warnings.length} warnings`,
                    'Audit trail initiated'
                ]
            };
        }
        catch (error) {
            console.error('Transaction creation error:', error);
            return {
                success: false,
                error: 'Transaction creation failed',
                status: 'failed',
                auditTrail: [`Error: ${error.message}`]
            };
        }
    }
    /**
     * Complete payment with audit trail
     */
    async completePayment(transactionId, gatewayTransactionId, userId, ipAddress) {
        try {
            const transaction = await this.repository.getById(transactionId);
            if (!transaction) {
                return { success: false, error: 'Transaction not found' };
            }
            transaction.completePayment(gatewayTransactionId, userId);
            const saveResult = await this.repository.save(transaction);
            if (!saveResult.success) {
                return { success: false, error: saveResult.error };
            }
            // Log completion
            await this.logAuditEvent({
                transactionId,
                userId,
                ipAddress,
                action: 'PAYMENT_COMPLETED',
                details: { gatewayTransactionId },
                riskLevel: 'low'
            });
            return { success: true };
        }
        catch (error) {
            console.error('Payment completion error:', error);
            return { success: false, error: error.message };
        }
    }
    /**
     * Process refund with compliance checks
     */
    async processRefund(transactionId, refundAmount, reason, userId, ipAddress) {
        try {
            const transaction = await this.repository.getById(transactionId);
            if (!transaction) {
                return { success: false, error: 'Transaction not found' };
            }
            // Validate refund amount
            if (refundAmount > transaction.amount) {
                return { success: false, error: 'Refund amount exceeds transaction amount' };
            }
            transaction.refundPayment(refundAmount, reason, userId);
            const saveResult = await this.repository.save(transaction);
            if (!saveResult.success) {
                return { success: false, error: saveResult.error };
            }
            const refundId = `REF_${transactionId}_${Date.now()}`;
            // Log refund
            await this.logAuditEvent({
                transactionId,
                userId,
                ipAddress,
                action: 'PAYMENT_REFUNDED',
                details: { refundAmount, reason, refundId },
                riskLevel: 'high'
            });
            return { success: true, refundId };
        }
        catch (error) {
            console.error('Refund processing error:', error);
            return { success: false, error: error.message };
        }
    }
    /**
     * Generate daily reconciliation report
     */
    async generateDailyReconciliation(date) {
        // Get all transactions for the date
        const transactions = await this.eventStore.db.prepare(`
      SELECT * FROM daily_sales_summary WHERE sale_date = ?
    `).bind(date).first();
        // Get payment method breakdown
        const paymentBreakdown = await this.eventStore.db.prepare(`
      SELECT 
        payment_method,
        COUNT(*) as count,
        SUM(amount) as amount,
        ROUND(100.0 * COUNT(CASE WHEN status = 'completed' THEN 1 END) / COUNT(*), 2) as success_rate
      FROM financial_transactions_projection
      WHERE DATE(created_at) = ?
      GROUP BY payment_method
    `).bind(date).all();
        // Get VAT summary
        const vatSummary = await this.eventStore.db.prepare(`
      SELECT * FROM vat_summary_daily WHERE transaction_date = ?
    `).bind(date).all();
        return {
            date,
            totalSales: transactions?.total_sales || 0,
            totalRefunds: transactions?.total_refunds || 0,
            netAmount: transactions?.net_sales || 0,
            transactionCount: transactions?.transaction_count || 0,
            discrepancies: [], // TODO: Implement discrepancy detection
            vatSummary: vatSummary.results.map((v) => ({
                rate: v.vat_rate,
                subtotal: v.total_subtotal,
                vatAmount: v.total_vat
            })),
            paymentMethodBreakdown: paymentBreakdown.results.map((p) => ({
                method: p.payment_method,
                count: p.count,
                amount: p.amount,
                successRate: p.success_rate
            }))
        };
    }
    /**
     * Get transaction audit trail
     */
    async getAuditTrail(transactionId) {
        const auditEvents = await this.eventStore.db.prepare(`
      SELECT timestamp, event_type as action, user_id, details, risk_level
      FROM financial_audit_log
      WHERE aggregate_id = ?
      ORDER BY timestamp ASC
    `).bind(transactionId).all();
        return auditEvents.results.map((event) => ({
            timestamp: event.timestamp,
            action: event.action,
            userId: event.user_id,
            details: JSON.parse(event.details || '{}'),
            riskLevel: event.risk_level
        }));
    }
    generateTransactionId(paymentMethod) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        return `FIN_${paymentMethod.toUpperCase()}_${timestamp}_${random}`;
    }
    async logAuditEvent(event) {
        await this.eventStore.db.prepare(`
      INSERT INTO financial_audit_log (
        id, aggregate_id, aggregate_type, event_type, user_id, 
        ip_address, timestamp, details, risk_level, compliance_flags
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(`audit_${event.transactionId}_${Date.now()}`, event.transactionId, 'FinancialTransaction', event.action, event.userId, event.ipAddress, new Date().toISOString(), JSON.stringify(event.details), event.riskLevel, JSON.stringify(['AUDIT_TRAIL', 'VIETNAMESE_COMPLIANCE'])).run();
    }
}
