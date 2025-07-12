import React, { useState } from 'react';
import { Table, Button, Space, Input, Select, Tag, Image } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { VNDDisplay } from '../../../components/business/VNDCurrency';
import { TableActions } from '../../../components/ui/Table';
import type { ProductListProps } from '../types/product.types';

const { Search } = Input;
const { Option } = Select;

export const ProductList: React.FC<ProductListProps> = ({
  products,
  loading = false,
  onAdd,
  onEdit,
  onDelete,
  onView,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<string>('all');

  const columns = [
    {
      title: 'Hình ảnh',
      dataIndex: 'image',
      key: 'image',
      width: 80,
      render: (image: string, record: any) => (
        <Image
          width={50}
          height={50}
          src={image}
          fallback="/placeholder-product.png"
          alt={record.name}
          style={{ objectFit: 'cover', borderRadius: 4 }}
        />
      ),
    },
    {
      title: 'Tên sản phẩm',
      dataIndex: 'name',
      key: 'name',
      sorter: (a: any, b: any) => a.name.localeCompare(b.name),
    },
    {
      title: 'Mã vạch',
      dataIndex: 'barcode',
      key: 'barcode',
      width: 120,
      render: (barcode: string) => (
        <span style={{ fontFamily: 'monospace' }}>{barcode}</span>
      ),
    },
    {
      title: 'SKU',
      dataIndex: 'sku',
      key: 'sku',
      width: 100,
    },
    {
      title: 'Danh mục',
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (category: string) => (
        <Tag color="blue">{category}</Tag>
      ),
    },
    {
      title: 'Giá bán',
      dataIndex: 'price',
      key: 'price',
      width: 120,
      sorter: (a: any, b: any) => a.price - b.price,
      render: (price: number) => (
        <VNDDisplay amount={price} />
      ),
    },
    {
      title: 'Tồn kho',
      dataIndex: 'stock',
      key: 'stock',
      width: 100,
      sorter: (a: any, b: any) => a.stock - b.stock,
      render: (stock: number, record: any) => {
        let color = 'green';
        if (stock === 0) color = 'red';
        else if (stock <= (record.minStock || 0)) color = 'orange';
        
        return <Tag color={color}>{stock}</Tag>;
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'active',
      key: 'active',
      width: 100,
      render: (active: boolean) => (
        <Tag color={active ? 'green' : 'red'}>
          {active ? 'Hoạt động' : 'Tạm dừng'}
        </Tag>
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 120,
      render: (_, record: any) => (
        <TableActions
          onView={() => onView?.(record)}
          onEdit={() => onEdit?.(record)}
          onDelete={() => onDelete?.(record)}
        />
      ),
    },
  ];

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.barcode?.includes(searchTerm) ||
                         product.sku?.includes(searchTerm);
    
    const matchesCategory = selectedCategory === 'all' || product.categoryId === selectedCategory;
    
    const matchesStock = stockFilter === 'all' ||
                        (stockFilter === 'in_stock' && product.stock > 0) ||
                        (stockFilter === 'low_stock' && product.stock <= (product.minStock || 0) && product.stock > 0) ||
                        (stockFilter === 'out_of_stock' && product.stock === 0);
    
    return matchesSearch && matchesCategory && matchesStock;
  });

  // Get unique categories for filter
  const categories = Array.from(new Set(products.map(p => ({ id: p.categoryId, name: p.category }))))
    .filter(cat => cat.id && cat.name);

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Quản lý sản phẩm</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={onAdd}>
          Thêm sản phẩm
        </Button>
      </div>

      {/* Filters */}
      <div style={{ marginBottom: 16, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <Search
          placeholder="Tìm kiếm sản phẩm, mã vạch, SKU..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: 300 }}
          allowClear
        />
        
        <Select
          placeholder="Chọn danh mục"
          value={selectedCategory}
          onChange={setSelectedCategory}
          style={{ width: 200 }}
        >
          <Option value="all">Tất cả danh mục</Option>
          {categories.map(cat => (
            <Option key={cat.id} value={cat.id}>
              {cat.name}
            </Option>
          ))}
        </Select>

        <Select
          placeholder="Lọc theo tồn kho"
          value={stockFilter}
          onChange={setStockFilter}
          style={{ width: 150 }}
        >
          <Option value="all">Tất cả</Option>
          <Option value="in_stock">Còn hàng</Option>
          <Option value="low_stock">Sắp hết</Option>
          <Option value="out_of_stock">Hết hàng</Option>
        </Select>
      </div>

      {/* Table */}
      <Table
        columns={columns}
        dataSource={filteredProducts}
        loading={loading}
        rowKey="id"
        pagination={{
          total: filteredProducts.length,
          pageSize: 20,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => 
            `${range[0]}-${range[1]} của ${total} sản phẩm`,
        }}
        scroll={{ x: 1200 }}
      />
    </div>
  );
};

export default ProductList;
