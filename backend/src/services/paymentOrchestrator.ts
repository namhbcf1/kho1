/**
 * Payment Orchestrator Service
 * Fixes: Payment gateway race conditions and concurrent payment handling
 */

import { z } from 'zod';

export interface PaymentRequest {
  orderId: string;
  amount: number;
  currency: string;
  customerId: string;
  paymentMethod: 'vnpay' | 'momo' | 'zalopay' | 'cash' | 'card';
  returnUrl: string;
  metadata?: Record<string, any>;
}

export interface PaymentResult {
  success: boolean;
  transactionId: string;
  paymentUrl?: string;
  qrCode?: string;
  error?: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
}

export interface PaymentStatus {
  transactionId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded';
  amount: number;
  paidAmount?: number;
  gateway: string;
  createdAt: string;
  completedAt?: string;
  failureReason?: string;
}

// Payment state machine
type PaymentState = 'initialized' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded';

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
  private locks = new Map<string, { timestamp: number; promise: Promise<void> }>();
  private readonly lockTimeout = 30000; // 30 seconds

  async acquireLock(orderId: string): Promise<() => void> {
    // Check if lock exists and is not expired
    const existing = this.locks.get(orderId);
    if (existing && Date.now() - existing.timestamp < this.lockTimeout) {
      // Wait for existing lock to release
      await existing.promise;
    }

    // Create new lock
    let releaseLock: () => void;
    const lockPromise = new Promise<void>((resolve) => {
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
        releaseLock!();
      }
    }, this.lockTimeout);

    return () => {
      this.locks.delete(orderId);
      releaseLock!();
    };
  }
}

/**
 * Payment State Manager - Handles payment state transitions
 */
class PaymentStateManager {
  private readonly validTransitions: Record<PaymentState, PaymentState[]> = {
    initialized: ['processing', 'failed', 'cancelled'],
    processing: ['completed', 'failed', 'cancelled'],
    completed: ['refunded'],
    failed: ['processing'], // Allow retry
    cancelled: [],
    refunded: []
  };

  constructor(private db: any) {}

  async getPaymentState(transactionId: string): Promise<PaymentState | null> {
    const payment = await this.db.prepare(`
      SELECT status FROM payments WHERE transaction_id = ?
    `).bind(transactionId).first();

    return payment?.status as PaymentState || null;
  }

  async updatePaymentState(
    transactionId: string,
    newState: PaymentState,
    details?: Record<string, any>
  ): Promise<boolean> {
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
    `).bind(
      newState,
      details ? JSON.stringify(details) : null,
      details ? JSON.stringify(details) : null,
      newState,
      transactionId
    ).run();

    return true;
  }
}

/**
 * Main Payment Orchestrator
 */
export class PaymentOrchestrator {
  private lockManager = new PaymentLockManager();
  private stateManager: PaymentStateManager;
  private gateways: Map<string, any> = new Map();

  constructor(
    private db: any,
    private kv: any
  ) {
    this.stateManager = new PaymentStateManager(db);
  }

  /**
   * Register payment gateway
   */
  registerGateway(name: string, gateway: any): void {
    this.gateways.set(name, gateway);
  }

  /**
   * Process payment with race condition protection
   */
  async processPayment(request: PaymentRequest): Promise<PaymentResult> {
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

    } catch (error) {
      console.error('Payment processing error:', error);
      
      // Try to update state to failed if transaction exists
      try {
        const transactionId = this.generateTransactionId(orderId, paymentMethod);
        await this.stateManager.updatePaymentState(transactionId, 'failed', {
          error: error.message
        });
      } catch {
        // Ignore if transaction doesn't exist
      }

      return {
        success: false,
        transactionId: '',
        error: 'Payment processing failed',
        status: 'failed'
      };
    } finally {
      releaseLock();
    }
  }

  /**
   * Check for existing payment
   */
  private async checkExistingPayment(orderId: string): Promise<any> {
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
  private handleExistingPayment(payment: any): PaymentResult {
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
  private async createPaymentRecord(transactionId: string, request: PaymentRequest): Promise<void> {
    await this.db.prepare(`
      INSERT INTO payments (
        transaction_id, order_id, amount, currency, customer_id,
        payment_method, status, created_at, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, 'initialized', CURRENT_TIMESTAMP, ?)
    `).bind(
      transactionId,
      request.orderId,
      request.amount,
      request.currency,
      request.customerId,
      request.paymentMethod,
      JSON.stringify(request.metadata || {})
    ).run();
  }

  /**
   * Process payment with specific gateway
   */
  private async processWithGateway(
    gateway: any,
    request: PaymentRequest,
    transactionId: string
  ): Promise<PaymentResult> {
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
    } catch (error) {
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
  async handlePaymentCallback(
    transactionId: string,
    gatewayResponse: any,
    signature?: string
  ): Promise<{ success: boolean; message: string }> {
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
      let newState: PaymentState;
      if (gatewayResponse.success || gatewayResponse.status === 'completed') {
        newState = 'completed';
      } else if (gatewayResponse.status === 'cancelled') {
        newState = 'cancelled';
      } else {
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

    } catch (error) {
      console.error('Payment callback error:', error);
      return { success: false, message: 'Callback processing failed' };
    }
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(transactionId: string): Promise<PaymentStatus | null> {
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
  async cancelPayment(transactionId: string, reason: string): Promise<boolean> {
    try {
      await this.stateManager.updatePaymentState(transactionId, 'cancelled', {
        cancellationReason: reason,
        cancelledAt: new Date().toISOString()
      });
      return true;
    } catch (error) {
      console.error('Payment cancellation error:', error);
      return false;
    }
  }

  /**
   * Process refund
   */
  async processRefund(
    transactionId: string,
    amount: number,
    reason: string
  ): Promise<{ success: boolean; refundId?: string; error?: string }> {
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
    } catch (error) {
      console.error('Refund processing error:', error);
      return { success: false, error: 'Refund processing failed' };
    }
  }

  /**
   * Generate unique transaction ID
   */
  private generateTransactionId(orderId: string, paymentMethod: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${paymentMethod.toUpperCase()}_${orderId}_${timestamp}_${random}`;
  }

  /**
   * Verify webhook signature
   */
  private async verifyWebhookSignature(payload: any, signature: string): Promise<boolean> {
    // Implementation depends on specific gateway requirements
    // This is a placeholder - each gateway has its own signature verification
    return true;
  }

  /**
   * Update order status
   */
  private async updateOrderStatus(transactionId: string, status: string): Promise<void> {
    await this.db.prepare(`
      UPDATE orders 
      SET payment_status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = (
        SELECT order_id FROM payments WHERE transaction_id = ?
      )
    `).bind(status, transactionId).run();
  }
}