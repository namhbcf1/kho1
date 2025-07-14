// Forgot password page with Vietnamese localization
import React from 'react';
import { Form, Input, Button, Typography, Alert, Card } from 'antd';
import { MailOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';

const { Title, Text } = Typography;

interface ForgotPasswordFormData {
  email: string;
}

export const ForgotPasswordPage: React.FC = () => {
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSubmitted, setIsSubmitted] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (values: ForgotPasswordFormData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // TODO: Implement actual forgot password API call
      // await forgotPassword(values.email);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setIsSubmitted(true);
    } catch (error: any) {
      setError(error.message || 'Có lỗi xảy ra, vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="w-full max-w-md mx-auto">
        <Card className="text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MailOutlined className="text-2xl text-green-600" />
            </div>
            <Title level={3} className="!mb-2">
              Kiểm tra email của bạn
            </Title>
            <Text className="text-gray-600">
              Chúng tôi đã gửi hướng dẫn đặt lại mật khẩu đến email của bạn.
              Vui lòng kiểm tra hộp thư và làm theo hướng dẫn.
            </Text>
          </div>
          
          <div className="space-y-4">
            <Text className="block text-sm text-gray-500">
              Không nhận được email? Kiểm tra thư mục spam hoặc thử lại sau 5 phút.
            </Text>
            
            <Link
              to={ROUTES.AUTH.LOGIN}
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700"
            >
              <ArrowLeftOutlined />
              Quay lại đăng nhập
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <Title level={3} className="!mb-2">
          Quên mật khẩu?
        </Title>
        <Text className="text-gray-600">
          Nhập email của bạn để nhận hướng dẫn đặt lại mật khẩu
        </Text>
      </div>

      {error && (
        <Alert
          message="Lỗi"
          description={error}
          type="error"
          showIcon
          closable
          onClose={() => setError(null)}
          className="mb-6"
        />
      )}

      <Form
        form={form}
        name="forgotPassword"
        onFinish={handleSubmit}
        layout="vertical"
        size="large"
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
            prefix={<MailOutlined className="text-gray-400" />}
            placeholder="Nhập địa chỉ email của bạn"
            autoComplete="email"
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
            {isLoading ? 'Đang gửi...' : 'Gửi hướng dẫn'}
          </Button>
        </Form.Item>

        <div className="text-center">
          <Link
            to={ROUTES.AUTH.LOGIN}
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700"
          >
            <ArrowLeftOutlined />
            Quay lại đăng nhập
          </Link>
        </div>
      </Form>

      {/* Additional help */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <Text strong className="block mb-2">
          Cần hỗ trợ?
        </Text>
        <Text className="text-sm text-gray-600">
          Liên hệ với quản trị viên hệ thống qua email:{' '}
          <a href="mailto:admin@khoaugment.com" className="text-blue-600 hover:text-blue-700">
            admin@khoaugment.com
          </a>
        </Text>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;