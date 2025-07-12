// Sales commission tracking component
import React from 'react';
import { Table, Card, Statistic, Row, Col } from 'antd';
import { formatVND } from '../../../utils/formatters/vndCurrency';

export const CommissionTracker: React.FC = () => {
  const columns = [
    {
      title: 'Ngày',
      dataIndex: 'date',
      key: 'date',
    },
    {
      title: 'Doanh số',
      dataIndex: 'sales',
      key: 'sales',
      render: (amount: number) => formatVND(amount),
    },
    {
      title: 'Tỷ lệ hoa hồng',
      dataIndex: 'rate',
      key: 'rate',
      render: (rate: number) => `${rate}%`,
    },
    {
      title: 'Hoa hồng',
      dataIndex: 'commission',
      key: 'commission',
      render: (amount: number) => (
        <span style={{ color: '#52c41a', fontWeight: 'bold' }}>
          {formatVND(amount)}
        </span>
      ),
    },
  ];

  const data = [
    {
      key: '1',
      date: '01/01/2024',
      sales: 2000000,
      rate: 3,
      commission: 60000,
    },
    {
      key: '2',
      date: '02/01/2024',
      sales: 1500000,
      rate: 3,
      commission: 45000,
    },
    {
      key: '3',
      date: '03/01/2024',
      sales: 2500000,
      rate: 3,
      commission: 75000,
    },
  ];

  const totalCommission = data.reduce((sum, item) => sum + item.commission, 0);
  const totalSales = data.reduce((sum, item) => sum + item.sales, 0);
  const averageRate = 3; // 3%

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Tổng hoa hồng tháng này"
              value={totalCommission}
              formatter={formatVND}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Tổng doanh số"
              value={totalSales}
              formatter={formatVND}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Tỷ lệ hoa hồng trung bình"
              value={averageRate}
              suffix="%"
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="Chi tiết hoa hồng">
        <Table
          columns={columns}
          dataSource={data}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} của ${total} bản ghi`,
          }}
          summary={() => (
            <Table.Summary>
              <Table.Summary.Row>
                <Table.Summary.Cell index={0}>
                  <strong>Tổng cộng</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={1}>
                  <strong>{formatVND(totalSales)}</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={2}>
                  <strong>{averageRate}%</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={3}>
                  <strong style={{ color: '#52c41a' }}>
                    {formatVND(totalCommission)}
                  </strong>
                </Table.Summary.Cell>
              </Table.Summary.Row>
            </Table.Summary>
          )}
        />
      </Card>
    </div>
  );
};

export default CommissionTracker;
