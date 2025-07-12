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
      navigate(from, { replace: true });
    } catch (error) {
      // Error is handled by the store
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
            placeholder="Nhập email của bạn"
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
              min: 6,
              message: 'Mật khẩu phải có ít nhất 6 ký tự!',
            },
          ]}
        >
          <Input.Password
            prefix={<LockOutlined className="text-gray-400" />}
            placeholder="Nhập mật khẩu của bạn"
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

      {/* Demo Accounts */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <Text strong className="block mb-2">
          Tài khoản demo:
        </Text>
        <Space direction="vertical" size="small" className="w-full">
          <div className="flex justify-between text-sm">
            <Text>Admin:</Text>
            <Text code>admin@khoaugment.com / 123456</Text>
          </div>
          <div className="flex justify-between text-sm">
            <Text>Quản lý:</Text>
            <Text code>manager@khoaugment.com / 123456</Text>
          </div>
          <div className="flex justify-between text-sm">
            <Text>Thu ngân:</Text>
            <Text code>cashier@khoaugment.com / 123456</Text>
          </div>
        </Space>
      </div>
    </div>
  );
};

export default LoginPage;
