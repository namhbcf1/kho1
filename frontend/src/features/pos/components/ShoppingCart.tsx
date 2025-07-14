import React from 'react';
import { List, Button, InputNumber, Space, Typography, Divider, Empty } from 'antd';
import { DeleteOutlined, ClearOutlined, MinusOutlined, PlusOutlined } from '@ant-design/icons';
import { formatVND } from '../../../utils/formatters/vndCurrency';
import { usePOSCart, usePOSActions } from '../../../stores';

const { Text, Title } = Typography;

export const ShoppingCart: React.FC = () => {
  const { cart, subtotal, discount, tax, total } = usePOSCart();
  const { updateCartItem, removeFromCart, clearCart } = usePOSActions();

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
    } else {
      updateCartItem(productId, { quantity });
    }
  };

  const handleIncreaseQuantity = (productId: string, currentQuantity: number) => {
    handleUpdateQuantity(productId, currentQuantity + 1);
  };

  const handleDecreaseQuantity = (productId: string, currentQuantity: number) => {
    handleUpdateQuantity(productId, currentQuantity - 1);
  };

  if (cart.length === 0) {
    return (
      <div className="p-4">
        <Empty 
          description="Giỏ hàng trống"
          className="py-8"
        />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Cart Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <Title level={5} className="!mb-0">
            Giỏ hàng ({cart.length})
          </Title>
          <Button
            type="text"
            danger
            icon={<ClearOutlined />}
            onClick={clearCart}
            size="small"
          >
            Xóa tất cả
          </Button>
        </div>
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-auto">
        <List
          dataSource={cart}
          renderItem={(item) => (
            <List.Item className="px-4 py-3 border-b-0">
              <div className="w-full">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 mr-2">
                    <Text strong className="text-sm">
                      {item.product.name}
                    </Text>
                    <div className="text-xs text-gray-500">
                      {formatVND(item.price)} x đơn vị
                    </div>
                  </div>
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => removeFromCart(item.productId)}
                    size="small"
                    className="flex-shrink-0"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Button
                      type="text"
                      icon={<MinusOutlined />}
                      onClick={() => handleDecreaseQuantity(item.productId, item.quantity)}
                      size="small"
                      disabled={item.quantity <= 1}
                    />
                    <InputNumber
                      min={1}
                      value={item.quantity}
                      onChange={(value) => handleUpdateQuantity(item.productId, value || 1)}
                      size="small"
                      className="w-16 text-center"
                      controls={false}
                    />
                    <Button
                      type="text"
                      icon={<PlusOutlined />}
                      onClick={() => handleIncreaseQuantity(item.productId, item.quantity)}
                      size="small"
                    />
                  </div>
                  
                  <Text strong className="text-blue-600">
                    {formatVND(item.total)}
                  </Text>
                </div>
              </div>
            </List.Item>
          )}
        />
      </div>

      {/* Cart Summary */}
      <div className="p-4 border-t bg-gray-50">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <Text>Tạm tính:</Text>
            <Text>{formatVND(subtotal)}</Text>
          </div>
          
          {discount > 0 && (
            <div className="flex justify-between text-sm">
              <Text>Giảm giá:</Text>
              <Text className="text-green-600">-{formatVND(discount)}</Text>
            </div>
          )}
          
          <div className="flex justify-between text-sm">
            <Text>Thuế VAT (10%):</Text>
            <Text>{formatVND(tax)}</Text>
          </div>
          
          <Divider className="my-2" />
          
          <div className="flex justify-between">
            <Title level={4} className="!mb-0">Tổng cộng:</Title>
            <Title level={4} className="!mb-0 text-blue-600">
              {formatVND(total)}
            </Title>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShoppingCart;
