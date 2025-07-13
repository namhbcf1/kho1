// Production ZaloPay Payment Gateway Integration
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import crypto from 'crypto';

const zalopayCreateSchema = z.object({
  orderId: z.string().min(1),
  amount: z.number().min(1000),
  description: z.string().min(1),
  userId: z.string().default('user'),
  bankCode: z.string().optional(),
  embedData: z.record(z.any()).default({}),
});

const zalopayCallbackSchema = z.object({
  data: z.string(),
  mac: z.string(),
  type: z.number(),
});

const zalopayQuerySchema = z.object({
  appTransId: z.string(),
});

export const zalopayHandler = new Hono()
  .post('/create', zValidator('json', zalopayCreateSchema), async (c) => {
    try {
      const { orderId, amount, description, userId, bankCode, embedData } = c.req.valid('json');
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

      // Get ZaloPay configuration
      const gatewayConfig = await DB.prepare(`
        SELECT * FROM payment_gateways 
        WHERE type = 'zalopay' AND active = 1
      `).first();

      if (!gatewayConfig) {
        return c.json({ error: 'ZaloPay not configured' }, 500);
      }

      const config = JSON.parse(gatewayConfig.config || '{}');
      const paymentId = crypto.randomUUID();
      const appTransId = `${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}_${paymentId}`;

      const zalopayRequest = {
        app_id: parseInt(gatewayConfig.merchant_id),
        app_trans_id: appTransId,
        app_user: userId,
        app_time: Date.now(),
        amount: amount,
        description: description,
        bank_code: bankCode || '',
        item: JSON.stringify([{
          itemid: orderId,
          itemname: description,
          itemprice: amount,
          itemquantity: 1,
        }]),
        embed_data: JSON.stringify(embedData),
        callback_url: `${c.env.BASE_URL}/api/payments/zalopay/callback`,
      };

      // Create MAC signature according to ZaloPay specification
      const macData = `${zalopayRequest.app_id}|${zalopayRequest.app_trans_id}|${zalopayRequest.app_user}|${zalopayRequest.amount}|${zalopayRequest.app_time}|${zalopayRequest.embed_data}|${zalopayRequest.item}`;
      const mac = crypto
        .createHmac('sha256', gatewayConfig.api_key)
        .update(macData)
        .digest('hex');

      // Determine endpoint (sandbox vs production)
      const endpoint = gatewayConfig.sandbox_mode 
        ? 'https://sb-openapi.zalopay.vn/v2/create'
        : 'https://openapi.zalopay.vn/v2/create';

      // Make request to ZaloPay API
      const requestBody = new URLSearchParams({
        app_id: zalopayRequest.app_id.toString(),
        app_trans_id: zalopayRequest.app_trans_id,
        app_user: zalopayRequest.app_user,
        app_time: zalopayRequest.app_time.toString(),
        amount: zalopayRequest.amount.toString(),
        description: zalopayRequest.description,
        bank_code: zalopayRequest.bank_code,
        item: zalopayRequest.item,
        embed_data: zalopayRequest.embed_data,
        callback_url: zalopayRequest.callback_url,
        mac: mac,
      });

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: requestBody,
      });

      const result = await response.json();

      if (result.return_code !== 1) {
        console.error('ZaloPay API error:', result);
        return c.json({ error: result.return_message || 'ZaloPay payment creation failed' }, 400);
      }

      // Create payment record
      await DB.prepare(`
        INSERT INTO payments (
          id, order_id, method, amount, status, gateway_id,
          gateway_order_id, original_amount, original_currency, created_at
        ) VALUES (?, ?, 'zalopay', ?, 'pending', ?, ?, ?, 'VND', CURRENT_TIMESTAMP)
      `).bind(paymentId, orderId, amount, gatewayConfig.id, appTransId, amount).run();

      // Create ZaloPay transaction record
      await DB.prepare(`
        INSERT INTO zalopay_transactions (
          id, payment_id, app_id, app_trans_id, app_user,
          app_time, amount, description, bank_code, callback_url,
          embed_data, mac, order_url, qr_code, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).bind(
        crypto.randomUUID(), paymentId, zalopayRequest.app_id, zalopayRequest.app_trans_id,
        zalopayRequest.app_user, zalopayRequest.app_time, zalopayRequest.amount,
        zalopayRequest.description, zalopayRequest.bank_code, zalopayRequest.callback_url,
        zalopayRequest.embed_data, mac, result.order_url || '', result.qr_code || ''
      ).run();

      return c.json({
        success: true,
        paymentId,
        appTransId,
        orderUrl: result.order_url,
        qrCode: result.qr_code,
        amount,
        currency: 'VND',
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes
      });

    } catch (error) {
      console.error('ZaloPay create error:', error);
      return c.json({ error: 'Payment creation failed' }, 500);
    }
  })

  .post('/callback', zValidator('json', zalopayCallbackSchema), async (c) => {
    try {
      const { data, mac, type } = c.req.valid('json');
      const { DB } = c.env;

      // Get gateway configuration
      const gatewayConfig = await DB.prepare(`
        SELECT * FROM payment_gateways 
        WHERE type = 'zalopay' AND active = 1
      `).first();

      if (!gatewayConfig) {
        return c.json({ return_code: -1, return_message: 'Gateway configuration not found' });
      }

      // Verify MAC signature
      const expectedMac = crypto
        .createHmac('sha256', gatewayConfig.secret_key)
        .update(data)
        .digest('hex');

      if (mac !== expectedMac) {
        console.error('ZaloPay MAC verification failed');
        return c.json({ return_code: -1, return_message: 'Invalid MAC signature' });
      }

      // Parse callback data
      const callbackData = JSON.parse(data);
      const { app_trans_id, zp_trans_id, amount, server_time } = callbackData;

      // Get payment record
      const payment = await DB.prepare(`
        SELECT p.*, o.customer_id, o.cashier_id 
        FROM payments p 
        JOIN orders o ON p.order_id = o.id 
        WHERE p.gateway_order_id = ?
      `).bind(app_trans_id).first();

      if (!payment) {
        return c.json({ return_code: 0, return_message: 'Payment not found' });
      }

      // Update ZaloPay transaction
      await DB.prepare(`
        UPDATE zalopay_transactions 
        SET return_code = 1, return_message = 'Success', sub_return_code = 1,
            sub_return_message = 'Success', zp_trans_id = ?, updated_at = CURRENT_TIMESTAMP
        WHERE payment_id = ?
      `).bind(zp_trans_id, payment.id).run();

      // Update payment status
      await DB.prepare(`
        UPDATE payments 
        SET status = 'paid', gateway_transaction_id = ?, gateway_response = ?, 
            webhook_received = 1, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(zp_trans_id, data, payment.id).run();

      // Update order status
      await DB.prepare(`
        UPDATE orders 
        SET payment_status = 'paid', status = 'completed', updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(payment.order_id).run();

      // Calculate and award loyalty points if customer exists
      if (payment.customer_id) {
        const pointsToAward = Math.floor(payment.amount * 0.01);
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

      return c.json({ return_code: 1, return_message: 'Success' });

    } catch (error) {
      console.error('ZaloPay callback error:', error);
      return c.json({ return_code: 0, return_message: 'Unknown error' });
    }
  })

  .post('/query', zValidator('json', zalopayQuerySchema), async (c) => {
    try {
      const { appTransId } = c.req.valid('json');
      const { DB } = c.env;

      // Get gateway configuration
      const gatewayConfig = await DB.prepare(`
        SELECT * FROM payment_gateways 
        WHERE type = 'zalopay' AND active = 1
      `).first();

      if (!gatewayConfig) {
        return c.json({ error: 'ZaloPay not configured' }, 500);
      }

      // Create MAC for query
      const queryData = `${gatewayConfig.merchant_id}|${appTransId}|${gatewayConfig.api_key}`;
      const mac = crypto
        .createHmac('sha256', gatewayConfig.api_key)
        .update(queryData)
        .digest('hex');

      // Query ZaloPay API
      const endpoint = gatewayConfig.sandbox_mode 
        ? 'https://sb-openapi.zalopay.vn/v2/query'
        : 'https://openapi.zalopay.vn/v2/query';

      const requestBody = new URLSearchParams({
        app_id: gatewayConfig.merchant_id,
        app_trans_id: appTransId,
        mac: mac,
      });

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: requestBody,
      });

      const result = await response.json();

      return c.json(result);

    } catch (error) {
      console.error('ZaloPay query error:', error);
      return c.json({ error: 'Query failed' }, 500);
    }
  })

  .post('/refund', async (c) => {
    try {
      const { paymentId, amount, description } = await c.req.json();
      const { DB } = c.env;

      // Get payment and transaction details
      const payment = await DB.prepare(`
        SELECT p.*, zt.zp_trans_id, zt.app_id 
        FROM payments p 
        JOIN zalopay_transactions zt ON p.id = zt.payment_id 
        WHERE p.id = ? AND p.status = 'paid'
      `).bind(paymentId).first();

      if (!payment) {
        return c.json({ error: 'Payment not found or not eligible for refund' }, 400);
      }

      const gatewayConfig = await DB.prepare(`
        SELECT * FROM payment_gateways 
        WHERE type = 'zalopay' AND merchant_id = ?
      `).bind(payment.app_id.toString()).first();

      if (!gatewayConfig) {
        return c.json({ error: 'Gateway configuration not found' }, 500);
      }

      const refundId = crypto.randomUUID();
      const mRefundId = `${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}_${refundId}`;
      const timestamp = Date.now();

      // Create refund MAC
      const refundData = `${gatewayConfig.merchant_id}|${payment.zp_trans_id}|${amount}|${description}|${timestamp}`;
      const mac = crypto
        .createHmac('sha256', gatewayConfig.api_key)
        .update(refundData)
        .digest('hex');

      // Make refund API call to ZaloPay
      const refundEndpoint = gatewayConfig.sandbox_mode
        ? 'https://sb-openapi.zalopay.vn/v2/refund'
        : 'https://openapi.zalopay.vn/v2/refund';

      const requestBody = new URLSearchParams({
        app_id: gatewayConfig.merchant_id,
        zp_trans_id: payment.zp_trans_id,
        amount: amount.toString(),
        description: description || 'Refund request',
        timestamp: timestamp.toString(),
        m_refund_id: mRefundId,
        mac: mac,
      });

      const refundResponse = await fetch(refundEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: requestBody,
      });

      const refundResult = await refundResponse.json();

      // Create refund record
      await DB.prepare(`
        INSERT INTO payments (
          id, order_id, method, amount, status, gateway_id,
          gateway_transaction_id, gateway_response, original_amount,
          original_currency, created_at
        ) VALUES (?, ?, 'zalopay_refund', ?, ?, ?, ?, ?, ?, 'VND', CURRENT_TIMESTAMP)
      `).bind(
        refundId, payment.order_id, -amount, 'pending', gatewayConfig.id,
        refundResult.refund_id || '', JSON.stringify(refundResult), amount
      ).run();

      if (refundResult.return_code === 1) {
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
        success: refundResult.return_code === 1,
        refundId,
        message: refundResult.return_message,
        zalopayRefundId: refundResult.refund_id,
      });

    } catch (error) {
      console.error('ZaloPay refund error:', error);
      return c.json({ error: 'Refund processing failed' }, 500);
    }
  })

  .get('/status/:paymentId', async (c) => {
    try {
      const paymentId = c.req.param('paymentId');
      const { DB } = c.env;

      const payment = await DB.prepare(`
        SELECT p.*, zt.return_code, zt.zp_trans_id, zt.return_message
        FROM payments p
        LEFT JOIN zalopay_transactions zt ON p.id = zt.payment_id
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
        zalopayReturnCode: payment.return_code,
        zpTransId: payment.zp_trans_id,
        message: payment.return_message,
        createdAt: payment.created_at,
        updatedAt: payment.updated_at,
      });

    } catch (error) {
      console.error('ZaloPay status check error:', error);
      return c.json({ error: 'Status check failed' }, 500);
    }
  });
