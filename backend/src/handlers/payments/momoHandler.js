// Production MoMo E-Wallet Payment Gateway Integration
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import crypto from 'crypto';
const momoCreateSchema = z.object({
    orderId: z.string().min(1),
    amount: z.number().min(1000),
    orderInfo: z.string().min(1),
    returnUrl: z.string().url(),
    ipnUrl: z.string().url().optional(),
    requestType: z.enum(['payWithATM', 'payWithCredit', 'captureWallet']).default('captureWallet'),
    extraData: z.string().default(''),
});
const momoCallbackSchema = z.object({
    partnerCode: z.string(),
    orderId: z.string(),
    requestId: z.string(),
    amount: z.number(),
    orderInfo: z.string(),
    orderType: z.string(),
    transId: z.number().optional(),
    resultCode: z.number(),
    message: z.string(),
    payType: z.string(),
    responseTime: z.number(),
    extraData: z.string(),
    signature: z.string(),
});
export const momoHandler = new Hono()
    .post('/create', zValidator('json', momoCreateSchema), async (c) => {
    try {
        const { orderId, amount, orderInfo, returnUrl, ipnUrl, requestType, extraData } = c.req.valid('json');
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
        // Get MoMo configuration
        const gatewayConfig = await DB.prepare(`
        SELECT * FROM payment_gateways 
        WHERE type = 'momo' AND active = 1
      `).first();
        if (!gatewayConfig) {
            return c.json({ error: 'MoMo not configured' }, 500);
        }
        const config = JSON.parse(gatewayConfig.config || '{}');
        const paymentId = crypto.randomUUID();
        const requestId = crypto.randomUUID();
        const momoRequest = {
            partnerCode: gatewayConfig.merchant_id,
            partnerName: config.partnerName || 'KhoAugment POS',
            storeId: config.storeId || 'KhoAugmentStore',
            requestId: requestId,
            amount: amount,
            orderId: paymentId,
            orderInfo: orderInfo,
            redirectUrl: returnUrl,
            ipnUrl: ipnUrl || `${c.env.BASE_URL}/api/payments/momo/ipn`,
            lang: 'vi',
            extraData: extraData,
            requestType: requestType,
            autoCapture: true,
            orderGroupId: '',
        };
        // Create signature according to MoMo specification
        const rawSignature = `accessKey=${gatewayConfig.api_key}&amount=${amount}&extraData=${extraData}&ipnUrl=${momoRequest.ipnUrl}&orderId=${paymentId}&orderInfo=${orderInfo}&partnerCode=${gatewayConfig.merchant_id}&redirectUrl=${returnUrl}&requestId=${requestId}&requestType=${requestType}`;
        const signature = crypto
            .createHmac('sha256', gatewayConfig.secret_key)
            .update(rawSignature)
            .digest('hex');
        const requestBody = {
            ...momoRequest,
            accessKey: gatewayConfig.api_key,
            signature: signature,
        };
        // Determine endpoint (sandbox vs production)
        const endpoint = gatewayConfig.sandbox_mode
            ? 'https://test-payment.momo.vn/v2/gateway/api/create'
            : 'https://payment.momo.vn/v2/gateway/api/create';
        // Make request to MoMo API
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });
        const result = await response.json();
        if (result.resultCode !== 0) {
            console.error('MoMo API error:', result);
            return c.json({ error: result.message || 'MoMo payment creation failed' }, 400);
        }
        // Create payment record
        await DB.prepare(`
        INSERT INTO payments (
          id, order_id, method, amount, status, gateway_id,
          gateway_order_id, original_amount, original_currency, created_at
        ) VALUES (?, ?, 'momo', ?, 'pending', ?, ?, ?, 'VND', CURRENT_TIMESTAMP)
      `).bind(paymentId, orderId, amount, gatewayConfig.id, paymentId, amount).run();
        // Create MoMo transaction record
        await DB.prepare(`
        INSERT INTO momo_transactions (
          id, payment_id, partner_code, order_id, request_id,
          amount, order_info, redirect_url, ipn_url, lang,
          extra_data, request_type, signature, qr_code_url,
          deeplink, pay_url, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).bind(crypto.randomUUID(), paymentId, gatewayConfig.merchant_id, paymentId, requestId, amount, orderInfo, returnUrl, momoRequest.ipnUrl, 'vi', extraData, requestType, signature, result.qrCodeUrl || '', result.deeplink || '', result.payUrl || '').run();
        return c.json({
            success: true,
            paymentId,
            payUrl: result.payUrl,
            qrCodeUrl: result.qrCodeUrl,
            deeplink: result.deeplink,
            amount,
            currency: 'VND',
            expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes
        });
    }
    catch (error) {
        console.error('MoMo create error:', error);
        return c.json({ error: 'Payment creation failed' }, 500);
    }
})
    .post('/callback', zValidator('json', momoCallbackSchema), async (c) => {
    try {
        const params = c.req.valid('json');
        const { DB } = c.env;
        // Get gateway configuration
        const gatewayConfig = await DB.prepare(`
        SELECT * FROM payment_gateways 
        WHERE type = 'momo' AND merchant_id = ?
      `).bind(params.partnerCode).first();
        if (!gatewayConfig) {
            return c.json({ error: 'Gateway configuration not found' }, 400);
        }
        // Verify signature
        const rawSignature = `accessKey=${gatewayConfig.api_key}&amount=${params.amount}&extraData=${params.extraData}&message=${params.message}&orderId=${params.orderId}&orderInfo=${params.orderInfo}&orderType=${params.orderType}&partnerCode=${params.partnerCode}&payType=${params.payType}&requestId=${params.requestId}&responseTime=${params.responseTime}&resultCode=${params.resultCode}&transId=${params.transId || ''}`;
        const expectedSignature = crypto
            .createHmac('sha256', gatewayConfig.secret_key)
            .update(rawSignature)
            .digest('hex');
        if (params.signature !== expectedSignature) {
            console.error('MoMo signature verification failed');
            return c.json({ resultCode: 1, message: 'Invalid signature' });
        }
        // Get payment record
        const payment = await DB.prepare(`
        SELECT p.*, o.customer_id, o.cashier_id 
        FROM payments p 
        JOIN orders o ON p.order_id = o.id 
        WHERE p.id = ?
      `).bind(params.orderId).first();
        if (!payment) {
            return c.json({ resultCode: 1, message: 'Payment not found' });
        }
        // Update MoMo transaction
        await DB.prepare(`
        UPDATE momo_transactions 
        SET result_code = ?, message = ?, trans_id = ?, response_time = ?, updated_at = CURRENT_TIMESTAMP
        WHERE payment_id = ?
      `).bind(params.resultCode, params.message, params.transId || 0, params.responseTime, payment.id).run();
        // Determine payment status
        const isSuccess = params.resultCode === 0;
        const paymentStatus = isSuccess ? 'paid' : 'failed';
        const orderStatus = isSuccess ? 'completed' : 'cancelled';
        // Update payment status
        await DB.prepare(`
        UPDATE payments 
        SET status = ?, gateway_transaction_id = ?, gateway_response = ?, 
            webhook_received = 1, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(paymentStatus, String(params.transId || ''), JSON.stringify(params), payment.id).run();
        // Update order status if payment successful
        if (isSuccess) {
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
            `).bind(crypto.randomUUID(), payment.customer_id, payment.order_id, pointsToAward, `Earned from order ${payment.order_id}`).run();
                }
            }
        }
        return c.json({ resultCode: 0, message: 'Success' });
    }
    catch (error) {
        console.error('MoMo callback error:', error);
        return c.json({ resultCode: 1, message: 'Error processing callback' });
    }
})
    .post('/ipn', zValidator('json', momoCallbackSchema), async (c) => {
    // Instant Payment Notification handler (same logic as callback)
    return momoHandler.fetch(c.req.clone().url.replace('/ipn', '/callback'), c.req);
})
    .post('/refund', async (c) => {
    try {
        const { paymentId, amount, description } = await c.req.json();
        const { DB } = c.env;
        // Get payment and transaction details
        const payment = await DB.prepare(`
        SELECT p.*, mt.trans_id, mt.partner_code 
        FROM payments p 
        JOIN momo_transactions mt ON p.id = mt.payment_id 
        WHERE p.id = ? AND p.status = 'paid'
      `).bind(paymentId).first();
        if (!payment) {
            return c.json({ error: 'Payment not found or not eligible for refund' }, 400);
        }
        const gatewayConfig = await DB.prepare(`
        SELECT * FROM payment_gateways 
        WHERE type = 'momo' AND merchant_id = ?
      `).bind(payment.partner_code).first();
        if (!gatewayConfig) {
            return c.json({ error: 'Gateway configuration not found' }, 500);
        }
        const refundId = crypto.randomUUID();
        const requestId = crypto.randomUUID();
        const refundRequest = {
            partnerCode: gatewayConfig.merchant_id,
            orderId: refundId,
            requestId: requestId,
            amount: amount,
            transId: payment.trans_id,
            lang: 'vi',
            description: description || 'Refund request',
        };
        // Create signature for refund
        const rawSignature = `accessKey=${gatewayConfig.api_key}&amount=${amount}&description=${refundRequest.description}&orderId=${refundId}&partnerCode=${gatewayConfig.merchant_id}&requestId=${requestId}&transId=${payment.trans_id}`;
        const signature = crypto
            .createHmac('sha256', gatewayConfig.secret_key)
            .update(rawSignature)
            .digest('hex');
        // Make refund API call to MoMo
        const refundEndpoint = gatewayConfig.sandbox_mode
            ? 'https://test-payment.momo.vn/v2/gateway/api/refund'
            : 'https://payment.momo.vn/v2/gateway/api/refund';
        const refundResponse = await fetch(refundEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...refundRequest,
                accessKey: gatewayConfig.api_key,
                signature: signature,
            }),
        });
        const refundResult = await refundResponse.json();
        // Create refund record
        await DB.prepare(`
        INSERT INTO payments (
          id, order_id, method, amount, status, gateway_id,
          gateway_transaction_id, gateway_response, original_amount,
          original_currency, created_at
        ) VALUES (?, ?, 'momo_refund', ?, ?, ?, ?, ?, ?, 'VND', CURRENT_TIMESTAMP)
      `).bind(refundId, payment.order_id, -amount, 'pending', gatewayConfig.id, refundResult.transId || '', JSON.stringify(refundResult), amount).run();
        if (refundResult.resultCode === 0) {
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
            success: refundResult.resultCode === 0,
            refundId,
            message: refundResult.message,
            transId: refundResult.transId,
        });
    }
    catch (error) {
        console.error('MoMo refund error:', error);
        return c.json({ error: 'Refund processing failed' }, 500);
    }
})
    .get('/status/:paymentId', async (c) => {
    try {
        const paymentId = c.req.param('paymentId');
        const { DB } = c.env;
        const payment = await DB.prepare(`
        SELECT p.*, mt.result_code, mt.trans_id, mt.message as momo_message
        FROM payments p
        LEFT JOIN momo_transactions mt ON p.id = mt.payment_id
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
            momoResultCode: payment.result_code,
            transId: payment.trans_id,
            message: payment.momo_message,
            createdAt: payment.created_at,
            updatedAt: payment.updated_at,
        });
    }
    catch (error) {
        console.error('MoMo status check error:', error);
        return c.json({ error: 'Status check failed' }, 500);
    }
});
