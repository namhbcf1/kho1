// POS Terminal page with Vietnamese business logic
import React, { useEffect } from 'react';
import { Row, Col, Card, Button, Typography, Space, Badge } from 'antd';
import { ShoppingCartOutlined, UserOutlined, CreditCardOutlined } from '@ant-design/icons';
import { POSTerminal } from '../../features/pos/components/POSTerminal';
import { ProductGrid } from '../../features/pos/components/ProductGrid';
import { ShoppingCart } from '../../features/pos/components/ShoppingCart';
import { PaymentMethods } from '../../features/pos/components/PaymentMethods';
import { usePOSCart } from '../../stores';
import { formatVND } from '../../services/utils';
import { usePage } from '../../stores';

const { Title, Text } = Typography;

export const POSTerminalPage: React.FC = () => {
  const { cart, total, customer } = usePOSCart();
  const { setPageTitle, setBreadcrumbs } = usePage();

  useEffect(() => {
    setPageTitle('Bán hàng');
    setBreadcrumbs([
      { title: 'Bán hàng' },
    ]);
  }, [setPageTitle, setBreadcrumbs]);

  return (
    <div className="h-full flex flex-col">
      {/* POS Header */}
      <div className="bg-white border-b p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Title level={4} className="!mb-0">
            Bán hàng
          </Title>
          {customer && (
            <div className="flex items-center space-x-2 text-sm">
              <UserOutlined />
              <Text>{customer.name}</Text>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          <Badge count={cart.length} size="small">
            <ShoppingCartOutlined className="text-xl" />
          </Badge>
          <Text strong className="text-lg text-blue-600">
            {formatVND(total)}
          </Text>
        </div>
      </div>

      {/* POS Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Product Grid */}
        <div className="flex-1 p-4 overflow-auto">
          <ProductGrid />
        </div>

        {/* Right: Cart and Payment */}
        <div className="w-96 border-l bg-white flex flex-col">
          {/* Shopping Cart */}
          <div className="flex-1 overflow-auto">
            <ShoppingCart />
          </div>

          {/* Payment Methods */}
          <div className="border-t">
            <PaymentMethods />
          </div>
        </div>
      </div>
    </div>
  );
};

export default POSTerminalPage;
