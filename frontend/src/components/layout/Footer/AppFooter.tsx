import React from 'react';
import { Layout, Typography, Space } from 'antd';
import type { AppFooterProps } from './Footer.types';

const { Footer } = Layout;
const { Text, Link } = Typography;

export const AppFooter: React.FC<AppFooterProps> = ({
  companyName = 'KhoAugment',
  version = '1.0.0',
  showVersion = true,
}) => {
  const currentYear = new Date().getFullYear();

  return (
    <Footer style={{ 
      textAlign: 'center', 
      background: '#f0f2f5',
      borderTop: '1px solid #d9d9d9'
    }}>
      <Space direction="vertical" size="small">
        <Text type="secondary">
          © {currentYear} {companyName}. Tất cả quyền được bảo lưu.
        </Text>
        
        {showVersion && (
          <Text type="secondary" style={{ fontSize: '12px' }}>
            Phiên bản {version}
          </Text>
        )}
        
        <Space split={<Text type="secondary">|</Text>}>
          <Link href="/privacy" target="_blank">
            Chính sách bảo mật
          </Link>
          <Link href="/terms" target="_blank">
            Điều khoản sử dụng
          </Link>
          <Link href="/support" target="_blank">
            Hỗ trợ
          </Link>
        </Space>
      </Space>
    </Footer>
  );
};

export default AppFooter;
