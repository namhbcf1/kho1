// Registration page with Vietnamese business validation
import React from 'react';
import { Form, Input, Button, Typography, Space, Alert, Select } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, PhoneOutlined, EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES } from '../../constants/routes';
import { validateVietnamesePhone } from '../../utils/validators/vietnameseValidators';

const { Title, Text } = Typography;
const { Option } = Select;

interface RegisterFormData {
  name: string;
  email: string;
  phone?: string;
  position?: string;
  password: string;
  confirmPassword: string;
}

const POSITIONS = [
  'Quản lý',
  'Thu ngân',
  'Nhân viên bán hàng',
  'Nhân viên kho',
  'Kế toán',
  'Khác',
];

export const RegisterPage: React.FC = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { register, isLoading, error, clearError } = useAuth();

  const handleSubmit = async (values: RegisterFormData) => {
    try {
      clearError();
      await register({
        name: values.name,
        email: values.email,
        phone: values.phone,
        position: values.position,
        password: values.password,
      });
      navigate(ROUTES.DASHBOARD, { replace: true });
    } catch (error) {
      // Error is handled by the store
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <Title level={3} className="!mb-2">
          Đăng ký tài khoản
        </Title>
        <Text className="text-gray-600">
          Tạo tài khoản mới cho KhoAugment POS
        </Text>
      </div>

      {error && (
        <Alert
          message="Đăng ký thất bại"
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
        name="register"
        onFinish={handleSubmit}
        layout="vertical"
        size="large"
        scrollToFirstError
      >
        <Form.Item
          name="name"
          label="Họ và tên"
          rules={[
            {
              required: true,
              message: 'Vui lòng nhập họ và tên!',
            },
            {
              min: 2,
              message: 'Họ và tên phải có ít nhất 2 ký tự!',
            },
            {
              max: 100,
              message: 'Họ và tên không được quá 100 ký tự!',
            },
          ]}
        >
          <Input
            prefix={<UserOutlined className="text-gray-400" />}
            placeholder="Nhập họ và tên đầy đủ"
            autoComplete="name"
          />
        </Form.Item>

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
            prefix={<MailOutlined className="text-gray-400" />}
            placeholder="Nhập địa chỉ email"
            autoComplete="email"
          />
        </Form.Item>

        <Form.Item
          name="phone"
          label="Số điện thoại"
          rules={[
            {
              validator: (_, value) => {
                if (!value) return Promise.resolve();
                if (!validateVietnamesePhone(value)) {
                  return Promise.reject(new Error('Số điện thoại không hợp lệ!'));
                }
                return Promise.resolve();
              },
            },
          ]}
        >
          <Input
            prefix={<PhoneOutlined className="text-gray-400" />}
            placeholder="Nhập số điện thoại (tùy chọn)"
            autoComplete="tel"
          />
        </Form.Item>

        <Form.Item
          name="position"
          label="Vị trí công việc"
        >
          <Select
            placeholder="Chọn vị trí công việc (tùy chọn)"
            allowClear
          >
            {POSITIONS.map(position => (
              <Option key={position} value={position}>
                {position}
              </Option>
            ))}
          </Select>
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
            {
              pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
              message: 'Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 số!',
            },
          ]}
          hasFeedback
        >
          <Input.Password
            prefix={<LockOutlined className="text-gray-400" />}
            placeholder="Nhập mật khẩu"
            iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
            autoComplete="new-password"
          />
        </Form.Item>

        <Form.Item
          name="confirmPassword"
          label="Xác nhận mật khẩu"
          dependencies={['password']}
          rules={[
            {
              required: true,
              message: 'Vui lòng xác nhận mật khẩu!',
            },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
              },
            }),
          ]}
          hasFeedback
        >
          <Input.Password
            prefix={<LockOutlined className="text-gray-400" />}
            placeholder="Nhập lại mật khẩu"
            iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
            autoComplete="new-password"
          />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={isLoading}
            block
            size="large"
          >
            {isLoading ? 'Đang đăng ký...' : 'Đăng ký'}
          </Button>
        </Form.Item>

        <div className="text-center">
          <Text className="text-gray-600">
            Đã có tài khoản?{' '}
            <Link
              to={ROUTES.AUTH.LOGIN}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Đăng nhập ngay
            </Link>
          </Text>
        </div>
      </Form>

      {/* Terms and Privacy */}
      <div className="mt-6 text-center">
        <Text className="text-xs text-gray-500">
          Bằng việc đăng ký, bạn đồng ý với{' '}
          <Link to="/terms" className="text-blue-600 hover:text-blue-700">
            Điều khoản sử dụng
          </Link>{' '}
          và{' '}
          <Link to="/privacy" className="text-blue-600 hover:text-blue-700">
            Chính sách bảo mật
          </Link>{' '}
          của chúng tôi.
        </Text>
      </div>
    </div>
  );
};

export default RegisterPage;
