// MoMo webhook handling
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import crypto from 'crypto';

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
  .post('/create', async (c) => {
    try {
      const { amount, orderId, orderInfo, redirectUrl } = await c.req.json();
      const { DB } = c.env;

      const requestId = `${orderId}_${Date.now()}`;
      const extraData = '';
      
      const momoConfig = {
        partnerCode: c.env.MOMO_PARTNER_CODE,
        requestId,
        amount,
        orderId,
        orderInfo,
        redirectUrl,
        ipnUrl: `${c.env.API_BASE_URL}/api/payments/momo/callback`,
        requestType: 'captureWallet',
        extraData,
        lang: 'vi',
      };

      // Create signature
      const rawSignature = `accessKey=${c.env.MOMO_ACCESS_KEY}&amount=${amount}&extraData=${extraData}&ipnUrl=${momoConfig.ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${c.env.MOMO_PARTNER_CODE}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=captureWallet`;
      
      const signature = crypto
        .createHmac('sha256', c.env.MOMO_SECRET_KEY)
        .update(rawSignature)
        .digest('hex');

      // Send request to MoMo
      const response = await fetch('https://test-payment.momo.vn/v2/gateway/api/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...momoConfig,
          signature,
        }),
      });

      const result = await response.json();

      // Save payment record
      await DB.prepare(`
        INSERT INTO payments (id, order_id, method, amount, status, gateway_data, created_at)
        VALUES (?, ?, 'momo', ?, 'pending', ?, CURRENT_TIMESTAMP)
      `).bind(crypto.randomUUID(), orderId, amount, JSON.stringify(momoConfig)).run();

      return c.json(result);
    } catch (error) {
      console.error('MoMo create error:', error);
      return c.json({ error: 'Payment creation failed' }, 500);
    }
  })

  .post('/callback', zValidator('json', momoCallbackSchema), async (c) => {
    try {
      const params = c.req.valid('json');
      const { DB } = c.env;

      // Verify signature
      const rawSignature = `accessKey=${c.env.MOMO_ACCESS_KEY}&amount=${params.amount}&extraData=${params.extraData}&message=${params.message}&orderId=${params.orderId}&orderInfo=${params.orderInfo}&orderType=${params.orderType}&partnerCode=${params.partnerCode}&payType=${params.payType}&requestId=${params.requestId}&responseTime=${params.responseTime}&resultCode=${params.resultCode}&transId=${params.transId}`;
      
      const expectedSignature = crypto
        .createHmac('sha256', c.env.MOMO_SECRET_KEY)
        .update(rawSignature)
        .digest('hex');

      if (params.signature !== expectedSignature) {
        return c.json({ error: 'Invalid signature' }, 400);
      }

      // Update payment status
      const status = params.resultCode === 0 ? 'completed' : 'failed';
      await DB.prepare(`
        UPDATE payments 
        SET status = ?, gateway_response = ?, updated_at = CURRENT_TIMESTAMP
        WHERE order_id = ? AND method = 'momo'
      `).bind(status, JSON.stringify(params), params.orderId).run();

      // Update order status if payment successful
      if (status === 'completed') {
        await DB.prepare(`
          UPDATE orders 
          SET payment_status = 'paid', status = 'completed', updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).bind(params.orderId).run();
      }

      return c.json({ message: 'Success' });
    } catch (error) {
      console.error('MoMo callback error:', error);
      return c.json({ error: 'Callback processing failed' }, 500);
    }
  });
