// Real VNPay integration component with Vietnamese payment gateway
import React, { useState } from 'react';
import { Button, Modal, QRCode, Spin, Alert, Radio, Card, Typography, Space, Divider } from 'antd';
import { CreditCardOutlined, BankOutlined, QrcodeOutlined, MobileOutlined } from '@ant-design/icons';
import { vnpayService, VNPayPaymentRequest } from '../../../services/api/vnpayService';
import { formatVND } from '../../../utils/formatters/vndCurrency';

const { Text, Title } = Typography;

interface VNPayGatewayProps {
  orderId: string;
  amount: number;
  orderInfo: string;
  customerInfo?: {
    name: string;
    phone: string;
    email?: string;
    address?: string;
  };
  onPaymentSuccess: (transactionData: any) => void;
  onPaymentError: (error: string) => void;
  onCancel: () => void;
}

export const VNPayGateway: React.FC<VNPayGatewayProps> = ({
  orderId,
  amount,
  orderInfo,
  customerInfo,
  onPaymentSuccess,
  onPaymentError,
  onCancel
}) => {
  const [showModal, setShowModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'ATM' | 'CC' | 'QRCODE'>('QRCODE');
  const [selectedBank, setSelectedBank] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState<string>('');
  const [paymentUrl, setPaymentUrl] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [supportedBanks, setSupportedBanks] = useState<Array<{
    bankCode: string;
    bankName: string;
    logo: string;
    isActive: boolean;
  }>>([]);

  const loadSupportedBanks = async () => {
    try {
      const banks = await vnpayService.getSupportedBanks();
      setSupportedBanks(banks.filter(bank => bank.isActive));
    } catch (err) {
      // Use fallback banks if API fails
      setSupportedBanks([
        { bankCode: 'NCB', bankName: 'Ngân hàng NCB', logo: '', isActive: true },
        { bankCode: 'AGRIBANK', bankName: 'Ngân hàng Agribank', logo: '', isActive: true },
        { bankCode: 'SCB', bankName: 'Ngân hàng SCB', logo: '', isActive: true },
        { bankCode: 'SACOMBANK', bankName: 'Ngân hàng SacomBank', logo: '', isActive: true },
        { bankCode: 'EXIMBANK', bankName: 'Ngân hàng EximBank', logo: '', isActive: true },
        { bankCode: 'MSBANK', bankName: 'Ngân hàng MSBANK', logo: '', isActive: true },
        { bankCode: 'NAMABANK', bankName: 'Ngân hàng NamABank', logo: '', isActive: true },
        { bankCode: 'VNMART', bankName: 'Ví VnMart', logo: '', isActive: true },
        { bankCode: 'VIETINBANK', bankName: 'Ngân hàng Vietinbank', logo: '', isActive: true },
        { bankCode: 'VIETCOMBANK', bankName: 'Ngân hàng VCB', logo: '', isActive: true },
        { bankCode: 'HDBANK', bankName: 'Ngân hàng HDBank', logo: '', isActive: true },
        { bankCode: 'DONGABANK', bankName: 'Ngân hàng Dong A', logo: '', isActive: true },
        { bankCode: 'TPBANK', bankName: 'Ngân hàng TPBank', logo: '', isActive: true },
        { bankCode: 'OJB', bankName: 'Ngân hàng OceanBank', logo: '', isActive: true },
        { bankCode: 'BIDV', bankName: 'Ngân hàng BIDV', logo: '', isActive: true },
        { bankCode: 'TECHCOMBANK', bankName: 'Ngân hàng Techcombank', logo: '', isActive: true },
        { bankCode: 'VPBANK', bankName: 'Ngân hàng VPBank', logo: '', isActive: true },
        { bankCode: 'MBBANK', bankName: 'Ngân hàng MBBank', logo: '', isActive: true },
        { bankCode: 'ACB', bankName: 'Ngân hàng ACB', logo: '', isActive: true },
        { bankCode: 'OCB', bankName: 'Ngân hàng OCB', logo: '', isActive: true },
        { bankCode: 'IVB', bankName: 'Ngân hàng IVB', logo: '', isActive: true },
        { bankCode: 'VISA', bankName: 'Thanh toán qua VISA/MASTER', logo: '', isActive: true },
      ]);
    }
  };

  const handleShowPayment = () => {
    setShowModal(true);
    setError(null);
    loadSupportedBanks();
  };

  const handlePayment = async () => {
    try {
      setLoading(true);
      setError(null);

      const paymentRequest: VNPayPaymentRequest = {
        orderId,
        amount,
        orderInfo,
        customerName: customerInfo?.name,
        customerPhone: customerInfo?.phone,
        customerEmail: customerInfo?.email,
        customerAddress: customerInfo?.address,
        bankCode: paymentMethod === 'QRCODE' ? undefined : selectedBank,
        paymentMethod,
        expireTime: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes
      };

      const response = await vnpayService.createPayment(paymentRequest);

      if (paymentMethod === 'QRCODE') {
        setQrCode(response.qrCode || '');
        // Set up polling to check payment status
        startPaymentStatusPolling(response.transactionId);
      } else {
        setPaymentUrl(response.paymentUrl);
        // Redirect to VNPay
        window.open(response.paymentUrl, '_self');
      }
    } catch (err: any) {
      setError(err.message || 'Không thể tạo giao dịch thanh toán. Vui lòng thử lại.');
      onPaymentError(err.message || 'VNPay payment failed');
    } finally {
      setLoading(false);
    }
  };

  const startPaymentStatusPolling = (transactionId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const status = await vnpayService.queryTransaction({
          orderId,
          transactionDate: new Date().toISOString().split('T')[0]
        });

        if (status.status === 'SUCCESS') {
          clearInterval(pollInterval);
          setShowModal(false);
          onPaymentSuccess(status);
        } else if (status.status === 'FAILED' || status.status === 'CANCELLED') {
          clearInterval(pollInterval);
          setError(vnpayService.getResponseCodeMessage(status.responseCode));
        }
      } catch (err) {
        // Continue polling
      }
    }, 3000); // Poll every 3 seconds

    // Stop polling after 10 minutes
    setTimeout(() => {
      clearInterval(pollInterval);
      if (showModal) {
        setError('Giao dịch đã hết hạn. Vui lòng thử lại.');
      }
    }, 10 * 60 * 1000);
  };

  const handleCancel = () => {
    setShowModal(false);
    setQrCode('');
    setPaymentUrl('');
    setError(null);
    onCancel();
  };

  return (
    <>
      <Button
        type="primary"
        icon={<CreditCardOutlined />}
        onClick={handleShowPayment}
        style={{ backgroundColor: '#d32f2f' }}
        size="large"
        block
      >
        Thanh toán VNPay
      </Button>

      <Modal
        title={
          <div className="flex items-center space-x-2">
            <CreditCardOutlined style={{ color: '#d32f2f' }} />
            <span>Thanh toán VNPay</span>
          </div>
        }
        open={showModal}
        onCancel={handleCancel}
        footer={null}
        width={600}
        centered
      >
        <div className="space-y-4">
          {/* Order Summary */}
          <Card size="small" className="bg-gray-50">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Text>Mã đơn hàng:</Text>
                <Text strong>{orderId}</Text>
              </div>
              <div className="flex justify-between">
                <Text>Số tiền:</Text>
                <Text strong className="text-lg text-red-600">{formatVND(amount)}</Text>
              </div>
              <div className="flex justify-between">
                <Text>Nội dung:</Text>
                <Text>{orderInfo}</Text>
              </div>
              {customerInfo && (
                <div className="flex justify-between">
                  <Text>Khách hàng:</Text>
                  <Text>{customerInfo.name} - {customerInfo.phone}</Text>
                </div>
              )}
            </div>
          </Card>

          {error && (
            <Alert
              message="Lỗi thanh toán"
              description={error}
              type="error"
              showIcon
              closable
              onClose={() => setError(null)}
            />
          )}

          {!qrCode && !paymentUrl && (
            <>
              {/* Payment Method Selection */}
              <div>
                <Title level={5}>Chọn phương thức thanh toán:</Title>
                <Radio.Group 
                  value={paymentMethod} 
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full"
                >
                  <Space direction="vertical" className="w-full">
                    <Radio value="QRCODE">
                      <Space>
                        <QrcodeOutlined />
                        Quét mã QR (VNPay QR)
                      </Space>
                    </Radio>
                    <Radio value="ATM">
                      <Space>
                        <BankOutlined />
                        Thẻ ATM nội địa
                      </Space>
                    </Radio>
                    <Radio value="CC">
                      <Space>
                        <CreditCardOutlined />
                        Thẻ tín dụng/Ghi nợ quốc tế
                      </Space>
                    </Radio>
                  </Space>
                </Radio.Group>
              </div>

              {/* Bank Selection */}
              {paymentMethod !== 'QRCODE' && (
                <div>
                  <Title level={5}>Chọn ngân hàng:</Title>
                  <Radio.Group 
                    value={selectedBank} 
                    onChange={(e) => setSelectedBank(e.target.value)}
                    className="w-full"
                  >
                    <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                      {supportedBanks.map(bank => (
                        <Radio key={bank.bankCode} value={bank.bankCode} className="flex items-center p-2 border rounded hover:bg-gray-50">
                          <span className="ml-2">{bank.bankName}</span>
                        </Radio>
                      ))}
                    </div>
                  </Radio.Group>
                </div>
              )}

              <Button
                type="primary"
                onClick={handlePayment}
                loading={loading}
                disabled={paymentMethod !== 'QRCODE' && !selectedBank}
                size="large"
                block
                style={{ backgroundColor: '#d32f2f' }}
              >
                {loading ? 'Đang xử lý...' : 'Tiến hành thanh toán'}
              </Button>
            </>
          )}

          {/* QR Code Payment */}
          {qrCode && (
            <div style={{ textAlign: 'center' }}>
              <Title level={4}>Quét mã QR để thanh toán</Title>
              <div className="flex justify-center mb-4">
                <QRCode value={qrCode} size={200} />
              </div>
              <Alert
                message="Hướng dẫn thanh toán"
                description={
                  <div className="text-left">
                    <p>1. Mở ứng dụng VNPay trên điện thoại</p>
                    <p>2. Chọn "Quét QR" hoặc "Thanh toán QR"</p>
                    <p>3. Quét mã QR phía trên</p>
                    <p>4. Xác nhận thông tin và hoàn tất thanh toán</p>
                  </div>
                }
                type="info"
                showIcon
              />
              <div className="mt-4">
                <Spin /> <Text>Đang chờ thanh toán... (tự động kiểm tra)</Text>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
};

export default VNPayGateway;
