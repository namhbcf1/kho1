import React, { useRef } from 'react';
import { Card, Button, Typography, Space, Alert } from 'antd';
import { ReloadOutlined, FullscreenOutlined, DownloadOutlined } from '@ant-design/icons';
import { ChartContainerProps } from '../types';
import { useBreakpoint } from '../../../hooks/useMediaQuery';
import DashboardSkeleton from '../DashboardSkeleton/DashboardSkeleton';
import './ChartContainer.css';

const { Title, Text } = Typography;

const ChartContainer: React.FC<ChartContainerProps> = ({
  title,
  children,
  loading = false,
  error,
  onRefresh,
  height = 300,
  className = '',
  headerActions,
  'aria-label': ariaLabel,
}) => {
  const { isMobile, isTablet } = useBreakpoint();
  const containerRef = useRef<HTMLDivElement>(null);

  const handleFullscreen = () => {
    if (containerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        containerRef.current.requestFullscreen();
      }
    }
  };

  const handleDownload = () => {
    // Implementation would depend on chart library
    console.log('Download chart data');
  };

  const getResponsiveHeight = () => {
    if (typeof height === 'string') return height;
    
    if (isMobile) {
      return Math.min(height, 250);
    }
    
    if (isTablet) {
      return Math.min(height, 280);
    }
    
    return height;
  };

  const cardClass = `chart-container ${className}`.trim();

  const headerActionsComponent = (
    <Space size="small">
      {headerActions}
      {onRefresh && (
        <Button
          type="text"
          icon={<ReloadOutlined />}
          onClick={onRefresh}
          size={isMobile ? 'small' : 'middle'}
          title="Làm mới dữ liệu"
          aria-label="Làm mới dữ liệu biểu đồ"
        />
      )}
      {!isMobile && (
        <>
          <Button
            type="text"
            icon={<FullscreenOutlined />}
            onClick={handleFullscreen}
            size="middle"
            title="Toàn màn hình"
            aria-label="Xem biểu đồ toàn màn hình"
          />
          <Button
            type="text"
            icon={<DownloadOutlined />}
            onClick={handleDownload}
            size="middle"
            title="Tải xuống"
            aria-label="Tải xuống dữ liệu biểu đồ"
          />
        </>
      )}
    </Space>
  );

  if (loading) {
    return (
      <Card
        className={cardClass}
        title={title}
        extra={headerActionsComponent}
        size={isMobile ? 'small' : 'default'}
      >
        <DashboardSkeleton type="chart" loading={true} />
      </Card>
    );
  }

  return (
    <Card
      ref={containerRef}
      className={cardClass}
      title={
        <Title 
          level={isMobile ? 5 : 4} 
          className="chart-container__title"
          style={{ margin: 0 }}
        >
          {title}
        </Title>
      }
      extra={headerActionsComponent}
      size={isMobile ? 'small' : 'default'}
      role="region"
      aria-label={ariaLabel || `${title} chart`}
    >
      {error ? (
        <Alert
          message="Lỗi tải dữ liệu"
          description={error}
          type="error"
          showIcon
          action={
            onRefresh && (
              <Button size="small" onClick={onRefresh}>
                Thử lại
              </Button>
            )
          }
          className="chart-container__error"
        />
      ) : (
        <div
          className="chart-container__content"
          style={{ 
            height: getResponsiveHeight(),
            minHeight: isMobile ? 200 : 250,
          }}
          role="img"
          aria-label={`${title} visualization`}
        >
          {children}
        </div>
      )}
    </Card>
  );
};

export default ChartContainer;