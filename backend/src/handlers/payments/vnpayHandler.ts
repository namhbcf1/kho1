// VNPay webhook handling
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import crypto from 'crypto';

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

export const vnpayHandler = new Hono()
  .post('/create', async (c) => {
    try {
      const { amount, orderId, orderInfo, returnUrl } = await c.req.json();
      const { DB } = c.env;

      // Create VNPay payment URL
      const vnpayConfig = {
        vnp_Version: '2.1.0',
        vnp_Command: 'pay',
        vnp_TmnCode: c.env.VNPAY_MERCHANT_ID,
        vnp_Amount: amount * 100, // VNPay expects amount in VND cents
        vnp_CurrCode: 'VND',
        vnp_TxnRef: orderId,
        vnp_OrderInfo: orderInfo,
        vnp_OrderType: 'other',
        vnp_Locale: 'vn',
        vnp_ReturnUrl: returnUrl,
        vnp_IpAddr: c.req.header('CF-Connecting-IP') || '127.0.0.1',
        vnp_CreateDate: new Date().toISOString().replace(/[-:]/g, '').split('.')[0],
      };

      // Create secure hash
      const sortedParams = Object.keys(vnpayConfig)
        .sort()
        .map(key => `${key}=${vnpayConfig[key]}`)
        .join('&');
      
      const secureHash = crypto
        .createHmac('sha512', c.env.VNPAY_SECRET_KEY)
        .update(sortedParams)
        .digest('hex');

      const paymentUrl = `https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?${sortedParams}&vnp_SecureHash=${secureHash}`;

      // Save payment record
      await DB.prepare(`
        INSERT INTO payments (id, order_id, method, amount, status, gateway_data, created_at)
        VALUES (?, ?, 'vnpay', ?, 'pending', ?, CURRENT_TIMESTAMP)
      `).bind(crypto.randomUUID(), orderId, amount, JSON.stringify(vnpayConfig)).run();

      return c.json({ paymentUrl });
    } catch (error) {
      console.error('VNPay create error:', error);
      return c.json({ error: 'Payment creation failed' }, 500);
    }
  })

  .post('/callback', zValidator('json', vnpayCallbackSchema), async (c) => {
    try {
      const params = c.req.valid('json');
      const { DB } = c.env;

      // Verify secure hash
      const { vnp_SecureHash, ...otherParams } = params;
      const sortedParams = Object.keys(otherParams)
        .sort()
        .map(key => `${key}=${otherParams[key]}`)
        .join('&');
      
      const expectedHash = crypto
        .createHmac('sha512', c.env.VNPAY_SECRET_KEY)
        .update(sortedParams)
        .digest('hex');

      if (vnp_SecureHash !== expectedHash) {
        return c.json({ error: 'Invalid signature' }, 400);
      }

      // Update payment status
      const status = params.vnp_ResponseCode === '00' ? 'completed' : 'failed';
      await DB.prepare(`
        UPDATE payments 
        SET status = ?, gateway_response = ?, updated_at = CURRENT_TIMESTAMP
        WHERE order_id = ? AND method = 'vnpay'
      `).bind(status, JSON.stringify(params), params.vnp_TxnRef).run();

      // Update order status if payment successful
      if (status === 'completed') {
        await DB.prepare(`
          UPDATE orders 
          SET payment_status = 'paid', status = 'completed', updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).bind(params.vnp_TxnRef).run();
      }

      return c.json({ RspCode: '00', Message: 'Success' });
    } catch (error) {
      console.error('VNPay callback error:', error);
      return c.json({ RspCode: '99', Message: 'Error' });
    }
  });
