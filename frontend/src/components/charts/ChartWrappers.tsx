import { Typography } from 'antd';
import React, { useEffect, useRef } from 'react';

const { Text } = Typography;

// Enhanced chart components with better data visualization
const generateBars = (data: any[], maxValue: number) => {
  return data.map((item, index) => {
    const height = (item.revenue / maxValue) * 200;
    return (
      <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        <div style={{ 
          width: 30,
          height: height || 20,
          backgroundColor: '#1890ff',
          borderRadius: '2px 2px 0 0',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          color: 'white',
          fontSize: 10,
          fontWeight: 600
        }}>
          {item.orders}
        </div>
        <div style={{ fontSize: 12, fontWeight: 600 }}>
          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.revenue)}
        </div>
        <div style={{ fontSize: 11, color: '#666' }}>{item.date}</div>
      </div>
    );
  });
};

// DualAxes Chart Wrapper - Enhanced with functional charts
export const DualAxes: React.FC<any> = (props) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const data = props.data || [];
  const maxRevenue = Math.max(...data.map((d: any) => d.revenue));
  const maxOrders = Math.max(...data.map((d: any) => d.orders));

  useEffect(() => {
    if (chartRef.current) {
      // Chart initialization would go here in production
    }
  }, [props, chartRef]);

  return (
    <div className="chart-wrapper" style={{ height: props.height || 300 }}>
      <div ref={chartRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
        <div style={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          background: '#fff',
          borderRadius: '4px',
          padding: '20px',
          border: '1px solid #e8e8e8'
        }}>
          <div style={{ marginBottom: 20 }}>
            <Text strong style={{ fontSize: 16, color: '#1890ff' }}>Biểu đồ doanh thu & đơn hàng</Text>
            <div style={{ display: 'flex', gap: 20, marginTop: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 12, height: 12, backgroundColor: '#1890ff', borderRadius: 2 }}></div>
                <Text type="secondary">Doanh thu</Text>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 12, height: 12, backgroundColor: '#f5222d', borderRadius: 2 }}></div>
                <Text type="secondary">Số đơn</Text>
              </div>
            </div>
          </div>
          
          <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: 20, justifyContent: 'center' }}>
            {data.length > 0 ? generateBars(data, maxRevenue) : (
              <div style={{ textAlign: 'center', color: '#999' }}>
                <Text type="secondary">Không có dữ liệu hiển thị</Text>
              </div>
            )}
          </div>
          
          <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#666' }}>
            <span>Tổng doanh thu: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(data.reduce((sum: number, item: any) => sum + item.revenue, 0))}</span>
            <span>Tổng đơn hàng: {data.reduce((sum: number, item: any) => sum + item.orders, 0)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Pie Chart Wrapper - Enhanced with visual pie representation
export const Pie: React.FC<any> = (props) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const data = props.data || [];
  const total = data.reduce((sum: number, item: any) => sum + item.value, 0);
  const colors = ['#1890ff', '#52c41a', '#fa8c16', '#722ed1', '#f5222d'];

  useEffect(() => {
    if (chartRef.current) {
      // Chart initialization would go here in production
    }
  }, [props, chartRef]);

  const generatePieSegments = () => {
    if (!data.length) return null;
    
    let cumulativePercentage = 0;
    const radius = 80;
    const centerX = 120;
    const centerY = 120;
    
    return data.map((item: any, index: number) => {
      const percentage = (item.value / total) * 100;
      const startAngle = (cumulativePercentage / 100) * 360;
      const endAngle = ((cumulativePercentage + percentage) / 100) * 360;
      
      const x1 = centerX + radius * Math.cos((startAngle * Math.PI) / 180);
      const y1 = centerY + radius * Math.sin((startAngle * Math.PI) / 180);
      const x2 = centerX + radius * Math.cos((endAngle * Math.PI) / 180);
      const y2 = centerY + radius * Math.sin((endAngle * Math.PI) / 180);
      
      const largeArcFlag = percentage > 50 ? 1 : 0;
      
      const pathData = [
        `M ${centerX} ${centerY}`,
        `L ${x1} ${y1}`,
        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
        'Z'
      ].join(' ');
      
      cumulativePercentage += percentage;
      
      return (
        <path
          key={index}
          d={pathData}
          fill={colors[index % colors.length]}
          stroke="#fff"
          strokeWidth="2"
        />
      );
    });
  };

  return (
    <div className="chart-wrapper" style={{ height: props.height || 300 }}>
      <div ref={chartRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
        <div style={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#fff',
          borderRadius: '4px',
          padding: '20px',
          border: '1px solid #e8e8e8'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 40 }}>
            <div>
              <svg width="240" height="240" viewBox="0 0 240 240">
                {generatePieSegments()}
                <circle cx="120" cy="120" r="40" fill="#fff" stroke="#e8e8e8" strokeWidth="2" />
                <text x="120" y="120" textAnchor="middle" dy="0.35em" fontSize="14" fontWeight="600" fill="#1890ff">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(total)}
                </text>
              </svg>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {data.map((item: any, index: number) => {
                const percentage = ((item.value / total) * 100).toFixed(1);
                return (
                  <div key={index} style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '4px 8px',
                    borderRadius: 4,
                    backgroundColor: `${colors[index % colors.length]}10`
                  }}>
                    <div style={{ 
                      width: 12,
                      height: 12, 
                      borderRadius: '50%',
                      background: colors[index % colors.length]
                    }}></div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{item.type}</div>
                      <div style={{ fontSize: 12, color: '#666' }}>
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.value)} ({percentage}%)
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Line Chart Wrapper
export const Line: React.FC<any> = (props) => {
  const chartRef = useRef<HTMLDivElement>(null);

  return (
    <div className="chart-wrapper" style={{ height: props.height || 300 }}>
      <div ref={chartRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
        <div style={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f5f5f5',
          borderRadius: '4px',
        }}>
          <Text type="secondary">Biểu đồ sẽ được hiển thị ở đây</Text>
        </div>
      </div>
    </div>
  );
};

// Column Chart Wrapper
export const Column: React.FC<any> = (props) => {
  const chartRef = useRef<HTMLDivElement>(null);

  return (
    <div className="chart-wrapper" style={{ height: props.height || 300 }}>
      <div ref={chartRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
        <div style={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f5f5f5',
          borderRadius: '4px',
        }}>
          <Text type="secondary">Biểu đồ sẽ được hiển thị ở đây</Text>
        </div>
      </div>
    </div>
  );
}; 