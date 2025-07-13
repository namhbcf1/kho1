// Production POS Terminal Component with Real Business Logic
import React, { useState, useEffect, useCallback } from 'react';
import { Row, Col, Card, Button, Space, Typography, Statistic, Alert, notification, Modal } from 'antd';
import { 
  ShoppingCartOutlined, 
  ScanOutlined, 
  PrinterOutlined, 
  UserOutlined,
  DisconnectOutlined,
  SyncOutlined,
  WifiOutlined
} from '@ant-design/icons';
import { ProductGrid } from './ProductGrid';
import { ShoppingCart } from './ShoppingCart';
import { PaymentMethods } from './PaymentMethods';
import { CustomerSelector } from './CustomerSelector';
import { OfflineSync } from './OfflineSync';
import { BarcodeScanner } from '../../../components/business/BarcodeScanner';
import { usePOS } from '../hooks/usePOS';
import { useOfflineOrders } from '../hooks/useOfflineOrders';
import { useNetworkStatus } from '../../../hooks/useNetworkStatus';
import { useAuth } from '../../../hooks/useAuth';
import { VietnameseTaxService } from '../../../utils/business/taxCalculations';
import type { POSTerminalProps, CartItem, Customer, PaymentMethod } from '../types/pos.types';

const { Text, Title } = Typography;

export const POSTerminal: React.FC<POSTerminalProps> = ({
  onOrderComplete,
}) => {
  const [scannerVisible, setScannerVisible] = useState(false);
  const [paymentVisible, setPaymentVisible] = useState(false);
  const [customerSelectorVisible, setCustomerSelectorVisible] = useState(false);
  const [offlineSyncVisible, setOfflineSyncVisible] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [shiftStartTime] = useState(Date.now());
  
  const { user } = useAuth();
  const { isOnline } = useNetworkStatus();
  const {
    cart,
    products,
    loading,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartCalculations,
    processOrder,
    refreshProducts,
    stockWarnings,
  } = usePOS();
  
  const {
    offlineOrders,
    addOfflineOrder,
    syncOfflineOrders,
    hasUnsyncedOrders,
  } = useOfflineOrders();

  // Real-time inventory check
  useEffect(() => {
    const interval = setInterval(() => {
      if (isOnline) {
        refreshProducts();
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [isOnline, refreshProducts]);

  // Show sync notification when coming back online
  useEffect(() => {
    if (isOnline && hasUnsyncedOrders) {
      notification.warning({
        message: 'Có đơn hàng chưa đồng bộ',
        description: 'Bạn có đơn hàng offline chưa được đồng bộ lên server. Nhấp để xem.',
        duration: 0,
        key: 'offline-sync',
        btn: (
          <Button 
            size="small" 
            type="primary" 
            onClick={() => setOfflineSyncVisible(true)}
          >
            Xem đơn hàng
          </Button>
        ),
      });
    }
  }, [isOnline, hasUnsyncedOrders]);

  // Show stock warnings
  useEffect(() => {
    stockWarnings.forEach(warning => {
      notification.warning({
        message: 'Cảnh báo tồn kho',
        description: `${warning.productName}: còn ${warning.currentStock} sản phẩm`,
        duration: 5,
      });
    });
  }, [stockWarnings]);

  const cartCalculations = getCartCalculations(selectedCustomer);

  const handleProductSelect = useCallback((product: any) => {
    // Check stock availability
    if (product.stock <= 0) {
      notification.error({
        message: 'Hết hàng',
        description: `Sản phẩm ${product.name} đã hết hàng`,
      });
      return;
    }

    // Check if adding one more would exceed stock
    const existingItem = cart.find(item => item.id === product.id);
    const currentQuantity = existingItem?.quantity || 0;
    
    if (currentQuantity + 1 > product.stock) {
      notification.error({
        message: 'Không đủ hàng',
        description: `Chỉ còn ${product.stock} sản phẩm ${product.name}`,
      });
      return;
    }

    addToCart(product);
    
    // Show low stock warning
    if (product.stock - (currentQuantity + 1) <= product.minStock) {
      notification.warning({
        message: 'Sắp hết hàng',
        description: `${product.name} sắp hết hàng (còn ${product.stock - (currentQuantity + 1)})`,
      });
    }
  }, [cart, addToCart]);

  const handleBarcodeScanned = useCallback((barcode: string) => {
    const product = products.find(p => p.barcode === barcode || p.sku === barcode);
    if (product) {
      handleProductSelect(product);
      notification.success({
        message: 'Quét mã thành công',
        description: `Đã thêm ${product.name} vào giỏ hàng`,
      });
    } else {
      notification.error({
        message: 'Không tìm thấy sản phẩm',
        description: `Mã vạch ${barcode} không có trong hệ thống`,
      });
    }
    setScannerVisible(false);
  }, [products, handleProductSelect]);

  const handleCustomerSelect = useCallback((customer: Customer | null) => {
    setSelectedCustomer(customer);
    setCustomerSelectorVisible(false);
    
    if (customer) {
      notification.success({
        message: 'Đã chọn khách hàng',
        description: `${customer.name} - ${customer.loyaltyTier.toUpperCase()}`,
      });
    }
  }, []);

  const handleCheckout = useCallback(() => {
    if (cart.length === 0) {
      notification.warning({
        message: 'Giỏ hàng trống',
        description: 'Vui lòng thêm sản phẩm vào giỏ hàng',
      });
      return;
    }

    // Validate stock again before checkout
    const stockErrors = cart.filter(item => {
      const product = products.find(p => p.id === item.id);
      return !product || product.stock < item.quantity;
    });

    if (stockErrors.length > 0) {
      notification.error({
        message: 'Không đủ hàng trong kho',
        description: `Các sản phẩm: ${stockErrors.map(e => e.name).join(', ')}`,
      });
      return;
    }

    setPaymentVisible(true);
  }, [cart, products]);

  const handlePaymentComplete = useCallback(async (paymentData: {
    method: PaymentMethod;
    amount: number;
    cashReceived?: number;
    gatewayData?: any;
  }) => {
    try {
      const orderData = {
        customerId: selectedCustomer?.id,
        cashierId: user?.id,
        items: cart.map(item => ({
          productId: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          category: item.category,
        })),
        subtotal: cartCalculations.subtotal,
        discount: cartCalculations.discount,
        vatAmount: cartCalculations.vatAmount,
        exciseAmount: cartCalculations.exciseAmount,
        total: cartCalculations.total,
        paymentMethod: paymentData.method,
        paymentData: paymentData,
        loyaltyPointsEarned: cartCalculations.loyaltyPointsEarned,
        loyaltyPointsRedeemed: cartCalculations.loyaltyPointsRedeemed,
      };

      let order;
      if (isOnline) {
        // Process online
        order = await processOrder(orderData);
      } else {
        // Store offline
        order = await addOfflineOrder(orderData);
        notification.info({
          message: 'Đã lưu đơn hàng offline',
          description: 'Đơn hàng sẽ được đồng bộ khi có kết nối internet',
        });
      }

      setPaymentVisible(false);
      clearCart();
      setSelectedCustomer(null);
      
      // Show success notification
      notification.success({
        message: 'Thanh toán thành công',
        description: `Đơn hàng ${order.orderNumber} đã được tạo`,
        duration: 3,
        btn: (
          <Button size="small" onClick={() => handlePrintReceipt(order)}>
            In hóa đơn
          </Button>
        ),
      });

      onOrderComplete?.(order);
    } catch (error) {
      console.error('Order processing failed:', error);
      notification.error({
        message: 'Lỗi thanh toán',
        description: error instanceof Error ? error.message : 'Không thể xử lý thanh toán',
      });
    }
  }, [
    selectedCustomer, 
    user, 
    cart, 
    cartCalculations, 
    isOnline, 
    processOrder, 
    addOfflineOrder, 
    clearCart, 
    onOrderComplete
  ]);

  const handlePrintReceipt = useCallback(async (order: any) => {
    try {
      // This would integrate with actual printer service
      const receiptData = VietnameseTaxService.generateInvoiceData(
        cartCalculations,
        selectedCustomer || {},
        {
          name: 'KhoAugment POS',
          taxCode: '0123456789',
          address: '123 Nguyễn Văn Linh, Q.7, TP.HCM',
          phone: '028 1234 5678',
        }
      );
      
      // In production, this would call the printer service
      console.log('Receipt data:', receiptData);
      
      notification.success({
        message: 'Đang in hóa đơn',
        description: 'Hóa đơn đang được in...',
      });
    } catch (error) {
      notification.error({
        message: 'Lỗi in hóa đơn',
        description: 'Không thể in hóa đơn. Vui lòng kiểm tra máy in.',
      });
    }
  }, [cartCalculations, selectedCustomer]);

  const handleSyncOfflineOrders = useCallback(async () => {
    try {
      await syncOfflineOrders();
      notification.success({
        message: 'Đồng bộ thành công',
        description: 'Tất cả đơn hàng offline đã được đồng bộ',
      });
      setOfflineSyncVisible(false);
      notification.close('offline-sync');
    } catch (error) {
      notification.error({
        message: 'Lỗi đồng bộ',
        description: 'Không thể đồng bộ đơn hàng offline',
      });
    }
  }, [syncOfflineOrders]);

  return (
    <div style={{ height: '100vh', padding: '16px', background: '#f5f5f5' }}>
      {/* Status Bar */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="Trạng thái kết nối"
              value={isOnline ? 'Online' : 'Offline'}
              prefix={isOnline ? <WifiOutlined style={{ color: '#52c41a' }} /> : <DisconnectOutlined style={{ color: '#f5222d' }} />}
              valueStyle={{ color: isOnline ? '#52c41a' : '#f5222d' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="Thu ngân"
              value={user?.name || 'N/A'}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="Ca làm việc"
              value={new Date(shiftStartTime).toLocaleTimeString('vi-VN')}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="Đơn chưa sync"
              value={offlineOrders.length}
              suffix={
                hasUnsyncedOrders && (
                  <Button
                    size="small"
                    icon={<SyncOutlined />}
                    onClick={() => setOfflineSyncVisible(true)}
                  >
                    Sync
                  </Button>
                )
              }
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ height: 'calc(100% - 100px)' }}>
        {/* Product Selection */}
        <Col span={16}>
          <Card 
            title={
              <Space>
                <Text strong>Sản phẩm</Text>
                {loading && <SyncOutlined spin />}
              </Space>
            }
            style={{ height: '100%' }}
            extra={
              <Space>
                <Button 
                  icon={<ScanOutlined />}
                  onClick={() => setScannerVisible(true)}
                  type="dashed"
                >
                  Quét mã vạch
                </Button>
              </Space>
            }
          >
            <div style={{ height: 'calc(100% - 60px)', overflow: 'auto' }}>
              <ProductGrid 
                products={products}
                loading={loading}
                onProductSelect={handleProductSelect}
                cart={cart}
              />
            </div>
          </Card>
        </Col>

        {/* Shopping Cart */}
        <Col span={8}>
          <Card 
            title={
              <Space>
                <ShoppingCartOutlined />
                <Text strong>Giỏ hàng ({cart.length})</Text>
              </Space>
            }
            style={{ height: '100%' }}
            extra={
              <Space>
                {selectedCustomer ? (
                  <Button 
                    size="small"
                    onClick={() => setCustomerSelectorVisible(true)}
                  >
                    {selectedCustomer.name}
                  </Button>
                ) : (
                  <Button 
                    icon={<UserOutlined />}
                    size="small"
                    onClick={() => setCustomerSelectorVisible(true)}
                  >
                    Chọn khách hàng
                  </Button>
                )}
                <Button 
                  type="primary" 
                  size="large"
                  disabled={cart.length === 0}
                  onClick={handleCheckout}
                >
                  Thanh toán
                </Button>
              </Space>
            }
          >
            <div style={{ height: 'calc(100% - 60px)', overflow: 'auto' }}>
              <ShoppingCart
                items={cart}
                onUpdateQuantity={updateQuantity}
                onRemoveItem={removeFromCart}
                onClear={clearCart}
                calculations={cartCalculations}
                customer={selectedCustomer}
              />
            </div>
          </Card>
        </Col>
      </Row>

      {/* Barcode Scanner Modal */}
      <BarcodeScanner
        visible={scannerVisible}
        onScan={handleBarcodeScanned}
        onClose={() => setScannerVisible(false)}
      />

      {/* Customer Selector Modal */}
      <CustomerSelector
        visible={customerSelectorVisible}
        selectedCustomer={selectedCustomer}
        onSelect={handleCustomerSelect}
        onClose={() => setCustomerSelectorVisible(false)}
      />

      {/* Payment Modal */}
      <PaymentMethods
        visible={paymentVisible}
        cart={cart}
        customer={selectedCustomer}
        calculations={cartCalculations}
        onPaymentComplete={handlePaymentComplete}
        onCancel={() => setPaymentVisible(false)}
        isOnline={isOnline}
      />

      {/* Offline Sync Modal */}
      <OfflineSync
        visible={offlineSyncVisible}
        orders={offlineOrders}
        onSync={handleSyncOfflineOrders}
        onClose={() => setOfflineSyncVisible(false)}
        isOnline={isOnline}
      />
    </div>
  );
};

export default POSTerminal;
