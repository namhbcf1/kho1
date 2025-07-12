import React from 'react';
import { List, Button, InputNumber, Space, Typography, Divider, Empty } from 'antd';
import { DeleteOutlined, ClearOutlined } from '@ant-design/icons';
import { VNDDisplay } from '../../../components/business/VNDCurrency';
import type { ShoppingCartProps } from '../types/pos.types';

const { Text, Title } = Typography;

export const ShoppingCart: React.FC<ShoppingCartProps> = ({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClear,
  total,
}) => {
  if (items.length === 0) {
    return (
      <Empty 
        description="Giỏ hàng trống"
        style={{ marginTop: '50px' }}
      />
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Cart Items */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <List
          dataSource={items}
          renderItem={(item) => (
            <List.Item
              style={{ padding: '12px 0' }}
              actions={[
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => onRemoveItem?.(item.id)}
                  size="small"
                />
              ]}
            >
              <div style={{ width: '100%' }}>
                <div style={{ marginBottom: 8 }}>
                  <Text strong>{item.name}</Text>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Space>
                    <InputNumber
                      min={1}
                      max={item.maxStock || 999}
                      value={item.quantity}
                      onChange={(value) => onUpdateQuantity?.(item.id, value || 1)}
                      size="small"
                      style={{ width: 60 }}
                    />
                    <Text type="secondary">x</Text>
                    <VNDDisplay amount={item.price} />
                  </Space>
                  
                  <Text strong>
                    <VNDDisplay amount={item.price * item.quantity} />
                  </Text>
                </div>
              </div>
            </List.Item>
          )}
        />
      </div>

      <Divider style={{ margin: '16px 0' }} />

      {/* Cart Summary */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <Text>Số lượng:</Text>
          <Text>{items.reduce((sum, item) => sum + item.quantity, 0)} sản phẩm</Text>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <Title level={4} style={{ margin: 0 }}>Tổng cộng:</Title>
          <Title level={4} style={{ margin: 0, color: '#1890ff' }}>
            <VNDDisplay amount={total} />
          </Title>
        </div>

        <Button
          block
          icon={<ClearOutlined />}
          onClick={onClear}
          disabled={items.length === 0}
        >
          Xóa tất cả
        </Button>
      </div>
    </div>
  );
};

export default ShoppingCart;
