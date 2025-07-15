// Payment callbacks handler
import { Hono } from 'hono';
export const callbackHandler = new Hono()
    .get('/vnpay/return', async (c) => {
    try {
        const params = c.req.query();
        const { DB } = c.env;
        // Verify and process VNPay return
        const orderId = params.vnp_TxnRef;
        const responseCode = params.vnp_ResponseCode;
        if (responseCode === '00') {
            // Payment successful
            await DB.prepare(`
          UPDATE orders 
          SET payment_status = 'paid', status = 'completed', updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).bind(orderId).run();
            return c.redirect(`${c.env.FRONTEND_URL}/payment/success?orderId=${orderId}`);
        }
        else {
            // Payment failed
            return c.redirect(`${c.env.FRONTEND_URL}/payment/failed?orderId=${orderId}&error=${responseCode}`);
        }
    }
    catch (error) {
        console.error('VNPay return error:', error);
        return c.redirect(`${c.env.FRONTEND_URL}/payment/error`);
    }
})
    .get('/momo/return', async (c) => {
    try {
        const params = c.req.query();
        const orderId = params.orderId;
        const resultCode = params.resultCode;
        if (resultCode === '0') {
            return c.redirect(`${c.env.FRONTEND_URL}/payment/success?orderId=${orderId}`);
        }
        else {
            return c.redirect(`${c.env.FRONTEND_URL}/payment/failed?orderId=${orderId}&error=${resultCode}`);
        }
    }
    catch (error) {
        console.error('MoMo return error:', error);
        return c.redirect(`${c.env.FRONTEND_URL}/payment/error`);
    }
})
    .get('/zalopay/return', async (c) => {
    try {
        const params = c.req.query();
        const appTransId = params.apptransid;
        const status = params.status;
        if (status === '1') {
            return c.redirect(`${c.env.FRONTEND_URL}/payment/success?orderId=${appTransId}`);
        }
        else {
            return c.redirect(`${c.env.FRONTEND_URL}/payment/failed?orderId=${appTransId}&error=${status}`);
        }
    }
    catch (error) {
        console.error('ZaloPay return error:', error);
        return c.redirect(`${c.env.FRONTEND_URL}/payment/error`);
    }
});
