import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Input, Select, Spin, Empty, Button, Tag, Badge, Alert } from 'antd';
import { SearchOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { formatVND } from '../../../utils/formatters/vndCurrency';
import { usePOSActions } from '../../../stores';
import { productService, Product, ProductCategory } from '../../../services/api/productService';
import { useDebounce } from '../../../hooks/useDebounce';

const { Search } = Input;

export const ProductGrid: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addToCart } = usePOSActions();
  
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      const filters = {
        search: debouncedSearchTerm || undefined,
        categoryId: selectedCategory === 'all' ? undefined : selectedCategory,
        inStock: true,
        isActive: true,
        pageSize: 100
      };

      const result = await productService.getProducts(filters);
      setProducts(result.products);
    } catch (err) {
      setError('Không thể tải danh sách sản phẩm. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const categoriesData = await productService.getCategories();
      setCategories([
        { id: 'all', name: 'Tất cả' } as ProductCategory,
        ...categoriesData.filter(cat => cat.isActive)
      ]);
    } catch (err) {
      // Fallback categories if API fails
      setCategories([
        { id: 'all', name: 'Tất cả' } as ProductCategory,
        { id: 'drinks', name: 'Đồ uống' } as ProductCategory,
        { id: 'food', name: 'Đồ ăn' } as ProductCategory,
        { id: 'snacks', name: 'Đồ ăn vặt' } as ProductCategory,
      ]);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadProducts();
  }, [debouncedSearchTerm, selectedCategory]);

  const handleAddToCart = (product: Product) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.sellPrice || product.price,
      stock: product.stock,
      category: product.categoryName,
      categoryId: product.categoryId,
      image: product.images[0] || null,
      barcode: product.barcode,
      unit: product.unit,
      vatRate: product.vatRate
    }, 1);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" tip="Đang tải sản phẩm..." />
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="Lỗi tải sản phẩm"
        description={error}
        type="error"
        showIcon
        action={
          <Button size="small" danger onClick={loadProducts} icon={<ReloadOutlined />}>
            Thử lại
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filter */}
      <div className="space-y-3">
        <Search
          placeholder="Tìm sản phẩm theo tên hoặc mã vạch..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          prefix={<SearchOutlined />}
          size="large"
          allowClear
        />
        
        <div className="flex gap-2 flex-wrap">
          {categories.map(category => (
            <Tag.CheckableTag
              key={category.id}
              checked={selectedCategory === category.id}
              onChange={() => setSelectedCategory(category.id)}
              className="px-3 py-1 rounded-full"
            >
              {category.name}
            </Tag.CheckableTag>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      {products.length === 0 ? (
        <Empty 
          description="Không tìm thấy sản phẩm nào"
          className="py-12"
        />
      ) : (
        <Row gutter={[16, 16]}>
          {products.map(product => (
            <Col xs={12} sm={8} md={6} lg={4} key={product.id}>
              <Card
                hoverable
                className="h-full"
                bodyStyle={{ padding: '12px' }}
                cover={
                  <div className="h-24 bg-gray-100 flex items-center justify-center relative">
                    {product.images && product.images.length > 0 ? (
                      <img 
                        src={product.images[0]} 
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
                        <span className="text-blue-600 font-bold text-xl">
                          {product.name.charAt(0)}
                        </span>
                      </div>
                    )}
                    {product.stock <= product.minStock && (
                      <Badge 
                        count={product.stock <= 0 ? "Hết hàng" : "Sắp hết"} 
                        style={{ backgroundColor: product.stock <= 0 ? '#ff4d4f' : '#faad14' }}
                        className="absolute top-1 right-1"
                      />
                    )}
                    {product.isPerishable && (
                      <Badge 
                        count="Hạn dùng" 
                        style={{ backgroundColor: '#722ed1' }}
                        className="absolute top-1 left-1"
                      />
                    )}
                  </div>
                }
                actions={[
                  <Button
                    key="add"
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => handleAddToCart(product)}
                    disabled={product.stock === 0 || !product.isActive}
                    block
                    size="small"
                  >
                    Thêm {product.unit && `(${product.unit})`}
                  </Button>
                ]}
              >
                <div className="space-y-2">
                  <div>
                    <div className="font-medium text-sm line-clamp-2" title={product.name}>
                      {product.name}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center justify-between">
                      <span>{product.categoryName}</span>
                      {product.sku && <span>SKU: {product.sku}</span>}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-blue-600">
                        {formatVND(product.sellPrice || product.price)}
                      </div>
                      {product.vatRate > 0 && (
                        <div className="text-xs text-gray-500">
                          VAT {product.vatRate}%
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500">
                        Còn {product.stock} {product.unit}
                      </div>
                      {product.origin && (
                        <div className="text-xs text-gray-400">
                          {product.origin}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
};

export default ProductGrid;
