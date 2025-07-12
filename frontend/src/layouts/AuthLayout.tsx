// Authentication layout for login/register pages
import React from 'react';
import { Layout, ConfigProvider, Card, Typography, Space } from 'antd';
import { Outlet } from 'react-router-dom';
import viVN from 'antd/locale/vi_VN';
import { useLayout } from '../stores';

const { Content } = Layout;
const { Title, Text } = Typography;

interface AuthLayoutProps {
  children?: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  const { theme } = useLayout();

  return (
    <ConfigProvider
      locale={viVN}
      theme={{
        token: {
          colorPrimary: '#1890ff',
          borderRadius: 8,
          fontSize: 14,
        },
        algorithm: theme === 'dark' ? 'darkAlgorithm' : 'defaultAlgorithm',
      }}
    >
      <Layout className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Content className="flex items-center justify-center p-6">
          <div className="w-full max-w-md">
            {/* Logo and Brand */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
              </div>
              <Title level={2} className="!mb-2 !text-gray-800">
                KhoAugment POS
              </Title>
              <Text className="text-gray-600">
                Hệ thống quản lý bán hàng thông minh
              </Text>
            </div>

            {/* Auth Form Card */}
            <Card
              className="shadow-lg border-0"
              bodyStyle={{ padding: '32px' }}
            >
              {children || <Outlet />}
            </Card>

            {/* Footer */}
            <div className="text-center mt-8">
              <Space direction="vertical" size="small">
                <Text className="text-gray-500 text-sm">
                  © 2024 KhoAugment. Tất cả quyền được bảo lưu.
                </Text>
                <Space size="large">
                  <Text className="text-gray-400 text-xs hover:text-blue-600 cursor-pointer">
                    Điều khoản sử dụng
                  </Text>
                  <Text className="text-gray-400 text-xs hover:text-blue-600 cursor-pointer">
                    Chính sách bảo mật
                  </Text>
                  <Text className="text-gray-400 text-xs hover:text-blue-600 cursor-pointer">
                    Hỗ trợ
                  </Text>
                </Space>
              </Space>
            </div>
          </div>
        </Content>
      </Layout>
    </ConfigProvider>
  );
};

export default AuthLayout;
