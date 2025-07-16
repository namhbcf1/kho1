import React, { useState, useMemo } from 'react';
import { 
  Row, Col, Card, Button, Input, Typography, Grid, Space, 
  List, InputNumber, Popconfirm, Badge, Tag, Select, Modal,
  Form, Divider, Steps, Radio, message 
} from 'antd';
import { 
  SearchOutlined, ScanOutlined, PlusOutlined, MinusOutlined,
  DeleteOutlined, ShoppingCartOutlined, UserOutlined,
  CreditCardOutlined, DollarOutlined, PhoneOutlined
} from '@ant-design/icons';
import { useProductStore } from '../../stores/useProductStore';
import { useCartStore } from '../../stores/useCartStore';
import { useCustomerStore } from '../../stores/useCustomerStore';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;
const { Option } = Select;

export default function POSScreen() {
  const screens = useBreakpoint();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [checkoutVisible, setCheckoutVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'vnpay' | 'momo' | 'zalopay'>('cash');
  const [customerSearch, setCustomerSearch] = useState('');
  
  const { products, categories } = useProductStore();
  const { 
    items, 
    addToCart, 
    removeFromCart, 
    updateQuantity, 
    clearCart,
    customer,
    setCustomer,
    clearCustomer,
    getCartSummary,
    applyDiscount
  } = useCartStore();
  const { customers, searchCustomers } = useCustomerStore();

  const filteredProducts = useMemo(() => {
    let filtered = products;
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.barcode?.includes(searchTerm) ||
        p.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  }, [products, selectedCategory, searchTerm]);

  const cartSummary = getCartSummary();

  const handleAddToCart = (product: any) => {
    addToCart(product);
    message.success(`Đã thêm ${product.name} vào giỏ hàng`);
  };

  const handleCheckout = () => {
    if (items.length === 0) {
      message.warning('Giỏ hàng trống');
      return;
    }
    setCheckoutVisible(true);
    setCurrentStep(0);
  };

  const handleCompleteOrder = () => {
    // TODO: Implement order completion logic
    message.success('Đơn hàng đã được tạo thành công!');
    clearCart();
    setCheckoutVisible(false);
    setCurrentStep(0);
  };

  const foundCustomers = useMemo(() => {
    if (!customerSearch) return [];
    return searchCustomers(customerSearch);
  }, [customerSearch, searchCustomers]);

  return (
    <div className="pos-container" style={{ height: '100vh', padding: 0 }}>
      <Title level={2} style={{ marginBottom: 16, fontSize: 'clamp(1.25rem, 3vw, 1.75rem)' }}>
        Điểm bán hàng (POS)
      </Title>
      
      <Row gutter={[16, 16]} style={{ height: 'calc(100vh - 120px)' }}>
        <Col xs={24} lg={16} className="pos-left">
          <Card 
            title="Sản phẩm" 
            className="pos-products" 
            style={{ height: '100%' }}
            bodyStyle={{ padding: '16px' }}
          >
            <Space direction="vertical" style={{ width: '100%', marginBottom: 16 }}>
              <Input
                placeholder="Tìm sản phẩm hoặc quét mã vạch"
                prefix={<SearchOutlined />}
                suffix={
                  <Button 
                    icon={<ScanOutlined />} 
                    type="link"
                    title="Quét mã vạch"
                  />
                }
                size="large"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              
              <Select
                value={selectedCategory}
                onChange={setSelectedCategory}
                style={{ width: '100%' }}
                size="large"
              >
                <Option value="all">Tất cả danh mục</Option>
                {categories.map(cat => (
                  <Option key={cat.id} value={cat.id}>{cat.name}</Option>
                ))}
              </Select>
            </Space>
            
            <div className="products-grid" style={{ 
              height: 'calc(100% - 120px)', 
              overflowY: 'auto'
            }}>
              <Row gutter={[8, 8]}>
                {filteredProducts.map(product => (
                  <Col 
                    xs={12} 
                    sm={8} 
                    md={6} 
                    lg={8} 
                    xl={6} 
                    key={product.id}
                  >
                    <Card
                      hoverable
                      size="small"
                      style={{ 
                        height: '100%',
                        cursor: 'pointer'
                      }}
                      bodyStyle={{ 
                        padding: '8px',
                        display: 'flex',
                        flexDirection: 'column',
                        height: '140px'
                      }}
                      onClick={() => handleAddToCart(product)}
                    >
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <Text strong style={{ 
                          fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
                          marginBottom: 4,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}>
                          {product.name}
                        </Text>
                        <Text style={{ 
                          color: '#1890ff', 
                          fontWeight: 'bold',
                          fontSize: 'clamp(0.875rem, 2.5vw, 1rem)'
                        }}>
                          {product.price.toLocaleString()}₫
                        </Text>
                        <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Tag color={product.stock > 10 ? 'green' : product.stock > 0 ? 'orange' : 'red'}>
                            Tồn: {product.stock}
                          </Tag>
                          <Button 
                            type="primary" 
                            size="small" 
                            icon={<PlusOutlined />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddToCart(product);
                            }}
                          />
                        </div>
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
              
              {filteredProducts.length === 0 && (
                <div style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  color: '#999',
                  textAlign: 'center'
                }}>
                  <div>
                    <p>Không tìm thấy sản phẩm nào</p>
                    <p>Thử thay đổi từ khóa tìm kiếm</p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </Col>
        
        <Col xs={24} lg={8} className="pos-right">
          <Card 
            title={
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>Giỏ hàng</span>
                <Badge count={cartSummary.itemCount} showZero color="#1890ff">
                  <ShoppingCartOutlined style={{ fontSize: '20px', color: '#1890ff' }} />
                </Badge>
              </div>
            }
            className="pos-cart" 
            style={{ height: '100%' }}
            bodyStyle={{ padding: '16px' }}
          >
            {customer && (
              <div style={{ 
                padding: 8, 
                background: '#f6ffed', 
                borderRadius: 4, 
                marginBottom: 16,
                border: '1px solid #b7eb8f'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <Text strong>{customer.name}</Text>
                    {customer.phone && <div><Text type="secondary">{customer.phone}</Text></div>}
                  </div>
                  <Button size="small" onClick={clearCustomer}>Xóa</Button>
                </div>
              </div>
            )}
            
            <div className="cart-items" style={{ 
              height: customer ? 'calc(100% - 220px)' : 'calc(100% - 180px)',
              overflowY: 'auto',
              marginBottom: 16
            }}>
              {items.length === 0 ? (
                <div style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  color: '#999',
                  textAlign: 'center'
                }}>
                  <p>Giỏ hàng trống</p>
                </div>
              ) : (
                <List
                  dataSource={items}
                  renderItem={item => (
                    <List.Item style={{ padding: '8px 0' }}>
                      <div style={{ width: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ flex: 1, marginRight: 8 }}>
                            <Text strong style={{ fontSize: '14px' }}>{item.product.name}</Text>
                            <div style={{ color: '#1890ff', fontWeight: 500 }}>
                              {item.price.toLocaleString()}₫
                            </div>
                          </div>
                          <Popconfirm
                            title="Xóa sản phẩm?"
                            onConfirm={() => removeFromCart(item.product.id)}
                            okText="Xóa"
                            cancelText="Hủy"
                          >
                            <Button size="small" danger icon={<DeleteOutlined />} />
                          </Popconfirm>
                        </div>
                        
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          marginTop: 8
                        }}>
                          <Space>
                            <Button 
                              size="small" 
                              icon={<MinusOutlined />}
                              onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            />
                            <InputNumber 
                              size="small" 
                              min={1} 
                              max={item.product.stock}
                              value={item.quantity}
                              onChange={(value) => updateQuantity(item.product.id, value || 1)}
                              style={{ width: 60 }}
                            />
                            <Button 
                              size="small" 
                              icon={<PlusOutlined />}
                              onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            />
                          </Space>
                          <Text strong style={{ color: '#fa8c16' }}>
                            {item.total.toLocaleString()}₫
                          </Text>
                        </div>
                      </div>
                    </List.Item>
                  )}
                />
              )}
            </div>
            
            <div className="cart-summary" style={{ 
              borderTop: '1px solid #f0f0f0', 
              paddingTop: 16 
            }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text>Tạm tính:</Text>
                  <Text>{cartSummary.subtotal.toLocaleString()}₫</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text>VAT (10%):</Text>
                  <Text>{cartSummary.tax.toLocaleString()}₫</Text>
                </div>
                {cartSummary.discount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text>Giảm giá:</Text>
                    <Text style={{ color: '#f5222d' }}>-{cartSummary.discount.toLocaleString()}₫</Text>
                  </div>
                )}
                <Divider style={{ margin: '8px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text strong style={{ fontSize: '16px' }}>Tổng cộng:</Text>
                  <Text strong style={{ fontSize: '16px', color: '#f5222d' }}>
                    {cartSummary.total.toLocaleString()}₫
                  </Text>
                </div>
                
                <Button 
                  type="primary" 
                  block 
                  size="large" 
                  disabled={items.length === 0}
                  onClick={handleCheckout}
                  style={{ marginTop: 8 }}
                >
                  Thanh toán
                </Button>
              </Space>
            </div>
          </Card>
        </Col>
      </Row>

      <Modal
        title="Thanh toán"
        open={checkoutVisible}
        onCancel={() => setCheckoutVisible(false)}
        width={screens.lg ? 600 : '95%'}
        footer={null}
      >
        <Steps current={currentStep} style={{ marginBottom: 24 }}>
          <Steps.Step title="Khách hàng" icon={<UserOutlined />} />
          <Steps.Step title="Thanh toán" icon={<CreditCardOutlined />} />
          <Steps.Step title="Hoàn tất" icon={<DollarOutlined />} />
        </Steps>

        {currentStep === 0 && (
          <div>
            <Input
              placeholder="Tìm khách hàng theo tên hoặc SĐT"
              prefix={<SearchOutlined />}
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              style={{ marginBottom: 16 }}
            />
            
            {foundCustomers.length > 0 && (
              <List
                dataSource={foundCustomers}
                renderItem={cust => (
                  <List.Item 
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      setCustomer({
                        id: cust.id,
                        name: cust.name,
                        phone: cust.phone,
                        loyaltyPoints: cust.loyaltyPoints
                      });
                      setCurrentStep(1);
                    }}
                  >
                    <List.Item.Meta
                      title={cust.name}
                      description={`${cust.phone} - ${cust.loyaltyPoints} điểm`}
                    />
                  </List.Item>
                )}
              />
            )}
            
            <div style={{ textAlign: 'center', margin: '16px 0' }}>
              <Button onClick={() => setCurrentStep(1)}>
                Khách vãng lai
              </Button>
            </div>
          </div>
        )}

        {currentStep === 1 && (
          <div>
            <Radio.Group 
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              style={{ width: '100%' }}
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                <Radio value="cash">Tiền mặt</Radio>
                <Radio value="card">Thẻ tín dụng</Radio>
                <Radio value="vnpay">VNPay</Radio>
                <Radio value="momo">MoMo</Radio>
                <Radio value="zalopay">ZaloPay</Radio>
              </Space>
            </Radio.Group>
            
            <div style={{ marginTop: 24, textAlign: 'center' }}>
              <Space>
                <Button onClick={() => setCurrentStep(0)}>Quay lại</Button>
                <Button type="primary" onClick={() => setCurrentStep(2)}>
                  Tiếp tục
                </Button>
              </Space>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div style={{ textAlign: 'center' }}>
            <Title level={4}>Xác nhận thanh toán</Title>
            <p>Tổng tiền: <strong>{cartSummary.total.toLocaleString()}₫</strong></p>
            <p>Phương thức: <strong>{paymentMethod}</strong></p>
            
            <Space style={{ marginTop: 24 }}>
              <Button onClick={() => setCurrentStep(1)}>Quay lại</Button>
              <Button type="primary" onClick={handleCompleteOrder}>
                Hoàn tất đơn hàng
              </Button>
            </Space>
          </div>
        )}
      </Modal>
    </div>
  );
}