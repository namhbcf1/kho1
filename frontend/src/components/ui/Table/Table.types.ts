import type { TableProps } from 'antd';

export interface DataTableProps extends TableProps<any> {
  // Additional custom props if needed
}

export interface TableActionsProps {
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  showView?: boolean;
  showEdit?: boolean;
  showDelete?: boolean;
  deleteConfirmTitle?: string;
}
