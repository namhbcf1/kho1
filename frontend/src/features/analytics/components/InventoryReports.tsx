// Stock reports component
import React from 'react';
import { Card, Table, Progress, Tag } from 'antd';
import { WarningOutlined } from '@ant-design/icons';

export const InventoryReports: React.FC = () => {
  const columns = [
    {
      title: 'Sản phẩm',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Tồn kho',
      dataIndex: 'stock',
      key: 'stock',
      render: (stock: number, record: any) => (
        <div>
          <div>{stock}</div>
          <Progress
            percent={(stock / record.maxStock) * 100}
            size="small"
            status={stock <= record.minStock ? 'exception' : 'normal'}
          />
        </div>
      ),
    },
    {
      title: 'Trạng thái',
      key: 'status',
      render: (_, record: any) => {
        if (record.stock === 0) {
          return <Tag color="red">Hết hàng</Tag>;
        } else if (record.stock <= record.minStock) {
          return <Tag color="orange" icon={<WarningOutlined />}>Sắp hết</Tag>;
        } else {
          return <Tag color="green">Còn hàng</Tag>;
        }
      },
    },
  ];

  const data = [
    { key: '1', name: 'Cà phê đen', stock: 5, minStock: 10, maxStock: 100 },
    { key: '2', name: 'Cà phê sữa', stock: 0, minStock: 10, maxStock: 100 },
    { key: '3', name: 'Trà đá', stock: 25, minStock: 15, maxStock: 120 },
  ];

  return (
    <Card title="Báo cáo tồn kho">
      <Table
        columns={columns}
        dataSource={data}
        pagination={false}
        size="small"
      />
    </Card>
  );
};

export default InventoryReports;
