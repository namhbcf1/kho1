// Performance Optimizer Component for Vietnamese POS System
import React, { memo, useMemo, useCallback, lazy, Suspense } from 'react';
import { Spin, Alert } from 'antd';
import { 
  useVietnameseVirtualList,
  useVietnameseSearch,
  useVietnameseImageLoader,
  useVietnameseNumberFormatter,
  useVietnameseDateFormatter,
  useVietnamesePerformanceMonitor
} from '../../hooks/usePerformance';

// Lazy load heavy components
const ChartComponent = lazy(() => import('@ant-design/plots').then(module => ({ default: module.Line })));
const DataTableComponent = lazy(() => import('antd').then(module => ({ default: module.Table })));

// Vietnamese Virtual List Component
interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
}

export const VietnameseVirtualList = memo(<T,>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  className = ''
}: VirtualListProps<T>) => {
  const {
    startIndex,
    endIndex,
    visibleItems,
    totalHeight,
    offsetY,
    handleScroll,
    isScrolling
  } = useVietnameseVirtualList(items, itemHeight, containerHeight);

  const { measureRenderTime } = useVietnamesePerformanceMonitor();

  const itemElements = useMemo(() => {
    const endMeasure = measureRenderTime('VietnameseVirtualList');
    
    const elements = visibleItems.map((item, index) => (
      <div
        key={startIndex + index}
        style={{
          height: itemHeight,
          position: 'absolute',
          top: (startIndex + index) * itemHeight,
          left: 0,
          right: 0,
        }}
      >
        {renderItem(item, startIndex + index)}
      </div>
    ));
    
    endMeasure();
    return elements;
  }, [visibleItems, startIndex, renderItem, itemHeight, measureRenderTime]);

  return (
    <div
      className={`vietnamese-virtual-list ${className} ${isScrolling ? 'scrolling' : ''}`}
      style={{
        height: containerHeight,
        overflow: 'auto',
        position: 'relative',
      }}
      onScroll={handleScroll}
    >
      <div
        style={{
          height: totalHeight,
          position: 'relative',
        }}
      >
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          {itemElements}
        </div>
      </div>
      
      {isScrolling && (
        <div className="absolute top-2 right-2 bg-blue-500 text-white px-2 py-1 rounded text-xs">
          Đang cuộn...
        </div>
      )}
    </div>
  );
});

// Vietnamese Search Component with Performance
interface SearchableListProps<T> {
  items: T[];
  searchKeys: (keyof T)[];
  renderItem: (item: T, index: number) => React.ReactNode;
  placeholder?: string;
  className?: string;
}

export const VietnameseSearchableList = memo(<T,>({
  items,
  searchKeys,
  renderItem,
  placeholder = 'Tìm kiếm...',
  className = ''
}: SearchableListProps<T>) => {
  const {
    searchTerm,
    setSearchTerm,
    filteredItems,
    isSearching
  } = useVietnameseSearch(items, searchKeys, 300);

  const { formatNumber } = useVietnameseNumberFormatter();

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, [setSearchTerm]);

  return (
    <div className={`vietnamese-searchable-list ${className}`}>
      <div className="search-header mb-4">
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder={placeholder}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent vietnamese-text"
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <Spin size="small" />
            </div>
          )}
        </div>
        
        <div className="mt-2 text-sm text-gray-600 vietnamese-text">
          {searchTerm ? (
            <>Tìm thấy {formatNumber(filteredItems.length)} / {formatNumber(items.length)} kết quả</>
          ) : (
            <>Tổng cộng {formatNumber(items.length)} mục</>
          )}
        </div>
      </div>

      <div className="search-results">
        {filteredItems.length > 0 ? (
          <VietnameseVirtualList
            items={filteredItems}
            itemHeight={80}
            containerHeight={400}
            renderItem={renderItem}
          />
        ) : searchTerm ? (
          <div className="text-center py-8 text-gray-500 vietnamese-text">
            Không tìm thấy kết quả cho "{searchTerm}"
          </div>
        ) : null}
      </div>
    </div>
  );
});

// Vietnamese Image Component with Lazy Loading
interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  fallback?: string;
  placeholder?: React.ReactNode;
}

export const VietnameseOptimizedImage = memo(({
  src,
  alt,
  className = '',
  fallback = '/images/placeholder.png',
  placeholder = <div className="bg-gray-200 animate-pulse" />
}: OptimizedImageProps) => {
  const { registerImage } = useVietnameseImageLoader();
  const [loaded, setLoaded] = React.useState(false);
  const [error, setError] = React.useState(false);
  const imgRef = React.useRef<HTMLImageElement>(null);

  React.useEffect(() => {
    if (imgRef.current) {
      registerImage(imgRef.current, src);
    }
  }, [src, registerImage]);

  const handleLoad = useCallback(() => {
    setLoaded(true);
  }, []);

  const handleError = useCallback(() => {
    setError(true);
    setLoaded(true);
  }, []);

  return (
    <div className={`vietnamese-optimized-image ${className}`}>
      {!loaded && placeholder}
      <img
        ref={imgRef}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        className={`${loaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300 ${className}`}
        style={{ display: loaded ? 'block' : 'none' }}
      />
      {error && fallback && (
        <img
          src={fallback}
          alt={alt}
          className={className}
        />
      )}
    </div>
  );
});

// Vietnamese Currency Display Component
interface CurrencyDisplayProps {
  amount: number;
  className?: string;
  showSymbol?: boolean;
  precision?: number;
}

export const VietnameseCurrencyDisplay = memo(({
  amount,
  className = '',
  showSymbol = true,
  precision = 0
}: CurrencyDisplayProps) => {
  const { formatCurrency } = useVietnameseNumberFormatter();

  const formattedAmount = useMemo(() => {
    if (showSymbol) {
      return formatCurrency(amount);
    } else {
      return new Intl.NumberFormat('vi-VN', {
        minimumFractionDigits: precision,
        maximumFractionDigits: precision,
      }).format(amount);
    }
  }, [amount, showSymbol, precision, formatCurrency]);

  return (
    <span className={`vietnamese-currency-display vnd-currency ${className}`}>
      {formattedAmount}
    </span>
  );
});

// Vietnamese Date Display Component
interface DateDisplayProps {
  date: Date;
  format?: 'date' | 'time' | 'datetime' | 'relative';
  className?: string;
}

export const VietnameseDateDisplay = memo(({
  date,
  format = 'datetime',
  className = ''
}: DateDisplayProps) => {
  const { formatDate, formatTime, formatDateTime, formatRelative } = useVietnameseDateFormatter();

  const formattedDate = useMemo(() => {
    switch (format) {
      case 'date':
        return formatDate(date);
      case 'time':
        return formatTime(date);
      case 'datetime':
        return formatDateTime(date);
      case 'relative':
        return formatRelative(date);
      default:
        return formatDateTime(date);
    }
  }, [date, format, formatDate, formatTime, formatDateTime, formatRelative]);

  return (
    <span className={`vietnamese-date-display vn-datetime ${className}`} title={formatDateTime(date)}>
      {formattedDate}
    </span>
  );
});

// Performance-optimized Chart Component
interface ChartProps {
  data: any[];
  config: any;
  type?: 'line' | 'column' | 'pie';
  height?: number;
  loading?: boolean;
}

export const VietnameseChart = memo(({
  data,
  config,
  type = 'line',
  height = 300,
  loading = false
}: ChartProps) => {
  const { measureRenderTime } = useVietnamesePerformanceMonitor();

  const chartConfig = useMemo(() => {
    const endMeasure = measureRenderTime('VietnameseChart');
    
    const optimizedConfig = {
      ...config,
      height,
      data,
      autoFit: true,
      renderer: 'canvas', // Use canvas for better performance
      animation: {
        appear: {
          animation: 'fade-in',
          duration: 500,
        },
      },
      tooltip: {
        formatter: (datum: any) => {
          if (datum.value && typeof datum.value === 'number') {
            return {
              name: datum.name || 'Giá trị',
              value: new Intl.NumberFormat('vi-VN').format(datum.value),
            };
          }
          return datum;
        },
      },
    };
    
    endMeasure();
    return optimizedConfig;
  }, [config, height, data, measureRenderTime]);

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <Spin size="large" />
        <span className="ml-2 vietnamese-text">Đang tải biểu đồ...</span>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <Alert
          message="Không có dữ liệu"
          description="Chưa có dữ liệu để hiển thị biểu đồ"
          type="info"
          showIcon
        />
      </div>
    );
  }

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center" style={{ height }}>
        <Spin size="large" />
        <span className="ml-2 vietnamese-text">Đang tải biểu đồ...</span>
      </div>
    }>
      <div className="vietnamese-chart">
        <ChartComponent {...chartConfig} />
      </div>
    </Suspense>
  );
});

// Performance-optimized Data Table
interface DataTableProps {
  data: any[];
  columns: any[];
  loading?: boolean;
  pagination?: boolean;
  pageSize?: number;
}

export const VietnameseDataTable = memo(({
  data,
  columns,
  loading = false,
  pagination = true,
  pageSize = 20
}: DataTableProps) => {
  const { measureRenderTime } = useVietnamesePerformanceMonitor();
  const { formatNumber } = useVietnameseNumberFormatter();

  const optimizedColumns = useMemo(() => {
    const endMeasure = measureRenderTime('VietnameseDataTable');
    
    const cols = columns.map(col => ({
      ...col,
      sorter: col.sorter || ((a: any, b: any) => {
        const aVal = a[col.dataIndex];
        const bVal = b[col.dataIndex];
        
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return aVal.localeCompare(bVal, 'vi-VN');
        }
        
        return aVal - bVal;
      }),
    }));
    
    endMeasure();
    return cols;
  }, [columns, measureRenderTime]);

  const tableProps = useMemo(() => ({
    dataSource: data,
    columns: optimizedColumns,
    loading,
    pagination: pagination ? {
      pageSize,
      showSizeChanger: true,
      showQuickJumper: true,
      showTotal: (total: number, range: [number, number]) =>
        `${formatNumber(range[0])}-${formatNumber(range[1])} trong ${formatNumber(total)} mục`,
      pageSizeOptions: ['10', '20', '50', '100'],
    } : false,
    scroll: { x: 'max-content' },
    size: 'small' as const,
    locale: {
      filterConfirm: 'Lọc',
      filterReset: 'Xóa lọc',
      emptyText: 'Không có dữ liệu',
      selectAll: 'Chọn tất cả',
      selectInvert: 'Chọn ngược lại',
      sortTitle: 'Sắp xếp',
    },
  }), [data, optimizedColumns, loading, pagination, pageSize, formatNumber]);

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center p-8">
        <Spin size="large" />
        <span className="ml-2 vietnamese-text">Đang tải bảng dữ liệu...</span>
      </div>
    }>
      <div className="vietnamese-data-table">
        <DataTableComponent {...tableProps} />
      </div>
    </Suspense>
  );
});

// Export all components
export default {
  VietnameseVirtualList,
  VietnameseSearchableList,
  VietnameseOptimizedImage,
  VietnameseCurrencyDisplay,
  VietnameseDateDisplay,
  VietnameseChart,
  VietnameseDataTable,
};