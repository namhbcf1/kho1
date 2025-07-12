import React from 'react';
import {
  DashboardOutlined,
  ShoppingCartOutlined,
  ShopOutlined,
  UserOutlined,
  FileTextOutlined,
  BarChartOutlined,
  CreditCardOutlined,
  TeamOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';

type MenuItem = Required<MenuProps>['items'][number];

export const MenuItems: MenuItem[] = [
  {
    key: 'dashboard',
    icon: <DashboardOutlined />,
    label: 'Tổng quan',
  },
  {
    key: 'pos',
    icon: <ShoppingCartOutlined />,
    label: 'Bán hàng (POS)',
  },
  {
    key: 'products',
    icon: <ShopOutlined />,
    label: 'Sản phẩm',
    children: [
      {
        key: 'products-list',
        label: 'Danh sách sản phẩm',
      },
      {
        key: 'products-categories',
        label: 'Danh mục',
      },
      {
        key: 'products-inventory',
        label: 'Quản lý tồn kho',
      },
    ],
  },
  {
    key: 'customers',
    icon: <UserOutlined />,
    label: 'Khách hàng',
    children: [
      {
        key: 'customers-list',
        label: 'Danh sách khách hàng',
      },
      {
        key: 'customers-loyalty',
        label: 'Chương trình khách hàng thân thiết',
      },
    ],
  },
  {
    key: 'orders',
    icon: <FileTextOutlined />,
    label: 'Đơn hàng',
    children: [
      {
        key: 'orders-list',
        label: 'Danh sách đơn hàng',
      },
      {
        key: 'orders-refunds',
        label: 'Hoàn trả',
      },
    ],
  },
  {
    key: 'analytics',
    icon: <BarChartOutlined />,
    label: 'Báo cáo & Thống kê',
    children: [
      {
        key: 'analytics-sales',
        label: 'Báo cáo bán hàng',
      },
      {
        key: 'analytics-revenue',
        label: 'Báo cáo doanh thu',
      },
      {
        key: 'analytics-inventory',
        label: 'Báo cáo tồn kho',
      },
      {
        key: 'analytics-customers',
        label: 'Phân tích khách hàng',
      },
    ],
  },
  {
    key: 'payments',
    icon: <CreditCardOutlined />,
    label: 'Thanh toán',
    children: [
      {
        key: 'payments-methods',
        label: 'Phương thức thanh toán',
      },
      {
        key: 'payments-history',
        label: 'Lịch sử giao dịch',
      },
    ],
  },
  {
    key: 'staff',
    icon: <TeamOutlined />,
    label: 'Nhân viên',
    children: [
      {
        key: 'staff-management',
        label: 'Quản lý nhân viên',
      },
      {
        key: 'staff-performance',
        label: 'Hiệu suất làm việc',
      },
      {
        key: 'staff-shifts',
        label: 'Quản lý ca làm việc',
      },
    ],
  },
  {
    type: 'divider',
  },
  {
    key: 'settings',
    icon: <SettingOutlined />,
    label: 'Cài đặt',
    children: [
      {
        key: 'settings-business',
        label: 'Thông tin doanh nghiệp',
      },
      {
        key: 'settings-tax',
        label: 'Cài đặt thuế',
      },
      {
        key: 'settings-receipt',
        label: 'Mẫu hóa đơn',
      },
      {
        key: 'settings-payment',
        label: 'Cổng thanh toán',
      },
      {
        key: 'settings-backup',
        label: 'Sao lưu dữ liệu',
      },
    ],
  },
];
