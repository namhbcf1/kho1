// Login page with Vietnamese localization
import React from 'react';
import { Form, Input, Button, Checkbox, Typography, Space, Alert } from 'antd';
import { UserOutlined, LockOutlined, EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES } from '../../constants/routes';

const { Title, Text } = Typography;

interface LoginFormData {
  email: string;
  password: string;
  remember: boolean;
}

export const LoginPage: React.FC = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading, error, clearError } = useAuth();

  const from = (location.state as any)?.from?.pathname || ROUTES.DASHBOARD;

  const handleSubmit = async (values: LoginFormData) => {
    try {
      clearError();
      await login({
        email: values.email,
        password: values.password,
        remember: values.remember,
      });
      // Navigate will happen automatically when auth state changes
      setTimeout(() => {
        navigate(from, { replace: true });
      }, 100);
    } catch (error) {
      // Error is handled by the store
      console.error('Login error:', error);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <Title level={3} className="!mb-2">
          Đăng nhập
        </Title>
        <Text className="text-gray-600">
          Đăng nhập vào hệ thống KhoAugment POS
        </Text>
      </div>

      {error && (
        <Alert
          message="Đăng nhập thất bại"
          description={error}
          type="error"
          showIcon
          closable
          onClose={clearError}
          className="mb-6"
        />
      )}

      <Form
        form={form}
        name="login"
        onFinish={handleSubmit}
        layout="vertical"
        size="large"
        initialValues={{
          remember: true,
        }}
      >
        <Form.Item
          name="email"
          label="Email"
          rules={[
            {
              required: true,
              message: 'Vui lòng nhập email!',
            },
            {
              type: 'email',
              message: 'Email không hợp lệ!',
            },
          ]}
        >
          <Input
            prefix={<UserOutlined className="text-gray-400" />}
            placeholder="user@company.com"
            autoComplete="email"
          />
        </Form.Item>

        <Form.Item
          name="password"
          label="Mật khẩu"
          rules={[
            {
              required: true,
              message: 'Vui lòng nhập mật khẩu!',
            },
            {
              min: 8,
              message: 'Mật khẩu phải có ít nhất 8 ký tự!',
            },
          ]}
        >
          <Input.Password
            prefix={<LockOutlined className="text-gray-400" />}
            placeholder="Nhập mật khẩu"
            iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
            autoComplete="current-password"
          />
        </Form.Item>

        <Form.Item>
          <div className="flex items-center justify-between">
            <Form.Item name="remember" valuePropName="checked" noStyle>
              <Checkbox>Ghi nhớ đăng nhập</Checkbox>
            </Form.Item>

            <Link
              to={ROUTES.AUTH.FORGOT_PASSWORD}
              className="text-blue-600 hover:text-blue-700"
            >
              Quên mật khẩu?
            </Link>
          </div>
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={isLoading}
            block
            size="large"
          >
            {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </Button>
        </Form.Item>

        <div className="text-center">
          <Text className="text-gray-600">
            Chưa có tài khoản?{' '}
            <Link
              to={ROUTES.AUTH.REGISTER}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Đăng ký ngay
            </Link>
          </Text>
        </div>
      </Form>

      {/* Production Login Notice */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <Text strong className="block mb-2 text-blue-700">
          Thông báo:
        </Text>
        <Text className="text-blue-600 text-sm">
          Vui lòng sử dụng tài khoản được cấp bởi quản trị viên hệ thống.
        </Text>
      </div>
    </div>
  );
};

export default LoginPage;
