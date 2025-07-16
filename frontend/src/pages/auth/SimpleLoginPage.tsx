import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, Typography, message, notification } from 'antd';
import { 
  UserOutlined, 
  LockOutlined, 
  LoginOutlined,
  ShopOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

interface LoginFormData {
  email: string;
  password: string;
}

const SimpleLoginPage: React.FC = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Check if user is already logged in
  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    const isAuthenticated = localStorage.getItem('isAuthenticated');
    
    if (savedUser && isAuthenticated === 'true') {
      try {
        const user = JSON.parse(savedUser);
        if (user && user.email) {
          notification.info({
            message: 'Đã đăng nhập',
            description: `Chào mừng trở lại, ${user.name}!`
          });
          navigate('/dashboard');
        }
      } catch (error) {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('isAuthenticated');
      }
    }
  }, [navigate]);

  const handleSubmit = async (values: LoginFormData) => {
    setLoading(true);
    
    try {
      // Enhanced authentication with multiple demo accounts
      const validUsers = [
        { email: 'admin@khoaugment.com', password: 'admin123', role: 'admin' },
        { email: 'cashier@khoaugment.com', password: 'cashier123', role: 'cashier' },
        { email: 'manager@khoaugment.com', password: 'manager123', role: 'manager' },
        { email: 'demo@khoaugment.com', password: 'demo123', role: 'demo' }
      ];
      
      const user = validUsers.find(u => u.email === values.email && u.password === values.password);
      
      if (user) {
        // Save auth status and user info to localStorage
        localStorage.setItem('auth', 'true');
        localStorage.setItem('user', JSON.stringify({
          email: user.email,
          role: user.role,
          name: user.role === 'admin' ? 'Quản trị viên' : 
                user.role === 'cashier' ? 'Thu ngân' :
                user.role === 'manager' ? 'Quản lý' : 'Demo User'
        }));
        
        message.success(`Đăng nhập thành công! Chào mừng ${user.role === 'admin' ? 'Quản trị viên' : user.role === 'cashier' ? 'Thu ngân' : user.role === 'manager' ? 'Quản lý' : 'Demo User'}`);
        
        setTimeout(() => {
          navigate('/dashboard');
        }, 1000);
      } else {
        message.error('Email hoặc mật khẩu không đúng!');
      }
    } catch (error) {
      message.error('Đăng nhập thất bại!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <Card style={{ width: 400, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <ShopOutlined style={{ fontSize: '3rem', color: '#1890ff', marginBottom: '1rem' }} />
          <Title level={2} style={{ margin: 0 }}>KhoAugment POS</Title>
          <Text style={{ color: '#666' }}>Hệ thống quản lý bán hàng thông minh</Text>
        </div>

        <Form
          form={form}
          name="login"
          onFinish={handleSubmit}
          layout="vertical"
          size="large"
          initialValues={{
            email: 'admin@khoaugment.com',
            password: 'admin123'
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
              prefix={<UserOutlined />}
              placeholder="Nhập email của bạn"
              autoComplete="email"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="Mật khẩu"
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu!' },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Nhập mật khẩu"
              autoComplete="current-password"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              size="large"
              icon={<LoginOutlined />}
            >
              Đăng nhập
            </Button>
          </Form.Item>
        </Form>

        <div style={{ 
          background: '#f0f2f5', 
          padding: '1rem', 
          borderRadius: '8px', 
          marginTop: '1rem' 
        }}>
          <Text strong style={{ color: '#1890ff', display: 'block', marginBottom: '0.5rem' }}>
            Thông tin đăng nhập demo:
          </Text>
          <div style={{ fontSize: '0.85rem', color: '#666' }}>
            <div style={{ marginBottom: '0.5rem' }}>
              <strong>Admin:</strong> admin@khoaugment.com / admin123
            </div>
            <div style={{ marginBottom: '0.5rem' }}>
              <strong>Thu ngân:</strong> cashier@khoaugment.com / cashier123
            </div>
            <div style={{ marginBottom: '0.5rem' }}>
              <strong>Quản lý:</strong> manager@khoaugment.com / manager123
            </div>
            <div>
              <strong>Demo:</strong> demo@khoaugment.com / demo123
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default SimpleLoginPage;