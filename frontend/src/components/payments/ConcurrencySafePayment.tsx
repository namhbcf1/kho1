/**
 * Concurrency-Safe Payment Component
 * Fixes: React 18 concurrent rendering payment issues
 * Implements: Safe payment flows, race condition prevention
 */

import React, { useCallback, useEffect, useRef, useMemo, startTransition } from 'react';
import { Button, Alert, Spin, Modal } from 'antd';
import { usePaymentFlowState } from '../../hooks/useConcurrencySafeState';

export interface PaymentRequest {
  orderId: string;
  amount: number;
  currency: string;
  paymentMethod: 'vnpay' | 'momo' | 'zalopay' | 'cash' | 'card';
  customerId: string;
}

export interface ConcurrencySafePaymentProps {
  paymentRequest: PaymentRequest;
  onSuccess: (transactionId: string) => void;
  onError: (error: string) => void;
  onCancel: () => void;
  disabled?: boolean;
}

/**
 * Payment component with concurrency safety
 */
export const ConcurrencySafePayment: React.FC<ConcurrencySafePaymentProps> = ({
  paymentRequest,
  onSuccess,
  onError,
  onCancel,
  disabled = false
}) => {
  const paymentFlow = usePaymentFlowState();
  const processingRef = useRef<boolean>(false);
  const attemptCountRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Prevent multiple simultaneous payment attempts
  const isProcessing = useMemo(() => {
    return paymentFlow.state.status === 'processing' || processingRef.current;
  }, [paymentFlow.state.status]);

  /**
   * Process payment with concurrency protection
   */
  const processPayment = useCallback(async () => {
    // Double-check to prevent race conditions
    if (isProcessing || disabled) {
      console.warn('Payment already in progress or disabled');
      return;
    }

    // Set processing flag immediately
    processingRef.current = true;
    attemptCountRef.current += 1;

    try {
      // Start payment transaction
      const startResult = await paymentFlow.startPayment(
        paymentRequest.orderId,
        paymentRequest.amount,
        paymentRequest.paymentMethod
      );

      if (!startResult.success) {
        throw new Error(startResult.error || 'Failed to start payment');
      }

      // Set timeout for payment processing
      timeoutRef.current = setTimeout(() => {
        paymentFlow.failPayment('Payment timeout - please try again');
        processingRef.current = false;
        onError('Payment processing timed out');
      }, 60000); // 60 seconds timeout

      // Use startTransition to prevent blocking UI updates
      startTransition(async () => {
        try {
          // Call actual payment API
          const paymentResult = await callPaymentAPI(paymentRequest);
          
          if (paymentResult.success) {
            // Clear timeout
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
            }

            // Complete payment transaction
            const completeResult = await paymentFlow.completePayment(paymentResult.transactionId);
            
            if (completeResult.success) {
              processingRef.current = false;
              onSuccess(paymentResult.transactionId);
            } else {
              throw new Error('Failed to complete payment transaction');
            }
          } else {
            throw new Error(paymentResult.error || 'Payment failed');
          }
        } catch (error) {
          // Clear timeout
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }

          // Fail payment transaction
          await paymentFlow.failPayment(error.message);
          processingRef.current = false;
          onError(error.message);
        }
      });

    } catch (error) {
      processingRef.current = false;
      await paymentFlow.failPayment(error.message);
      onError(error.message);
    }
  }, [
    isProcessing,
    disabled,
    paymentRequest,
    paymentFlow,
    onSuccess,
    onError
  ]);

  /**
   * Cancel payment safely
   */
  const cancelPayment = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    processingRef.current = false;
    
    startTransition(() => {
      paymentFlow.setState(async (current) => ({
        ...current,
        status: 'idle',
        errors: []
      }));
    });
    
    onCancel();
  }, [paymentFlow, onCancel]);

  /**
   * Retry payment with exponential backoff
   */
  const retryPayment = useCallback(() => {
    if (attemptCountRef.current >= 3) {
      onError('Maximum payment attempts exceeded');
      return;
    }

    // Reset state and retry
    startTransition(() => {
      processingRef.current = false;
      paymentFlow.setState(async (current) => ({
        ...current,
        status: 'idle',
        errors: []
      }));
    });

    // Exponential backoff delay
    const delay = Math.pow(2, attemptCountRef.current) * 1000;
    setTimeout(() => {
      processPayment();
    }, delay);
  }, [processPayment, onError, paymentFlow]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      processingRef.current = false;
    };
  }, []);

  // Render payment status
  const renderPaymentStatus = () => {
    const { status, errors } = paymentFlow.state;

    switch (status) {
      case 'processing':
        return (
          <div className="payment-processing">
            <Spin size="large" />
            <p>Processing payment...</p>
            <p>Please do not close this window or navigate away.</p>
            <Button 
              onClick={cancelPayment}
              disabled={false}
              danger
            >
              Cancel Payment
            </Button>
          </div>
        );

      case 'completed':
        return (
          <Alert
            message="Payment Successful"
            description="Your payment has been processed successfully."
            type="success"
            showIcon
          />
        );

      case 'failed':
        return (
          <div className="payment-failed">
            <Alert
              message="Payment Failed"
              description={errors.join(', ') || 'Payment processing failed'}
              type="error"
              showIcon
            />
            {attemptCountRef.current < 3 && (
              <Button 
                onClick={retryPayment}
                type="primary"
                style={{ marginTop: 16 }}
              >
                Retry Payment ({3 - attemptCountRef.current} attempts remaining)
              </Button>
            )}
          </div>
        );

      default:
        return (
          <div className="payment-ready">
            <Button
              type="primary"
              size="large"
              onClick={processPayment}
              disabled={disabled || isProcessing}
              loading={isProcessing}
              block
            >
              Pay {formatCurrency(paymentRequest.amount, paymentRequest.currency)}
            </Button>
          </div>
        );
    }
  };

  return (
    <div className="concurrency-safe-payment">
      <div className="payment-details">
        <h3>Payment Details</h3>
        <p>Order ID: {paymentRequest.orderId}</p>
        <p>Amount: {formatCurrency(paymentRequest.amount, paymentRequest.currency)}</p>
        <p>Payment Method: {paymentRequest.paymentMethod.toUpperCase()}</p>
        {paymentFlow.pendingTransactions > 0 && (
          <Alert
            message="Concurrent Operations Detected"
            description={`${paymentFlow.pendingTransactions} pending transaction(s)`}
            type="warning"
            style={{ marginBottom: 16 }}
          />
        )}
      </div>
      
      {renderPaymentStatus()}
      
      {/* Debug info in development */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{ marginTop: 20, padding: 16, background: '#f5f5f5' }}>
          <h4>Debug Info</h4>
          <p>Status: {paymentFlow.state.status}</p>
          <p>Attempts: {attemptCountRef.current}</p>
          <p>Version: {paymentFlow.version}</p>
          <p>Pending Transactions: {paymentFlow.pendingTransactions}</p>
          <p>Processing Ref: {processingRef.current.toString()}</p>
        </div>
      )}
    </div>
  );
};

/**
 * Mock payment API call (replace with actual implementation)
 */
async function callPaymentAPI(request: PaymentRequest): Promise<{
  success: boolean;
  transactionId?: string;
  error?: string;
}> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Simulate payment processing
  const success = Math.random() > 0.1; // 90% success rate for testing

  if (success) {
    return {
      success: true,
      transactionId: `txn_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    };
  } else {
    return {
      success: false,
      error: 'Payment gateway error - please try again'
    };
  }
}

/**
 * Format currency for display
 */
function formatCurrency(amount: number, currency: string): string {
  if (currency === 'VND') {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0
    }).format(amount);
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount);
}

/**
 * Payment Modal with concurrency protection
 */
export const PaymentModal: React.FC<{
  visible: boolean;
  paymentRequest: PaymentRequest;
  onSuccess: (transactionId: string) => void;
  onError: (error: string) => void;
  onCancel: () => void;
}> = ({ visible, paymentRequest, onSuccess, onError, onCancel }) => {
  return (
    <Modal
      title="Payment Processing"
      open={visible}
      footer={null}
      closable={false}
      maskClosable={false}
      width={500}
    >
      <ConcurrencySafePayment
        paymentRequest={paymentRequest}
        onSuccess={onSuccess}
        onError={onError}
        onCancel={onCancel}
      />
    </Modal>
  );
};

export default ConcurrencySafePayment;