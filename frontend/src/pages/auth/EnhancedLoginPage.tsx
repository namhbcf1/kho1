// Enhanced Login Page with modern UI, animations, and responsive design
import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Checkbox, Typography, Space, Alert, Card, Divider, Row, Col, Spin } from 'antd';
import { 
  UserOutlined, 
  LockOutlined, 
  EyeInvisibleOutlined, 
  EyeTwoTone,
  LoginOutlined,
  ShopOutlined,
  SafetyOutlined,
  ThunderboltOutlined,
  GlobalOutlined,
  CheckCircleOutlined,
  RightOutlined
} from '@ant-design/icons';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES } from '../../constants/routes';
import './EnhancedLoginPage.css';

const { Title, Text, Paragraph } = Typography;

interface LoginFormData {
  email: string;
  password: string;
  remember: boolean;
}

// Demo accounts removed for production security

const features = [
  {
    icon: <ShopOutlined className="text-2xl text-blue-600" />,
    title: 'Quản lý bán hàng',
    description: 'Hệ thống POS hiện đại với giao diện thân thiện'
  },
  {
    icon: <SafetyOutlined className="text-2xl text-green-600" />,
    title: 'Bảo mật cao',
    description: 'Mã hóa dữ liệu và xác thực đa lớp'
  },
  {
    icon: <ThunderboltOutlined className="text-2xl text-orange-600" />,
    title: 'Tốc độ nhanh',
    description: 'Xử lý giao dịch trong thời gian thực'
  },
  {
    icon: <GlobalOutlined className="text-2xl text-purple-600" />,
    title: 'Hỗ trợ tiếng Việt',
    description: 'Tương thích với thị trường Việt Nam'
  }
];

export const EnhancedLoginPage: React.FC = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading, error, clearError } = useAuth();
  const [showFeatures, setShowFeatures] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const from = (location.state as any)?.from?.pathname || ROUTES.DASHBOARD;

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Show features after delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowFeatures(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (values: LoginFormData) => {
    try {
      clearError();
      await login({
        email: values.email,
        password: values.password,
        remember: values.remember,
      });
      
      // Show success animation
      setTimeout(() => {
        navigate(from, { replace: true });
      }, 1000);
    } catch (error) {
      console.error('Login error:', error);
    }
  };


  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('vi-VN', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit' 
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('vi-VN', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="enhanced-login-container">
      {/* Background Elements */}
      <div className="login-background">
        <div className="background-shapes">
          <div className="shape shape-1" />
          <div className="shape shape-2" />
          <div className="shape shape-3" />
        </div>
      </div>

      <Row className="h-screen">
        {/* Left Panel - Features & Branding */}
        <Col xs={0} md={12} lg={14} className="login-left-panel">
          <div className="left-panel-content">
            {/* Header */}
            <div className="brand-header">
              <div className="brand-logo">
                <ShopOutlined className="text-4xl text-white" />
              </div>
              <div>
                <Title level={2} className="text-white !mb-2">
                  KhoAugment POS
                </Title>
                <Text className="text-blue-100 text-lg">
                  Hệ thống quản lý bán hàng thông minh
                </Text>
              </div>
            </div>

            {/* Time Display */}
            <div className="time-display">
              <div className="current-time">
                {formatTime(currentTime)}
              </div>
              <div className="current-date">
                {formatDate(currentTime)}
              </div>
            </div>

            {/* Features */}
            <div className={`features-grid ${showFeatures ? 'features-visible' : ''}`}>
              {features.map((feature, index) => (
                <div 
                  key={index} 
                  className="feature-card"
                  style={{ animationDelay: `${index * 0.2}s` }}
                >
                  <div className="feature-icon">{feature.icon}</div>
                  <div className="feature-content">
                    <h3 className="feature-title">{feature.title}</h3>
                    <p className="feature-description">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="stats-section">
              <div className="stat-item">
                <div className="stat-number">1000+</div>
                <div className="stat-label">Cửa hàng tin dùng</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">50K+</div>
                <div className="stat-label">Giao dịch/ngày</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">99.9%</div>
                <div className="stat-label">Thời gian hoạt động</div>
              </div>
            </div>
          </div>
        </Col>

        {/* Right Panel - Login Form */}
        <Col xs={24} md={12} lg={10} className="login-right-panel">
          <div className="login-form-container">
            <div className="login-form-content">
              {/* Mobile Header */}
              <div className="mobile-header md:hidden">
                <div className="mobile-logo">
                  <ShopOutlined className="text-3xl text-blue-600" />
                </div>
                <Title level={3} className="text-center !mb-2">
                  KhoAugment POS
                </Title>
                <Text className="text-gray-600 text-center block mb-6">
                  Hệ thống quản lý bán hàng thông minh
                </Text>
              </div>

              {/* Login Header */}
              <div className="login-header">
                <Title level={2} className="!mb-2">
                  Đăng nhập
                </Title>
                <Text className="text-gray-600">
                  Chào mừng bạn quay lại! Vui lòng đăng nhập để tiếp tục.
                </Text>
              </div>

              {/* Error Alert */}
              {error && (
                <Alert
                  message="Đăng nhập thất bại"
                  description={error}
                  type="error"
                  showIcon
                  closable
                  onClose={clearError}
                  className="mb-6 login-error-alert"
                />
              )}

              {/* Login Form */}
              <Form
                form={form}
                name="enhanced-login"
                onFinish={handleSubmit}
                layout="vertical"
                size="large"
                className="login-form"
                initialValues={{
                  remember: true,
                }}
              >
                <Form.Item
                  name="email"
                  label="Email"
                  rules={[
                    { required: true, message: 'Vui lòng nhập email!' },
                    { type: 'email', message: 'Email không hợp lệ!' },
                  ]}
                >
                  <Input
                    prefix={<UserOutlined className="text-gray-400" />}
                    placeholder="Nhập email của bạn"
                    autoComplete="email"
                    className="login-input"
                  />
                </Form.Item>

                <Form.Item
                  name="password"
                  label="Mật khẩu"
                  rules={[
                    { required: true, message: 'Vui lòng nhập mật khẩu!' },
                    { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' },
                  ]}
                >
                  <Input.Password
                    prefix={<LockOutlined className="text-gray-400" />}
                    placeholder="Nhập mật khẩu"
                    iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                    autoComplete="current-password"
                    className="login-input"
                  />
                </Form.Item>

                <Form.Item>
                  <div className="flex items-center justify-between">
                    <Form.Item name="remember" valuePropName="checked" noStyle>
                      <Checkbox>Ghi nhớ đăng nhập</Checkbox>
                    </Form.Item>

                    <Link
                      to={ROUTES.AUTH.FORGOT_PASSWORD}
                      className="text-blue-600 hover:text-blue-700 transition-colors"
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
                    className="login-button"
                    icon={!isLoading && <LoginOutlined />}
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center">
                        <Spin size="small" className="mr-2" />
                        Đang đăng nhập...
                      </span>
                    ) : (
                      'Đăng nhập'
                    )}
                  </Button>
                </Form.Item>
              </Form>

              {/* Production Notice */}
              <div className="bg-blue-50 p-4 rounded-lg mt-4">
                <Text strong className="text-blue-700 block mb-2">
                  Thông báo hệ thống:
                </Text>
                <Text className="text-blue-600 text-sm">
                  Vui lòng liên hệ quản trị viên để được cấp tài khoản truy cập.
                </Text>
              </div>

              {/* Register Link */}
              <div className="register-link">
                <Text className="text-gray-600">
                  Chưa có tài khoản?{' '}
                  <Link
                    to={ROUTES.AUTH.REGISTER}
                    className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                  >
                    Đăng ký ngay
                  </Link>
                </Text>
              </div>
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default EnhancedLoginPage;