import React, { useState } from 'react';
import { Row, Col, Card, Input, Select, Spin, Empty } from 'antd';
import { SearchOutlined, PlusOutlined } from '@ant-design/icons';
import { VNDDisplay } from '../../../components/business/VNDCurrency';
import type { ProductGridProps } from '../types/pos.types';

const { Search } = Input;
const { Option } = Select;

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  loading = false,
  onProductSelect,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.barcode?.includes(searchTerm);
    const matchesCategory = selectedCategory === 'all' || product.categoryId === selectedCategory;
    
    return matchesSearch && matchesCategory && product.stock > 0;
  });

  const categories = [
    { id: 'all', name: 'Tất cả' },
    ...Array.from(new Set(products.map(p => p.category)))
      .map(cat => ({ id: cat, name: cat }))
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" tip="Đang tải sản phẩm..." />
      </div>
    );
  }

  return (
    <div>
      {/* Search and Filter */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={16}>
          <Search
            placeholder="Tìm kiếm sản phẩm hoặc mã vạch..."
            prefix={<SearchOutlined />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            allowClear
          />
        </Col>
        <Col span={8}>
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

      {/* Product Grid */}
      <div style={{ height: 'calc(100vh - 200px)', overflowY: 'auto' }}>
        {filteredProducts.length === 0 ? (
          <Empty 
            description="Không tìm thấy sản phẩm nào"
            style={{ marginTop: '50px' }}
          />
        ) : (
          <Row gutter={[16, 16]}>
            {filteredProducts.map(product => (
              <Col key={product.id} xs={24} sm={12} md={8} lg={6}>
                <Card
                  hoverable
                  cover={
                    <div style={{ 
                      height: 120, 
                      background: '#f5f5f5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {product.image ? (
                        <img 
                          src={product.image} 
                          alt={product.name}
                          style={{ maxHeight: '100%', maxWidth: '100%' }}
                        />
                      ) : (
                        <PlusOutlined style={{ fontSize: 24, color: '#ccc' }} />
                      )}
                    </div>
                  }
                  onClick={() => onProductSelect?.(product)}
                  style={{ cursor: 'pointer' }}
                >
                  <Card.Meta
                    title={
                      <div style={{ fontSize: '14px', height: '40px', overflow: 'hidden' }}>
                        {product.name}
                      </div>
                    }
                    description={
                      <div>
                        <div style={{ fontWeight: 'bold', color: '#1890ff' }}>
                          <VNDDisplay amount={product.price} />
                        </div>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          Tồn: {product.stock}
                        </div>
                      </div>
                    }
                  />
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </div>
    </div>
  );
};

export default ProductGrid;
