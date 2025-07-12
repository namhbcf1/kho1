// ZaloPay webhook handling
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import crypto from 'crypto';

const zalopayCallbackSchema = z.object({
  data: z.string(),
  mac: z.string(),
  type: z.number(),
});

export const zalopayHandler = new Hono()
  .post('/create', async (c) => {
    try {
      const { amount, description, appTransId, bankCode = '' } = await c.req.json();
      const { DB } = c.env;

      const embedData = JSON.stringify({});
      const items = JSON.stringify([]);
      
      const zalopayConfig = {
        app_id: parseInt(c.env.ZALOPAY_APP_ID),
        app_trans_id: appTransId,
        app_user: 'user123',
        app_time: Date.now(),
        amount,
        description,
        bank_code: bankCode,
        item: items,
        embed_data: embedData,
        callback_url: `${c.env.API_BASE_URL}/api/payments/zalopay/callback`,
      };

      // Create MAC
      const data = `${zalopayConfig.app_id}|${zalopayConfig.app_trans_id}|${zalopayConfig.app_user}|${zalopayConfig.amount}|${zalopayConfig.app_time}|${zalopayConfig.embed_data}|${zalopayConfig.item}`;
      const mac = crypto
        .createHmac('sha256', c.env.ZALOPAY_KEY1)
        .update(data)
        .digest('hex');

      // Send request to ZaloPay
      const response = await fetch('https://sb-openapi.zalopay.vn/v2/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          ...zalopayConfig,
          mac,
        }),
      });

      const result = await response.json();

      // Save payment record
      await DB.prepare(`
        INSERT INTO payments (id, order_id, method, amount, status, gateway_data, created_at)
        VALUES (?, ?, 'zalopay', ?, 'pending', ?, CURRENT_TIMESTAMP)
      `).bind(crypto.randomUUID(), appTransId, amount, JSON.stringify(zalopayConfig)).run();

      return c.json(result);
    } catch (error) {
      console.error('ZaloPay create error:', error);
      return c.json({ error: 'Payment creation failed' }, 500);
    }
  })

  .post('/callback', zValidator('json', zalopayCallbackSchema), async (c) => {
    try {
      const { data, mac } = c.req.valid('json');
      const { DB } = c.env;

      // Verify MAC
      const expectedMac = crypto
        .createHmac('sha256', c.env.ZALOPAY_KEY2)
        .update(data)
        .digest('hex');

      if (mac !== expectedMac) {
        return c.json({ return_code: -1, return_message: 'Invalid MAC' });
      }

      // Parse callback data
      const callbackData = JSON.parse(data);
      const appTransId = callbackData.app_trans_id;

      // Update payment status
      await DB.prepare(`
        UPDATE payments 
        SET status = 'completed', gateway_response = ?, updated_at = CURRENT_TIMESTAMP
        WHERE order_id = ? AND method = 'zalopay'
      `).bind(data, appTransId).run();

      // Update order status
      await DB.prepare(`
        UPDATE orders 
        SET payment_status = 'paid', status = 'completed', updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(appTransId).run();

      return c.json({ return_code: 1, return_message: 'Success' });
    } catch (error) {
      console.error('ZaloPay callback error:', error);
      return c.json({ return_code: 0, return_message: 'Error' });
    }
  });
