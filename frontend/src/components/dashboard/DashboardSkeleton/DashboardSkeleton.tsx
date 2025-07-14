import React from 'react';
import { Skeleton, Card, Row, Col } from 'antd';
import { SkeletonProps } from '../types';
import './DashboardSkeleton.css';

interface DashboardSkeletonProps extends SkeletonProps {
  type?: 'kpi' | 'chart' | 'table' | 'stat' | 'widget';
  count?: number;
}

const DashboardSkeleton: React.FC<DashboardSkeletonProps> = ({
  loading = true,
  children,
  type = 'widget',
  count = 1,
  active = true,
}) => {
  if (!loading && children) {
    return <>{children}</>;
  }

  const renderKPISkeleton = () => (
    <Card className="dashboard-skeleton dashboard-skeleton--kpi" size="small">
      <div className="dashboard-skeleton__kpi-content">
        <div className="dashboard-skeleton__kpi-header">
          <Skeleton.Avatar size="small" shape="square" active={active} />
          <Skeleton.Input size="small" active={active} style={{ width: 100 }} />
        </div>
        <div className="dashboard-skeleton__kpi-value">
          <Skeleton.Input size="large" active={active} style={{ width: 120 }} />
        </div>
        <div className="dashboard-skeleton__kpi-change">
          <Skeleton.Input size="small" active={active} style={{ width: 60 }} />
        </div>
      </div>
    </Card>
  );

  const renderChartSkeleton = () => (
    <Card className="dashboard-skeleton dashboard-skeleton--chart">
      <div className="dashboard-skeleton__chart-header">
        <Skeleton.Input size="default" active={active} style={{ width: 150 }} />
        <Skeleton.Button size="small" active={active} />
      </div>
      <div className="dashboard-skeleton__chart-content">
        <div className="dashboard-skeleton__chart-placeholder">
          <div className="dashboard-skeleton__chart-bars">
            {[...Array(6)].map((_, i) => (
              <div 
                key={i} 
                className="dashboard-skeleton__chart-bar"
                style={{ 
                  height: `${Math.random() * 60 + 20}%`,
                  animationDelay: `${i * 0.1}s`
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </Card>
  );

  const renderTableSkeleton = () => (
    <Card className="dashboard-skeleton dashboard-skeleton--table">
      <div className="dashboard-skeleton__table-header">
        <Skeleton.Input size="default" active={active} style={{ width: 150 }} />
        <Skeleton.Button size="small" active={active} />
      </div>
      <div className="dashboard-skeleton__table-content">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="dashboard-skeleton__table-row">
            <Skeleton.Avatar size="small" active={active} />
            <Skeleton.Input size="small" active={active} style={{ width: '40%' }} />
            <Skeleton.Input size="small" active={active} style={{ width: '20%' }} />
            <Skeleton.Input size="small" active={active} style={{ width: '20%' }} />
          </div>
        ))}
      </div>
    </Card>
  );

  const renderStatSkeleton = () => (
    <Card className="dashboard-skeleton dashboard-skeleton--stat" size="small">
      <div className="dashboard-skeleton__stat-content">
        <Skeleton.Avatar size="default" shape="circle" active={active} />
        <div className="dashboard-skeleton__stat-details">
          <Skeleton.Input size="small" active={active} style={{ width: 80 }} />
          <Skeleton.Input size="large" active={active} style={{ width: 100 }} />
        </div>
      </div>
    </Card>
  );

  const renderWidgetSkeleton = () => (
    <Card className="dashboard-skeleton dashboard-skeleton--widget">
      <Skeleton 
        active={active}
        avatar={{ size: 'default' }}
        title={{ width: '50%' }}
        paragraph={{ rows: 3, width: ['100%', '80%', '60%'] }}
      />
    </Card>
  );

  const renderSkeleton = () => {
    switch (type) {
      case 'kpi':
        return renderKPISkeleton();
      case 'chart':
        return renderChartSkeleton();
      case 'table':
        return renderTableSkeleton();
      case 'stat':
        return renderStatSkeleton();
      default:
        return renderWidgetSkeleton();
    }
  };

  if (count === 1) {
    return renderSkeleton();
  }

  return (
    <Row gutter={[16, 16]}>
      {[...Array(count)].map((_, index) => (
        <Col key={index} xs={24} sm={12} md={8} lg={6}>
          {renderSkeleton()}
        </Col>
      ))}
    </Row>
  );
};

export default DashboardSkeleton;