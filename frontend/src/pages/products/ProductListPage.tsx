// Real product management with Vietnamese business logic
import React, { useState, useEffect, useRef } from 'react';
import { 
  Card, 
  Button, 
  Space, 
  Table, 
  Input, 
  Select, 
  Tag, 
  Modal, 
  Form, 
  InputNumber, 
  Typography,
  Row,
  Col,
  Statistic,
  Badge,
  Spin,
  Alert,
  Upload,
  Image,
  Tooltip,
  DatePicker,
  Switch,
  TreeSelect,
  message
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  SearchOutlined,
  ExportOutlined,
  ImportOutlined,
  BarChartOutlined,
  ReloadOutlined,
  CameraOutlined,
  QrcodeOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { formatVND } from '../../utils/formatters/vndCurrency';
import { usePage } from '../../stores';
import { productService, Product, ProductCategory, ProductFilters } from '../../services/api/productService';
import { useDebounce } from '../../hooks/useDebounce';
import dayjs from 'dayjs';

const { Search } = Input;
const { Option } = Select;
const { Title, Text } = Typography;
const { confirm } = Modal;

// Vietnamese units of measurement
const VIETNAMESE_UNITS = [
  { value: 'cái', label: 'Cái' },
  { value: 'kg', label: 'Kilogram (kg)' },
  { value: 'g', label: 'Gram (g)' },
  { value: 'lít', label: 'Lít' },
  { value: 'ml', label: 'Mililít (ml)' },
  { value: 'hộp', label: 'Hộp' },
  { value: 'gói', label: 'Gói' },
  { value: 'chai', label: 'Chai' },
  { value: 'lon', label: 'Lon' },
  { value: 'thùng', label: 'Thùng' },
  { value: 'bao', label: 'Bao' },
  { value: 'túi', label: 'Túi' },
  { value: 'đôi', label: 'Đôi' },
  { value: 'bộ', label: 'Bộ' },
  { value: 'chiếc', label: 'Chiếc' },
  { value: 'ly', label: 'Ly' },
  { value: 'tô', label: 'Tô' },
  { value: 'dĩa', label: 'Dĩa' },
  { value: 'phần', label: 'Phần' },
  { value: 'suất', label: 'Suất' }
];

// Vietnamese VAT rates
const VAT_RATES = [
  { value: 0, label: '0% - Hàng hóa không chịu thuế' },
  { value: 5, label: '5% - Hàng hóa thiết yếu' },
  { value: 8, label: '8% - Dịch vụ' },
  { value: 10, label: '10% - Mức thuế tiêu chuẩn' },
  { value: 20, label: '20% - Hàng xa xỉ' }
];

// Vietnamese provinces for origin tracking
const VIETNAMESE_PROVINCES = [
  'An Giang', 'Bà Rịa - Vũng Tàu', 'Bạc Liêu', 'Bắc Giang', 'Bắc Kạn', 'Bắc Ninh',
  'Bến Tre', 'Bình Dương', 'Bình Định', 'Bình Phước', 'Bình Thuận', 'Cà Mau',
  'Cao Bằng', 'Cần Thơ', 'Đà Nẵng', 'Đắk Lắk', 'Đắk Nông', 'Điện Biên',
  'Đồng Nai', 'Đồng Tháp', 'Gia Lai', 'Hà Giang', 'Hà Nam', 'Hà Nội',
  'Hà Tĩnh', 'Hải Dương', 'Hải Phòng', 'Hậu Giang', 'Hòa Bình', 'Hưng Yên',
  'Khánh Hòa', 'Kiên Giang', 'Kon Tum', 'Lai Châu', 'Lâm Đồng', 'Lạng Sơn',
  'Lào Cai', 'Long An', 'Nam Định', 'Nghệ An', 'Ninh Bình', 'Ninh Thuận',
  'Phú Thọ', 'Phú Yên', 'Quảng Bình', 'Quảng Nam', 'Quảng Ngãi', 'Quảng Ninh',
  'Quảng Trị', 'Sóc Trăng', 'Sơn La', 'Tây Ninh', 'Thái Bình', 'Thái Nguyên',
  'Thanh Hóa', 'Thừa Thiên Huế', 'Tiền Giang', 'TP. Hồ Chí Minh', 'Trà Vinh',
  'Tuyên Quang', 'Vĩnh Long', 'Vĩnh Phúc', 'Yên Bái'
];

export const ProductListPage: React.FC = () => {
  // State management
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filters and search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [priceRange, setPriceRange] = useState<[number, number] | null>(null);
  
  // Pagination and sorting
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0
  });
  const [sorter, setSorter] = useState<{ field?: string; order?: 'ascend' | 'descend' }>({});
  
  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [barcodeModalVisible, setBarcodeModalVisible] = useState(false);
  const [selectedProductForBarcode, setSelectedProductForBarcode] = useState<Product | null>(null);
  
  // Forms and refs
  const [form] = Form.useForm();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { setPageTitle, setBreadcrumbs } = usePage();
  
  // Debounced search
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Load initial data
  useEffect(() => {
    setPageTitle('Quản lý sản phẩm');
    setBreadcrumbs([
      { title: 'Sản phẩm' },
    ]);
    loadCategories();
    loadProducts();
  }, [setPageTitle, setBreadcrumbs]);

  // Load products when filters change
  useEffect(() => {
    loadProducts();
  }, [
    debouncedSearchQuery, 
    selectedCategory, 
    selectedStatus, 
    priceRange, 
    pagination.current, 
    pagination.pageSize,
    sorter
  ]);

  // Load categories
  const loadCategories = async () => {
    try {
      const categoriesData = await productService.getCategories();
      setCategories([
        { id: 'all', name: 'Tất cả', isActive: true } as ProductCategory,
        ...categoriesData.filter(cat => cat.isActive)
      ]);
    } catch (err) {
      // Use fallback categories if API fails
      setCategories([
        { id: 'all', name: 'Tất cả', isActive: true } as ProductCategory,
        { id: 'drinks', name: 'Đồ uống', isActive: true } as ProductCategory,
        { id: 'food', name: 'Đồ ăn', isActive: true } as ProductCategory,
        { id: 'snacks', name: 'Đồ ăn vặt', isActive: true } as ProductCategory,
      ]);
    }
  };

  // Load products with filters
  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      const filters: ProductFilters = {
        search: debouncedSearchQuery || undefined,
        categoryId: selectedCategory === 'all' ? undefined : selectedCategory,
        isActive: selectedStatus === 'active' ? true : selectedStatus === 'inactive' ? false : undefined,
        minPrice: priceRange?.[0],
        maxPrice: priceRange?.[1],
        page: pagination.current,
        pageSize: pagination.pageSize,
        sortBy: sorter.field as string,
        sortOrder: sorter.order === 'ascend' ? 'asc' : sorter.order === 'descend' ? 'desc' : undefined
      };

      const result = await productService.getProducts(filters);
      setProducts(result.products);
      setPagination(prev => ({
        ...prev,
        total: result.total
      }));
    } catch (err: any) {
      setError('Không thể tải danh sách sản phẩm. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // Product management handlers
  const handleAddProduct = () => {
    setEditingProduct(null);
    form.resetFields();
    // Set default values
    form.setFieldsValue({
      vatRate: 10, // Default Vietnamese VAT rate
      unit: 'cái',
      origin: 'TP. Hồ Chí Minh',
      isActive: true,
      isPerishable: false
    });
    setModalVisible(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    form.setFieldsValue({
      ...product,
      expiryDate: product.expiryDate ? dayjs(product.expiryDate) : null,
      manufactureDate: product.manufactureDate ? dayjs(product.manufactureDate) : null
    });
    setModalVisible(true);
  };

  const handleDeleteProduct = (product: Product) => {
    confirm({
      title: 'Xác nhận xóa sản phẩm',
      content: `Bạn có chắc muốn xóa sản phẩm "${product.name}"?`,
      icon: <ExclamationCircleOutlined />,
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await productService.deleteProduct(product.id);
          message.success('Đã xóa sản phẩm thành công');
          loadProducts();
        } catch (err: any) {
          message.error(err.message || 'Không thể xóa sản phẩm');
        }
      },
    });
  };

  const handleSaveProduct = async (values: any) => {
    try {
      setSaving(true);
      
      // Process form data with Vietnamese business logic
      const productData = {
        ...values,
        expiryDate: values.expiryDate ? values.expiryDate.toISOString() : undefined,
        manufactureDate: values.manufactureDate ? values.manufactureDate.toISOString() : undefined,
        sellPrice: values.price, // Use price as sell price
        qualityStandards: values.qualityStandards || [],
        tags: values.tags || [],
        attributes: values.attributes || {}
      };

      if (editingProduct) {
        await productService.updateProduct({
          id: editingProduct.id,
          ...productData
        });
        message.success('Đã cập nhật sản phẩm thành công');
      } else {
        await productService.createProduct(productData);
        message.success('Đã thêm sản phẩm mới thành công');
      }
      
      setModalVisible(false);
      form.resetFields();
      loadProducts();
    } catch (err: any) {
      message.error(err.message || 'Không thể lưu sản phẩm');
    } finally {
      setSaving(false);
    }
  };

  // Barcode generation
  const handleGenerateBarcode = async (product: Product) => {
    try {
      const barcodeData = await productService.generateBarcode(product.id);
      setSelectedProductForBarcode({ ...product, barcode: barcodeData.barcode });
      setBarcodeModalVisible(true);
    } catch (err: any) {
      message.error('Không thể tạo mã vạch');
    }
  };

  // Import/Export handlers
  const handleImportProducts = async (file: File) => {
    try {
      setLoading(true);
      const result = await productService.importProducts(file);
      message.success(`Đã nhập ${result.success} sản phẩm. Lỗi: ${result.failed}`);
      if (result.errors.length > 0) {
        // Show errors in a modal or notification
        Modal.error({
          title: 'Lỗi nhập dữ liệu',
          content: result.errors.slice(0, 5).map(err => 
            `Dòng ${err.row}: ${err.error}`
          ).join('\n')
        });
      }
      loadProducts();
    } catch (err: any) {
      message.error('Không thể nhập file');
    } finally {
      setLoading(false);
    }
  };

  const handleExportProducts = async (format: 'csv' | 'xlsx') => {
    try {
      const blob = await productService.exportProducts(format, {
        search: debouncedSearchQuery || undefined,
        categoryId: selectedCategory === 'all' ? undefined : selectedCategory,
        isActive: selectedStatus === 'active' ? true : selectedStatus === 'inactive' ? false : undefined
      });
      
      // Download file
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `products_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      message.success('Đã xuất file thành công');
    } catch (err: any) {
      message.error('Không thể xuất file');
    }
  };

  // Table columns with Vietnamese business data
  const columns = [
    {
      title: 'Sản phẩm',
      dataIndex: 'name',
      key: 'name',
      sorter: true,
      render: (text: string, record: Product) => (
        <div>
          <div className="flex items-center space-x-2">
            {record.images && record.images.length > 0 ? (
              <Image
                src={record.images[0]}
                alt={record.name}
                width={40}
                height={40}
                className="rounded object-cover"
                preview={false}
              />
            ) : (
              <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                <Text className="text-gray-400 text-xs">{text.charAt(0)}</Text>
              </div>
            )}
            <div>
              <div className="font-medium">{text}</div>
              <div className="text-xs text-gray-500">
                SKU: {record.sku} | {record.barcode || 'Chưa có mã vạch'}
              </div>
              <div className="text-xs text-gray-400">{record.unit}</div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Danh mục',
      dataIndex: 'categoryName',
      key: 'categoryName',
      render: (categoryName: string, record: Product) => (
        <div>
          <Tag color="blue">{categoryName}</Tag>
          {record.brandName && (
            <div className="text-xs text-gray-500 mt-1">
              Thương hiệu: {record.brandName}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Giá bán / VAT',
      key: 'pricing',
      sorter: true,
      render: (_: any, record: Product) => (
        <div>
          <div className="font-medium text-green-600">
            {formatVND(record.sellPrice || record.price)}
          </div>
          <div className="text-xs text-gray-500">
            Vốn: {formatVND(record.costPrice)}
          </div>
          <div className="text-xs">
            <Tag color="orange">VAT {record.vatRate}%</Tag>
          </div>
        </div>
      ),
    },
    {
      title: 'Tồn kho',
      dataIndex: 'stock',
      key: 'stock',
      sorter: true,
      render: (stock: number, record: Product) => {
        const status = stock <= 0 ? 'error' : stock <= record.minStock ? 'warning' : 'success';
        const color = stock <= 0 ? '#ff4d4f' : stock <= record.minStock ? '#faad14' : '#52c41a';
        
        return (
          <div>
            <Badge
              count={stock}
              showZero
              style={{ backgroundColor: color }}
            />
            <div className="text-xs text-gray-500 mt-1">
              Tối thiểu: {record.minStock}
            </div>
            {stock <= record.reorderLevel && (
              <Tag color="red" className="text-xs">
                Cần nhập hàng
              </Tag>
            )}
          </div>
        );
      },
    },
    {
      title: 'Nguồn gốc',
      dataIndex: 'origin',
      key: 'origin',
      render: (origin: string, record: Product) => (
        <div>
          <div className="text-sm">{origin}</div>
          {record.supplierName && (
            <div className="text-xs text-gray-500">
              NCC: {record.supplierName}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Trạng thái',
      key: 'status',
      render: (_: any, record: Product) => (
        <div>
          <Tag color={record.isActive ? 'green' : 'red'}>
            {record.isActive ? 'Hoạt động' : 'Ngừng bán'}
          </Tag>
          {record.isPerishable && (
            <Tag color="orange" className="mt-1">
              Có hạn dùng
            </Tag>
          )}
          {record.isFeatured && (
            <Tag color="purple" className="mt-1">
              Nổi bật
            </Tag>
          )}
          {record.expiryDate && (
            <div className="text-xs text-gray-500 mt-1">
              HSD: {new Date(record.expiryDate).toLocaleDateString('vi-VN')}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Hành động',
      key: 'actions',
      width: 120,
      render: (_: any, record: Product) => (
        <Space direction="vertical" size="small">
          <Space>
            <Tooltip title="Chỉnh sửa">
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleEditProduct(record)}
              />
            </Tooltip>
            <Tooltip title="Tạo mã vạch">
              <Button
                type="link"
                size="small"
                icon={<QrcodeOutlined />}
                onClick={() => handleGenerateBarcode(record)}
              />
            </Tooltip>
            <Tooltip title="Xóa">
              <Button
                type="link"
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleDeleteProduct(record)}
              />
            </Tooltip>
          </Space>
        </Space>
      ),
    },
  ];

  // Calculate Vietnamese business statistics
  const totalProducts = products.length;
  const totalValue = products.reduce((sum, p) => sum + ((p.sellPrice || p.price) * p.stock), 0);
  const totalCostValue = products.reduce((sum, p) => sum + (p.costPrice * p.stock), 0);
  const lowStockCount = products.filter(p => p.stock <= p.minStock).length;
  const outOfStockCount = products.filter(p => p.stock === 0).length;
  const reorderCount = products.filter(p => p.stock <= p.reorderLevel).length;
  const perishableExpiringCount = products.filter(p => 
    p.isPerishable && p.expiryDate && 
    new Date(p.expiryDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
  ).length;

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Tổng sản phẩm"
              value={totalProducts}
              prefix={<BarChartOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Giá trị kho"
              value={totalValue}
              formatter={(value) => formatVND(Number(value))}
              prefix={<ExportOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Sắp hết hàng"
              value={lowStockCount}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Hết hàng"
              value={outOfStockCount}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Main Card */}
      <Card
        title="Danh sách sản phẩm"
        extra={
          <Space>
            <Button icon={<ImportOutlined />}>
              Nhập Excel
            </Button>
            <Button icon={<ExportOutlined />}>
              Xuất Excel
            </Button>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={handleAddProduct}
            >
              Thêm sản phẩm
            </Button>
          </Space>
        }
      >
        {/* Filters */}
        <Row gutter={[16, 16]} className="mb-4">
          <Col xs={24} md={12}>
            <Search
              placeholder="Tìm kiếm tên sản phẩm hoặc mã vạch..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} md={6}>
            <Select
              style={{ width: '100%' }}
              value={selectedCategory}
              onChange={setSelectedCategory}
              placeholder="Chọn danh mục"
            >
              {categories.map(cat => (
                <Option key={cat.id} value={cat.id}>
                  {cat.name}
                </Option>
              ))}
            </Select>
          </Col>
        </Row>

        {/* Product Table */}
        <Table
          columns={columns}
          dataSource={filteredProducts}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} của ${total} sản phẩm`,
          }}
        />
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        title={editingProduct ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveProduct}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Tên sản phẩm"
                name="name"
                rules={[{ required: true, message: 'Vui lòng nhập tên sản phẩm' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Mã vạch"
                name="barcode"
                rules={[{ required: true, message: 'Vui lòng nhập mã vạch' }]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Danh mục"
                name="categoryId"
                rules={[{ required: true, message: 'Vui lòng chọn danh mục' }]}
              >
                <Select>
                  {categories.filter(c => c.id !== 'all').map(cat => (
                    <Option key={cat.id} value={cat.id}>
                      {cat.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Đơn vị"
                name="unit"
                rules={[{ required: true, message: 'Vui lòng nhập đơn vị' }]}
              >
                <Input placeholder="Ly, Cái, Gói..." />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="Giá vốn"
                name="costPrice"
                rules={[{ required: true, message: 'Vui lòng nhập giá vốn' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
                  addonAfter="₫"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Giá bán"
                name="price"
                rules={[{ required: true, message: 'Vui lòng nhập giá bán' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
                  addonAfter="₫"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Tồn kho"
                name="stock"
                rules={[{ required: true, message: 'Vui lòng nhập số lượng tồn kho' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Mô tả"
            name="description"
          >
            <Input.TextArea rows={3} />
          </Form.Item>

          <Form.Item
            label="Nhà cung cấp"
            name="supplier"
          >
            <Input />
          </Form.Item>

          <div className="flex justify-end space-x-2">
            <Button onClick={() => setModalVisible(false)}>
              Hủy
            </Button>
            <Button type="primary" htmlType="submit">
              {editingProduct ? 'Cập nhật' : 'Thêm mới'}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default ProductListPage;
