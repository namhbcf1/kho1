import {
    BarChartOutlined,
    DownloadOutlined,
    FileExcelOutlined,
    FilePdfOutlined,
    FilterOutlined,
    LineChartOutlined,
    PieChartOutlined,
    PrinterOutlined
} from '@ant-design/icons';
import {
    Alert,
    Button,
    Card,
    Col,
    DatePicker,
    Row,
    Select,
    Space,
    Table,
    Tabs,
    Tag,
    Typography
} from 'antd';
import dayjs from 'dayjs';
import React, { useState } from 'react';
import { BarChart, LineChart, PieChart } from '../../components/charts/ChartWrappers';
import { formatVND } from '../../utils/formatters/vietnameseCurrency';

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;

const ReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('sales');
  const [dateRange, setDateRange] = useState<[any, any]>([dayjs().subtract(30, 'day'), dayjs()]);
  const [exportLoading, setExportLoading] = useState(false);

  // Mock data for reports
  const salesData = {
    daily: [
      { date: '16/07', sales: 7800000, transactions: 34 },
      { date: '17/07', sales: 8200000, transactions: 38 },
      { date: '18/07', sales: 6500000, transactions: 29 },
      { date: '19/07', sales: 9100000, transactions: 42 },
      { date: '20/07', sales: 7600000, transactions: 35 },
      { date: '21/07', sales: 11200000, transactions: 51 },
      { date: '22/07', sales: 9800000, transactions: 44 }
    ],
    categoryData: [
      { name: 'Điện thoại', value: 42500000 },
      { name: 'Laptop', value: 38900000 },
      { name: 'Phụ kiện', value: 15600000 },
      { name: 'Tablet', value: 12400000 },
      { name: 'Đồng hồ', value: 8900000 }
    ],
    productTopSellers: [
      { id: 1, name: 'iPhone 15 Pro Max', category: 'Điện thoại', sales: 78900000, quantity: 3 },
      { id: 2, name: 'Samsung Galaxy S24', category: 'Điện thoại', sales: 62500000, quantity: 2 },
      { id: 3, name: 'MacBook Air M3', category: 'Laptop', sales: 59800000, quantity: 2 },
      { id: 4, name: 'AirPods Pro', category: 'Phụ kiện', sales: 24000000, quantity: 4 },
      { id: 5, name: 'iPad Pro 2024', category: 'Tablet', sales: 22800000, quantity: 1 }
    ]
  };

  const inventoryData = {
    stockStatus: [
      { name: 'Còn hàng', value: 68 },
      { name: 'Sắp hết', value: 22 },
      { name: 'Hết hàng', value: 10 }
    ],
    lowStockItems: [
      { id: 1, name: 'Samsung Galaxy S24', current: 3, minimum: 5, category: 'Điện thoại', supplier: 'Samsung Vietnam' },
      { id: 2, name: 'MacBook Air M3', current: 2, minimum: 5, category: 'Laptop', supplier: 'Apple Vietnam' },
      { id: 3, name: 'iPad Pro 2024', current: 4, minimum: 5, category: 'Tablet', supplier: 'Apple Vietnam' },
      { id: 4, name: 'Tai nghe Sony WH-1000XM5', current: 3, minimum: 5, category: 'Phụ kiện', supplier: 'Sony Vietnam' },
      { id: 5, name: 'Apple Watch Series 9', current: 2, minimum: 5, category: 'Đồng hồ', supplier: 'Apple Vietnam' }
    ],
    receivingHistory: [
      { id: 1, date: '15/07/2024', supplier: 'Apple Vietnam', items: 12, total: 156000000 },
      { id: 2, date: '12/07/2024', supplier: 'Samsung Vietnam', items: 8, total: 98000000 },
      { id: 3, date: '10/07/2024', supplier: 'Sony Vietnam', items: 15, total: 76500000 },
      { id: 4, date: '08/07/2024', supplier: 'LG Vietnam', items: 6, total: 42000000 },
      { id: 5, date: '05/07/2024', supplier: 'Xiaomi Vietnam', items: 10, total: 65000000 }
    ]
  };

  const customerData = {
    newCustomers: [
      { date: '16/07', count: 8 },
      { date: '17/07', count: 6 },
      { date: '18/07', count: 12 },
      { date: '19/07', count: 9 },
      { date: '20/07', count: 5 },
      { date: '21/07', count: 11 },
      { date: '22/07', count: 7 }
    ],
    customerSegmentation: [
      { name: 'VIP', value: 15 },
      { name: 'Thành viên', value: 45 },
      { name: 'Thường xuyên', value: 25 },
      { name: 'Mới', value: 15 }
    ],
    topCustomers: [
      { id: 1, name: 'Nguyễn Văn A', orders: 15, total: 45800000, lastPurchase: '21/07/2024', type: 'VIP' },
      { id: 2, name: 'Trần Thị B', orders: 12, total: 38600000, lastPurchase: '20/07/2024', type: 'VIP' },
      { id: 3, name: 'Lê Minh C', orders: 9, total: 29700000, lastPurchase: '19/07/2024', type: 'Thành viên' },
      { id: 4, name: 'Phạm Thu D', orders: 7, total: 22500000, lastPurchase: '18/07/2024', type: 'Thành viên' },
      { id: 5, name: 'Hoàng Văn E', orders: 5, total: 18900000, lastPurchase: '17/07/2024', type: 'Thường xuyên' }
    ]
  };

  const financeData = {
    revenueExpense: [
      { month: 'T1', revenue: 324500000, expense: 198000000 },
      { month: 'T2', revenue: 356800000, expense: 210500000 },
      { month: 'T3', revenue: 389200000, expense: 225600000 },
      { month: 'T4', revenue: 412600000, expense: 242300000 },
      { month: 'T5', revenue: 435900000, expense: 258700000 },
      { month: 'T6', revenue: 468500000, expense: 277500000 },
      { month: 'T7', revenue: 495700000, expense: 289800000 }
    ],
    expenseCategories: [
      { name: 'Nhập hàng', value: 185600000 },
      { name: 'Tiền thuê', value: 45000000 },
      { name: 'Lương nhân viên', value: 35000000 },
      { name: 'Marketing', value: 15000000 },
      { name: 'Tiện ích', value: 9200000 }
    ],
    taxReport: [
      { quarter: 'Q1', revenue: 1070500000, vat: 107050000, corporateTax: 53525000 },
      { quarter: 'Q2', revenue: 1317000000, vat: 131700000, corporateTax: 65850000 }
    ]
  };

  const handleDateRangeChange = (dates: any) => {
    setDateRange(dates);
  };

  const handleExportReport = (format: string) => {
    setExportLoading(true);
    // Simulating export process
    setTimeout(() => {
      setExportLoading(false);
    }, 1500);
  };

  const renderSalesReport = () => (
    <>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card title="Doanh thu theo ngày">
            <LineChart 
              data={salesData.daily} 
              xField="date"
              yField="sales"
              seriesField="sales"
              tooltip={{
                formatter: (data) => ({
                  name: 'Doanh thu',
                  value: formatVND(data.sales)
                })
              }}
              height={300}
            />
          </Card>
        </Col>
      </Row>
      
      <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
        <Col span={12}>
          <Card title="Doanh thu theo danh mục">
            <PieChart 
              data={salesData.categoryData} 
              angleField="value" 
              colorField="name"
              height={300}
              tooltip={{
                formatter: (data) => ({
                  name: data.name,
                  value: formatVND(data.value)
                })
              }}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Sản phẩm bán chạy">
            <Table
              dataSource={salesData.productTopSellers}
              pagination={false}
              rowKey="id"
              size="small"
              columns={[
                {
                  title: 'Sản phẩm',
                  dataIndex: 'name',
                  key: 'name',
                },
                {
                  title: 'Danh mục',
                  dataIndex: 'category',
                  key: 'category',
                },
                {
                  title: 'SL',
                  dataIndex: 'quantity',
                  key: 'quantity',
                  align: 'center'
                },
                {
                  title: 'Doanh thu',
                  dataIndex: 'sales',
                  key: 'sales',
                  render: (sales) => formatVND(sales),
                  align: 'right'
                }
              ]}
            />
          </Card>
        </Col>
      </Row>
    </>
  );

  const renderInventoryReport = () => (
    <>
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Card title="Tình trạng kho hàng">
            <PieChart 
              data={inventoryData.stockStatus} 
              angleField="value" 
              colorField="name"
              height={300}
              tooltip={{
                formatter: (data) => ({
                  name: data.name,
                  value: `${data.value}%`
                })
              }}
              color={['#52c41a', '#faad14', '#ff4d4f']}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Hàng sắp hết">
            <Table
              dataSource={inventoryData.lowStockItems}
              pagination={false}
              rowKey="id"
              size="small"
              columns={[
                {
                  title: 'Sản phẩm',
                  dataIndex: 'name',
                  key: 'name',
                },
                {
                  title: 'Danh mục',
                  dataIndex: 'category',
                  key: 'category',
                },
                {
                  title: 'Hiện tại',
                  dataIndex: 'current',
                  key: 'current',
                  align: 'center',
                  render: (current) => (
                    <Tag color="warning">{current}</Tag>
                  )
                },
                {
                  title: 'Tối thiểu',
                  dataIndex: 'minimum',
                  key: 'minimum',
                  align: 'center'
                }
              ]}
            />
          </Card>
        </Col>
      </Row>
      
      <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
        <Col span={24}>
          <Card title="Lịch sử nhập hàng">
            <Table
              dataSource={inventoryData.receivingHistory}
              pagination={false}
              rowKey="id"
              size="small"
              columns={[
                {
                  title: 'Ngày',
                  dataIndex: 'date',
                  key: 'date',
                  width: 120
                },
                {
                  title: 'Nhà cung cấp',
                  dataIndex: 'supplier',
                  key: 'supplier',
                },
                {
                  title: 'Số mặt hàng',
                  dataIndex: 'items',
                  key: 'items',
                  align: 'center',
                  width: 120
                },
                {
                  title: 'Tổng tiền',
                  dataIndex: 'total',
                  key: 'total',
                  render: (total) => formatVND(total),
                  align: 'right',
                  width: 150
                }
              ]}
            />
          </Card>
        </Col>
      </Row>
    </>
  );

  const renderCustomerReport = () => (
    <>
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Card title="Khách hàng mới">
            <BarChart 
              data={customerData.newCustomers} 
              xField="date"
              yField="count"
              seriesField="count"
              height={300}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Phân khúc khách hàng">
            <PieChart 
              data={customerData.customerSegmentation} 
              angleField="value" 
              colorField="name"
              height={300}
              tooltip={{
                formatter: (data) => ({
                  name: data.name,
                  value: `${data.value}%`
                })
              }}
            />
          </Card>
        </Col>
      </Row>
      
      <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
        <Col span={24}>
          <Card title="Top khách hàng">
            <Table
              dataSource={customerData.topCustomers}
              pagination={false}
              rowKey="id"
              size="small"
              columns={[
                {
                  title: 'Khách hàng',
                  dataIndex: 'name',
                  key: 'name',
                },
                {
                  title: 'Loại',
                  dataIndex: 'type',
                  key: 'type',
                  render: (type) => {
                    const color = type === 'VIP' ? 'gold' : type === 'Thành viên' ? 'green' : 'blue';
                    return <Tag color={color}>{type}</Tag>;
                  }
                },
                {
                  title: 'Đơn hàng',
                  dataIndex: 'orders',
                  key: 'orders',
                  align: 'center'
                },
                {
                  title: 'Tổng chi tiêu',
                  dataIndex: 'total',
                  key: 'total',
                  render: (total) => formatVND(total),
                  align: 'right'
                },
                {
                  title: 'Mua gần nhất',
                  dataIndex: 'lastPurchase',
                  key: 'lastPurchase',
                }
              ]}
            />
          </Card>
        </Col>
      </Row>
    </>
  );

  const renderFinanceReport = () => (
    <>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card title="Doanh thu & chi phí">
            <BarChart 
              data={financeData.revenueExpense} 
              xField="month"
              yField={['revenue', 'expense']}
              isGroup={true}
              seriesField="type"
              height={300}
              meta={{
                revenue: {
                  alias: 'Doanh thu'
                },
                expense: {
                  alias: 'Chi phí'
                }
              }}
            />
          </Card>
        </Col>
      </Row>
      
      <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
        <Col span={12}>
          <Card title="Cơ cấu chi phí">
            <PieChart 
              data={financeData.expenseCategories} 
              angleField="value" 
              colorField="name"
              height={300}
              tooltip={{
                formatter: (data) => ({
                  name: data.name,
                  value: formatVND(data.value)
                })
              }}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Báo cáo thuế">
            <Table
              dataSource={financeData.taxReport}
              pagination={false}
              rowKey="quarter"
              size="small"
              columns={[
                {
                  title: 'Quý',
                  dataIndex: 'quarter',
                  key: 'quarter',
                },
                {
                  title: 'Doanh thu',
                  dataIndex: 'revenue',
                  key: 'revenue',
                  render: (revenue) => formatVND(revenue),
                  align: 'right'
                },
                {
                  title: 'VAT (10%)',
                  dataIndex: 'vat',
                  key: 'vat',
                  render: (vat) => formatVND(vat),
                  align: 'right'
                },
                {
                  title: 'Thuế TNDN (5%)',
                  dataIndex: 'corporateTax',
                  key: 'corporateTax',
                  render: (tax) => formatVND(tax),
                  align: 'right'
                }
              ]}
            />
          </Card>
        </Col>
      </Row>
    </>
  );

  const renderActiveReport = () => {
    switch (activeTab) {
      case 'sales':
        return renderSalesReport();
      case 'inventory':
        return renderInventoryReport();
      case 'customers':
        return renderCustomerReport();
      case 'finance':
        return renderFinanceReport();
      default:
        return renderSalesReport();
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <Title level={2}>📊 Báo cáo tổng hợp</Title>
        <Space>
          <RangePicker 
            value={dateRange} 
            onChange={handleDateRangeChange} 
            format="DD/MM/YYYY" 
          />
          <Select defaultValue="daily" style={{ width: 120 }}>
            <Option value="daily">Ngày</Option>
            <Option value="weekly">Tuần</Option>
            <Option value="monthly">Tháng</Option>
            <Option value="quarterly">Quý</Option>
          </Select>
          <Button icon={<FilterOutlined />}>Lọc</Button>
          <Button.Group>
            <Button icon={<FileExcelOutlined />} onClick={() => handleExportReport('excel')} loading={exportLoading}>Excel</Button>
            <Button icon={<FilePdfOutlined />} onClick={() => handleExportReport('pdf')} loading={exportLoading}>PDF</Button>
            <Button icon={<PrinterOutlined />} onClick={() => handleExportReport('print')} loading={exportLoading}>In</Button>
          </Button.Group>
        </Space>
      </div>
      
      <Alert 
        message="Dữ liệu báo cáo từ 15/06/2024 - 22/07/2024" 
        type="info" 
        showIcon 
        style={{ marginBottom: '16px' }}
      />

      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        type="card"
        tabPosition="top"
        style={{ marginBottom: '16px' }}
      >
        <TabPane 
          tab={<span><BarChartOutlined /> Doanh thu</span>} 
          key="sales"
        />
        <TabPane 
          tab={<span><LineChartOutlined /> Kho hàng</span>} 
          key="inventory"
        />
        <TabPane 
          tab={<span><PieChartOutlined /> Khách hàng</span>} 
          key="customers"
        />
        <TabPane 
          tab={<span><DownloadOutlined /> Tài chính</span>} 
          key="finance"
        />
      </Tabs>
      
      {renderActiveReport()}
    </div>
  );
};

export default ReportsPage; 