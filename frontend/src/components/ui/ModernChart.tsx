/**
 * Modern Chart Component for Dashboard Analytics
 * Fixes: Basic chart components, poor data visualization
 * Implements: Interactive charts, multiple chart types, responsive design
 */

import React, { useState, useEffect, useRef } from 'react';
import { Card, Select, Space, Typography, Tooltip, Button, Spin } from 'antd';
import { 
  LineChartOutlined, 
  BarChartOutlined, 
  PieChartOutlined,
  AreaChartOutlined,
  FullscreenOutlined,
  DownloadOutlined,
  ReloadOutlined
} from '@ant-design/icons';

const { Option } = Select;
const { Title, Text } = Typography;

export interface ChartDataPoint {
  x: string | number;
  y: number;
  label?: string;
  color?: string;
  category?: string;
}

export interface ChartSeries {
  name: string;
  data: ChartDataPoint[];
  color?: string;
  type?: 'line' | 'bar' | 'area';
}

export interface ModernChartProps {
  type: 'line' | 'bar' | 'pie' | 'area' | 'donut' | 'scatter';
  data: ChartSeries[];
  title?: string;
  subtitle?: string;
  height?: number;
  width?: string;
  loading?: boolean;
  interactive?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  showGrid?: boolean;
  showAxes?: boolean;
  colors?: string[];
  gradient?: boolean;
  animation?: boolean;
  responsive?: boolean;
  theme?: 'light' | 'dark';
  onDataPointClick?: (point: ChartDataPoint, series: ChartSeries) => void;
  onExport?: (format: 'png' | 'svg' | 'pdf') => void;
  onRefresh?: () => void;
  customOptions?: Record<string, any>;
}

export const ModernChart: React.FC<ModernChartProps> = ({
  type,
  data,
  title,
  subtitle,
  height = 300,
  width = '100%',
  loading = false,
  interactive = true,
  showLegend = true,
  showTooltip = true,
  showGrid = true,
  showAxes = true,
  colors = ['#1890ff', '#52c41a', '#faad14', '#ff4d4f', '#722ed1', '#eb2f96'],
  gradient = false,
  animation = true,
  responsive = true,
  theme = 'light',
  onDataPointClick,
  onExport,
  onRefresh,
  customOptions = {}
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const [chartType, setChartType] = useState(type);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState<ChartDataPoint | null>(null);

  // Mock chart rendering (in real implementation, use Chart.js, D3, or Recharts)
  const renderChart = () => {
    if (!data || data.length === 0) {
      return <div className="chart-no-data">No data available</div>;
    }

    // Create SVG elements based on chart type
    const svgWidth = 400;
    const svgHeight = height - 60; // Account for padding
    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    const chartWidth = svgWidth - margin.left - margin.right;
    const chartHeight = svgHeight - margin.top - margin.bottom;

    // Process data for rendering
    const allPoints = data.flatMap(series => series.data);
    const maxY = Math.max(...allPoints.map(p => p.y));
    const minY = Math.min(...allPoints.map(p => p.y));
    
    const scaleY = (value: number) => {
      return chartHeight - ((value - minY) / (maxY - minY)) * chartHeight;
    };

    const scaleX = (index: number, total: number) => {
      return (index / (total - 1)) * chartWidth;
    };

    const renderLineChart = () => {
      return data.map((series, seriesIndex) => {
        const color = series.color || colors[seriesIndex % colors.length];
        const points = series.data.map((point, index) => ({
          x: scaleX(index, series.data.length),
          y: scaleY(point.y),
          data: point
        }));

        const pathData = points.map((point, index) => 
          `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
        ).join(' ');

        return (
          <g key={series.name}>
            <path
              d={pathData}
              stroke={color}
              strokeWidth="2"
              fill="none"
              className="chart-line"
            />
            {points.map((point, index) => (
              <circle
                key={index}
                cx={point.x}
                cy={point.y}
                r="4"
                fill={color}
                className="chart-point"
                onClick={() => onDataPointClick?.(point.data, series)}
                onMouseEnter={() => setHoveredPoint(point.data)}
                onMouseLeave={() => setHoveredPoint(null)}
              />
            ))}
          </g>
        );
      });
    };

    const renderBarChart = () => {
      const barWidth = chartWidth / (data[0]?.data.length || 1) * 0.8;
      const barSpacing = chartWidth / (data[0]?.data.length || 1) * 0.2;

      return data.map((series, seriesIndex) => {
        const color = series.color || colors[seriesIndex % colors.length];
        return series.data.map((point, index) => {
          const barHeight = ((point.y - minY) / (maxY - minY)) * chartHeight;
          const x = index * (barWidth + barSpacing) + seriesIndex * (barWidth / data.length);
          const y = chartHeight - barHeight;

          return (
            <rect
              key={`${series.name}-${index}`}
              x={x}
              y={y}
              width={barWidth / data.length}
              height={barHeight}
              fill={gradient ? `url(#gradient-${seriesIndex})` : color}
              className="chart-bar"
              onClick={() => onDataPointClick?.(point, series)}
              onMouseEnter={() => setHoveredPoint(point)}
              onMouseLeave={() => setHoveredPoint(null)}
            />
          );
        });
      });
    };

    const renderPieChart = () => {
      const centerX = chartWidth / 2;
      const centerY = chartHeight / 2;
      const radius = Math.min(chartWidth, chartHeight) / 2 - 20;
      
      const total = data[0]?.data.reduce((sum, point) => sum + point.y, 0) || 1;
      let currentAngle = 0;

      return data[0]?.data.map((point, index) => {
        const color = colors[index % colors.length];
        const angle = (point.y / total) * 2 * Math.PI;
        const startAngle = currentAngle;
        const endAngle = currentAngle + angle;
        
        const x1 = centerX + radius * Math.cos(startAngle);
        const y1 = centerY + radius * Math.sin(startAngle);
        const x2 = centerX + radius * Math.cos(endAngle);
        const y2 = centerY + radius * Math.sin(endAngle);
        
        const largeArc = angle > Math.PI ? 1 : 0;
        const pathData = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
        
        currentAngle += angle;
        
        return (
          <path
            key={index}
            d={pathData}
            fill={color}
            className="chart-pie-slice"
            onClick={() => onDataPointClick?.(point, data[0])}
            onMouseEnter={() => setHoveredPoint(point)}
            onMouseLeave={() => setHoveredPoint(null)}
          />
        );
      });
    };

    const renderGradients = () => {
      return (
        <defs>
          {data.map((series, index) => (
            <linearGradient
              key={index}
              id={`gradient-${index}`}
              x1="0%"
              y1="0%"
              x2="0%"
              y2="100%"
            >
              <stop offset="0%" stopColor={series.color || colors[index]} stopOpacity="0.8" />
              <stop offset="100%" stopColor={series.color || colors[index]} stopOpacity="0.1" />
            </linearGradient>
          ))}
        </defs>
      );
    };

    const renderGrid = () => {
      if (!showGrid) return null;
      
      const gridLines = [];
      const gridColor = theme === 'dark' ? '#434343' : '#f0f0f0';
      
      // Horizontal grid lines
      for (let i = 0; i <= 5; i++) {
        const y = (chartHeight / 5) * i;
        gridLines.push(
          <line
            key={`h-${i}`}
            x1={0}
            y1={y}
            x2={chartWidth}
            y2={y}
            stroke={gridColor}
            strokeWidth="1"
          />
        );
      }
      
      // Vertical grid lines
      for (let i = 0; i <= 5; i++) {
        const x = (chartWidth / 5) * i;
        gridLines.push(
          <line
            key={`v-${i}`}
            x1={x}
            y1={0}
            x2={x}
            y2={chartHeight}
            stroke={gridColor}
            strokeWidth="1"
          />
        );
      }
      
      return <g className="chart-grid">{gridLines}</g>;
    };

    const renderAxes = () => {
      if (!showAxes) return null;
      
      const axisColor = theme === 'dark' ? '#8c8c8c' : '#d9d9d9';
      
      return (
        <g className="chart-axes">
          {/* X-axis */}
          <line
            x1={0}
            y1={chartHeight}
            x2={chartWidth}
            y2={chartHeight}
            stroke={axisColor}
            strokeWidth="1"
          />
          {/* Y-axis */}
          <line
            x1={0}
            y1={0}
            x2={0}
            y2={chartHeight}
            stroke={axisColor}
            strokeWidth="1"
          />
        </g>
      );
    };

    return (
      <div className="chart-container">
        <svg
          width={svgWidth}
          height={svgHeight}
          className={`chart-svg ${theme === 'dark' ? 'dark-theme' : ''}`}
        >
          {gradient && renderGradients()}
          {renderGrid()}
          {renderAxes()}
          <g transform={`translate(${margin.left}, ${margin.top})`}>
            {chartType === 'line' && renderLineChart()}
            {chartType === 'bar' && renderBarChart()}
            {chartType === 'pie' && renderPieChart()}
            {chartType === 'area' && renderLineChart()}
          </g>
        </svg>
        
        {/* Tooltip */}
        {showTooltip && hoveredPoint && (
          <div className="chart-tooltip">
            <div className="tooltip-label">{hoveredPoint.label || hoveredPoint.x}</div>
            <div className="tooltip-value">{hoveredPoint.y}</div>
          </div>
        )}
      </div>
    );
  };

  const renderLegend = () => {
    if (!showLegend) return null;
    
    return (
      <div className="chart-legend">
        {data.map((series, index) => (
          <div key={series.name} className="legend-item">
            <div 
              className="legend-color"
              style={{ backgroundColor: series.color || colors[index % colors.length] }}
            />
            <span className="legend-label">{series.name}</span>
          </div>
        ))}
      </div>
    );
  };

  const chartTypeOptions = [
    { value: 'line', label: 'Line Chart', icon: <LineChartOutlined /> },
    { value: 'bar', label: 'Bar Chart', icon: <BarChartOutlined /> },
    { value: 'pie', label: 'Pie Chart', icon: <PieChartOutlined /> },
    { value: 'area', label: 'Area Chart', icon: <AreaChartOutlined /> }
  ];

  return (
    <Card
      className="modern-chart-card"
      title={
        <div className="chart-header">
          <div className="chart-title-section">
            {title && <Title level={4}>{title}</Title>}
            {subtitle && <Text type="secondary">{subtitle}</Text>}
          </div>
          {interactive && (
            <div className="chart-controls">
              <Select
                value={chartType}
                onChange={setChartType}
                size="small"
                style={{ width: 120 }}
              >
                {chartTypeOptions.map(option => (
                  <Option key={option.value} value={option.value}>
                    <Space>
                      {option.icon}
                      {option.label}
                    </Space>
                  </Option>
                ))}
              </Select>
              <Space>
                {onRefresh && (
                  <Tooltip title="Refresh">
                    <Button 
                      type="text" 
                      icon={<ReloadOutlined />} 
                      onClick={onRefresh}
                      size="small"
                    />
                  </Tooltip>
                )}
                {onExport && (
                  <Tooltip title="Export">
                    <Button 
                      type="text" 
                      icon={<DownloadOutlined />} 
                      onClick={() => onExport('png')}
                      size="small"
                    />
                  </Tooltip>
                )}
                <Tooltip title="Fullscreen">
                  <Button 
                    type="text" 
                    icon={<FullscreenOutlined />} 
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    size="small"
                  />
                </Tooltip>
              </Space>
            </div>
          )}
        </div>
      }
      style={{ width }}
      bodyStyle={{ padding: '16px' }}
    >
      <Spin spinning={loading}>
        <div 
          ref={chartRef}
          className={`chart-wrapper ${isFullscreen ? 'fullscreen' : ''}`}
          style={{ height: height }}
        >
          {renderChart()}
          {renderLegend()}
        </div>
      </Spin>

      {/* Chart Styles */}
      <style jsx>{`
        .modern-chart-card {
          border-radius: 12px;
          overflow: hidden;
        }

        .chart-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          width: 100%;
        }

        .chart-title-section {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .chart-controls {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .chart-wrapper {
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .chart-wrapper.fullscreen {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: white;
          z-index: 1000;
          padding: 24px;
        }

        .chart-container {
          position: relative;
          width: 100%;
          height: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .chart-svg {
          max-width: 100%;
          height: auto;
        }

        .chart-no-data {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 200px;
          color: #8c8c8c;
          font-size: 16px;
        }

        .chart-line {
          transition: stroke-width 0.2s ease;
        }

        .chart-line:hover {
          stroke-width: 3;
        }

        .chart-point {
          transition: all 0.2s ease;
          cursor: pointer;
        }

        .chart-point:hover {
          r: 6;
          filter: drop-shadow(0 0 4px rgba(24, 144, 255, 0.5));
        }

        .chart-bar {
          transition: all 0.2s ease;
          cursor: pointer;
        }

        .chart-bar:hover {
          filter: brightness(1.1);
          transform: scaleY(1.05);
        }

        .chart-pie-slice {
          transition: all 0.2s ease;
          cursor: pointer;
        }

        .chart-pie-slice:hover {
          filter: brightness(1.1);
          transform: scale(1.05);
        }

        .chart-tooltip {
          position: absolute;
          background: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 8px 12px;
          border-radius: 4px;
          font-size: 12px;
          pointer-events: none;
          z-index: 100;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        }

        .tooltip-label {
          font-weight: 500;
          margin-bottom: 2px;
        }

        .tooltip-value {
          font-size: 14px;
          font-weight: 600;
        }

        .chart-legend {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          justify-content: center;
          margin-top: 16px;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .legend-color {
          width: 12px;
          height: 12px;
          border-radius: 2px;
        }

        .legend-label {
          font-size: 12px;
          color: #595959;
        }

        .chart-grid {
          opacity: 0.5;
        }

        .chart-axes {
          opacity: 0.7;
        }

        /* Dark theme */
        .dark-theme .chart-no-data {
          color: #8c8c8c;
        }

        .dark-theme .legend-label {
          color: #d9d9d9;
        }

        /* Responsive design */
        @media (max-width: 768px) {
          .chart-header {
            flex-direction: column;
            gap: 12px;
          }

          .chart-controls {
            width: 100%;
            justify-content: flex-end;
          }

          .chart-legend {
            flex-direction: column;
            align-items: flex-start;
          }
        }

        /* Animation */
        ${animation ? `
          .chart-line,
          .chart-bar,
          .chart-pie-slice {
            animation: chartFadeIn 0.8s ease-out;
          }

          @keyframes chartFadeIn {
            from {
              opacity: 0;
              transform: scale(0.8);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
        ` : ''}

        /* Accessibility */
        .chart-point:focus,
        .chart-bar:focus,
        .chart-pie-slice:focus {
          outline: 2px solid #1890ff;
          outline-offset: 2px;
        }
      `}</style>
    </Card>
  );
};

export default ModernChart;