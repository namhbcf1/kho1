import {
    AppstoreOutlined,
    BarChartOutlined,
    BarcodeOutlined,
    DatabaseOutlined,
    DeleteOutlined,
    EditOutlined,
    ExclamationCircleOutlined,
    EyeOutlined,
    PlusOutlined, SearchOutlined,
    TagOutlined
} from '@ant-design/icons';
import {
    Alert,
    Button,
    Card,
    Col,
    Form,
    Grid,
    Image,
    Input,
    InputNumber,
    message,
    Modal,
    Popconfirm,
    Row,
    Select,
    Space,
    Statistic,
    Table,
    Tabs,
    Tag,
    Typography
} from 'antd';
import React, { useMemo, useState } from 'react';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { useBreakpoint } = Grid;
const { TabPane } = Tabs;

// Mock product store
const useProductStore = () => {
  // Mock categories
  const categories = [
    { id: 'phone', name: 'Điện thoại' },
    { id: 'laptop', name: 'Laptop' },
    { id: 'tablet', name: 'Máy tính bảng' },
    { id: 'watch', name: 'Đồng hồ' },
    { id: 'accessory', name: 'Phụ kiện' },
  ];

  // Mock products
  const [products, setProducts] = useState([
    {
      id: '1',
      name: 'iPhone 15 Pro Max',
      price: 34990000,
      category: 'phone',
      stock: 15,
      barcode: '8938505974861',
      image: 'https://cdn.tgdd.vn/Products/Images/42/299033/iphone-15-pro-max-blue-thumbnew-600x600.jpg',
      description: 'Điện thoại iPhone 15 Pro Max mới nhất của Apple'
    },
    {
      id: '2',
      name: 'Samsung Galaxy S24 Ultra',
      price: 29990000,
      category: 'phone',
      stock: 10,
      barcode: '8806092992733',
      image: 'https://cdn.tgdd.vn/Products/Images/42/310785/samsung-galaxy-s24-ultra-xanh-thumb-600x600.jpg',
      description: 'Điện thoại Samsung Galaxy S24 Ultra mới nhất'
    },
    {
      id: '3',
      name: 'iPad Air 5',
      price: 16990000,
      category: 'tablet',
      stock: 8,
      barcode: '8936082080136',
      image: 'https://cdn.tgdd.vn/Products/Images/522/274155/ipad-air-5-wifi-gray-thumb-600x600.jpg',
      description: 'Máy tính bảng iPad Air 5'
    },
    {
      id: '4',
      name: 'MacBook Air M3',
      price: 32990000,
      category: 'laptop',
      stock: 5,
      barcode: '8939304727156',
      image: 'https://cdn.tgdd.vn/Products/Images/44/306103/macbook-air-m3-thumb-600x600.jpg',
      description: 'Laptop MacBook Air M3 mới nhất của Apple'
    },
    {
      id: '5',
      name: 'Apple Watch Series 9',
      price: 11990000,
      category: 'watch',
      stock: 12,
      barcode: '8935142967237',
      image: 'https://cdn.tgdd.vn/Products/Images/7077/289612/apple-watch-s9-gps-41mm-thumb-1-1-600x600.jpg',
      description: 'Đồng hồ thông minh Apple Watch Series 9'
    },
    {
      id: '6',
      name: 'AirPods Pro 2',
      price: 6790000,
      category: 'accessory',
      stock: 20,
      barcode: '8932082951264',
      image: 'https://cdn.tgdd.vn/Products/Images/54/290702/airpods-pro-2-thumb-600x600.jpeg',
      description: 'Tai nghe không dây AirPods Pro 2'
    },
    {
      id: '7',
      name: 'Sạc dự phòng 20.000mAh',
      price: 990000,
      category: 'accessory',
      stock: 30,
      barcode: '8930174835942',
      image: 'https://cdn.tgdd.vn/Products/Images/57/217009/pin-du-phong-10000mah-ava-ds003-thumb-5-600x600.jpeg',
      description: 'Sạc dự phòng dung lượng cao 20.000mAh'
    },
    {
      id: '8',
      name: 'Ốp lưng iPhone 15 Pro Max',
      price: 390000,
      category: 'accessory',
      stock: 50,
      barcode: '8938491057391',
      image: 'https://cdn.tgdd.vn/Products/Images/60/310246/op-lung-iphone-15-pro-max-nhua-memsoft-touch-dada-xanh-navy-thumb-600x600.jpg',
      description: 'Ốp lưng bảo vệ cho iPhone 15 Pro Max'
    },
  ]);

  const loading = false;
  const error = null;

  // Add product
  const addProduct = (product: any) => {
    const newProduct = {
      id: (products.length + 1).toString(),
      ...product,
    };
    setProducts([...products, newProduct]);
  };

  // Update product
  const updateProduct = (id: string, product: any) => {
    setProducts(products.map(p => p.id === id ? { ...p, ...product } : p));
  };

  // Delete product
  const deleteProduct = (id: string) => {
    setProducts(products.filter(p => p.id !== id));
  };

  // Get low stock products
  const getLowStockProducts = (threshold: number) => {
    return products.filter(p => p.stock < threshold);
  };

  return {
    products,
    categories,
    addProduct,
    updateProduct,
    deleteProduct,
    getLowStockProducts,
    loading,
    error
  };
};

type Product = {
  id: string;
  name: string;
  price: number;
  category: string;
  stock: number;
  barcode?: string;
  description?: string;
  image?: string;
};

interface ProductsPageProps {
  initialTab?: string;
}

const ProductsPage: React.FC<ProductsPageProps> = ({ initialTab = 'list' }) => {
  const screens = useBreakpoint();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form] = Form.useForm();
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [activeTab, setActiveTab] = useState(initialTab);

  const {
    products,
    categories,
    addProduct,
    updateProduct,
    deleteProduct,
    getLowStockProducts,
    loading,
    error
  } = useProductStore();

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

  const lowStockProducts = getLowStockProducts(10);
  const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);

  const handleAddProduct = () => {
    setEditingProduct(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    form.setFieldsValue(product);
    setModalVisible(true);
  };

  const handleDeleteProduct = (id: string) => {
    deleteProduct(id);
    message.success('Đã xóa sản phẩm thành công');
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      if (editingProduct) {
        updateProduct(editingProduct.id, values);
        message.success('Cập nhật sản phẩm thành công');
      } else {
        addProduct(values);
        message.success('Thêm sản phẩm thành công');
      }
      
      setModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const columns = [
    {
      title: 'Sản phẩm',
      key: 'product',
      width: screens.lg ? 300 : 200,
      render: (record: Product) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {record.image && (
            <Image
              width={40}
              height={40}
              src={record.image}
              style={{ marginRight: 12, borderRadius: 4 }}
              placeholder
            />
          )}
          <div>
            <Text strong style={{ display: 'block', fontSize: '14px' }}>
              {record.name}
            </Text>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.barcode}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: 'Danh mục',
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (category: string) => {
        const cat = categories.find(c => c.id === category);
        return <Tag color="blue">{cat?.name || category}</Tag>;
      },
      filters: categories.map(cat => ({ text: cat.name, value: cat.id })),
      onFilter: (value: any, record: Product) => record.category === value,
    },
    {
      title: 'Giá bán',
      dataIndex: 'price',
      key: 'price',
      width: 120,
      render: (price: number) => (
        <Text strong style={{ color: '#1890ff' }}>
          {price.toLocaleString()}₫
        </Text>
      ),
      sorter: (a: Product, b: Product) => a.price - b.price,
    },
    {
      title: 'Tồn kho',
      dataIndex: 'stock',
      key: 'stock',
      width: 100,
      render: (stock: number) => (
        <Tag color={stock > 20 ? 'green' : stock > 0 ? 'orange' : 'red'}>
          {stock}
        </Tag>
      ),
      sorter: (a: Product, b: Product) => a.stock - b.stock,
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 120,
      render: (record: Product) => (
        <Space size="small">
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => {
              Modal.info({
                title: record.name,
                width: 500,
                content: (
                  <div>
                    {record.image && (
                      <Image src={record.image} style={{ marginBottom: 16 }} />
                    )}
                    <p><strong>Mã vạch:</strong> {record.barcode}</p>
                    <p><strong>Giá:</strong> {record.price.toLocaleString()}₫</p>
                    <p><strong>Tồn kho:</strong> {record.stock}</p>
                    {record.description && (
                      <p><strong>Mô tả:</strong> {record.description}</p>
                    )}
                  </div>
                ),
              });
            }}
          />
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditProduct(record)}
          />
          <Popconfirm
            title="Xóa sản phẩm này?"
            description="Thao tác này không thể hoàn tác"
            onConfirm={() => handleDeleteProduct(record.id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // Tab items
  const tabItems = [
    {
      key: 'list',
      tab: <span><AppstoreOutlined />Danh sách</span>,
      children: (
        <div>
          <Card>
            {/* Search and Filter Controls */}
            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
              <Col xs={24} sm={12} lg={8}>
                <Input
                  placeholder="Tìm kiếm sản phẩm..."
                  prefix={<SearchOutlined />}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  allowClear
                />
              </Col>
              <Col xs={24} sm={12} lg={8}>
                <Select
                  placeholder="Chọn danh mục"
                  value={selectedCategory}
                  onChange={setSelectedCategory}
                  style={{ width: '100%' }}
                  allowClear
                >
                  <Option value="all">Tất cả danh mục</Option>
                  {categories.map(cat => (
                    <Option key={cat.id} value={cat.id}>{cat.name}</Option>
                  ))}
                </Select>
              </Col>
            </Row>

            <Table
              columns={columns}
              dataSource={filteredProducts}
              rowKey="id"
              loading={loading}
              pagination={{
                pageSize: 20,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} trên ${total} sản phẩm`,
              }}
              scroll={{ x: 800 }}
              size={screens.lg ? 'middle' : 'small'}
            />
          </Card>
        </div>
      )
    },
    {
      key: 'categories',
      tab: <span><TagOutlined />Danh mục</span>,
      children: (
        <Card title="Quản lý danh mục">
          <div style={{ textAlign: 'center', padding: 40 }}>
            <TagOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
            <Title level={4}>Tính năng đang được phát triển</Title>
            <Text>Chức năng quản lý danh mục sản phẩm sẽ sớm được triển khai</Text>
          </div>
        </Card>
      )
    },
    {
      key: 'inventory',
      tab: <span><DatabaseOutlined />Kho hàng</span>,
      children: (
        <Card title="Quản lý tồn kho">
          <div style={{ textAlign: 'center', padding: 40 }}>
            <DatabaseOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
            <Title level={4}>Tính năng đang được phát triển</Title>
            <Text>Chức năng quản lý tồn kho sẽ sớm được triển khai</Text>
          </div>
        </Card>
      )
    },
    {
      key: 'barcodes',
      tab: <span><BarcodeOutlined />Mã vạch</span>,
      children: (
        <Card title="Quản lý mã vạch">
          <div style={{ textAlign: 'center', padding: 40 }}>
            <BarcodeOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
            <Title level={4}>Tính năng đang được phát triển</Title>
            <Text>Chức năng quản lý mã vạch sẽ sớm được triển khai</Text>
          </div>
        </Card>
      )
    },
  ];

  return (
    <div className="products-page" style={{ padding: 0 }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 24,
        flexWrap: 'wrap',
        gap: 16
      }}>
        <Title level={2} style={{ margin: 0, fontSize: 'clamp(1.25rem, 3vw, 1.75rem)' }}>
          Quản lý sản phẩm
        </Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAddProduct}
        >
          Thêm sản phẩm
        </Button>
      </div>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tổng sản phẩm"
              value={products.length}
              prefix={<BarChartOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tổng giá trị kho"
              value={totalValue}
              precision={0}
              formatter={value => `${value?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}₫`}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Sắp hết hàng"
              value={lowStockProducts.length}
              valueStyle={{ color: '#fa8c16' }}
              prefix={<ExclamationCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Danh mục"
              value={categories.length}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <Alert
          message="Cảnh báo tồn kho thấp"
          description={`${lowStockProducts.length} sản phẩm sắp hết hàng: ${lowStockProducts.slice(0, 3).map(p => p.name).join(', ')}${lowStockProducts.length > 3 ? '...' : ''}`}
          type="warning"
          showIcon
          style={{ marginBottom: 24 }}
          closable
        />
      )}

      {/* Tabs */}
      <Tabs 
        activeKey={activeTab}
        onChange={setActiveTab}
        type="card"
        items={tabItems}
      />

      {/* Add/Edit Product Modal */}
      <Modal
        title={editingProduct ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSubmit}
        width={screens.lg ? 600 : '95%'}
        okText={editingProduct ? 'Cập nhật' : 'Thêm'}
        cancelText="Hủy"
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            category: categories[0]?.id,
            stock: 0,
            price: 0,
          }}
        >
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="name"
                label="Tên sản phẩm"
                rules={[{ required: true, message: 'Vui lòng nhập tên sản phẩm' }]}
              >
                <Input placeholder="Nhập tên sản phẩm" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="barcode"
                label="Mã vạch"
              >
                <Input placeholder="Nhập mã vạch" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="category"
                label="Danh mục"
                rules={[{ required: true, message: 'Vui lòng chọn danh mục' }]}
              >
                <Select placeholder="Chọn danh mục">
                  {categories.map(cat => (
                    <Option key={cat.id} value={cat.id}>{cat.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="price"
                label="Giá bán (₫)"
                rules={[{ required: true, message: 'Vui lòng nhập giá bán' }]}
              >
                <InputNumber
                  placeholder="Nhập giá bán"
                  style={{ width: '100%' }}
                  min={0}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="stock"
            label="Số lượng tồn kho"
            rules={[{ required: true, message: 'Vui lòng nhập số lượng' }]}
          >
            <InputNumber
              placeholder="Nhập số lượng"
              style={{ width: '100%' }}
              min={0}
            />
          </Form.Item>

          <Form.Item
            name="description"
            label="Mô tả"
          >
            <TextArea
              placeholder="Nhập mô tả sản phẩm"
              rows={3}
            />
          </Form.Item>

          <Form.Item
            name="image"
            label="Hình ảnh"
          >
            <Input placeholder="URL hình ảnh" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProductsPage; 