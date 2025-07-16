import React, { useState, useMemo } from 'react';
import { 
  Table, Button, Space, Input, Typography, Card, Modal, Form, 
  InputNumber, Select, Tag, Popconfirm, message, Row, Col,
  Upload, Image, Statistic, Alert, Grid, Divider
} from 'antd';
import { 
  PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined,
  UploadOutlined, BarChartOutlined, ExclamationCircleOutlined,
  EyeOutlined, FileTextOutlined
} from '@ant-design/icons';
import { useProductStore, type Product } from '../../stores/useProductStore';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { useBreakpoint } = Grid;

export default function ProductsPage() {
  const screens = useBreakpoint();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form] = Form.useForm();
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

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
        <Space>
          <Button
            type={viewMode === 'table' ? 'primary' : 'default'}
            icon={<FileTextOutlined />}
            onClick={() => setViewMode('table')}
          >
            Bảng
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddProduct}
          >
            Thêm sản phẩm
          </Button>
        </Space>
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
              prefix="₫"
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
}