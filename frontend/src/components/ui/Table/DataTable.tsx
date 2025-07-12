import React from 'react';
import { Table, ConfigProvider } from 'antd';
import viVN from 'antd/locale/vi_VN';
import type { DataTableProps } from './Table.types';

export const DataTable: React.FC<DataTableProps> = ({
  columns,
  dataSource,
  loading = false,
  pagination = true,
  rowKey = 'id',
  size = 'middle',
  ...props
}) => {
  return (
    <ConfigProvider locale={viVN}>
      <Table
        columns={columns}
        dataSource={dataSource}
        loading={loading}
        pagination={pagination}
        rowKey={rowKey}
        size={size}
        {...props}
      />
    </ConfigProvider>
  );
};

export default DataTable;
