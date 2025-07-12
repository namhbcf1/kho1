// Customer insights component
import React from 'react';
import { Card, Row, Col, Statistic } from 'antd';
import { UserOutlined, StarOutlined, ShoppingOutlined } from '@ant-design/icons';
import { formatVND } from '../../../utils/formatters/vndCurrency';

export const CustomerAnalytics: React.FC = () => {
  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={8}>
        <Card>
          <Statistic
            title="Tổng khách hàng"
            value={1234}
            prefix={<UserOutlined />}
          />
        </Card>
      </Col>
      <Col xs={24} sm={8}>
        <Card>
          <Statistic
            title="Khách hàng VIP"
            value={89}
            prefix={<StarOutlined />}
          />
        </Card>
      </Col>
      <Col xs={24} sm={8}>
        <Card>
          <Statistic
            title="Giá trị TB/khách"
            value={125000}
            prefix={<ShoppingOutlined />}
            formatter={formatVND}
          />
        </Card>
      </Col>
    </Row>
  );
};

export default CustomerAnalytics;
