/**
 * Payment Orchestrator Service
 * Fixes: Payment gateway race conditions and concurrent payment handling
 */
import { z } from 'zod';
const PaymentRequestSchema = z.object({
    orderId: z.string(),
    amount: z.number().positive(),
    currency: z.string().default('VND'),
    customerId: z.string(),
    paymentMethod: z.enum(['vnpay', 'momo', 'zalopay', 'cash', 'card']),
    returnUrl: z.string().url(),
    metadata: z.record(z.any()).optional()
});
/**
 * Payment Lock Manager - Prevents concurrent payment processing
 */
class PaymentLockManager {
    locks = new Map();
    lockTimeout = 30000; // 30 seconds
    async acquireLock(orderId) {
        // Check if lock exists and is not expired
        const existing = this.locks.get(orderId);
        if (existing && Date.now() - existing.timestamp < this.lockTimeout) {
            // Wait for existing lock to release
            await existing.promise;
        }
        // Create new lock
        let releaseLock;
        const lockPromise = new Promise((resolve) => {
            releaseLock = resolve;
        });
        this.locks.set(orderId, {
            timestamp: Date.now(),
            promise: lockPromise
        });
        // Auto-release lock after timeout
        setTimeout(() => {
            if (this.locks.get(orderId)?.promise === lockPromise) {
                this.locks.delete(orderId);
                releaseLock();
            }
        }, this.lockTimeout);
        return () => {
            this.locks.delete(orderId);
            releaseLock();
        };
    }
}
/**
 * Payment State Manager - Handles payment state transitions
 */
class PaymentStateManager {
    db;
    validTransitions = {
        initialized: ['processing', 'failed', 'cancelled'],
        processing: ['completed', 'failed', 'cancelled'],
        completed: ['refunded'],
        failed: ['processing'], // Allow retry
        cancelled: [],
        refunded: []
    };
    constructor(db) {
        this.db = db;
    }
    async getPaymentState(transactionId) {
        const payment = await this.db.prepare(`
      SELECT status FROM payments WHERE transaction_id = ?
    `).bind(transactionId).first();
        return payment?.status || null;
    }
    async updatePaymentState(transactionId, newState, details) {
        const currentState = await this.getPaymentState(transactionId);
        if (!currentState) {
            throw new Error('Payment not found');
        }
        // Validate state transition
        if (!this.validTransitions[currentState].includes(newState)) {
            throw new Error(`Invalid state transition from ${currentState} to ${newState}`);
        }
        // Update payment state
        await this.db.prepare(`
      UPDATE payments 
      SET status = ?, 
          updated_at = CURRENT_TIMESTAMP,
          gateway_response = CASE 
            WHEN ? IS NOT NULL THEN ?
            ELSE gateway_response
          END,
          completed_at = CASE 
            WHEN ? = 'completed' THEN CURRENT_TIMESTAMP
            ELSE completed_at
          END
      WHERE transaction_id = ?
    `).bind(newState, details ? JSON.stringify(details) : null, details ? JSON.stringify(details) : null, newState, transactionId).run();
        return true;
    }
}
/**
 * Main Payment Orchestrator
 */
export class PaymentOrchestrator {
    db;
    kv;
    lockManager = new PaymentLockManager();
    stateManager;
    gateways = new Map();
    constructor(db, kv) {
        this.db = db;
        this.kv = kv;
        this.stateManager = new PaymentStateManager(db);
    }
    /**
     * Register payment gateway
     */
    registerGateway(name, gateway) {
        this.gateways.set(name, gateway);
    }
    /**
     * Process payment with race condition protection
     */
    async processPayment(request) {
        const validated = PaymentRequestSchema.parse(request);
        const { orderId, paymentMethod } = validated;
        // Acquire lock for this order
        const releaseLock = await this.lockManager.acquireLock(orderId);
        try {
            // Check if payment already exists for this order
            const existingPayment = await this.checkExistingPayment(orderId);
            if (existingPayment) {
                return this.handleExistingPayment(existingPayment);
            }
            // Generate transaction ID
            const transactionId = this.generateTransactionId(orderId, paymentMethod);
            // Create payment record
            await this.createPaymentRecord(transactionId, validated);
            // Process with specific gateway
            const gateway = this.gateways.get(paymentMethod);
            if (!gateway) {
                await this.stateManager.updatePaymentState(transactionId, 'failed', {
                    error: 'Payment gateway not available'
                });
                return {
                    success: false,
                    transactionId,
                    error: 'Payment gateway not available',
                    status: 'failed'
                };
            }
            // Update state to processing
            await this.stateManager.updatePaymentState(transactionId, 'processing');
            // Process payment
            const result = await this.processWithGateway(gateway, validated, transactionId);
            // Update final state
            const finalState = result.success ? 'completed' : 'failed';
            await this.stateManager.updatePaymentState(transactionId, finalState, {
                gatewayResponse: result,
                paidAmount: result.success ? validated.amount : 0
            });
            return {
                ...result,
                transactionId
            };
        }
        catch (error) {
            console.error('Payment processing error:', error);
            // Try to update state to failed if transaction exists
            try {
                const transactionId = this.generateTransactionId(orderId, paymentMethod);
                await this.stateManager.updatePaymentState(transactionId, 'failed', {
                    error: error.message
                });
            }
            catch {
                // Ignore if transaction doesn't exist
            }
            return {
                success: false,
                transactionId: '',
                error: 'Payment processing failed',
                status: 'failed'
            };
        }
        finally {
            releaseLock();
        }
    }
    /**
     * Check for existing payment
     */
    async checkExistingPayment(orderId) {
        return await this.db.prepare(`
      SELECT transaction_id, status, amount, payment_method, created_at
      FROM payments 
      WHERE order_id = ? AND status NOT IN ('failed', 'cancelled')
      ORDER BY created_at DESC
      LIMIT 1
    `).bind(orderId).first();
    }
    /**
     * Handle existing payment
     */
    handleExistingPayment(payment) {
        return {
            success: payment.status === 'completed',
            transactionId: payment.transaction_id,
            status: payment.status,
            error: payment.status === 'completed' ? undefined : 'Payment already exists'
        };
    }
    /**
     * Create payment record
     */
    async createPaymentRecord(transactionId, request) {
        await this.db.prepare(`
      INSERT INTO payments (
        transaction_id, order_id, amount, currency, customer_id,
        payment_method, status, created_at, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, 'initialized', CURRENT_TIMESTAMP, ?)
    `).bind(transactionId, request.orderId, request.amount, request.currency, request.customerId, request.paymentMethod, JSON.stringify(request.metadata || {})).run();
    }
    /**
     * Process payment with specific gateway
     */
    async processWithGateway(gateway, request, transactionId) {
        try {
            // Add idempotency key
            const gatewayRequest = {
                ...request,
                transactionId,
                idempotencyKey: transactionId
            };
            const result = await gateway.processPayment(gatewayRequest);
            return {
                success: result.success,
                transactionId,
                paymentUrl: result.paymentUrl,
                qrCode: result.qrCode,
                status: result.success ? 'completed' : 'failed',
                error: result.error
            };
        }
        catch (error) {
            return {
                success: false,
                transactionId,
                status: 'failed',
                error: error.message
            };
        }
    }
    /**
     * Handle payment callback/webhook
     */
    async handlePaymentCallback(transactionId, gatewayResponse, signature) {
        try {
            // Verify signature if provided
            if (signature) {
                const isValid = await this.verifyWebhookSignature(gatewayResponse, signature);
                if (!isValid) {
                    return { success: false, message: 'Invalid signature' };
                }
            }
            // Get current payment state
            const currentState = await this.stateManager.getPaymentState(transactionId);
            if (!currentState) {
                return { success: false, message: 'Payment not found' };
            }
            // Determine new state based on gateway response
            let newState;
            if (gatewayResponse.success || gatewayResponse.status === 'completed') {
                newState = 'completed';
            }
            else if (gatewayResponse.status === 'cancelled') {
                newState = 'cancelled';
            }
            else {
                newState = 'failed';
            }
            // Update payment state
            await this.stateManager.updatePaymentState(transactionId, newState, {
                gatewayCallback: gatewayResponse,
                callbackTimestamp: new Date().toISOString()
            });
            // Update order status if payment completed
            if (newState === 'completed') {
                await this.updateOrderStatus(transactionId, 'paid');
            }
            return { success: true, message: 'Callback processed successfully' };
        }
        catch (error) {
            console.error('Payment callback error:', error);
            return { success: false, message: 'Callback processing failed' };
        }
    }
    /**
     * Get payment status
     */
    async getPaymentStatus(transactionId) {
        const payment = await this.db.prepare(`
      SELECT transaction_id, status, amount, paid_amount, payment_method as gateway,
             created_at, completed_at, gateway_response
      FROM payments 
      WHERE transaction_id = ?
    `).bind(transactionId).first();
        if (!payment) {
            return null;
        }
        const gatewayResponse = payment.gateway_response ? JSON.parse(payment.gateway_response) : {};
        return {
            transactionId: payment.transaction_id,
            status: payment.status,
            amount: payment.amount,
            paidAmount: payment.paid_amount,
            gateway: payment.gateway,
            createdAt: payment.created_at,
            completedAt: payment.completed_at,
            failureReason: gatewayResponse.error
        };
    }
    /**
     * Cancel payment
     */
    async cancelPayment(transactionId, reason) {
        try {
            await this.stateManager.updatePaymentState(transactionId, 'cancelled', {
                cancellationReason: reason,
                cancelledAt: new Date().toISOString()
            });
            return true;
        }
        catch (error) {
            console.error('Payment cancellation error:', error);
            return false;
        }
    }
    /**
     * Process refund
     */
    async processRefund(transactionId, amount, reason) {
        try {
            const payment = await this.getPaymentStatus(transactionId);
            if (!payment || payment.status !== 'completed') {
                return { success: false, error: 'Payment not eligible for refund' };
            }
            const gateway = this.gateways.get(payment.gateway);
            if (!gateway.processRefund) {
                return { success: false, error: 'Refund not supported by gateway' };
            }
            const refundResult = await gateway.processRefund({
                transactionId,
                amount,
                reason
            });
            if (refundResult.success) {
                await this.stateManager.updatePaymentState(transactionId, 'refunded', {
                    refundId: refundResult.refundId,
                    refundAmount: amount,
                    refundReason: reason,
                    refundedAt: new Date().toISOString()
                });
            }
            return refundResult;
        }
        catch (error) {
            console.error('Refund processing error:', error);
            return { success: false, error: 'Refund processing failed' };
        }
    }
    /**
     * Generate unique transaction ID
     */
    generateTransactionId(orderId, paymentMethod) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        return `${paymentMethod.toUpperCase()}_${orderId}_${timestamp}_${random}`;
    }
    /**
     * Verify webhook signature
     */
    async verifyWebhookSignature(payload, signature) {
        // Implementation depends on specific gateway requirements
        // This is a placeholder - each gateway has its own signature verification
        return true;
    }
    /**
     * Update order status
     */
    async updateOrderStatus(transactionId, status) {
        await this.db.prepare(`
      UPDATE orders 
      SET payment_status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = (
        SELECT order_id FROM payments WHERE transaction_id = ?
      )
    `).bind(status, transactionId).run();
    }
}
