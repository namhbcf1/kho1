// Modern Product Management with drag-drop, advanced search, and beautiful UI
import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  Drawer,
  Tabs,
  Progress,
  Avatar,
  Dropdown,
  Menu,
  Checkbox,
  Radio,
  Slider,
  TreeSelect,
  AutoComplete,
  Cascader,
  TimePicker,
  Rate,
  message,
  notification
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
  ExclamationCircleOutlined,
  DragOutlined,
  FilterOutlined,
  SortAscendingOutlined,
  SortDescendingOutlined,
  EyeOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
  TagsOutlined,
  StarOutlined,
  HeartOutlined,
  FireOutlined,
  ThunderboltOutlined,
  GiftOutlined,
  CrownOutlined,
  TrophyOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  SettingOutlined,
  UserOutlined,
  TeamOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  MailOutlined,
  LinkOutlined,
  PrinterOutlined,
  DownloadOutlined,
  ShareAltOutlined,
  BookOutlined,
  FileTextOutlined,
  PictureOutlined,
  VideoCameraOutlined,
  SoundOutlined,
  FileOutlined,
  FolderOutlined,
  CloudOutlined,
  SafetyOutlined,
  LockOutlined,
  UnlockOutlined,
  BellOutlined,
  NotificationOutlined,
  MessageOutlined,
  CommentOutlined,
  LikeOutlined,
  DislikeOutlined,
  ShareOutlined,
  RetweetOutlined,
  SyncOutlined,
  LoadingOutlined,
  CheckOutlined,
  CloseOutlined,
  InfoOutlined,
  QuestionCircleOutlined,
  MenuOutlined,
  MoreOutlined
} from '@ant-design/icons';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { SortableItem } from './components/SortableItem';
import { formatVND } from '../../utils/formatters/vndCurrency';
import { usePage } from '../../stores';
import { useDebounce } from '../../hooks/useDebounce';
import dayjs from 'dayjs';
import './ModernProductPage.css';

const { Search } = Input;
const { Option } = Select;
const { Title, Text } = Typography;
const { confirm } = Modal;
const { TabPane } = Tabs;
const { CheckableTag } = Tag;

// Mock data for demonstration
const mockProducts = [
  {
    id: 1,
    name: 'iPhone 15 Pro Max',
    sku: 'IP15PM256',
    barcode: '1234567890',
    price: 29990000,
    costPrice: 25000000,
    sellPrice: 29990000,
    stock: 15,
    minStock: 5,
    reorderLevel: 10,
    category: 'Điện tử',
    categoryId: 'electronics',
    categoryName: 'Điện tử',
    brand: 'Apple',
    brandName: 'Apple',
    supplier: 'FPT Shop',
    supplierName: 'FPT Shop',
    unit: 'cái',
    origin: 'Trung Quốc',
    vatRate: 10,
    isActive: true,
    isPerishable: false,
    isFeatured: true,
    isOnSale: false,
    discount: 0,
    description: 'iPhone 15 Pro Max 256GB - Titan Tự Nhiên',
    images: ['https://via.placeholder.com/300x300'],
    tags: ['mới', 'hot', 'premium'],
    rating: 4.8,
    reviews: 125,
    sold: 89,
    views: 1250,
    createdAt: '2024-01-15',
    updatedAt: '2024-01-20',
    expiryDate: null,
    manufactureDate: '2023-12-01',
    warranty: 12,
    qualityStandards: ['CE', 'FCC'],
    attributes: {
      color: 'Titan Tự Nhiên',
      storage: '256GB',
      ram: '8GB'
    }
  },
  {
    id: 2,
    name: 'Samsung Galaxy S24 Ultra',
    sku: 'SGS24U512',
    barcode: '1234567891',
    price: 32990000,
    costPrice: 28000000,
    sellPrice: 32990000,
    stock: 8,
    minStock: 3,
    reorderLevel: 5,
    category: 'Điện tử',
    categoryId: 'electronics',
    categoryName: 'Điện tử',
    brand: 'Samsung',
    brandName: 'Samsung',
    supplier: 'Samsung Vietnam',
    supplierName: 'Samsung Vietnam',
    unit: 'cái',
    origin: 'Việt Nam',
    vatRate: 10,
    isActive: true,
    isPerishable: false,
    isFeatured: true,
    isOnSale: true,
    discount: 5,
    description: 'Samsung Galaxy S24 Ultra 512GB - Titanium Gray',
    images: ['https://via.placeholder.com/300x300'],
    tags: ['mới', 'sale', 'flagship'],
    rating: 4.7,
    reviews: 87,
    sold: 67,
    views: 980,
    createdAt: '2024-01-10',
    updatedAt: '2024-01-18',
    expiryDate: null,
    manufactureDate: '2023-12-15',
    warranty: 12,
    qualityStandards: ['CE', 'FCC'],
    attributes: {
      color: 'Titanium Gray',
      storage: '512GB',
      ram: '12GB'
    }
  },
  {
    id: 3,
    name: 'MacBook Air M3',
    sku: 'MBA15M3',
    barcode: '1234567892',
    price: 35990000,
    costPrice: 30000000,
    sellPrice: 35990000,
    stock: 5,
    minStock: 2,
    reorderLevel: 3,
    category: 'Laptop',
    categoryId: 'laptop',
    categoryName: 'Laptop',
    brand: 'Apple',
    brandName: 'Apple',
    supplier: 'Apple Vietnam',
    supplierName: 'Apple Vietnam',
    unit: 'cái',
    origin: 'Trung Quốc',
    vatRate: 10,
    isActive: true,
    isPerishable: false,
    isFeatured: false,
    isOnSale: false,
    discount: 0,
    description: 'MacBook Air 15" M3 8GB 256GB - Midnight',
    images: ['https://via.placeholder.com/300x300'],
    tags: ['laptop', 'macbook', 'premium'],
    rating: 4.9,
    reviews: 56,
    sold: 23,
    views: 650,
    createdAt: '2024-01-05',
    updatedAt: '2024-01-12',
    expiryDate: null,
    manufactureDate: '2023-11-20',
    warranty: 12,
    qualityStandards: ['CE', 'FCC'],
    attributes: {
      color: 'Midnight',
      storage: '256GB',
      ram: '8GB'
    }
  },
  {
    id: 4,
    name: 'Coca Cola 330ml',
    sku: 'CC330ML',
    barcode: '1234567893',
    price: 12000,
    costPrice: 8000,
    sellPrice: 12000,
    stock: 150,
    minStock: 50,
    reorderLevel: 100,
    category: 'Đồ uống',
    categoryId: 'drinks',
    categoryName: 'Đồ uống',
    brand: 'Coca Cola',
    brandName: 'Coca Cola',
    supplier: 'Coca Cola Vietnam',
    supplierName: 'Coca Cola Vietnam',
    unit: 'lon',
    origin: 'Việt Nam',
    vatRate: 10,
    isActive: true,
    isPerishable: true,
    isFeatured: false,
    isOnSale: false,
    discount: 0,
    description: 'Coca Cola nguyên chất 330ml',
    images: ['https://via.placeholder.com/300x300'],
    tags: ['đồ uống', 'nước ngọt', 'phổ biến'],
    rating: 4.5,
    reviews: 234,
    sold: 1250,
    views: 2800,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-15',
    expiryDate: '2024-12-31',
    manufactureDate: '2024-01-01',
    warranty: 0,
    qualityStandards: ['FDA', 'HACCP'],
    attributes: {
      volume: '330ml',
      taste: 'Nguyên chất'
    }
  },
  {
    id: 5,
    name: 'Bánh mì thịt nướng',
    sku: 'BMTN001',
    barcode: '1234567894',
    price: 25000,
    costPrice: 15000,
    sellPrice: 25000,
    stock: 20,
    minStock: 5,
    reorderLevel: 10,
    category: 'Đồ ăn',
    categoryId: 'food',
    categoryName: 'Đồ ăn',
    brand: 'Nhà làm',
    brandName: 'Nhà làm',
    supplier: 'Bếp gia đình',
    supplierName: 'Bếp gia đình',
    unit: 'cái',
    origin: 'Việt Nam',
    vatRate: 5,
    isActive: true,
    isPerishable: true,
    isFeatured: true,
    isOnSale: false,
    discount: 0,
    description: 'Bánh mì thịt nướng tự làm, tươi ngon',
    images: ['https://via.placeholder.com/300x300'],
    tags: ['đồ ăn', 'tươi', 'ngon'],
    rating: 4.6,
    reviews: 89,
    sold: 456,
    views: 1100,
    createdAt: '2024-01-20',
    updatedAt: '2024-01-20',
    expiryDate: '2024-01-22',
    manufactureDate: '2024-01-20',
    warranty: 0,
    qualityStandards: ['HACCP'],
    attributes: {
      type: 'Bánh mì',
      topping: 'Thịt nướng'
    }
  }
];

const categories = [
  { value: 'all', label: 'Tất cả' },
  { value: 'electronics', label: 'Điện tử' },
  { value: 'laptop', label: 'Laptop' },
  { value: 'drinks', label: 'Đồ uống' },
  { value: 'food', label: 'Đồ ăn' },
  { value: 'fashion', label: 'Thời trang' },
  { value: 'books', label: 'Sách' },
  { value: 'home', label: 'Gia dụng' }
];

const brands = [
  { value: 'all', label: 'Tất cả' },
  { value: 'apple', label: 'Apple' },
  { value: 'samsung', label: 'Samsung' },
  { value: 'coca-cola', label: 'Coca Cola' },
  { value: 'nike', label: 'Nike' },
  { value: 'sony', label: 'Sony' }
];

const suppliers = [
  { value: 'all', label: 'Tất cả' },
  { value: 'fpt-shop', label: 'FPT Shop' },
  { value: 'samsung-vietnam', label: 'Samsung Vietnam' },
  { value: 'apple-vietnam', label: 'Apple Vietnam' },
  { value: 'coca-cola-vietnam', label: 'Coca Cola Vietnam' }
];

const sortOptions = [
  { value: 'name-asc', label: 'Tên A-Z' },
  { value: 'name-desc', label: 'Tên Z-A' },
  { value: 'price-asc', label: 'Giá thấp đến cao' },
  { value: 'price-desc', label: 'Giá cao đến thấp' },
  { value: 'stock-asc', label: 'Tồn kho thấp đến cao' },
  { value: 'stock-desc', label: 'Tồn kho cao đến thấp' },
  { value: 'created-desc', label: 'Mới nhất' },
  { value: 'created-asc', label: 'Cũ nhất' },
  { value: 'sold-desc', label: 'Bán chạy nhất' },
  { value: 'rating-desc', label: 'Đánh giá cao nhất' }
];

const statusOptions = [
  { value: 'all', label: 'Tất cả' },
  { value: 'active', label: 'Hoạt động' },
  { value: 'inactive', label: 'Ngừng bán' },
  { value: 'featured', label: 'Nổi bật' },
  { value: 'on-sale', label: 'Đang sale' },
  { value: 'low-stock', label: 'Sắp hết hàng' },
  { value: 'out-of-stock', label: 'Hết hàng' },
  { value: 'expired', label: 'Hết hạn' }
];

const quickFilters = [
  { key: 'featured', label: 'Nổi bật', icon: <StarOutlined /> },
  { key: 'on-sale', label: 'Đang sale', icon: <FireOutlined /> },
  { key: 'low-stock', label: 'Sắp hết', icon: <WarningOutlined /> },
  { key: 'out-of-stock', label: 'Hết hàng', icon: <ExclamationCircleOutlined /> },
  { key: 'new', label: 'Mới', icon: <ThunderboltOutlined /> },
  { key: 'bestseller', label: 'Bán chạy', icon: <TrophyOutlined /> }
];

const ModernProductPage: React.FC = () => {
  const { setPageTitle, setBreadcrumbs } = usePage();
  
  // State management
  const [products, setProducts] = useState(mockProducts);
  const [filteredProducts, setFilteredProducts] = useState(mockProducts);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // View and layout
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  
  // Search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [selectedSupplier, setSelectedSupplier] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [sortBy, setSortBy] = useState('name-asc');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000000]);
  const [stockRange, setStockRange] = useState<[number, number]>([0, 1000]);
  const [activeQuickFilters, setActiveQuickFilters] = useState<string[]>([]);
  
  // Modals and drawers
  const [productModalVisible, setProductModalVisible] = useState(false);
  const [filterDrawerVisible, setFilterDrawerVisible] = useState(false);
  const [bulkModalVisible, setBulkModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  
  // Forms
  const [form] = Form.useForm();
  const [bulkForm] = Form.useForm();
  
  // Debounced search
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  
  // Drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    setPageTitle('Quản lý sản phẩm');
    setBreadcrumbs([
      { title: 'Sản phẩm' },
    ]);
  }, [setPageTitle, setBreadcrumbs]);

  // Filter products
  useEffect(() => {
    let filtered = [...products];
    
    // Search filter
    if (debouncedSearchQuery) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        product.sku.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        product.barcode.includes(debouncedSearchQuery) ||
        product.description.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
      );
    }
    
    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.categoryId === selectedCategory);
    }
    
    // Brand filter
    if (selectedBrand !== 'all') {
      filtered = filtered.filter(product => product.brand.toLowerCase().includes(selectedBrand));
    }
    
    // Supplier filter
    if (selectedSupplier !== 'all') {
      filtered = filtered.filter(product => product.supplierName.toLowerCase().includes(selectedSupplier));
    }
    
    // Status filter
    if (selectedStatus !== 'all') {
      switch (selectedStatus) {
        case 'active':
          filtered = filtered.filter(product => product.isActive);
          break;
        case 'inactive':
          filtered = filtered.filter(product => !product.isActive);
          break;
        case 'featured':
          filtered = filtered.filter(product => product.isFeatured);
          break;
        case 'on-sale':
          filtered = filtered.filter(product => product.isOnSale);
          break;
        case 'low-stock':
          filtered = filtered.filter(product => product.stock <= product.minStock);
          break;
        case 'out-of-stock':
          filtered = filtered.filter(product => product.stock === 0);
          break;
        case 'expired':
          filtered = filtered.filter(product => 
            product.expiryDate && new Date(product.expiryDate) < new Date()
          );
          break;
      }
    }
    
    // Price range filter
    filtered = filtered.filter(product => 
      product.price >= priceRange[0] && product.price <= priceRange[1]
    );
    
    // Stock range filter
    filtered = filtered.filter(product => 
      product.stock >= stockRange[0] && product.stock <= stockRange[1]
    );
    
    // Quick filters
    activeQuickFilters.forEach(filter => {
      switch (filter) {
        case 'featured':
          filtered = filtered.filter(product => product.isFeatured);
          break;
        case 'on-sale':
          filtered = filtered.filter(product => product.isOnSale);
          break;
        case 'low-stock':
          filtered = filtered.filter(product => product.stock <= product.minStock);
          break;
        case 'out-of-stock':
          filtered = filtered.filter(product => product.stock === 0);
          break;
        case 'new':
          filtered = filtered.filter(product => 
            new Date(product.createdAt) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          );
          break;
        case 'bestseller':
          filtered = filtered.filter(product => product.sold > 100);
          break;
      }
    });
    
    // Sort
    const [sortField, sortOrder] = sortBy.split('-');
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortField) {
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'price':
          aValue = a.price;
          bValue = b.price;
          break;
        case 'stock':
          aValue = a.stock;
          bValue = b.stock;
          break;
        case 'created':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        case 'sold':
          aValue = a.sold;
          bValue = b.sold;
          break;
        case 'rating':
          aValue = a.rating;
          bValue = b.rating;
          break;
        default:
          aValue = a.name;
          bValue = b.name;
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    setFilteredProducts(filtered);
  }, [
    products,
    debouncedSearchQuery,
    selectedCategory,
    selectedBrand,
    selectedSupplier,
    selectedStatus,
    sortBy,
    priceRange,
    stockRange,
    activeQuickFilters
  ]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    
    if (active.id !== over.id) {
      setFilteredProducts((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleQuickFilterChange = (filterKey: string, checked: boolean) => {
    if (checked) {
      setActiveQuickFilters([...activeQuickFilters, filterKey]);
    } else {
      setActiveQuickFilters(activeQuickFilters.filter(key => key !== filterKey));
    }
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    form.resetFields();
    form.setFieldsValue({
      vatRate: 10,
      unit: 'cái',
      origin: 'Việt Nam',
      isActive: true,
      isPerishable: false,
      isFeatured: false,
      isOnSale: false,
      discount: 0,
      minStock: 5,
      reorderLevel: 10,
      warranty: 0
    });
    setProductModalVisible(true);
  };

  const handleEditProduct = (product: any) => {
    setEditingProduct(product);
    form.setFieldsValue({
      ...product,
      expiryDate: product.expiryDate ? dayjs(product.expiryDate) : null,
      manufactureDate: product.manufactureDate ? dayjs(product.manufactureDate) : null
    });
    setProductModalVisible(true);
  };

  const handleDeleteProduct = (product: any) => {
    confirm({
      title: 'Xác nhận xóa sản phẩm',
      content: `Bạn có chắc muốn xóa sản phẩm "${product.name}"?`,
      icon: <ExclamationCircleOutlined />,
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: () => {
        setProducts(products.filter(p => p.id !== product.id));
        message.success('Đã xóa sản phẩm thành công');
      },
    });
  };

  const handleSaveProduct = async (values: any) => {
    try {
      setSaving(true);
      
      const productData = {
        ...values,
        id: editingProduct?.id || Date.now(),
        expiryDate: values.expiryDate ? values.expiryDate.format('YYYY-MM-DD') : null,
        manufactureDate: values.manufactureDate ? values.manufactureDate.format('YYYY-MM-DD') : null,
        createdAt: editingProduct?.createdAt || new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0],
        sold: editingProduct?.sold || 0,
        views: editingProduct?.views || 0,
        rating: editingProduct?.rating || 0,
        reviews: editingProduct?.reviews || 0,
        tags: editingProduct?.tags || [],
        images: editingProduct?.images || [],
        qualityStandards: editingProduct?.qualityStandards || [],
        attributes: editingProduct?.attributes || {}
      };

      if (editingProduct) {
        setProducts(products.map(p => p.id === editingProduct.id ? productData : p));
        message.success('Đã cập nhật sản phẩm thành công');
      } else {
        setProducts([...products, productData]);
        message.success('Đã thêm sản phẩm mới thành công');
      }
      
      setProductModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error('Không thể lưu sản phẩm');
    } finally {
      setSaving(false);
    }
  };

  const handleBulkAction = (action: string) => {
    if (selectedRowKeys.length === 0) {
      message.warning('Vui lòng chọn ít nhất một sản phẩm');
      return;
    }

    switch (action) {
      case 'delete':
        confirm({
          title: 'Xác nhận xóa sản phẩm',
          content: `Bạn có chắc muốn xóa ${selectedRowKeys.length} sản phẩm đã chọn?`,
          icon: <ExclamationCircleOutlined />,
          okText: 'Xóa',
          okType: 'danger',
          cancelText: 'Hủy',
          onOk: () => {
            setProducts(products.filter(p => !selectedRowKeys.includes(p.id)));
            setSelectedRowKeys([]);
            message.success(`Đã xóa ${selectedRowKeys.length} sản phẩm`);
          },
        });
        break;
      case 'activate':
        setProducts(products.map(p => 
          selectedRowKeys.includes(p.id) ? { ...p, isActive: true } : p
        ));
        setSelectedRowKeys([]);
        message.success(`Đã kích hoạt ${selectedRowKeys.length} sản phẩm`);
        break;
      case 'deactivate':
        setProducts(products.map(p => 
          selectedRowKeys.includes(p.id) ? { ...p, isActive: false } : p
        ));
        setSelectedRowKeys([]);
        message.success(`Đã ngừng bán ${selectedRowKeys.length} sản phẩm`);
        break;
      case 'feature':
        setProducts(products.map(p => 
          selectedRowKeys.includes(p.id) ? { ...p, isFeatured: true } : p
        ));
        setSelectedRowKeys([]);
        message.success(`Đã đánh dấu ${selectedRowKeys.length} sản phẩm nổi bật`);
        break;
      case 'bulk-edit':
        setBulkModalVisible(true);
        break;
    }
  };

  const handleBulkUpdate = async (values: any) => {
    try {
      setSaving(true);
      
      const updateData = Object.keys(values).reduce((acc, key) => {
        if (values[key] !== undefined && values[key] !== null) {
          acc[key] = values[key];
        }
        return acc;
      }, {} as any);

      setProducts(products.map(p => 
        selectedRowKeys.includes(p.id) ? { ...p, ...updateData } : p
      ));
      
      setBulkModalVisible(false);
      setSelectedRowKeys([]);
      bulkForm.resetFields();
      message.success(`Đã cập nhật ${selectedRowKeys.length} sản phẩm`);
    } catch (error) {
      message.error('Không thể cập nhật sản phẩm');
    } finally {
      setSaving(false);
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedBrand('all');
    setSelectedSupplier('all');
    setSelectedStatus('all');
    setSortBy('name-asc');
    setPriceRange([0, 100000000]);
    setStockRange([0, 1000]);
    setActiveQuickFilters([]);
  };

  // Statistics
  const totalProducts = filteredProducts.length;
  const totalValue = filteredProducts.reduce((sum, p) => sum + (p.price * p.stock), 0);
  const totalCostValue = filteredProducts.reduce((sum, p) => sum + (p.costPrice * p.stock), 0);
  const lowStockCount = filteredProducts.filter(p => p.stock <= p.minStock).length;
  const outOfStockCount = filteredProducts.filter(p => p.stock === 0).length;
  const featuredCount = filteredProducts.filter(p => p.isFeatured).length;
  const onSaleCount = filteredProducts.filter(p => p.isOnSale).length;
  const avgRating = filteredProducts.reduce((sum, p) => sum + p.rating, 0) / filteredProducts.length;

  return (
    <div className="modern-product-page">
      {/* Header */}
      <div className="product-header">
        <div className="header-content">
          <div className="header-left">
            <Title level={2} className="product-title">
              <AppstoreOutlined className="title-icon" />
              Quản lý sản phẩm
            </Title>
            <Text className="product-subtitle">
              Quản lý toàn bộ sản phẩm với giao diện hiện đại và tính năng drag-drop
            </Text>
          </div>
          <div className="header-right">
            <Space size="middle">
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
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="stats-section">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card className="stat-card">
              <div className="stat-content">
                <div className="stat-icon products">
                  <AppstoreOutlined />
                </div>
                <div className="stat-info">
                  <div className="stat-value">{totalProducts}</div>
                  <div className="stat-label">Sản phẩm</div>
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="stat-card">
              <div className="stat-content">
                <div className="stat-icon value">
                  <DollarOutlined />
                </div>
                <div className="stat-info">
                  <div className="stat-value">{formatCurrency(totalValue)}</div>
                  <div className="stat-label">Giá trị kho</div>
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="stat-card">
              <div className="stat-content">
                <div className="stat-icon warning">
                  <WarningOutlined />
                </div>
                <div className="stat-info">
                  <div className="stat-value">{lowStockCount}</div>
                  <div className="stat-label">Sắp hết hàng</div>
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="stat-card">
              <div className="stat-content">
                <div className="stat-icon featured">
                  <StarOutlined />
                </div>
                <div className="stat-info">
                  <div className="stat-value">{featuredCount}</div>
                  <div className="stat-label">Nổi bật</div>
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </div>

      {/* Quick Filters */}
      <Card className="quick-filters-card">
        <div className="quick-filters-header">
          <Title level={4}>Lọc nhanh</Title>
          <Button 
            type="text" 
            size="small" 
            onClick={resetFilters}
            icon={<ReloadOutlined />}
          >
            Đặt lại
          </Button>
        </div>
        <div className="quick-filters">
          {quickFilters.map(filter => (
            <CheckableTag
              key={filter.key}
              checked={activeQuickFilters.includes(filter.key)}
              onChange={(checked) => handleQuickFilterChange(filter.key, checked)}
              className="quick-filter-tag"
            >
              {filter.icon}
              {filter.label}
            </CheckableTag>
          ))}
        </div>
      </Card>

      {/* Main Content */}
      <Card className="main-content-card">
        {/* Toolbar */}
        <div className="toolbar">
          <div className="toolbar-left">
            <Space>
              <Search
                placeholder="Tìm sản phẩm, SKU hoặc mã vạch..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: 300 }}
                allowClear
              />
              <Select
                value={selectedCategory}
                onChange={setSelectedCategory}
                style={{ width: 150 }}
                placeholder="Danh mục"
              >
                {categories.map(cat => (
                  <Option key={cat.value} value={cat.value}>
                    {cat.label}
                  </Option>
                ))}
              </Select>
              <Select
                value={sortBy}
                onChange={setSortBy}
                style={{ width: 180 }}
                placeholder="Sắp xếp"
              >
                {sortOptions.map(option => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
              <Button 
                icon={<FilterOutlined />}
                onClick={() => setFilterDrawerVisible(true)}
              >
                Lọc nâng cao
              </Button>
            </Space>
          </div>
          <div className="toolbar-right">
            <Space>
              {selectedRowKeys.length > 0 && (
                <Dropdown
                  overlay={
                    <Menu>
                      <Menu.Item key="activate" onClick={() => handleBulkAction('activate')}>
                        <CheckCircleOutlined /> Kích hoạt
                      </Menu.Item>
                      <Menu.Item key="deactivate" onClick={() => handleBulkAction('deactivate')}>
                        <CloseOutlined /> Ngừng bán
                      </Menu.Item>
                      <Menu.Item key="feature" onClick={() => handleBulkAction('feature')}>
                        <StarOutlined /> Đánh dấu nổi bật
                      </Menu.Item>
                      <Menu.Item key="bulk-edit" onClick={() => handleBulkAction('bulk-edit')}>
                        <EditOutlined /> Chỉnh sửa hàng loạt
                      </Menu.Item>
                      <Menu.Divider />
                      <Menu.Item key="delete" danger onClick={() => handleBulkAction('delete')}>
                        <DeleteOutlined /> Xóa
                      </Menu.Item>
                    </Menu>
                  }
                >
                  <Button>
                    Hành động ({selectedRowKeys.length}) <MoreOutlined />
                  </Button>
                </Dropdown>
              )}
              <Button.Group>
                <Button
                  type={viewMode === 'table' ? 'primary' : 'default'}
                  icon={<UnorderedListOutlined />}
                  onClick={() => setViewMode('table')}
                >
                  Bảng
                </Button>
                <Button
                  type={viewMode === 'grid' ? 'primary' : 'default'}
                  icon={<AppstoreOutlined />}
                  onClick={() => setViewMode('grid')}
                >
                  Lưới
                </Button>
              </Button.Group>
            </Space>
          </div>
        </div>

        {/* Results Count */}
        <div className="results-info">
          <Text type="secondary">
            Hiển thị {filteredProducts.length} sản phẩm
            {searchQuery && ` cho "${searchQuery}"`}
            {activeQuickFilters.length > 0 && ` với ${activeQuickFilters.length} bộ lọc`}
          </Text>
        </div>

        {/* Product List */}
        <div className="product-list">
          {viewMode === 'table' ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
              modifiers={[restrictToVerticalAxis]}
            >
              <SortableContext 
                items={filteredProducts.map(p => p.id)}
                strategy={verticalListSortingStrategy}
              >
                <Table
                  dataSource={filteredProducts}
                  rowKey="id"
                  loading={loading}
                  pagination={{
                    pageSize: 20,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total, range) => 
                      `${range[0]}-${range[1]} của ${total} sản phẩm`,
                  }}
                  rowSelection={{
                    selectedRowKeys,
                    onChange: setSelectedRowKeys,
                  }}
                  components={{
                    body: {
                      row: ({ children, ...props }) => (
                        <SortableItem id={props['data-row-key']}>
                          <tr {...props}>{children}</tr>
                        </SortableItem>
                      ),
                    },
                  }}
                  columns={[
                    {
                      title: '',
                      key: 'drag',
                      width: 30,
                      render: () => (
                        <div className="drag-handle">
                          <DragOutlined />
                        </div>
                      ),
                    },
                    {
                      title: 'Sản phẩm',
                      key: 'product',
                      render: (_, record) => (
                        <div className="product-cell">
                          <div className="product-image">
                            <Avatar 
                              src={record.images?.[0]} 
                              size={48}
                              shape="square"
                            >
                              {record.name.charAt(0)}
                            </Avatar>
                            {record.isFeatured && (
                              <Badge className="featured-badge" count={<StarOutlined />} />
                            )}
                            {record.isOnSale && (
                              <Badge className="sale-badge" count={<FireOutlined />} />
                            )}
                          </div>
                          <div className="product-info">
                            <div className="product-name">{record.name}</div>
                            <div className="product-meta">
                              <Text type="secondary">SKU: {record.sku}</Text>
                              <Text type="secondary">•</Text>
                              <Text type="secondary">{record.barcode}</Text>
                            </div>
                            <div className="product-tags">
                              {record.tags.slice(0, 2).map(tag => (
                                <Tag key={tag} size="small">{tag}</Tag>
                              ))}
                            </div>
                          </div>
                        </div>
                      ),
                    },
                    {
                      title: 'Danh mục',
                      key: 'category',
                      render: (_, record) => (
                        <div className="category-cell">
                          <Tag color="blue">{record.categoryName}</Tag>
                          <div className="brand-info">
                            <Text type="secondary">{record.brandName}</Text>
                          </div>
                        </div>
                      ),
                    },
                    {
                      title: 'Giá bán',
                      key: 'price',
                      render: (_, record) => (
                        <div className="price-cell">
                          <div className="sell-price">{formatCurrency(record.price)}</div>
                          <div className="cost-price">
                            <Text type="secondary">Vốn: {formatCurrency(record.costPrice)}</Text>
                          </div>
                          {record.discount > 0 && (
                            <Tag color="red">-{record.discount}%</Tag>
                          )}
                        </div>
                      ),
                    },
                    {
                      title: 'Kho',
                      key: 'stock',
                      render: (_, record) => (
                        <div className="stock-cell">
                          <div className="stock-value">
                            <Badge
                              count={record.stock}
                              showZero
                              style={{
                                backgroundColor: record.stock === 0 ? '#ff4d4f' : 
                                               record.stock <= record.minStock ? '#faad14' : '#52c41a'
                              }}
                            />
                          </div>
                          <div className="stock-meta">
                            <Text type="secondary">Tối thiểu: {record.minStock}</Text>
                          </div>
                          {record.stock <= record.reorderLevel && (
                            <Tag color="orange" size="small">Cần nhập</Tag>
                          )}
                        </div>
                      ),
                    },
                    {
                      title: 'Đánh giá',
                      key: 'rating',
                      render: (_, record) => (
                        <div className="rating-cell">
                          <div className="rating-stars">
                            <Rate disabled defaultValue={record.rating} />
                          </div>
                          <div className="rating-info">
                            <Text type="secondary">{record.rating}/5 ({record.reviews})</Text>
                          </div>
                        </div>
                      ),
                    },
                    {
                      title: 'Trạng thái',
                      key: 'status',
                      render: (_, record) => (
                        <div className="status-cell">
                          <Tag color={record.isActive ? 'green' : 'red'}>
                            {record.isActive ? 'Hoạt động' : 'Ngừng bán'}
                          </Tag>
                          {record.isPerishable && (
                            <Tag color="orange" size="small">Có hạn dùng</Tag>
                          )}
                          {record.expiryDate && (
                            <div className="expiry-info">
                              <Text type="secondary">HSD: {record.expiryDate}</Text>
                            </div>
                          )}
                        </div>
                      ),
                    },
                    {
                      title: 'Hành động',
                      key: 'actions',
                      width: 120,
                      render: (_, record) => (
                        <Space>
                          <Tooltip title="Xem chi tiết">
                            <Button 
                              type="text" 
                              icon={<EyeOutlined />}
                              onClick={() => setSelectedProduct(record)}
                            />
                          </Tooltip>
                          <Tooltip title="Chỉnh sửa">
                            <Button 
                              type="text" 
                              icon={<EditOutlined />}
                              onClick={() => handleEditProduct(record)}
                            />
                          </Tooltip>
                          <Tooltip title="Xóa">
                            <Button 
                              type="text" 
                              danger
                              icon={<DeleteOutlined />}
                              onClick={() => handleDeleteProduct(record)}
                            />
                          </Tooltip>
                        </Space>
                      ),
                    },
                  ]}
                />
              </SortableContext>
            </DndContext>
          ) : (
            <div className="product-grid">
              <Row gutter={[16, 16]}>
                {filteredProducts.map(product => (
                  <Col key={product.id} xs={24} sm={12} md={8} lg={6}>
                    <Card 
                      className="product-grid-card"
                      hoverable
                      cover={
                        <div className="product-card-image">
                          <img 
                            src={product.images?.[0] || 'https://via.placeholder.com/300x200'} 
                            alt={product.name}
                          />
                          {product.isFeatured && (
                            <div className="featured-badge">
                              <StarOutlined />
                            </div>
                          )}
                          {product.isOnSale && (
                            <div className="sale-badge">
                              <FireOutlined />
                            </div>
                          )}
                          {product.discount > 0 && (
                            <div className="discount-badge">
                              -{product.discount}%
                            </div>
                          )}
                        </div>
                      }
                      actions={[
                        <Tooltip title="Xem chi tiết">
                          <Button 
                            type="text" 
                            icon={<EyeOutlined />}
                            onClick={() => setSelectedProduct(product)}
                          />
                        </Tooltip>,
                        <Tooltip title="Chỉnh sửa">
                          <Button 
                            type="text" 
                            icon={<EditOutlined />}
                            onClick={() => handleEditProduct(product)}
                          />
                        </Tooltip>,
                        <Tooltip title="Xóa">
                          <Button 
                            type="text" 
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => handleDeleteProduct(product)}
                          />
                        </Tooltip>
                      ]}
                    >
                      <div className="product-card-content">
                        <div className="product-card-header">
                          <Title level={5} className="product-card-title">
                            {product.name}
                          </Title>
                          <Text type="secondary" className="product-card-sku">
                            SKU: {product.sku}
                          </Text>
                        </div>
                        
                        <div className="product-card-category">
                          <Tag color="blue">{product.categoryName}</Tag>
                        </div>
                        
                        <div className="product-card-price">
                          <div className="sell-price">{formatCurrency(product.price)}</div>
                          <div className="cost-price">
                            <Text type="secondary">Vốn: {formatCurrency(product.costPrice)}</Text>
                          </div>
                        </div>
                        
                        <div className="product-card-stock">
                          <Text>Tồn kho: </Text>
                          <Badge
                            count={product.stock}
                            showZero
                            style={{
                              backgroundColor: product.stock === 0 ? '#ff4d4f' : 
                                             product.stock <= product.minStock ? '#faad14' : '#52c41a'
                            }}
                          />
                        </div>
                        
                        <div className="product-card-rating">
                          <Rate disabled defaultValue={product.rating} />
                          <Text type="secondary">({product.reviews})</Text>
                        </div>
                        
                        <div className="product-card-status">
                          <Tag color={product.isActive ? 'green' : 'red'}>
                            {product.isActive ? 'Hoạt động' : 'Ngừng bán'}
                          </Tag>
                        </div>
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
            </div>
          )}
        </div>
      </Card>

      {/* Filter Drawer */}
      <Drawer
        title="Lọc nâng cao"
        placement="right"
        onClose={() => setFilterDrawerVisible(false)}
        visible={filterDrawerVisible}
        width={400}
      >
        <div className="filter-drawer-content">
          <div className="filter-section">
            <Title level={5}>Thương hiệu</Title>
            <Select
              value={selectedBrand}
              onChange={setSelectedBrand}
              style={{ width: '100%' }}
            >
              {brands.map(brand => (
                <Option key={brand.value} value={brand.value}>
                  {brand.label}
                </Option>
              ))}
            </Select>
          </div>
          
          <div className="filter-section">
            <Title level={5}>Nhà cung cấp</Title>
            <Select
              value={selectedSupplier}
              onChange={setSelectedSupplier}
              style={{ width: '100%' }}
            >
              {suppliers.map(supplier => (
                <Option key={supplier.value} value={supplier.value}>
                  {supplier.label}
                </Option>
              ))}
            </Select>
          </div>
          
          <div className="filter-section">
            <Title level={5}>Trạng thái</Title>
            <Select
              value={selectedStatus}
              onChange={setSelectedStatus}
              style={{ width: '100%' }}
            >
              {statusOptions.map(status => (
                <Option key={status.value} value={status.value}>
                  {status.label}
                </Option>
              ))}
            </Select>
          </div>
          
          <div className="filter-section">
            <Title level={5}>Khoảng giá</Title>
            <Slider
              range
              value={priceRange}
              onChange={setPriceRange}
              min={0}
              max={100000000}
              step={100000}
              tipFormatter={(value) => formatCurrency(value)}
            />
            <div className="price-range-display">
              <Text>{formatCurrency(priceRange[0])}</Text>
              <Text>{formatCurrency(priceRange[1])}</Text>
            </div>
          </div>
          
          <div className="filter-section">
            <Title level={5}>Kho hàng</Title>
            <Slider
              range
              value={stockRange}
              onChange={setStockRange}
              min={0}
              max={1000}
              step={1}
            />
            <div className="stock-range-display">
              <Text>{stockRange[0]} - {stockRange[1]}</Text>
            </div>
          </div>
          
          <div className="filter-actions">
            <Button block onClick={resetFilters}>
              Đặt lại tất cả
            </Button>
          </div>
        </div>
      </Drawer>

      {/* Product Modal */}
      <Modal
        title={editingProduct ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
        visible={productModalVisible}
        onCancel={() => setProductModalVisible(false)}
        footer={null}
        width={800}
        className="product-modal"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveProduct}
        >
          <Tabs defaultActiveKey="basic">
            <TabPane tab="Thông tin cơ bản" key="basic">
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Tên sản phẩm"
                    name="name"
                    rules={[{ required: true, message: 'Vui lòng nhập tên sản phẩm' }]}
                  >
                    <Input placeholder="Nhập tên sản phẩm" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="SKU"
                    name="sku"
                    rules={[{ required: true, message: 'Vui lòng nhập SKU' }]}
                  >
                    <Input placeholder="Nhập mã SKU" />
                  </Form.Item>
                </Col>
              </Row>
              
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Mã vạch"
                    name="barcode"
                    rules={[{ required: true, message: 'Vui lòng nhập mã vạch' }]}
                  >
                    <Input placeholder="Nhập mã vạch" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Đơn vị"
                    name="unit"
                    rules={[{ required: true, message: 'Vui lòng nhập đơn vị' }]}
                  >
                    <Input placeholder="Cái, Ly, Gói..." />
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
                    <Select placeholder="Chọn danh mục">
                      {categories.filter(c => c.value !== 'all').map(cat => (
                        <Option key={cat.value} value={cat.value}>
                          {cat.label}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Thương hiệu"
                    name="brand"
                  >
                    <Input placeholder="Nhập thương hiệu" />
                  </Form.Item>
                </Col>
              </Row>
              
              <Form.Item
                label="Mô tả"
                name="description"
              >
                <Input.TextArea rows={4} placeholder="Mô tả sản phẩm" />
              </Form.Item>
            </TabPane>
            
            <TabPane tab="Giá cả & Kho" key="pricing">
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
                      placeholder="0"
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
                      placeholder="0"
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="Thuế VAT (%)"
                    name="vatRate"
                    rules={[{ required: true, message: 'Vui lòng nhập thuế VAT' }]}
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      min={0}
                      max={100}
                      placeholder="10"
                    />
                  </Form.Item>
                </Col>
              </Row>
              
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item
                    label="Tồn kho"
                    name="stock"
                    rules={[{ required: true, message: 'Vui lòng nhập tồn kho' }]}
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      min={0}
                      placeholder="0"
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="Tồn kho tối thiểu"
                    name="minStock"
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      min={0}
                      placeholder="5"
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="Mức nhập hàng"
                    name="reorderLevel"
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      min={0}
                      placeholder="10"
                    />
                  </Form.Item>
                </Col>
              </Row>
              
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Giảm giá (%)"
                    name="discount"
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      min={0}
                      max={100}
                      placeholder="0"
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Bảo hành (tháng)"
                    name="warranty"
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      min={0}
                      placeholder="0"
                    />
                  </Form.Item>
                </Col>
              </Row>
            </TabPane>
            
            <TabPane tab="Khác" key="other">
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Nhà cung cấp"
                    name="supplier"
                  >
                    <Input placeholder="Nhập nhà cung cấp" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Xuất xứ"
                    name="origin"
                  >
                    <Input placeholder="Nhập xuất xứ" />
                  </Form.Item>
                </Col>
              </Row>
              
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Ngày sản xuất"
                    name="manufactureDate"
                  >
                    <DatePicker style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Hạn sử dụng"
                    name="expiryDate"
                  >
                    <DatePicker style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>
              
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item
                    label="Trạng thái"
                    name="isActive"
                    valuePropName="checked"
                  >
                    <Switch checkedChildren="Hoạt động" unCheckedChildren="Ngừng bán" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="Nổi bật"
                    name="isFeatured"
                    valuePropName="checked"
                  >
                    <Switch checkedChildren="Có" unCheckedChildren="Không" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="Có hạn dùng"
                    name="isPerishable"
                    valuePropName="checked"
                  >
                    <Switch checkedChildren="Có" unCheckedChildren="Không" />
                  </Form.Item>
                </Col>
              </Row>
            </TabPane>
          </Tabs>
          
          <div className="form-actions">
            <Space>
              <Button onClick={() => setProductModalVisible(false)}>
                Hủy
              </Button>
              <Button type="primary" htmlType="submit" loading={saving}>
                {editingProduct ? 'Cập nhật' : 'Thêm mới'}
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>

      {/* Bulk Edit Modal */}
      <Modal
        title="Chỉnh sửa hàng loạt"
        visible={bulkModalVisible}
        onCancel={() => setBulkModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={bulkForm}
          layout="vertical"
          onFinish={handleBulkUpdate}
        >
          <Alert
            message={`Cập nhật ${selectedRowKeys.length} sản phẩm được chọn`}
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Danh mục"
                name="categoryId"
              >
                <Select placeholder="Chọn danh mục">
                  {categories.filter(c => c.value !== 'all').map(cat => (
                    <Option key={cat.value} value={cat.value}>
                      {cat.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Thương hiệu"
                name="brand"
              >
                <Input placeholder="Nhập thương hiệu" />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Giảm giá (%)"
                name="discount"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  max={100}
                  placeholder="0"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Thuế VAT (%)"
                name="vatRate"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  max={100}
                  placeholder="10"
                />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="Trạng thái"
                name="isActive"
                valuePropName="checked"
              >
                <Switch checkedChildren="Hoạt động" unCheckedChildren="Ngừng bán" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Nổi bật"
                name="isFeatured"
                valuePropName="checked"
              >
                <Switch checkedChildren="Có" unCheckedChildren="Không" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Đang sale"
                name="isOnSale"
                valuePropName="checked"
              >
                <Switch checkedChildren="Có" unCheckedChildren="Không" />
              </Form.Item>
            </Col>
          </Row>
          
          <div className="form-actions">
            <Space>
              <Button onClick={() => setBulkModalVisible(false)}>
                Hủy
              </Button>
              <Button type="primary" htmlType="submit" loading={saving}>
                Cập nhật
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default ModernProductPage;