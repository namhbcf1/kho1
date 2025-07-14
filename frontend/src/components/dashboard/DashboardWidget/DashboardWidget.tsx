import React from 'react';
import { Card, Button, Typography, Space, Alert, Spin } from 'antd';
import { ReloadOutlined, MoreOutlined } from '@ant-design/icons';
import { DashboardWidgetProps } from '../types';
import { useBreakpoint } from '../../../hooks/useMediaQuery';
import DashboardSkeleton from '../DashboardSkeleton/DashboardSkeleton';
import './DashboardWidget.css';

const { Title, Text } = Typography;

const DashboardWidget: React.FC<DashboardWidgetProps> = ({
  title,
  subtitle,
  icon,
  loading = false,
  error,
  onRefresh,
  refreshing = false,
  children,
  className = '',
  headerActions,
  size = 'default',
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
}) => {
  const { isMobile } = useBreakpoint();

  const widgetClass = `dashboard-widget dashboard-widget--${size} ${className}`.trim();

  const headerActionsComponent = (
    <Space size="small">
      {headerActions}
      {onRefresh && (
        <Button
          type="text"
          icon={<ReloadOutlined />}
          onClick={onRefresh}
          loading={refreshing}
          size={isMobile ? 'small' : 'middle'}
          title={refreshing ? 'Đang làm mới...' : 'Làm mới dữ liệu'}
          aria-label={refreshing ? 'Đang làm mới dữ liệu' : 'Làm mới dữ liệu widget'}
        />
      )}
      {!isMobile && (
        <Button
          type="text"
          icon={<MoreOutlined />}
          size="middle"
          title="Tùy chọn khác"
          aria-label="Mở menu tùy chọn widget"
        />
      )}
    </Space>
  );

  if (loading) {
    return (
      <Card
        className={`${widgetClass} dashboard-widget--loading`}
        size={isMobile ? 'small' : 'default'}
        role="region"
        aria-label={ariaLabel || `${title} widget đang tải`}
      >
        <DashboardSkeleton type="widget" loading={true} />
      </Card>
    );
  }

  return (
    <Card
      className={widgetClass}
      title={
        <div className="dashboard-widget__header-content">
          {icon && (
            <div className="dashboard-widget__icon" aria-hidden="true">
              {icon}
            </div>
          )}
          <div className="dashboard-widget__title-section">
            {title && (
              <Title 
                level={isMobile ? 5 : 4}
                className="dashboard-widget__title"
                style={{ margin: 0 }}
              >
                {title}
              </Title>
            )}
            {subtitle && (
              <Text 
                className="dashboard-widget__subtitle"
                type="secondary"
              >
                {subtitle}
              </Text>
            )}
          </div>
        </div>
      }
      extra={headerActionsComponent}
      size={isMobile ? 'small' : 'default'}
      hoverable
      role="region"
      aria-label={ariaLabel || `${title || 'Widget'} dashboard`}
      aria-describedby={ariaDescribedBy}
    >
      {error ? (
        <Alert
          message="Lỗi tải dữ liệu"
          description={error}
          type="error"
          showIcon
          action={
            onRefresh && (
              <Button 
                size="small" 
                onClick={onRefresh}
                loading={refreshing}
              >
                Thử lại
              </Button>
            )
          }
          className="dashboard-widget__error"
          role="alert"
          aria-live="polite"
        />
      ) : (
        <div 
          className="dashboard-widget__content"
          role="main"
          aria-label={`${title || 'Widget'} content`}
        >
          {refreshing ? (
            <Spin 
              spinning={refreshing}
              tip="Đang cập nhật..."
              size={isMobile ? 'small' : 'default'}
            >
              <div style={{ minHeight: '100px' }}>
                {children}
              </div>
            </Spin>
          ) : (
            children
          )}
        </div>
      )}
    </Card>
  );
};

export default DashboardWidget;