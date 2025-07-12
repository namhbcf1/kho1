import React from 'react';
import { Space, Button, Popconfirm } from 'antd';
import { EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import type { TableActionsProps } from './Table.types';

export const TableActions: React.FC<TableActionsProps> = ({
  onView,
  onEdit,
  onDelete,
  showView = true,
  showEdit = true,
  showDelete = true,
  deleteConfirmTitle = 'Bạn có chắc chắn muốn xóa?',
}) => {
  return (
    <Space size="small">
      {showView && onView && (
        <Button
          type="text"
          icon={<EyeOutlined />}
          onClick={onView}
          title="Xem chi tiết"
        />
      )}
      {showEdit && onEdit && (
        <Button
          type="text"
          icon={<EditOutlined />}
          onClick={onEdit}
          title="Chỉnh sửa"
        />
      )}
      {showDelete && onDelete && (
        <Popconfirm
          title={deleteConfirmTitle}
          onConfirm={onDelete}
          okText="Có"
          cancelText="Không"
        >
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            title="Xóa"
          />
        </Popconfirm>
      )}
    </Space>
  );
};

export default TableActions;
