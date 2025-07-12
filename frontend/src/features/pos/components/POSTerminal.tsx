import React, { useState } from 'react';
import { Row, Col, Card, Button, Space } from 'antd';
import { ShoppingCartOutlined, ScanOutlined, PrinterOutlined } from '@ant-design/icons';
import { ProductGrid } from './ProductGrid';
import { ShoppingCart } from './ShoppingCart';
import { PaymentMethods } from './PaymentMethods';
import { BarcodeScanner } from '../../../components/business/BarcodeScanner';
import { usePOS } from '../hooks/usePOS';
import type { POSTerminalProps } from '../types/pos.types';

export const POSTerminal: React.FC<POSTerminalProps> = ({
  onOrderComplete,
}) => {
  const [scannerVisible, setScannerVisible] = useState(false);
  const [paymentVisible, setPaymentVisible] = useState(false);
  
  const {
    cart,
    products,
    loading,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    processOrder,
  } = usePOS();

  const handleProductSelect = (product: any) => {
    addToCart(product);
  };

  const handleBarcodeScanned = (barcode: string) => {
    // Find product by barcode and add to cart
    const product = products.find(p => p.barcode === barcode);
    if (product) {
      addToCart(product);
    }
    setScannerVisible(false);
  };

  const handleCheckout = () => {
    if (cart.length > 0) {
      setPaymentVisible(true);
    }
  };

  const handlePaymentComplete = async (paymentData: any) => {
    try {
      const order = await processOrder(paymentData);
      setPaymentVisible(false);
      clearCart();
      onOrderComplete?.(order);
    } catch (error) {
      console.error('Order processing failed:', error);
    }
  };

  return (
    <div style={{ height: '100vh', padding: '16px' }}>
      <Row gutter={16} style={{ height: '100%' }}>
        {/* Product Selection */}
        <Col span={16}>
          <Card 
            title="Sản phẩm" 
            style={{ height: '100%' }}
            extra={
              <Space>
                <Button 
                  icon={<ScanOutlined />}
                  onClick={() => setScannerVisible(true)}
                >
                  Quét mã vạch
                </Button>
              </Space>
            }
          >
            <ProductGrid 
              products={products}
              loading={loading}
              onProductSelect={handleProductSelect}
            />
          </Card>
        </Col>

        {/* Shopping Cart */}
        <Col span={8}>
          <Card 
            title={
              <Space>
                <ShoppingCartOutlined />
                Giỏ hàng ({cart.length})
              </Space>
            }
            style={{ height: '100%' }}
            extra={
              <Button 
                type="primary" 
                size="large"
                disabled={cart.length === 0}
                onClick={handleCheckout}
              >
                Thanh toán
              </Button>
            }
          >
            <ShoppingCart
              items={cart}
              onUpdateQuantity={updateQuantity}
              onRemoveItem={removeFromCart}
              onClear={clearCart}
              total={getCartTotal()}
            />
          </Card>
        </Col>
      </Row>

      {/* Barcode Scanner Modal */}
      <BarcodeScanner
        visible={scannerVisible}
        onScan={handleBarcodeScanned}
        onClose={() => setScannerVisible(false)}
      />

      {/* Payment Modal */}
      <PaymentMethods
        visible={paymentVisible}
        cart={cart}
        total={getCartTotal()}
        onPaymentComplete={handlePaymentComplete}
        onCancel={() => setPaymentVisible(false)}
      />
    </div>
  );
};

export default POSTerminal;
