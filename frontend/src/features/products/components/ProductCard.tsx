// Product display card
import React from 'react';
import { Card, Tag, Button } from 'antd';
import { ShoppingCartOutlined, EditOutlined } from '@ant-design/icons';
import { formatVND } from '../../../utils/formatters/vndCurrency';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    price: number;
    stock: number;
    image?: string;
    active: boolean;
  };
  onAddToCart?: (product: any) => void;
  onEdit?: (product: any) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  onEdit
}) => {
  return (
    <Card
      hoverable
      cover={
        product.image ? (
          <img alt={product.name} src={product.image} style={{ height: 200, objectFit: 'cover' }} />
        ) : (
          <div style={{ height: 200, background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            No Image
          </div>
        )
      }
      actions={[
        <Button
          type="primary"
          icon={<ShoppingCartOutlined />}
          onClick={() => onAddToCart?.(product)}
          disabled={!product.active || product.stock === 0}
        >
          Thêm vào giỏ
        </Button>,
        <Button
          icon={<EditOutlined />}
          onClick={() => onEdit?.(product)}
        >
          Sửa
        </Button>
      ]}
    >
      <Card.Meta
        title={product.name}
        description={
          <div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1890ff' }}>
              {formatVND(product.price)}
            </div>
            <div style={{ marginTop: 8 }}>
              <Tag color={product.stock > 0 ? 'green' : 'red'}>
                Tồn kho: {product.stock}
              </Tag>
              <Tag color={product.active ? 'blue' : 'default'}>
                {product.active ? 'Hoạt động' : 'Tạm dừng'}
              </Tag>
            </div>
          </div>
        }
      />
    </Card>
  );
};

export default ProductCard;
