// Vietnamese performance metrics component
import React from 'react';
import { Card, Row, Col, Statistic, Progress } from 'antd';
import { TrophyOutlined, DollarOutlined, ShoppingOutlined } from '@ant-design/icons';
import { formatVND } from '../../../utils/formatters/vndCurrency';

export const PerformanceTracker: React.FC = () => {
  const performanceData = {
    salesTarget: 10000000,
    salesAchieved: 7500000,
    ordersTarget: 100,
    ordersAchieved: 85,
    customerSatisfaction: 95,
    commission: 750000,
  };

  const salesProgress = (performanceData.salesAchieved / performanceData.salesTarget) * 100;
  const ordersProgress = (performanceData.ordersAchieved / performanceData.ordersTarget) * 100;

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Doanh số tháng này"
              value={performanceData.salesAchieved}
              formatter={formatVND}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
            <Progress 
              percent={salesProgress} 
              size="small" 
              status={salesProgress >= 100 ? 'success' : 'active'}
            />
            <div style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>
              Mục tiêu: {formatVND(performanceData.salesTarget)}
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Số đơn hàng"
              value={performanceData.ordersAchieved}
              prefix={<ShoppingOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
            <Progress 
              percent={ordersProgress} 
              size="small" 
              status={ordersProgress >= 100 ? 'success' : 'active'}
            />
            <div style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>
              Mục tiêu: {performanceData.ordersTarget} đơn
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Hài lòng khách hàng"
              value={performanceData.customerSatisfaction}
              suffix="%"
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
            <Progress 
              percent={performanceData.customerSatisfaction} 
              size="small" 
              status="success"
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Hoa hồng tháng này"
              value={performanceData.commission}
              formatter={formatVND}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="Biểu đồ hiệu suất" style={{ marginTop: 16 }}>
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <p>Biểu đồ hiệu suất chi tiết sẽ được hiển thị ở đây</p>
        </div>
      </Card>
    </div>
  );
};

export default PerformanceTracker;
