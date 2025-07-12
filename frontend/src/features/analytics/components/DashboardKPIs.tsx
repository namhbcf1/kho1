// Vietnamese business KPIs component
import React from 'react';
import { Row, Col, Card, Statistic } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, DollarOutlined, ShoppingOutlined, UserOutlined, TrophyOutlined } from '@ant-design/icons';
import { formatVND } from '../../../utils/formatters/vndCurrency';

export const DashboardKPIs: React.FC = () => {
  const kpis = [
    {
      title: 'Doanh thu hôm nay',
      value: 2500000,
      prefix: <DollarOutlined />,
      trend: 'up',
      trendValue: 12.5,
      formatter: formatVND,
    },
    {
      title: 'Đơn hàng hôm nay',
      value: 45,
      prefix: <ShoppingOutlined />,
      trend: 'up',
      trendValue: 8.3,
    },
    {
      title: 'Khách hàng mới',
      value: 12,
      prefix: <UserOutlined />,
      trend: 'down',
      trendValue: 2.1,
    },
    {
      title: 'Sản phẩm bán chạy',
      value: 156,
      prefix: <TrophyOutlined />,
      trend: 'up',
      trendValue: 15.2,
    },
  ];

  return (
    <Row gutter={[16, 16]}>
      {kpis.map((kpi, index) => (
        <Col xs={24} sm={12} lg={6} key={index}>
          <Card>
            <Statistic
              title={kpi.title}
              value={kpi.value}
              prefix={kpi.prefix}
              formatter={kpi.formatter}
              valueStyle={{
                color: kpi.trend === 'up' ? '#3f8600' : '#cf1322',
              }}
            />
            <div style={{ marginTop: 8, fontSize: '12px' }}>
              {kpi.trend === 'up' ? (
                <ArrowUpOutlined style={{ color: '#3f8600' }} />
              ) : (
                <ArrowDownOutlined style={{ color: '#cf1322' }} />
              )}
              <span style={{ marginLeft: 4 }}>
                {kpi.trendValue}% so với hôm qua
              </span>
            </div>
          </Card>
        </Col>
      ))}
    </Row>
  );
};

export default DashboardKPIs;
