import React, { useState } from 'react';
import {
  Card,
  Button,
  Table,
  Typography,
  Row,
  Col,
  Form,
  Select,
  DatePicker,
  Input,
  Space,
  Tag,
  Progress,
  notification,
  Modal,
  Checkbox,
  Radio
} from 'antd';
import {
  ExportOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  PrinterOutlined,
  DownloadOutlined,
  FilterOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { formatVND } from '../../utils/formatters/vietnameseCurrency';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

interface InventoryItem {
  id: string;
  productCode: string;
  productName: string;
  category: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  unitPrice: number;
  totalValue: number;
  supplier: string;
  lastUpdated: string;
  status: 'in-stock' | 'low-stock' | 'out-of-stock';
}

const InventoryExportPage: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [filterVisible, setFilterVisible] = useState(false);
  const [exportModalVisible, setExportModalVisible] = useState(false);

  // Sample inventory data
  const inventoryData: InventoryItem[] = [
    {
      id: '1',
      productCode: 'IP14-128GB',
      productName: 'iPhone 14 128GB',
      category: 'Điện thoại',
      currentStock: 45,
      minStock: 10,
      maxStock: 100,
      unitPrice: 22000000,
      totalValue: 990000000,
      supplier: 'Apple Vietnam',
      lastUpdated: '2024-07-16',
      status: 'in-stock'
    },
    {
      id: '2',
      productCode: 'SS-S24-256GB',
      productName: 'Samsung Galaxy S24 256GB',
      category: 'Điện thoại',
      currentStock: 8,
      minStock: 10,
      maxStock: 80,
      unitPrice: 25000000,
      totalValue: 200000000,
      supplier: 'Samsung Vietnam',
      lastUpdated: '2024-07-15',
      status: 'low-stock'
    },
    {
      id: '3',
      productCode: 'MBA-M2-512GB',
      productName: 'MacBook Air M2 512GB',
      category: 'Laptop',
      currentStock: 0,
      minStock: 5,
      maxStock: 50,
      unitPrice: 35000000,
      totalValue: 0,
      supplier: 'Apple Vietnam',
      lastUpdated: '2024-07-14',
      status: 'out-of-stock'
    },
    {
      id: '4',
      productCode: 'AIRPODS-PRO',
      productName: 'AirPods Pro 2nd Gen',
      category: 'Phụ kiện',
      currentStock: 25,
      minStock: 15,
      maxStock: 60,
      unitPrice: 6000000,
      totalValue: 150000000,
      supplier: 'Apple Vietnam',
      lastUpdated: '2024-07-16',
      status: 'in-stock'
    },
    {
      id: '5',
      productCode: 'WATCH-S9',
      productName: 'Apple Watch Series 9',
      category: 'Đồng hồ thông minh',
      currentStock: 12,
      minStock: 8,
      maxStock: 40,
      unitPrice: 9000000,
      totalValue: 108000000,
      supplier: 'Apple Vietnam',
      lastUpdated: '2024-07-15',
      status: 'in-stock'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in-stock': return 'success';
      case 'low-stock': return 'warning';
      case 'out-of-stock': return 'error';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'in-stock': return 'Còn hàng';
      case 'low-stock': return 'Sắp hết';
      case 'out-of-stock': return 'Hết hàng';
      default: return status;
    }
  };

  const handleExport = (format: string) => {
    setExporting(true);
    
    setTimeout(() => {
      setExporting(false);
      setExportModalVisible(false);
      notification.success({
        message: 'Xuất file thành công',
        description: `Đã xuất ${selectedItems.length || inventoryData.length} sản phẩm sang ${format.toUpperCase()}`
      });
    }, 2000);
  };

  const handlePrint = () => {
    notification.info({
      message: 'Đang chuẩn bị in',
      description: 'Báo cáo sẽ được gửi đến máy in mặc định'
    });
  };

  const columns = [
    {
      title: 'Mã SP',
      dataIndex: 'productCode',
      key: 'productCode',
      width: 120,
      fixed: 'left' as const
    },
    {
      title: 'Tên sản phẩm',
      dataIndex: 'productName',
      key: 'productName',
      width: 200,
      fixed: 'left' as const
    },
    {
      title: 'Danh mục',
      dataIndex: 'category',
      key: 'category',
      width: 120
    },
    {
      title: 'Tồn kho',
      dataIndex: 'currentStock',
      key: 'currentStock',
      width: 100,
      render: (stock: number, record: InventoryItem) => (
        <div>
          <Text strong style={{ 
            color: record.status === 'out-of-stock' ? '#ff4d4f' : 
                   record.status === 'low-stock' ? '#fa8c16' : '#52c41a' 
          }}>
            {stock.toLocaleString()}
          </Text>
          <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
            Min: {record.minStock} | Max: {record.maxStock}
          </div>
        </div>
      )
    },
    {
      title: 'Đơn giá',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      width: 150,
      render: (price: number) => formatVND(price)
    },
    {
      title: 'Tổng giá trị',
      dataIndex: 'totalValue',
      key: 'totalValue',
      width: 150,
      render: (value: number) => (
        <Text strong style={{ color: '#1890ff' }}>
          {formatVND(value)}
        </Text>
      )
    },
    {
      title: 'Nhà cung cấp',
      dataIndex: 'supplier',
      key: 'supplier',
      width: 150
    },
    {
      title: 'Cập nhật',
      dataIndex: 'lastUpdated',
      key: 'lastUpdated',
      width: 120,
      render: (date: string) => dayjs(date).format('DD/MM/YYYY')
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => (
        <Tag color={getStatusColor(status)} icon={<CheckCircleOutlined />}>
          {getStatusText(status)}
        </Tag>
      )
    }
  ];

  const totalValue = inventoryData.reduce((sum, item) => sum + item.totalValue, 0);
  const inStockCount = inventoryData.filter(item => item.status === 'in-stock').length;
  const lowStockCount = inventoryData.filter(item => item.status === 'low-stock').length;
  const outStockCount = inventoryData.filter(item => item.status === 'out-of-stock').length;

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>📊 Xuất Báo Cáo Tồn Kho</Title>

      {/* Summary Cards */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
                {inventoryData.length}
              </Title>
              <Text>Tổng sản phẩm</Text>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <Title level={3} style={{ margin: 0, color: '#52c41a' }}>
                {inStockCount}
              </Title>
              <Text>Còn hàng</Text>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <Title level={3} style={{ margin: 0, color: '#fa8c16' }}>
                {lowStockCount}
              </Title>
              <Text>Sắp hết</Text>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <Title level={3} style={{ margin: 0, color: '#ff4d4f' }}>
                {outStockCount}
              </Title>
              <Text>Hết hàng</Text>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Total Value Card */}
      <Card style={{ marginBottom: '24px', textAlign: 'center' }}>
        <Title level={2} style={{ margin: 0, color: '#722ed1' }}>
          {formatVND(totalValue)}
        </Title>
        <Text style={{ fontSize: '16px' }}>Tổng giá trị tồn kho</Text>
      </Card>

      {/* Filters and Export */}
      <Card 
        title="📋 Danh sách tồn kho"
        extra={
          <Space>
            <Button 
              icon={<FilterOutlined />}
              onClick={() => setFilterVisible(!filterVisible)}
            >
              Lọc
            </Button>
            <Button 
              icon={<PrinterOutlined />}
              onClick={handlePrint}
            >
              In
            </Button>
            <Button 
              type="primary"
              icon={<ExportOutlined />}
              onClick={() => setExportModalVisible(true)}
            >
              Xuất file
            </Button>
          </Space>
        }
      >
        {/* Filter Form */}
        {filterVisible && (
          <Card size="small" style={{ marginBottom: '16px', backgroundColor: '#f8f9fa' }}>
            <Form layout="inline" form={form}>
              <Form.Item name="category" label="Danh mục">
                <Select style={{ width: 150 }} placeholder="Chọn danh mục">
                  <Option value="">Tất cả</Option>
                  <Option value="Điện thoại">Điện thoại</Option>
                  <Option value="Laptop">Laptop</Option>
                  <Option value="Phụ kiện">Phụ kiện</Option>
                  <Option value="Đồng hồ thông minh">Đồng hồ thông minh</Option>
                </Select>
              </Form.Item>
              
              <Form.Item name="status" label="Trạng thái">
                <Select style={{ width: 120 }} placeholder="Trạng thái">
                  <Option value="">Tất cả</Option>
                  <Option value="in-stock">Còn hàng</Option>
                  <Option value="low-stock">Sắp hết</Option>
                  <Option value="out-of-stock">Hết hàng</Option>
                </Select>
              </Form.Item>
              
              <Form.Item name="supplier" label="Nhà cung cấp">
                <Select style={{ width: 150 }} placeholder="Nhà cung cấp">
                  <Option value="">Tất cả</Option>
                  <Option value="Apple Vietnam">Apple Vietnam</Option>
                  <Option value="Samsung Vietnam">Samsung Vietnam</Option>
                </Select>
              </Form.Item>
              
              <Form.Item>
                <Button type="primary">Áp dụng</Button>
                <Button style={{ marginLeft: 8 }}>Đặt lại</Button>
              </Form.Item>
            </Form>
          </Card>
        )}

        {/* Inventory Table */}
        <Table
          columns={columns}
          dataSource={inventoryData}
          rowKey="id"
          scroll={{ x: 1200 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} của ${total} sản phẩm`
          }}
          rowSelection={{
            selectedRowKeys: selectedItems,
            onChange: setSelectedItems,
            selections: [
              Table.SELECTION_ALL,
              Table.SELECTION_INVERT,
              Table.SELECTION_NONE,
            ]
          }}
        />
      </Card>

      {/* Export Modal */}
      <Modal
        title="📊 Xuất báo cáo tồn kho"
        open={exportModalVisible}
        onCancel={() => setExportModalVisible(false)}
        footer={null}
        width={500}
      >
        <div style={{ marginBottom: '24px' }}>
          <Text>
            Xuất {selectedItems.length > 0 ? selectedItems.length : inventoryData.length} sản phẩm
          </Text>
        </div>

        <Form layout="vertical">
          <Form.Item label="Định dạng file">
            <Radio.Group defaultValue="excel">
              <Space direction="vertical">
                <Radio value="excel">
                  <FileExcelOutlined style={{ color: '#52c41a' }} />
                  {' '}Excel (.xlsx) - Phù hợp để chỉnh sửa dữ liệu
                </Radio>
                <Radio value="pdf">
                  <FilePdfOutlined style={{ color: '#ff4d4f' }} />
                  {' '}PDF (.pdf) - Phù hợp để in ấn và lưu trữ
                </Radio>
              </Space>
            </Radio.Group>
          </Form.Item>

          <Form.Item label="Thông tin bao gồm">
            <Checkbox.Group defaultValue={['basic', 'stock', 'value']}>
              <Space direction="vertical">
                <Checkbox value="basic">Thông tin cơ bản (Mã, Tên, Danh mục)</Checkbox>
                <Checkbox value="stock">Thông tin tồn kho (Số lượng, Min/Max)</Checkbox>
                <Checkbox value="value">Thông tin giá trị (Đơn giá, Tổng giá trị)</Checkbox>
                <Checkbox value="supplier">Nhà cung cấp</Checkbox>
                <Checkbox value="dates">Ngày cập nhật</Checkbox>
              </Space>
            </Checkbox.Group>
          </Form.Item>

          <div style={{ textAlign: 'right', marginTop: '24px' }}>
            <Space>
              <Button onClick={() => setExportModalVisible(false)}>
                Hủy
              </Button>
              <Button 
                type="primary" 
                icon={<DownloadOutlined />}
                loading={exporting}
                onClick={() => handleExport('excel')}
              >
                Xuất Excel
              </Button>
              <Button 
                icon={<DownloadOutlined />}
                loading={exporting}
                onClick={() => handleExport('pdf')}
              >
                Xuất PDF
              </Button>
            </Space>
          </div>
        </Form>

        {exporting && (
          <div style={{ marginTop: '16px' }}>
            <Progress percent={75} status="active" />
            <Text type="secondary">Đang tạo file...</Text>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default InventoryExportPage;