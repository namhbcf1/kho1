// Modern POS Page with optimized UX
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Layout, 
  Card, 
  Row, 
  Col, 
  Button, 
  Input, 
  Select, 
  Table, 
  Typography, 
  Space, 
  Badge, 
  Avatar, 
  Divider,
  Modal,
  Form,
  InputNumber,
  Radio,
  Tooltip,
  Popconfirm,
  message,
  Drawer,
  Tabs,
  Tag,
  Progress,
  Statistic,
  Empty,
  Spin
} from 'antd';
import {
  ShoppingCartOutlined,
  PlusOutlined,
  MinusOutlined,
  DeleteOutlined,
  SearchOutlined,
  ScanOutlined,
  CreditCardOutlined,
  DollarOutlined,
  PrinterOutlined,
  UserOutlined,
  GiftOutlined,
  CalculatorOutlined,
  HistoryOutlined,
  StarOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
  FilterOutlined,
  SettingOutlined,
  MobileOutlined,
  WalletOutlined,
  BankOutlined,
  CrownOutlined,
  FireOutlined,
  HeartOutlined,
  TagOutlined
} from '@ant-design/icons';
import { usePage } from '../../stores';
import './ModernPOSPage.css';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

// Mock data
const mockProducts = [
  {
    id: 1,
    name: 'iPhone 15 Pro Max',
    price: 29990000,
    category: 'Điện tử',
    image: 'https://via.placeholder.com/100x100',
    stock: 15,
    barcode: '1234567890',
    discount: 5,
    popular: true
  },
  {
    id: 2,
    name: 'Samsung Galaxy S24',
    price: 24990000,
    category: 'Điện tử',
    image: 'https://via.placeholder.com/100x100',
    stock: 8,
    barcode: '1234567891',
    discount: 0,
    popular: true
  },
  {
    id: 3,
    name: 'MacBook Air M3',
    price: 35990000,
    category: 'Laptop',
    image: 'https://via.placeholder.com/100x100',
    stock: 5,
    barcode: '1234567892',
    discount: 10,
    popular: false
  },
  {
    id: 4,
    name: 'iPad Pro 2024',
    price: 19990000,
    category: 'Máy tính bảng',
    image: 'https://via.placeholder.com/100x100',
    stock: 12,
    barcode: '1234567893',
    discount: 0,
    popular: true
  },
  {
    id: 5,
    name: 'AirPods Pro',
    price: 6990000,
    category: 'Phụ kiện',
    image: 'https://via.placeholder.com/100x100',
    stock: 25,
    barcode: '1234567894',
    discount: 15,
    popular: false
  },
  {
    id: 6,
    name: 'Apple Watch Series 9',
    price: 11990000,
    category: 'Đồng hồ',
    image: 'https://via.placeholder.com/100x100',
    stock: 18,
    barcode: '1234567895',
    discount: 8,
    popular: true
  }
];

const categories = ['Tất cả', 'Điện tử', 'Laptop', 'Máy tính bảng', 'Phụ kiện', 'Đồng hồ'];

const paymentMethods = [
  { key: 'cash', name: 'Tiền mặt', icon: <DollarOutlined />, color: '#52c41a' },
  { key: 'card', name: 'Thẻ tín dụng', icon: <CreditCardOutlined />, color: '#1890ff' },
  { key: 'momo', name: 'MoMo', icon: <MobileOutlined />, color: '#a0336e' },
  { key: 'vnpay', name: 'VNPay', icon: <WalletOutlined />, color: '#003d82' },
  { key: 'bank', name: 'Chuyển khoản', icon: <BankOutlined />, color: '#722ed1' }
];

const ModernPOSPage: React.FC = () => {
  const { setPageTitle, setBreadcrumbs } = usePage();
  const [cart, setCart] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [searchQuery, setSearchQuery] = useState('');
  const [customer, setCustomer] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentVisible, setPaymentVisible] = useState(false);
  const [receivedAmount, setReceivedAmount] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [historyVisible, setHistoryVisible] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    setPageTitle('POS Terminal');
    setBreadcrumbs([
      { title: 'POS Terminal' }
    ]);
  }, [setPageTitle, setBreadcrumbs]);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const filteredProducts = useMemo(() => {
    let filtered = mockProducts;
    
    if (selectedCategory !== 'Tất cả') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }
    
    if (searchQuery) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.barcode.includes(searchQuery)
      );
    }
    
    return filtered;
  }, [selectedCategory, searchQuery]);

  const cartTotal = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discountAmount = subtotal * (discount / 100);
    const total = subtotal - discountAmount;
    return { subtotal, discountAmount, total };
  }, [cart, discount]);

  const addToCart = (product: any) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: number) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prevCart =>
      prevCart.map(item =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    Modal.confirm({
      title: 'Xóa giỏ hàng',
      content: 'Bạn có chắc muốn xóa toàn bộ giỏ hàng?',
      onOk: () => {
        setCart([]);
        message.success('Đã xóa giỏ hàng');
      }
    });
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      message.warning('Giỏ hàng trống!');
      return;
    }
    setPaymentVisible(true);
  };

  const processPayment = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setPaymentVisible(false);
      setCart([]);
      setReceivedAmount(0);
      setDiscount(0);
      message.success('Thanh toán thành công!');
    }, 2000);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('vi-VN', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit' 
    });
  };

  const cartColumns = [
    {
      title: 'Sản phẩm',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: any) => (
        <div className="cart-product">
          <Avatar src={record.image} size={40} className="product-avatar" />
          <div className="product-info">
            <div className="product-name">{text}</div>
            <div className="product-price">{formatCurrency(record.price)}</div>
          </div>
        </div>
      )
    },
    {
      title: 'Số lượng',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (quantity: number, record: any) => (
        <div className="quantity-controls">
          <Button 
            size="small" 
            icon={<MinusOutlined />}
            onClick={() => updateQuantity(record.id, quantity - 1)}
            className="quantity-btn"
          />
          <span className="quantity-display">{quantity}</span>
          <Button 
            size="small" 
            icon={<PlusOutlined />}
            onClick={() => updateQuantity(record.id, quantity + 1)}
            className="quantity-btn"
          />
        </div>
      )
    },
    {
      title: 'Thành tiền',
      key: 'total',
      render: (record: any) => (
        <div className="item-total">
          {formatCurrency(record.price * record.quantity)}
        </div>
      )
    },
    {
      title: '',
      key: 'action',
      render: (record: any) => (
        <Popconfirm
          title="Xóa sản phẩm khỏi giỏ hàng?"
          onConfirm={() => removeFromCart(record.id)}
        >
          <Button 
            type="text" 
            danger 
            icon={<DeleteOutlined />}
            className="remove-btn"
          />
        </Popconfirm>
      )
    }
  ];

  return (
    <div className="modern-pos">
      <Layout>
        {/* Header */}
        <div className="pos-header">
          <div className="header-left">
            <Title level={3} className="pos-title">
              <ShoppingCartOutlined className="pos-icon" />
              POS Terminal
            </Title>
            <div className="pos-time">
              {formatTime(currentTime)}
            </div>
          </div>
          <div className="header-right">
            <Space>
              <Button 
                icon={<HistoryOutlined />}
                onClick={() => setHistoryVisible(true)}
              >
                Lịch sử
              </Button>
              <Button 
                icon={<SettingOutlined />}
              >
                Cài đặt
              </Button>
              <Button 
                icon={<ReloadOutlined />}
                onClick={() => window.location.reload()}
              >
                Làm mới
              </Button>
            </Space>
          </div>
        </div>

        <div className="pos-content">
          <Row gutter={[16, 16]}>
            {/* Products Panel */}
            <Col xs={24} lg={14}>
              <Card className="products-panel" bodyStyle={{ padding: 0 }}>
                {/* Search & Filter */}
                <div className="products-toolbar">
                  <div className="search-section">
                    <Input
                      placeholder="Tìm sản phẩm hoặc mã vạch..."
                      prefix={<SearchOutlined />}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="search-input"
                      size="large"
                    />
                    <Button 
                      icon={<ScanOutlined />}
                      size="large"
                      className="scan-btn"
                    >
                      Quét mã
                    </Button>
                  </div>
                  <div className="category-tabs">
                    <Tabs 
                      activeKey={selectedCategory}
                      onChange={setSelectedCategory}
                      type="card"
                      size="small"
                    >
                      {categories.map(category => (
                        <TabPane tab={category} key={category} />
                      ))}
                    </Tabs>
                  </div>
                </div>

                {/* Products Grid */}
                <div className="products-grid">
                  {filteredProducts.length === 0 ? (
                    <Empty 
                      description="Không tìm thấy sản phẩm"
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                    />
                  ) : (
                    <Row gutter={[12, 12]}>
                      {filteredProducts.map(product => (
                        <Col key={product.id} xs={12} sm={8} md={6} lg={8} xl={6}>
                          <Card 
                            className="product-card"
                            hoverable
                            onClick={() => addToCart(product)}
                            bodyStyle={{ padding: '12px' }}
                          >
                            <div className="product-image">
                              <Avatar 
                                src={product.image} 
                                size={60}
                                className="product-avatar"
                              />
                              {product.popular && (
                                <Badge 
                                  className="popular-badge"
                                  count={<FireOutlined />}
                                  style={{ backgroundColor: '#ff4d4f' }}
                                />
                              )}
                              {product.discount > 0 && (
                                <div className="discount-badge">
                                  -{product.discount}%
                                </div>
                              )}
                            </div>
                            <div className="product-details">
                              <Tooltip title={product.name}>
                                <div className="product-name">{product.name}</div>
                              </Tooltip>
                              <div className="product-price">
                                {formatCurrency(product.price)}
                              </div>
                              <div className="product-stock">
                                <Tag color={product.stock > 10 ? 'green' : product.stock > 5 ? 'orange' : 'red'}>
                                  Còn {product.stock}
                                </Tag>
                              </div>
                            </div>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  )}
                </div>
              </Card>
            </Col>

            {/* Cart Panel */}
            <Col xs={24} lg={10}>
              <Card className="cart-panel">
                <div className="cart-header">
                  <Title level={4} className="cart-title">
                    Giỏ hàng ({cart.length})
                  </Title>
                  {cart.length > 0 && (
                    <Button 
                      type="text" 
                      danger 
                      icon={<DeleteOutlined />}
                      onClick={clearCart}
                      className="clear-cart-btn"
                    >
                      Xóa tất cả
                    </Button>
                  )}
                </div>

                <div className="cart-content">
                  {cart.length === 0 ? (
                    <Empty 
                      description="Giỏ hàng trống"
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                    />
                  ) : (
                    <>
                      <Table
                        dataSource={cart}
                        columns={cartColumns}
                        pagination={false}
                        rowKey="id"
                        className="cart-table"
                        size="small"
                      />

                      {/* Cart Summary */}
                      <div className="cart-summary">
                        <div className="summary-row">
                          <span>Tạm tính:</span>
                          <span>{formatCurrency(cartTotal.subtotal)}</span>
                        </div>
                        <div className="summary-row">
                          <span>Giảm giá:</span>
                          <div className="discount-input">
                            <InputNumber
                              min={0}
                              max={100}
                              value={discount}
                              onChange={(value) => setDiscount(value || 0)}
                              formatter={(value) => `${value}%`}
                              parser={(value) => value!.replace('%', '')}
                              size="small"
                            />
                            <span className="discount-amount">
                              -{formatCurrency(cartTotal.discountAmount)}
                            </span>
                          </div>
                        </div>
                        <Divider />
                        <div className="summary-row total-row">
                          <span>Tổng cộng:</span>
                          <span className="total-amount">
                            {formatCurrency(cartTotal.total)}
                          </span>
                        </div>
                      </div>

                      {/* Checkout Button */}
                      <Button
                        type="primary"
                        size="large"
                        block
                        icon={<CreditCardOutlined />}
                        onClick={handleCheckout}
                        className="checkout-btn"
                      >
                        Thanh toán
                      </Button>
                    </>
                  )}
                </div>
              </Card>
            </Col>
          </Row>
        </div>
      </Layout>

      {/* Payment Modal */}
      <Modal
        title="Thanh toán"
        visible={paymentVisible}
        onCancel={() => setPaymentVisible(false)}
        footer={null}
        width={500}
        className="payment-modal"
      >
        <div className="payment-content">
          <div className="payment-summary">
            <Statistic
              title="Tổng tiền"
              value={cartTotal.total}
              formatter={(value) => formatCurrency(value as number)}
              className="payment-total"
            />
          </div>

          <Divider />

          <div className="payment-methods">
            <Text strong>Phương thức thanh toán:</Text>
            <Radio.Group 
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="payment-method-group"
            >
              {paymentMethods.map(method => (
                <Radio.Button
                  key={method.key}
                  value={method.key}
                  className="payment-method-btn"
                >
                  <div className="payment-method-content">
                    <span className="payment-icon" style={{ color: method.color }}>
                      {method.icon}
                    </span>
                    <span className="payment-name">{method.name}</span>
                  </div>
                </Radio.Button>
              ))}
            </Radio.Group>
          </div>

          {paymentMethod === 'cash' && (
            <div className="cash-payment">
              <Text strong>Tiền khách đưa:</Text>
              <InputNumber
                value={receivedAmount}
                onChange={(value) => setReceivedAmount(value || 0)}
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
                size="large"
                className="received-amount-input"
                placeholder="Nhập số tiền"
              />
              {receivedAmount > 0 && (
                <div className="change-amount">
                  <Text strong>
                    Tiền thối: {formatCurrency(receivedAmount - cartTotal.total)}
                  </Text>
                </div>
              )}
            </div>
          )}

          <div className="payment-actions">
            <Button
              type="primary"
              size="large"
              block
              icon={<CheckCircleOutlined />}
              onClick={processPayment}
              loading={loading}
              disabled={paymentMethod === 'cash' && receivedAmount < cartTotal.total}
            >
              {loading ? 'Đang xử lý...' : 'Xác nhận thanh toán'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* History Drawer */}
      <Drawer
        title="Lịch sử giao dịch"
        placement="right"
        onClose={() => setHistoryVisible(false)}
        visible={historyVisible}
        width={600}
      >
        <Empty description="Chưa có giao dịch nào" />
      </Drawer>
    </div>
  );
};

export default ModernPOSPage;