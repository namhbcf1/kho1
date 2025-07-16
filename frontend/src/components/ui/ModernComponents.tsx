import {
    ArrowDownOutlined,
    ArrowUpOutlined,
    ClockCircleOutlined,
    TagOutlined,
    UserOutlined
} from '@ant-design/icons';
import { Avatar, Card, Table, Tag } from 'antd';
import React, { ReactNode } from 'react';
import '../../styles/modern-ui.css';

// Modern Stats Card Component
interface ModernStatsCardProps {
  title: string;
  value: string | number;
  prefix?: ReactNode;
  suffix?: ReactNode;
  trend?: {
    value: number;
    type: 'up' | 'down' | 'neutral';
    label?: string;
  };
  icon?: ReactNode;
  color?: string;
  loading?: boolean;
  onClick?: () => void;
}

export const ModernStatsCard: React.FC<ModernStatsCardProps> = ({
  title,
  value,
  prefix,
  suffix,
  trend,
  icon,
  color = 'var(--color-primary)',
  loading = false,
  onClick,
}) => {
  return (
    <Card 
      className="modern-card" 
      bodyStyle={{ padding: 0 }}
      loading={loading}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div className="modern-stats-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div className="modern-stats-title">{title}</div>
          {icon && (
            <div style={{ 
              width: 40, 
              height: 40, 
              borderRadius: 8, 
              background: `${color}10`, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: color
            }}>
              {icon}
            </div>
          )}
        </div>
        
        <div className="modern-stats-value">
          {prefix && <span style={{ marginRight: 4, fontSize: '0.7em' }}>{prefix}</span>}
          {value}
          {suffix && <span style={{ marginLeft: 4, fontSize: '0.7em' }}>{suffix}</span>}
        </div>
        
        {trend && (
          <div className="modern-stats-footer">
            <div className={`modern-stats-trend modern-stats-trend-${trend.type}`}>
              {trend.type === 'up' && <ArrowUpOutlined />}
              {trend.type === 'down' && <ArrowDownOutlined />}
              <span>{trend.value}%</span>
            </div>
            {trend.label && (
              <span style={{ color: 'var(--color-textSecondary)', fontSize: '14px' }}>
                {trend.label}
              </span>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

// Modern Data Card Component
interface ModernDataCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  extra?: ReactNode;
  loading?: boolean;
  className?: string;
}

export const ModernDataCard: React.FC<ModernDataCardProps> = ({
  title,
  subtitle,
  children,
  extra,
  loading = false,
  className = '',
}) => {
  return (
    <Card 
      className={`modern-card ${className}`}
      loading={loading}
    >
      <div className="modern-card-header">
        <div>
          <div className="modern-card-title">{title}</div>
          {subtitle && (
            <div style={{ color: 'var(--color-textSecondary)', fontSize: '12px' }}>
              {subtitle}
            </div>
          )}
        </div>
        {extra && (
          <div>
            {extra}
          </div>
        )}
      </div>
      <div className="modern-card-content">
        {children}
      </div>
    </Card>
  );
};

// Modern Badge Component
interface ModernBadgeProps {
  status: 'success' | 'warning' | 'error' | 'info' | 'default';
  text: string;
  icon?: ReactNode;
}

export const ModernBadge: React.FC<ModernBadgeProps> = ({
  status,
  text,
  icon,
}) => {
  return (
    <div className={`modern-badge modern-badge-${status}`}>
      {icon && <span>{icon}</span>}
      <span>{text}</span>
    </div>
  );
};

// Modern Table Component
export const ModernTable = (props: any) => {
  return (
    <Table
      {...props}
      className={`modern-table ${props.className || ''}`}
      pagination={{
        hideOnSinglePage: true,
        showSizeChanger: true,
        showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} mục`,
        ...props.pagination,
      }}
    />
  );
};

// Modern User Card Component
interface ModernUserCardProps {
  name: string;
  role?: string;
  avatar?: string;
  status?: 'online' | 'offline' | 'busy';
  stats?: {
    label: string;
    value: string | number;
  }[];
  actions?: ReactNode[];
}

export const ModernUserCard: React.FC<ModernUserCardProps> = ({
  name,
  role,
  avatar,
  status,
  stats,
  actions,
}) => {
  return (
    <Card className="modern-card">
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ position: 'relative' }}>
          <Avatar 
            size={64} 
            src={avatar} 
            icon={!avatar && <UserOutlined />} 
            style={{ backgroundColor: !avatar ? 'var(--color-primary)' : undefined }}
          />
          {status && (
            <div 
              style={{ 
                position: 'absolute', 
                bottom: 0, 
                right: 0, 
                width: 14, 
                height: 14, 
                borderRadius: '50%', 
                background: 
                  status === 'online' ? 'var(--color-vndGreen)' : 
                  status === 'busy' ? 'var(--color-vndOrange)' : 
                  'var(--color-textDisabled)',
                border: '2px solid var(--color-bgPrimary)',
              }} 
            />
          )}
        </div>
        
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: '16px' }}>{name}</div>
          {role && <div style={{ color: 'var(--color-textSecondary)', fontSize: '14px' }}>{role}</div>}
          
          {stats && stats.length > 0 && (
            <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
              {stats.map((stat, index) => (
                <div key={index} style={{ textAlign: 'center' }}>
                  <div style={{ fontWeight: 600, fontSize: '16px' }}>{stat.value}</div>
                  <div style={{ color: 'var(--color-textSecondary)', fontSize: '12px' }}>{stat.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {actions && actions.length > 0 && (
        <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
          {actions}
        </div>
      )}
    </Card>
  );
};

// Modern Order Card Component
interface ModernOrderCardProps {
  orderNumber: string;
  customer: string;
  date: string;
  amount: string | number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  items?: number;
  onClick?: () => void;
}

export const ModernOrderCard: React.FC<ModernOrderCardProps> = ({
  orderNumber,
  customer,
  date,
  amount,
  status,
  items,
  onClick,
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'pending': return 'var(--color-vndOrange)';
      case 'processing': return 'var(--color-vndBlue)';
      case 'completed': return 'var(--color-vndGreen)';
      case 'cancelled': return 'var(--color-vndRed)';
      default: return 'var(--color-textSecondary)';
    }
  };
  
  const getStatusText = () => {
    switch (status) {
      case 'pending': return 'Chờ xử lý';
      case 'processing': return 'Đang xử lý';
      case 'completed': return 'Hoàn thành';
      case 'cancelled': return 'Đã hủy';
      default: return 'Không xác định';
    }
  };
  
  return (
    <Card 
      className="modern-card" 
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: '16px', marginBottom: 4 }}>{orderNumber}</div>
          <div style={{ color: 'var(--color-textSecondary)', fontSize: '14px', marginBottom: 8 }}>{customer}</div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-textSecondary)', fontSize: '12px' }}>
            <ClockCircleOutlined />
            <span>{date}</span>
          </div>
        </div>
        
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 600, fontSize: '16px', marginBottom: 4 }}>{amount}</div>
          {items !== undefined && (
            <div style={{ color: 'var(--color-textSecondary)', fontSize: '14px', marginBottom: 8 }}>
              {items} sản phẩm
            </div>
          )}
          
          <Tag color={getStatusColor()} style={{ borderRadius: '10px', padding: '0 8px' }}>
            {getStatusText()}
          </Tag>
        </div>
      </div>
    </Card>
  );
};

// Modern Product Card Component
interface ModernProductCardProps {
  name: string;
  image?: string;
  price: string | number;
  stock?: number;
  category?: string;
  barcode?: string;
  onClick?: () => void;
}

export const ModernProductCard: React.FC<ModernProductCardProps> = ({
  name,
  image,
  price,
  stock,
  category,
  barcode,
  onClick,
}) => {
  return (
    <Card 
      className="modern-card" 
      cover={image && <img alt={name} src={image} style={{ height: 160, objectFit: 'cover' }} />}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div style={{ padding: image ? 0 : 16 }}>
        <div style={{ fontWeight: 600, fontSize: '16px', marginBottom: 4 }}>{name}</div>
        
        {category && (
          <div style={{ color: 'var(--color-textSecondary)', fontSize: '14px', marginBottom: 8 }}>
            {category}
          </div>
        )}
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
          <div style={{ fontWeight: 600, fontSize: '16px', color: 'var(--color-primary)' }}>{price}</div>
          
          {stock !== undefined && (
            <Tag color={stock > 10 ? 'success' : stock > 0 ? 'warning' : 'error'} style={{ borderRadius: '10px' }}>
              {stock > 0 ? `Còn ${stock}` : 'Hết hàng'}
            </Tag>
          )}
        </div>
        
        {barcode && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-textSecondary)', fontSize: '12px', marginTop: 8 }}>
            <TagOutlined />
            <span>{barcode}</span>
          </div>
        )}
      </div>
    </Card>
  );
};

export default {
  ModernStatsCard,
  ModernDataCard,
  ModernBadge,
  ModernTable,
  ModernUserCard,
  ModernOrderCard,
  ModernProductCard,
}; 