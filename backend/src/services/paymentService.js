// Payment service for Vietnamese payment gateways
import crypto from 'crypto';
export class PaymentService {
    // VNPay integration
    static async createVNPayPayment(payment, env) {
        try {
            const vnpUrl = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
            const secretKey = env.VNPAY_SECRET_KEY;
            const merchantId = env.VNPAY_MERCHANT_ID;
            if (!secretKey || !merchantId) {
                throw new Error('VNPay credentials not configured');
            }
            const createDate = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
            const transactionId = `${Date.now()}`;
            const params = {
                vnp_Version: '2.1.0',
                vnp_Command: 'pay',
                vnp_TmnCode: merchantId,
                vnp_Amount: (payment.amount * 100).toString(), // VNPay expects amount in xu (1/100 VND)
                vnp_CurrCode: 'VND',
                vnp_TxnRef: transactionId,
                vnp_OrderInfo: payment.orderInfo,
                vnp_OrderType: 'other',
                vnp_Locale: 'vn',
                vnp_ReturnUrl: payment.returnUrl,
                vnp_IpAddr: payment.ipAddress,
                vnp_CreateDate: createDate,
            };
            // Sort parameters
            const sortedParams = Object.keys(params)
                .sort()
                .reduce((result, key) => {
                result[key] = params[key];
                return result;
            }, {});
            // Create query string
            const queryString = Object.keys(sortedParams)
                .map(key => `${key}=${encodeURIComponent(sortedParams[key])}`)
                .join('&');
            // Create signature
            const hmac = crypto.createHmac('sha512', secretKey);
            hmac.update(queryString);
            const signature = hmac.digest('hex');
            const paymentUrl = `${vnpUrl}?${queryString}&vnp_SecureHash=${signature}`;
            return {
                success: true,
                paymentUrl,
                transactionId,
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'VNPay payment creation failed',
            };
        }
    }
    // MoMo integration
    static async createMoMoPayment(payment, env) {
        try {
            const endpoint = 'https://test-payment.momo.vn/v2/gateway/api/create';
            const partnerCode = env.MOMO_PARTNER_CODE;
            const accessKey = env.MOMO_ACCESS_KEY;
            const secretKey = env.MOMO_SECRET_KEY;
            if (!partnerCode || !accessKey || !secretKey) {
                throw new Error('MoMo credentials not configured');
            }
            const orderId = `${Date.now()}`;
            const requestId = orderId;
            const extraData = '';
            const orderGroupId = '';
            const autoCapture = true;
            const lang = 'vi';
            // Create signature
            const rawSignature = `accessKey=${accessKey}&amount=${payment.amount}&extraData=${extraData}&ipnUrl=${payment.notifyUrl}&orderId=${orderId}&orderInfo=${payment.orderInfo}&partnerCode=${partnerCode}&redirectUrl=${payment.returnUrl}&requestId=${requestId}&requestType=payWithMethod`;
            const signature = crypto
                .createHmac('sha256', secretKey)
                .update(rawSignature)
                .digest('hex');
            const requestBody = {
                partnerCode,
                partnerName: 'KhoAugment POS',
                storeId: 'KhoAugmentStore',
                requestId,
                amount: payment.amount,
                orderId,
                orderInfo: payment.orderInfo,
                redirectUrl: payment.returnUrl,
                ipnUrl: payment.notifyUrl,
                lang,
                requestType: 'payWithMethod',
                autoCapture,
                extraData,
                orderGroupId,
                signature,
            };
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });
            const result = await response.json();
            if (result.resultCode === 0) {
                return {
                    success: true,
                    paymentUrl: result.payUrl,
                    transactionId: orderId,
                };
            }
            else {
                return {
                    success: false,
                    error: result.message || 'MoMo payment creation failed',
                };
            }
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'MoMo payment creation failed',
            };
        }
    }
    // ZaloPay integration
    static async createZaloPayPayment(payment, env) {
        try {
            const endpoint = 'https://sb-openapi.zalopay.vn/v2/create';
            const appId = env.ZALOPAY_APP_ID;
            const key1 = env.ZALOPAY_KEY1;
            const key2 = env.ZALOPAY_KEY2;
            if (!appId || !key1 || !key2) {
                throw new Error('ZaloPay credentials not configured');
            }
            const transId = `${Date.now()}`;
            const appTime = Date.now();
            const appTransId = `${new Date().toISOString().slice(0, 6).replace(/-/g, '')}${appId}${transId}`;
            const orderData = {
                app_id: parseInt(appId),
                app_trans_id: appTransId,
                app_user: 'user123',
                app_time: appTime,
                item: JSON.stringify([]),
                embed_data: JSON.stringify({
                    redirecturl: payment.callbackUrl,
                }),
                amount: payment.amount,
                description: payment.description,
                bank_code: '',
                callback_url: payment.callbackUrl,
            };
            // Create MAC
            const data = `${orderData.app_id}|${orderData.app_trans_id}|${orderData.app_user}|${orderData.amount}|${orderData.app_time}|${orderData.embed_data}|${orderData.item}`;
            const mac = crypto.createHmac('sha256', key1).update(data).digest('hex');
            const requestBody = {
                ...orderData,
                mac,
            };
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams(requestBody).toString(),
            });
            const result = await response.json();
            if (result.return_code === 1) {
                return {
                    success: true,
                    paymentUrl: result.order_url,
                    transactionId: appTransId,
                };
            }
            else {
                return {
                    success: false,
                    error: result.return_message || 'ZaloPay payment creation failed',
                };
            }
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'ZaloPay payment creation failed',
            };
        }
    }
    // Verify VNPay callback
    static verifyVNPayCallback(params, secretKey) {
        try {
            const secureHash = params.vnp_SecureHash;
            delete params.vnp_SecureHash;
            delete params.vnp_SecureHashType;
            const sortedParams = Object.keys(params)
                .sort()
                .reduce((result, key) => {
                result[key] = params[key];
                return result;
            }, {});
            const queryString = Object.keys(sortedParams)
                .map(key => `${key}=${sortedParams[key]}`)
                .join('&');
            const hmac = crypto.createHmac('sha512', secretKey);
            hmac.update(queryString);
            const signature = hmac.digest('hex');
            return signature === secureHash;
        }
        catch (error) {
            return false;
        }
    }
    // Verify MoMo callback
    static verifyMoMoCallback(params, secretKey) {
        try {
            const { partnerCode, orderId, requestId, amount, orderInfo, orderType, transId, resultCode, message, payType, responseTime, extraData, signature, } = params;
            const rawSignature = `accessKey=${params.accessKey}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;
            const expectedSignature = crypto
                .createHmac('sha256', secretKey)
                .update(rawSignature)
                .digest('hex');
            return signature === expectedSignature;
        }
        catch (error) {
            return false;
        }
    }
    // Verify ZaloPay callback
    static verifyZaloPayCallback(params, key2) {
        try {
            const { data, mac } = params;
            const expectedMac = crypto.createHmac('sha256', key2).update(data).digest('hex');
            return mac === expectedMac;
        }
        catch (error) {
            return false;
        }
    }
}
