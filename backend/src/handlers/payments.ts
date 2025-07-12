// Payment handlers for Vietnamese payment gateways
import { PaymentService } from '../services/paymentService';
import { vnpayPaymentSchema, momoPaymentSchema, zalopayPaymentSchema } from '../../../shared/schemas';

export const paymentsHandlers = {
  // VNPay payment creation
  async createVNPayPayment(request: Request, env: any): Promise<Response> {
    try {
      const body = await request.json();
      const validatedData = vnpayPaymentSchema.parse(body);

      const result = await PaymentService.createVNPayPayment(validatedData, env);

      if (result.success) {
        return new Response(JSON.stringify({
          success: true,
          data: {
            paymentUrl: result.paymentUrl,
            transactionId: result.transactionId,
          },
        }), {
          headers: { 'Content-Type': 'application/json' },
        });
      } else {
        return new Response(JSON.stringify({
          success: false,
          error: {
            code: 'PAYMENT_CREATION_FAILED',
            message: result.error,
          },
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: error instanceof Error ? error.message : 'Invalid request data',
        },
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  },

  // VNPay callback handler
  async handleVNPayCallback(request: Request, env: any): Promise<Response> {
    try {
      const url = new URL(request.url);
      const params: Record<string, string> = {};
      
      for (const [key, value] of url.searchParams.entries()) {
        params[key] = value;
      }

      const isValid = PaymentService.verifyVNPayCallback(params, env.VNPAY_SECRET_KEY);
      
      if (!isValid) {
        return new Response(JSON.stringify({
          success: false,
          error: {
            code: 'INVALID_SIGNATURE',
            message: 'Invalid payment signature',
          },
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const { vnp_TxnRef, vnp_ResponseCode, vnp_TransactionStatus } = params;
      
      // Update order status based on payment result
      const paymentSuccess = vnp_ResponseCode === '00' && vnp_TransactionStatus === '00';
      
      // TODO: Update order in database
      // await updateOrderPaymentStatus(vnp_TxnRef, paymentSuccess ? 'paid' : 'failed');

      return new Response(JSON.stringify({
        success: true,
        data: {
          transactionId: vnp_TxnRef,
          status: paymentSuccess ? 'success' : 'failed',
          responseCode: vnp_ResponseCode,
        },
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        error: {
          code: 'CALLBACK_ERROR',
          message: error instanceof Error ? error.message : 'Callback processing failed',
        },
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  },

  // MoMo payment creation
  async createMoMoPayment(request: Request, env: any): Promise<Response> {
    try {
      const body = await request.json();
      const validatedData = momoPaymentSchema.parse(body);

      const result = await PaymentService.createMoMoPayment(validatedData, env);

      if (result.success) {
        return new Response(JSON.stringify({
          success: true,
          data: {
            paymentUrl: result.paymentUrl,
            transactionId: result.transactionId,
          },
        }), {
          headers: { 'Content-Type': 'application/json' },
        });
      } else {
        return new Response(JSON.stringify({
          success: false,
          error: {
            code: 'PAYMENT_CREATION_FAILED',
            message: result.error,
          },
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: error instanceof Error ? error.message : 'Invalid request data',
        },
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  },

  // MoMo callback handler
  async handleMoMoCallback(request: Request, env: any): Promise<Response> {
    try {
      const body = await request.json();
      
      const isValid = PaymentService.verifyMoMoCallback(body, env.MOMO_SECRET_KEY);
      
      if (!isValid) {
        return new Response(JSON.stringify({
          success: false,
          error: {
            code: 'INVALID_SIGNATURE',
            message: 'Invalid payment signature',
          },
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const { orderId, resultCode, transId } = body;
      const paymentSuccess = resultCode === 0;
      
      // TODO: Update order in database
      // await updateOrderPaymentStatus(orderId, paymentSuccess ? 'paid' : 'failed');

      return new Response(JSON.stringify({
        success: true,
        data: {
          orderId,
          transactionId: transId,
          status: paymentSuccess ? 'success' : 'failed',
        },
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        error: {
          code: 'CALLBACK_ERROR',
          message: error instanceof Error ? error.message : 'Callback processing failed',
        },
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  },

  // ZaloPay payment creation
  async createZaloPayPayment(request: Request, env: any): Promise<Response> {
    try {
      const body = await request.json();
      const validatedData = zalopayPaymentSchema.parse(body);

      const result = await PaymentService.createZaloPayPayment(validatedData, env);

      if (result.success) {
        return new Response(JSON.stringify({
          success: true,
          data: {
            paymentUrl: result.paymentUrl,
            transactionId: result.transactionId,
          },
        }), {
          headers: { 'Content-Type': 'application/json' },
        });
      } else {
        return new Response(JSON.stringify({
          success: false,
          error: {
            code: 'PAYMENT_CREATION_FAILED',
            message: result.error,
          },
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: error instanceof Error ? error.message : 'Invalid request data',
        },
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  },

  // ZaloPay callback handler
  async handleZaloPayCallback(request: Request, env: any): Promise<Response> {
    try {
      const body = await request.json();
      
      const isValid = PaymentService.verifyZaloPayCallback(body, env.ZALOPAY_KEY2);
      
      if (!isValid) {
        return new Response(JSON.stringify({
          success: false,
          error: {
            code: 'INVALID_SIGNATURE',
            message: 'Invalid payment signature',
          },
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const data = JSON.parse(body.data);
      const { app_trans_id, zp_trans_id } = data;
      
      // TODO: Update order in database
      // await updateOrderPaymentStatus(app_trans_id, 'paid');

      return new Response(JSON.stringify({
        success: true,
        data: {
          appTransId: app_trans_id,
          zpTransId: zp_trans_id,
          status: 'success',
        },
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        error: {
          code: 'CALLBACK_ERROR',
          message: error instanceof Error ? error.message : 'Callback processing failed',
        },
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  },
};
