// Stock level tracking component
import React from 'react';
import { Table, Tag, Progress, Button } from 'antd';
import { WarningOutlined, PlusOutlined } from '@ant-design/icons';

export const InventoryTracker: React.FC = () => {
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
      title: 'Tối thiểu',
      dataIndex: 'minStock',
      key: 'minStock',
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
    {
      title: 'Thao tác',
      key: 'action',
      render: () => (
        <Button type="primary" size="small" icon={<PlusOutlined />}>
          Nhập hàng
        </Button>
      ),
    },
  ];

  const data = [
    {
      key: '1',
      name: 'Cà phê đen',
      stock: 5,
      minStock: 10,
      maxStock: 100,
    },
    {
      key: '2',
      name: 'Cà phê sữa',
      stock: 0,
      minStock: 10,
      maxStock: 100,
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={data}
      pagination={false}
      size="small"
    />
  );
};

export default InventoryTracker;
