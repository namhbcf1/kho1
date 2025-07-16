// Modern POS Page with optimized UX
import {
    BarcodeOutlined,
    CloseOutlined,
    CreditCardOutlined,
    DeleteOutlined,
    DollarOutlined,
    FilterOutlined,
    MinusOutlined,
    PlusOutlined,
    PrinterOutlined,
    QrcodeOutlined,
    SaveOutlined,
    SearchOutlined,
    ShopOutlined,
    ShoppingCartOutlined,
    TagOutlined,
    UserOutlined
} from '@ant-design/icons';
import {
    Avatar,
    Badge,
    Button,
    Card,
    Col,
    Divider,
    Empty,
    Form,
    Input,
    InputNumber,
    Layout,
    List,
    Modal,
    Row,
    Select,
    Space,
    Statistic,
    Tabs,
    Tag,
    Typography,
    message
} from 'antd';
import React, { useState } from 'react';

const { Header, Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

// Mock product data
const mockProducts = [
  {
    id: '1',
    name: 'iPhone 15 Pro Max',
    price: 34990000,
    category: 'phone',
    stock: 15,
    barcode: '8938505974861',
    image: 'https://cdn.tgdd.vn/Products/Images/42/299033/iphone-15-pro-max-blue-thumbnew-600x600.jpg'
  },
  {
    id: '2',
    name: 'Samsung Galaxy S24 Ultra',
    price: 29990000,
    category: 'phone',
    stock: 10,
    barcode: '8806092992733',
    image: 'https://cdn.tgdd.vn/Products/Images/42/310785/samsung-galaxy-s24-ultra-xanh-thumb-600x600.jpg'
  },
  {
    id: '3',
    name: 'iPad Air 5',
    price: 16990000,
    category: 'tablet',
    stock: 8,
    barcode: '8936082080136',
    image: 'https://cdn.tgdd.vn/Products/Images/522/274155/ipad-air-5-wifi-gray-thumb-600x600.jpg'
  },
  {
    id: '4',
    name: 'MacBook Air M3',
    price: 32990000,
    category: 'laptop',
    stock: 5,
    barcode: '8939304727156',
    image: 'https://cdn.tgdd.vn/Products/Images/44/306103/macbook-air-m3-thumb-600x600.jpg'
  },
  {
    id: '5',
    name: 'Apple Watch Series 9',
    price: 11990000,
    category: 'watch',
    stock: 12,
    barcode: '8935142967237',
    image: 'https://cdn.tgdd.vn/Products/Images/7077/289612/apple-watch-s9-gps-41mm-thumb-1-1-600x600.jpg'
  },
  {
    id: '6',
    name: 'Airpods Pro 2',
    price: 6790000,
    category: 'accessory',
    stock: 20,
    barcode: '8932082951264',
    image: 'https://cdn.tgdd.vn/Products/Images/54/290702/airpods-pro-2-thumb-600x600.jpeg'
  },
  {
    id: '7',
    name: 'Sạc dự phòng 20.000mAh',
    price: 990000,
    category: 'accessory',
    stock: 30,
    barcode: '8930174835942',
    image: 'https://cdn.tgdd.vn/Products/Images/57/217009/pin-du-phong-10000mah-ava-ds003-thumb-5-600x600.jpeg'
  },
  {
    id: '8',
    name: 'Ốp lưng iPhone 15 Pro Max',
    price: 390000,
    category: 'accessory',
    stock: 50,
    barcode: '8938491057391',
    image: 'https://cdn.tgdd.vn/Products/Images/60/310246/op-lung-iphone-15-pro-max-nhua-memsoft-touch-dada-xanh-navy-thumb-600x600.jpg'
  },
];

// Mock customer data
const mockCustomers = [
  { id: '1', name: 'Nguyễn Văn A', phone: '0901234567', points: 150 },
  { id: '2', name: 'Trần Thị B', phone: '0912345678', points: 320 },
  { id: '3', name: 'Lê Văn C', phone: '0923456789', points: 450 },
  { id: '4', name: 'Phạm Thị D', phone: '0934567890', points: 80 },
];

// Mock categories
const mockCategories = [
  { id: 'all', name: 'Tất cả' },
  { id: 'phone', name: 'Điện thoại' },
  { id: 'laptop', name: 'Laptop' },
  { id: 'tablet', name: 'Máy tính bảng' },
  { id: 'watch', name: 'Đồng hồ' },
  { id: 'accessory', name: 'Phụ kiện' },
];

const ModernPOSPage: React.FC = () => {
  const [products] = useState(mockProducts);
  const [customers] = useState(mockCustomers);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [customerModalVisible, setCustomerModalVisible] = useState(false);
  const [paymentForm] = Form.useForm();

  // Filter products based on search term and category
  const filteredProducts = products.filter((product) => {
    const matchesSearch = 
      searchTerm === '' || 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      product.barcode.includes(searchTerm);
    
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Handle barcode search
  const handleBarcodeSearch = () => {
    if (!barcodeInput) return;
    
    const product = products.find(p => p.barcode === barcodeInput);
    if (product) {
      addToCart(product);
      setBarcodeInput('');
    } else {
      message.error('Không tìm thấy sản phẩm với mã vạch này');
    }
  };

  // Handle adding product to cart
  const addToCart = (product: any) => {
    const existingItem = cartItems.find(item => item.id === product.id);
    
    if (existingItem) {
      // Increase quantity if already in cart
      setCartItems(
        cartItems.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.price }
            : item
        )
      );
    } else {
      // Add new item to cart
      setCartItems([
        ...cartItems,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
          total: product.price,
          image: product.image
        }
      ]);
    }
    
    message.success(`Đã thêm ${product.name} vào giỏ hàng`);
  };

  // Handle removing item from cart
  const removeFromCart = (productId: string) => {
    setCartItems(cartItems.filter(item => item.id !== productId));
  };

  // Handle updating item quantity
  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    setCartItems(
      cartItems.map(item =>
        item.id === productId
          ? { ...item, quantity: newQuantity, total: newQuantity * item.price }
          : item
      )
    );
  };

  // Calculate cart total
  const cartTotal = cartItems.reduce((sum, item) => sum + item.total, 0);
  
  // Handle discount
  const [discount, setDiscount] = useState(0);
  
  // Calculate final amount
  const finalAmount = cartTotal - discount;

  // Calculate tax (VAT 10%)
  const tax = Math.round(finalAmount * 0.1);
  
  // Handle payment
  const handlePayment = () => {
    paymentForm.validateFields().then(values => {
      message.success('Thanh toán thành công');
      // Reset cart
      setCartItems([]);
      setDiscount(0);
      setSelectedCustomer(null);
      setPaymentModalVisible(false);
      
      // In receipt simulation
      setTimeout(() => {
        message.info('Đang in hóa đơn...');
      }, 1000);
    });
  };

  // Handle barcode input
  const handleBarcodeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBarcodeInput(e.target.value);
  };
  
  // Handle barcode input keypress
  const handleBarcodeKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleBarcodeSearch();
    }
  };
  
  // Handle customer selection
  const handleSelectCustomer = (customer: any) => {
    setSelectedCustomer(customer);
    setCustomerModalVisible(false);
    
    // Apply loyalty discount (10% of points value)
    const loyaltyDiscount = Math.min(customer.points * 1000, cartTotal * 0.1);
    setDiscount(loyaltyDiscount);
    
    message.success(`Đã áp dụng ${loyaltyDiscount.toLocaleString('vi-VN')}₫ điểm tích lũy`);
  };

  return (
    <Layout style={{ height: '100%', background: '#f0f2f5' }}>
      <Header style={{ 
        padding: '0 16px', 
        background: '#fff', 
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between'
      }}>
        <Title level={4} style={{ margin: 0 }}>
          <ShopOutlined /> Bán hàng
        </Title>
        <Space>
          <Input
            prefix={<BarcodeOutlined />}
            placeholder="Quét mã vạch..."
            value={barcodeInput}
            onChange={handleBarcodeInputChange}
            onKeyPress={handleBarcodeKeyPress}
            style={{ width: 200 }}
            allowClear
          />
          <Button 
            type="primary" 
            onClick={handleBarcodeSearch}
            icon={<BarcodeOutlined />}
          >
            Quét
          </Button>
        </Space>
      </Header>
      
      <Content style={{ padding: '16px', height: 'calc(100vh - 64px)', overflowY: 'auto' }}>
        <Row gutter={16} style={{ height: '100%' }}>
          {/* Products Section */}
          <Col xs={24} lg={16} style={{ marginBottom: 16 }}>
            <Card style={{ height: '100%' }}>
              {/* Search and categories */}
              <div style={{ marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                <Input
                  placeholder="Tìm kiếm sản phẩm..."
                  prefix={<SearchOutlined />}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ width: '100%', maxWidth: 300 }}
                  allowClear
                />
                
                <div style={{ flexGrow: 1 }}>
                  <Tabs 
                    activeKey={selectedCategory} 
                    onChange={setSelectedCategory}
                    tabBarExtraContent={<Button icon={<FilterOutlined />} size="small">Lọc</Button>}
                  >
                    {mockCategories.map(category => (
                      <TabPane 
                        tab={
                          <span>
                            <TagOutlined />
                            {category.name}
                          </span>
                        } 
                        key={category.id} 
                      />
                    ))}
                  </Tabs>
                </div>
              </div>
              
              {/* Products grid */}
              {filteredProducts.length > 0 ? (
                <Row gutter={[16, 16]}>
                  {filteredProducts.map(product => (
                    <Col xs={12} sm={8} md={6} key={product.id}>
                      <Card
                        hoverable
                        style={{ height: '100%' }}
                        cover={
                          <img
                            alt={product.name}
                            src={product.image}
                            style={{ height: 120, objectFit: 'contain', padding: 8 }}
                          />
                        }
                        onClick={() => addToCart(product)}
                      >
                        <Card.Meta
                          title={
                            <div style={{ fontSize: '14px', height: '40px', overflow: 'hidden' }}>
                              {product.name}
                            </div>
                          }
                          description={
                            <div>
                              <div style={{ fontWeight: 'bold', color: '#ff4d4f' }}>
                                {product.price.toLocaleString('vi-VN')}₫
                              </div>
                              <div>
                                {product.stock > 0 ? (
                                  <Tag color="success">Còn hàng: {product.stock}</Tag>
                                ) : (
                                  <Tag color="error">Hết hàng</Tag>
                                )}
                              </div>
                            </div>
                          }
                        />
                      </Card>
                    </Col>
                  ))}
                </Row>
              ) : (
                <Empty description="Không tìm thấy sản phẩm" />
              )}
            </Card>
          </Col>
          
          {/* Cart Section */}
          <Col xs={24} lg={8} style={{ marginBottom: 16 }}>
            <Card
              title={
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>
                    <ShoppingCartOutlined /> Giỏ hàng
                  </span>
                  <span>
                    <Badge count={cartItems.length} showZero />
                  </span>
                </div>
              }
              extra={
                <Button 
                  size="small" 
                  danger 
                  disabled={cartItems.length === 0}
                  onClick={() => setCartItems([])}
                >
                  Xóa tất cả
                </Button>
              }
              style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
              bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column' }}
            >
              {/* Customer information */}
              <div style={{ marginBottom: 16 }}>
                <Button 
                  type={selectedCustomer ? "default" : "dashed"} 
                  icon={<UserOutlined />} 
                  style={{ width: '100%' }}
                  onClick={() => setCustomerModalVisible(true)}
                >
                  {selectedCustomer 
                    ? `${selectedCustomer.name} - ${selectedCustomer.phone}` 
                    : 'Chọn khách hàng'}
                </Button>
              </div>
              
              {/* Cart items */}
              <div style={{ flex: 1, overflow: 'auto' }}>
                {cartItems.length === 0 ? (
                  <Empty description="Giỏ hàng trống" />
                ) : (
                  <List
                    itemLayout="horizontal"
                    dataSource={cartItems}
                    renderItem={(item) => (
                      <List.Item
                        actions={[
                          <Button 
                            size="small" 
                            danger 
                            icon={<DeleteOutlined />} 
                            onClick={() => removeFromCart(item.id)}
                          />
                        ]}
                      >
                        <List.Item.Meta
                          avatar={<Avatar src={item.image} size="large" shape="square" />}
                          title={item.name}
                          description={
                            <div style={{ color: '#ff4d4f', fontWeight: 'bold' }}>
                              {item.price.toLocaleString('vi-VN')}₫
                            </div>
                          }
                        />
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Button 
                            size="small" 
                            icon={<MinusOutlined />}
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          />
                          <InputNumber
                            min={1}
                            value={item.quantity}
                            onChange={(value) => updateQuantity(item.id, value as number)}
                            style={{ width: 60 }}
                          />
                          <Button 
                            size="small" 
                            icon={<PlusOutlined />}
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          />
                        </div>
                      </List.Item>
                    )}
                  />
                )}
              </div>
              
              <Divider style={{ margin: '16px 0' }} />
              
              {/* Cart summary */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text>Tạm tính:</Text>
                  <Text strong>{cartTotal.toLocaleString('vi-VN')}₫</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text>Chiết khấu:</Text>
                  <Text strong type="danger">-{discount.toLocaleString('vi-VN')}₫</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text>VAT (10%):</Text>
                  <Text strong>{tax.toLocaleString('vi-VN')}₫</Text>
                </div>
                <Divider style={{ margin: '8px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                  <Title level={4} style={{ margin: 0 }}>Tổng cộng:</Title>
                  <Title level={4} style={{ margin: 0, color: '#ff4d4f' }}>
                    {(finalAmount + tax).toLocaleString('vi-VN')}₫
                  </Title>
                </div>
                
                <Space style={{ width: '100%' }}>
                  <Button 
                    type="primary" 
                    icon={<CreditCardOutlined />} 
                    style={{ flex: 1 }}
                    size="large"
                    block
                    disabled={cartItems.length === 0}
                    onClick={() => setPaymentModalVisible(true)}
                  >
                    Thanh toán
                  </Button>
                  <Button 
                    icon={<SaveOutlined />}
                    disabled={cartItems.length === 0}
                  >
                    Lưu
                  </Button>
                </Space>
              </div>
            </Card>
          </Col>
        </Row>
      </Content>
      
      {/* Payment Modal */}
      <Modal
        title="Thanh toán"
        open={paymentModalVisible}
        onCancel={() => setPaymentModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={paymentForm} layout="vertical" onFinish={handlePayment}>
          <div style={{ marginBottom: 20 }}>
            <Statistic 
              title="Tổng tiền thanh toán"
              value={(finalAmount + tax).toLocaleString('vi-VN') + '₫'}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </div>
          
          <Form.Item name="paymentMethod" label="Phương thức thanh toán" initialValue="cash" rules={[{ required: true }]}>
            <Select>
              <Option value="cash">
                <DollarOutlined /> Tiền mặt
              </Option>
              <Option value="card">
                <CreditCardOutlined /> Thẻ
              </Option>
              <Option value="vnpay">
                <QrcodeOutlined /> VNPay
              </Option>
              <Option value="momo">
                <QrcodeOutlined /> MoMo
              </Option>
              <Option value="zalopay">
                <QrcodeOutlined /> ZaloPay
              </Option>
            </Select>
          </Form.Item>
          
          <Form.Item name="amountPaid" label="Số tiền khách trả" rules={[{ required: true }]}>
            <InputNumber
              style={{ width: '100%' }}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
              min={finalAmount + tax}
              defaultValue={finalAmount + tax}
              step={10000}
            />
          </Form.Item>
          
          <Form.Item name="note" label="Ghi chú">
            <Input.TextArea rows={2} />
          </Form.Item>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button icon={<CloseOutlined />} onClick={() => setPaymentModalVisible(false)}>
              Hủy
            </Button>
            <Button icon={<PrinterOutlined />} htmlType="submit" type="primary">
              Thanh toán & In hóa đơn
            </Button>
          </div>
        </Form>
      </Modal>
      
      {/* Customer Selection Modal */}
      <Modal
        title="Chọn khách hàng"
        open={customerModalVisible}
        onCancel={() => setCustomerModalVisible(false)}
        footer={null}
      >
        <Input
          placeholder="Tìm kiếm khách hàng..."
          prefix={<SearchOutlined />}
          style={{ marginBottom: 16 }}
        />
        
        <List
          itemLayout="horizontal"
          dataSource={customers}
          renderItem={(customer) => (
            <List.Item
              style={{ cursor: 'pointer' }}
              onClick={() => handleSelectCustomer(customer)}
            >
              <List.Item.Meta
                avatar={<Avatar icon={<UserOutlined />} />}
                title={customer.name}
                description={`SĐT: ${customer.phone} - Điểm tích lũy: ${customer.points}`}
              />
            </List.Item>
          )}
        />
        
        <Divider />
        
        <Button type="dashed" icon={<PlusOutlined />} style={{ width: '100%' }}>
          Thêm khách hàng mới
        </Button>
      </Modal>
    </Layout>
  );
};

export default ModernPOSPage;