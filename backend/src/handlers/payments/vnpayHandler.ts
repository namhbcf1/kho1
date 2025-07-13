// Production VNPay Payment Gateway Integration
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import crypto from 'crypto';

const vnpayCreateSchema = z.object({
  orderId: z.string().min(1),
  amount: z.number().min(1000), // Minimum 1,000 VND
  orderInfo: z.string().min(1),
  returnUrl: z.string().url(),
  ipnUrl: z.string().url().optional(),
  bankCode: z.string().optional(),
  locale: z.enum(['vn', 'en']).default('vn'),
});

const vnpayCallbackSchema = z.object({
  vnp_Amount: z.string(),
  vnp_BankCode: z.string().optional(),
  vnp_BankTranNo: z.string().optional(),
  vnp_CardType: z.string().optional(),
  vnp_OrderInfo: z.string(),
  vnp_PayDate: z.string(),
  vnp_ResponseCode: z.string(),
  vnp_TmnCode: z.string(),
  vnp_TransactionNo: z.string(),
  vnp_TransactionStatus: z.string(),
  vnp_TxnRef: z.string(),
  vnp_SecureHash: z.string(),
});

const vnpayIpnSchema = z.object({
  vnp_Amount: z.string(),
  vnp_BankCode: z.string().optional(),
  vnp_BankTranNo: z.string().optional(),
  vnp_CardType: z.string().optional(),
  vnp_OrderInfo: z.string(),
  vnp_PayDate: z.string(),
  vnp_ResponseCode: z.string(),
  vnp_TmnCode: z.string(),
  vnp_TransactionNo: z.string(),
  vnp_TransactionStatus: z.string(),
  vnp_TxnRef: z.string(),
  vnp_SecureHash: z.string(),
});

export const vnpayHandler = new Hono()
  .post('/create', zValidator('json', vnpayCreateSchema), async (c) => {
    try {
      const { orderId, amount, orderInfo, returnUrl, ipnUrl, bankCode, locale } = c.req.valid('json');
      const { DB } = c.env;

      // Verify order exists and is pending payment
      const order = await DB.prepare(`
        SELECT id, total, payment_status, status FROM orders 
        WHERE id = ? AND payment_status = 'pending'
      `).bind(orderId).first();

      if (!order) {
        return c.json({ error: 'Order not found or already paid' }, 400);
      }

      if (Math.abs(order.total - amount) > 0.01) {
        return c.json({ error: 'Amount mismatch' }, 400);
      }

      // Get VNPay configuration
      const gatewayConfig = await DB.prepare(`
        SELECT * FROM payment_gateways 
        WHERE type = 'vnpay' AND active = 1
      `).first();

      if (!gatewayConfig) {
        return c.json({ error: 'VNPay not configured' }, 500);
      }

      const paymentId = crypto.randomUUID();
      const createDate = new Date().toISOString().replace(/[-:T]/g, '').substring(0, 14);
      
      // Build VNPay parameters
      const vnpParams = {
        vnp_Version: '2.1.0',
        vnp_Command: 'pay',
        vnp_TmnCode: gatewayConfig.merchant_id,
        vnp_Amount: Math.round(amount * 100), // Convert to cents
        vnp_CurrCode: 'VND',
        vnp_TxnRef: paymentId,
        vnp_OrderInfo: orderInfo,
        vnp_OrderType: 'other',
        vnp_Locale: locale,
        vnp_ReturnUrl: returnUrl,
        vnp_IpAddr: c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || '127.0.0.1',
        vnp_CreateDate: createDate,
      };

      if (ipnUrl) {
        vnpParams.vnp_IpnUrl = ipnUrl;
      }

      if (bankCode) {
        vnpParams.vnp_BankCode = bankCode;
      }

      // Create secure hash
      const sortedParams = Object.keys(vnpParams)
        .sort()
        .map(key => `${key}=${encodeURIComponent(vnpParams[key])}`)
        .join('&');
      
      const secureHash = crypto
        .createHmac('sha512', gatewayConfig.secret_key)
        .update(sortedParams)
        .digest('hex');

      // Determine endpoint (sandbox vs production)
      const endpoint = gatewayConfig.sandbox_mode 
        ? 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html'
        : 'https://vnpayment.vn/paymentv2/vpcpay.html';

      const paymentUrl = `${endpoint}?${sortedParams}&vnp_SecureHash=${secureHash}`;

      // Create payment record
      await DB.prepare(`
        INSERT INTO payments (
          id, order_id, method, amount, status, gateway_id, 
          gateway_order_id, original_amount, original_currency, created_at
        ) VALUES (?, ?, 'vnpay', ?, 'pending', ?, ?, ?, 'VND', CURRENT_TIMESTAMP)
      `).bind(paymentId, orderId, amount, gatewayConfig.id, paymentId, amount).run();

      // Create VNPay transaction record
      await DB.prepare(`
        INSERT INTO vnpay_transactions (
          id, payment_id, vnp_TmnCode, vnp_Amount, vnp_Command,
          vnp_CreateDate, vnp_CurrCode, vnp_IpAddr, vnp_Locale,
          vnp_OrderInfo, vnp_OrderType, vnp_ReturnUrl, vnp_TxnRef,
          vnp_Version, vnp_SecureHash, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).bind(
        crypto.randomUUID(), paymentId, vnpParams.vnp_TmnCode, vnpParams.vnp_Amount,
        vnpParams.vnp_Command, vnpParams.vnp_CreateDate, vnpParams.vnp_CurrCode,
        vnpParams.vnp_IpAddr, vnpParams.vnp_Locale, vnpParams.vnp_OrderInfo,
        vnpParams.vnp_OrderType, vnpParams.vnp_ReturnUrl, vnpParams.vnp_TxnRef,
        vnpParams.vnp_Version, secureHash
      ).run();

      return c.json({
        success: true,
        paymentId,
        paymentUrl,
        amount,
        currency: 'VND',
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 minutes
      });

    } catch (error) {
      console.error('VNPay create error:', error);
      return c.json({ error: 'Payment creation failed' }, 500);
    }
  })

  .post('/callback', zValidator('form', vnpayCallbackSchema), async (c) => {
    try {
      const params = c.req.valid('form');
      const { DB } = c.env;

      // Get gateway configuration
      const gatewayConfig = await DB.prepare(`
        SELECT * FROM payment_gateways 
        WHERE type = 'vnpay' AND merchant_id = ?
      `).bind(params.vnp_TmnCode).first();

      if (!gatewayConfig) {
        return c.json({ error: 'Gateway configuration not found' }, 400);
      }

      // Verify secure hash
      const { vnp_SecureHash, ...otherParams } = params;
      const sortedParams = Object.keys(otherParams)
        .sort()
        .map(key => `${key}=${encodeURIComponent(otherParams[key])}`)
        .join('&');
      
      const expectedHash = crypto
        .createHmac('sha512', gatewayConfig.secret_key)
        .update(sortedParams)
        .digest('hex');

      if (vnp_SecureHash.toLowerCase() !== expectedHash.toLowerCase()) {
        console.error('VNPay hash verification failed');
        return c.json({ error: 'Invalid signature' }, 400);
      }

      // Get payment record
      const payment = await DB.prepare(`
        SELECT p.*, o.customer_id, o.cashier_id 
        FROM payments p 
        JOIN orders o ON p.order_id = o.id 
        WHERE p.id = ?
      `).bind(params.vnp_TxnRef).first();

      if (!payment) {
        return c.json({ error: 'Payment not found' }, 400);
      }

      // Update VNPay transaction
      await DB.prepare(`
        UPDATE vnpay_transactions 
        SET vnp_ResponseCode = ?, vnp_TransactionNo = ?, vnp_BankCode = ?,
            vnp_BankTranNo = ?, vnp_CardType = ?, vnp_PayDate = ?, updated_at = CURRENT_TIMESTAMP
        WHERE payment_id = ?
      `).bind(
        params.vnp_ResponseCode, params.vnp_TransactionNo, params.vnp_BankCode,
        params.vnp_BankTranNo, params.vnp_CardType, params.vnp_PayDate, payment.id
      ).run();

      // Determine payment status
      const isSuccess = params.vnp_ResponseCode === '00' && params.vnp_TransactionStatus === '00';
      const paymentStatus = isSuccess ? 'paid' : 'failed';
      const orderStatus = isSuccess ? 'completed' : 'cancelled';

      // Update payment status
      await DB.prepare(`
        UPDATE payments 
        SET status = ?, gateway_transaction_id = ?, gateway_response = ?, 
            webhook_received = 1, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(paymentStatus, params.vnp_TransactionNo, JSON.stringify(params), payment.id).run();

      // Update order status if payment successful
      if (isSuccess) {
        await DB.prepare(`
          UPDATE orders 
          SET payment_status = 'paid', status = 'completed', updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).bind(payment.order_id).run();

        // Calculate and award loyalty points if customer exists
        if (payment.customer_id) {
          const pointsToAward = Math.floor(payment.amount * 0.01); // 1 point per 100 VND
          if (pointsToAward > 0) {
            await DB.prepare(`
              UPDATE customers 
              SET loyalty_points = loyalty_points + ?, tier_points = tier_points + ?,
                  total_spent = total_spent + ?, updated_at = CURRENT_TIMESTAMP
              WHERE id = ?
            `).bind(pointsToAward, pointsToAward, payment.amount, payment.customer_id).run();

            // Record loyalty transaction
            await DB.prepare(`
              INSERT INTO loyalty_transactions (
                id, customer_id, order_id, type, points, description, created_at
              ) VALUES (?, ?, ?, 'earn', ?, ?, CURRENT_TIMESTAMP)
            `).bind(
              crypto.randomUUID(), payment.customer_id, payment.order_id,
              pointsToAward, `Earned from order ${payment.order_id}`
            ).run();
          }
        }
      }

      // Return VNPay-compliant response
      return c.json({ RspCode: '00', Message: 'Confirm Success' });

    } catch (error) {
      console.error('VNPay callback error:', error);
      return c.json({ RspCode: '99', Message: 'Unknown error' });
    }
  })

  .post('/ipn', zValidator('form', vnpayIpnSchema), async (c) => {
    // Instant Payment Notification handler (same logic as callback)
    return vnpayHandler.fetch(c.req.clone().url.replace('/ipn', '/callback'), c.req);
  })

  .post('/refund', async (c) => {
    try {
      const { paymentId, amount, reason } = await c.req.json();
      const { DB } = c.env;

      // Get payment and transaction details
      const payment = await DB.prepare(`
        SELECT p.*, vt.vnp_TransactionNo, vt.vnp_TmnCode 
        FROM payments p 
        JOIN vnpay_transactions vt ON p.id = vt.payment_id 
        WHERE p.id = ? AND p.status = 'paid'
      `).bind(paymentId).first();

      if (!payment) {
        return c.json({ error: 'Payment not found or not eligible for refund' }, 400);
      }

      const gatewayConfig = await DB.prepare(`
        SELECT * FROM payment_gateways 
        WHERE type = 'vnpay' AND merchant_id = ?
      `).bind(payment.vnp_TmnCode).first();

      if (!gatewayConfig) {
        return c.json({ error: 'Gateway configuration not found' }, 500);
      }

      const refundId = crypto.randomUUID();
      const createDate = new Date().toISOString().replace(/[-:T]/g, '').substring(0, 14);

      // Build refund parameters
      const refundParams = {
        vnp_Version: '2.1.0',
        vnp_Command: 'refund',
        vnp_TmnCode: gatewayConfig.merchant_id,
        vnp_TransactionType: '02', // Full refund
        vnp_TxnRef: refundId,
        vnp_Amount: Math.round(amount * 100),
        vnp_OrderInfo: reason || 'Refund request',
        vnp_TransactionNo: payment.vnp_TransactionNo,
        vnp_CreateBy: 'system',
        vnp_CreateDate: createDate,
        vnp_IpAddr: c.req.header('CF-Connecting-IP') || '127.0.0.1',
      };

      // Create secure hash for refund
      const sortedParams = Object.keys(refundParams)
        .sort()
        .map(key => `${key}=${encodeURIComponent(refundParams[key])}`)
        .join('&');
      
      const secureHash = crypto
        .createHmac('sha512', gatewayConfig.secret_key)
        .update(sortedParams)
        .digest('hex');

      // Make refund API call to VNPay
      const refundEndpoint = gatewayConfig.sandbox_mode
        ? 'https://sandbox.vnpayment.vn/merchant_webapi/api/transaction'
        : 'https://vnpayment.vn/merchant_webapi/api/transaction';

      const refundResponse = await fetch(refundEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...refundParams, vnp_SecureHash: secureHash }),
      });

      const refundResult = await refundResponse.json();

      // Create refund record
      await DB.prepare(`
        INSERT INTO payments (
          id, order_id, method, amount, status, gateway_id,
          gateway_transaction_id, gateway_response, original_amount,
          original_currency, created_at
        ) VALUES (?, ?, 'vnpay_refund', ?, ?, ?, ?, ?, ?, 'VND', CURRENT_TIMESTAMP)
      `).bind(
        refundId, payment.order_id, -amount, 'pending', gatewayConfig.id,
        refundResult.vnp_TransactionNo || '', JSON.stringify(refundResult), amount
      ).run();

      if (refundResult.vnp_ResponseCode === '00') {
        // Update original payment status
        await DB.prepare(`
          UPDATE payments SET status = 'refunded', updated_at = CURRENT_TIMESTAMP WHERE id = ?
        `).bind(paymentId).run();
        
        // Update order status
        await DB.prepare(`
          UPDATE orders SET payment_status = 'refunded', status = 'refunded', updated_at = CURRENT_TIMESTAMP 
          WHERE id = ?
        `).bind(payment.order_id).run();
      }

      return c.json({
        success: refundResult.vnp_ResponseCode === '00',
        refundId,
        message: refundResult.vnp_Message,
        transactionNo: refundResult.vnp_TransactionNo,
      });

    } catch (error) {
      console.error('VNPay refund error:', error);
      return c.json({ error: 'Refund processing failed' }, 500);
    }
  })

  .get('/status/:paymentId', async (c) => {
    try {
      const paymentId = c.req.param('paymentId');
      const { DB } = c.env;

      const payment = await DB.prepare(`
        SELECT p.*, vt.vnp_ResponseCode, vt.vnp_TransactionNo, vt.vnp_PayDate
        FROM payments p
        LEFT JOIN vnpay_transactions vt ON p.id = vt.payment_id
        WHERE p.id = ?
      `).bind(paymentId).first();

      if (!payment) {
        return c.json({ error: 'Payment not found' }, 404);
      }

      return c.json({
        paymentId: payment.id,
        orderId: payment.order_id,
        amount: payment.amount,
        status: payment.status,
        vnpayResponseCode: payment.vnp_ResponseCode,
        transactionNo: payment.vnp_TransactionNo,
        payDate: payment.vnp_PayDate,
        createdAt: payment.created_at,
        updatedAt: payment.updated_at,
      });

    } catch (error) {
      console.error('VNPay status check error:', error);
      return c.json({ error: 'Status check failed' }, 500);
    }
  });
