import React from 'react';
import { Row, Col } from 'antd';
import { useBreakpoint } from '../../../hooks/useMediaQuery';
import { DashboardGridProps } from '../types';
import './DashboardGrid.css';

const DashboardGrid: React.FC<DashboardGridProps> = ({
  children,
  spacing = [16, 16],
  responsive = true,
  className = '',
  'aria-label': ariaLabel,
}) => {
  const { isMobile, isTablet } = useBreakpoint();

  const getResponsiveSpacing = () => {
    if (!responsive) return spacing;
    
    if (isMobile) {
      return Array.isArray(spacing) ? [Math.max(8, spacing[0] / 2), Math.max(8, spacing[1] / 2)] : Math.max(8, spacing / 2);
    }
    
    if (isTablet) {
      return Array.isArray(spacing) ? [Math.max(12, spacing[0] * 0.75), Math.max(12, spacing[1] * 0.75)] : Math.max(12, spacing * 0.75);
    }
    
    return spacing;
  };

  const gridClass = `dashboard-grid ${className}`.trim();

  return (
    <div 
      className={gridClass}
      role="grid"
      aria-label={ariaLabel || "Dashboard content grid"}
    >
      <Row 
        gutter={getResponsiveSpacing()}
        className="dashboard-grid__row"
      >
        {React.Children.map(children, (child, index) => {
          if (!React.isValidElement(child)) return child;
          
          // Extract responsive props from child
          const { xs = 24, sm = 12, md = 8, lg = 6, xl = 6, xxl = 4, ...otherProps } = child.props;
          
          return (
            <Col
              key={index}
              xs={xs}
              sm={sm}
              md={md}
              lg={lg}
              xl={xl}
              xxl={xxl}
              className="dashboard-grid__col"
              role="gridcell"
            >
              {React.cloneElement(child, otherProps)}
            </Col>
          );
        })}
      </Row>
    </div>
  );
};

export default DashboardGrid;