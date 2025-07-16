import React, { useState } from 'react';
import {
  Card,
  Upload,
  Button,
  Table,
  Typography,
  Row,
  Col,
  Progress,
  Alert,
  Space,
  Divider,
  Tag,
  Steps,
  Form,
  Input,
  Select,
  notification,
  Modal
} from 'antd';
import {
  UploadOutlined,
  FileExcelOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  DownloadOutlined,
  ImportOutlined,
  InboxOutlined
} from '@ant-design/icons';
import { formatVND } from '../../utils/formatters/vietnameseCurrency';

const { Title, Text } = Typography;
const { Dragger } = Upload;
const { Step } = Steps;
const { Option } = Select;

interface ImportItem {
  id: string;
  productCode: string;
  productName: string;
  category: string;
  quantity: number;
  unitPrice: number;
  supplier: string;
  expiryDate?: string;
  status: 'pending' | 'success' | 'error';
  error?: string;
}

const InventoryImportPage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [importData, setImportData] = useState<ImportItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [form] = Form.useForm();

  // Sample import data
  const sampleData: ImportItem[] = [
    {
      id: '1',
      productCode: 'IP14-128GB',
      productName: 'iPhone 14 128GB',
      category: 'Điện thoại',
      quantity: 50,
      unitPrice: 22000000,
      supplier: 'Apple Vietnam',
      status: 'pending'
    },
    {
      id: '2',
      productCode: 'SS-S24-256GB',
      productName: 'Samsung Galaxy S24 256GB',
      category: 'Điện thoại',
      quantity: 30,
      unitPrice: 25000000,
      supplier: 'Samsung Vietnam',
      status: 'pending'
    },
    {
      id: '3',
      productCode: 'MBA-M2-512GB',
      productName: 'MacBook Air M2 512GB',
      category: 'Laptop',
      quantity: 20,
      unitPrice: 35000000,
      supplier: 'Apple Vietnam',
      status: 'pending'
    }
  ];

  const handleUpload = (info: any) => {
    setUploading(true);
    
    // Simulate file processing
    setTimeout(() => {
      setImportData(sampleData);
      setCurrentStep(1);
      setUploading(false);
      notification.success({
        message: 'Upload thành công',
        description: 'File đã được tải lên và xử lý thành công'
      });
    }, 2000);
  };

  const handlePreview = () => {
    setCurrentStep(1);
  };

  const handleImport = () => {
    setImporting(true);
    setCurrentStep(2);

    // Simulate import process
    setTimeout(() => {
      const updatedData = importData.map(item => ({
        ...item,
        status: Math.random() > 0.1 ? 'success' as const : 'error' as const,
        error: Math.random() > 0.1 ? undefined : 'Mã sản phẩm đã tồn tại'
      }));
      
      setImportData(updatedData);
      setImporting(false);
      setCurrentStep(3);
      
      const successCount = updatedData.filter(item => item.status === 'success').length;
      const errorCount = updatedData.filter(item => item.status === 'error').length;
      
      notification.success({
        message: 'Import hoàn tất',
        description: `Thành công: ${successCount}, Lỗi: ${errorCount}`
      });
    }, 3000);
  };

  const columns = [
    {
      title: 'Mã sản phẩm',
      dataIndex: 'productCode',
      key: 'productCode',
      width: 120
    },
    {
      title: 'Tên sản phẩm',
      dataIndex: 'productName',
      key: 'productName',
      width: 200
    },
    {
      title: 'Danh mục',
      dataIndex: 'category',
      key: 'category',
      width: 120
    },
    {
      title: 'Số lượng',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      render: (quantity: number) => (
        <Text strong style={{ color: '#52c41a' }}>{quantity.toLocaleString()}</Text>
      )
    },
    {
      title: 'Đơn giá',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      width: 150,
      render: (price: number) => (
        <Text strong>{formatVND(price)}</Text>
      )
    },
    {
      title: 'Nhà cung cấp',
      dataIndex: 'supplier',
      key: 'supplier',
      width: 150
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string, record: ImportItem) => {
        if (status === 'success') {
          return <Tag color="success" icon={<CheckCircleOutlined />}>Thành công</Tag>;
        } else if (status === 'error') {
          return <Tag color="error" icon={<ExclamationCircleOutlined />}>Lỗi</Tag>;
        }
        return <Tag color="processing">Chờ xử lý</Tag>;
      }
    }
  ];

  const uploadProps = {
    name: 'file',
    multiple: false,
    accept: '.xlsx,.xls,.csv',
    beforeUpload: () => false,
    onChange: handleUpload,
    onDrop: handleUpload,
  };

  const successCount = importData.filter(item => item.status === 'success').length;
  const errorCount = importData.filter(item => item.status === 'error').length;
  const totalValue = importData
    .filter(item => item.status === 'success')
    .reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>📦 Nhập Kho Hàng</Title>
      
      {/* Progress Steps */}
      <Card style={{ marginBottom: '24px' }}>
        <Steps current={currentStep} style={{ marginBottom: '24px' }}>
          <Step title="Upload File" description="Tải lên file Excel/CSV" />
          <Step title="Xem trước" description="Kiểm tra dữ liệu" />
          <Step title="Import" description="Nhập vào hệ thống" />
          <Step title="Hoàn thành" description="Kết quả import" />
        </Steps>
      </Card>

      {/* Step 0: Upload */}
      {currentStep === 0 && (
        <Row gutter={24}>
          <Col span={16}>
            <Card title="📁 Tải lên file dữ liệu">
              <Dragger {...uploadProps} style={{ marginBottom: '16px' }}>
                <p className="ant-upload-drag-icon">
                  <InboxOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
                </p>
                <p className="ant-upload-text">Kéo thả file vào đây hoặc click để chọn</p>
                <p className="ant-upload-hint">
                  Hỗ trợ file Excel (.xlsx, .xls) và CSV. Dung lượng tối đa 10MB
                </p>
              </Dragger>
              
              <Alert
                message="Lưu ý định dạng file"
                description="File phải có các cột: Mã sản phẩm, Tên sản phẩm, Danh mục, Số lượng, Đơn giá, Nhà cung cấp"
                type="info"
                showIcon
                style={{ marginBottom: '16px' }}
              />
              
              <Space>
                <Button 
                  icon={<DownloadOutlined />}
                  onClick={() => {
                    // Download template
                    notification.info({
                      message: 'Tải template',
                      description: 'Template đã được tải xuống'
                    });
                  }}
                >
                  Tải template
                </Button>
                <Button 
                  type="primary"
                  onClick={handlePreview}
                  disabled={importData.length === 0}
                >
                  Sử dụng dữ liệu mẫu
                </Button>
              </Space>
            </Card>
          </Col>
          
          <Col span={8}>
            <Card title="📋 Hướng dẫn">
              <div style={{ lineHeight: '1.8' }}>
                <Text strong>Bước 1:</Text> Chuẩn bị file Excel với các cột bắt buộc
                <br />
                <Text strong>Bước 2:</Text> Tải lên file hoặc kéo thả vào khu vực upload
                <br />
                <Text strong>Bước 3:</Text> Xem trước và kiểm tra dữ liệu
                <br />
                <Text strong>Bước 4:</Text> Xác nhận import vào hệ thống
              </div>
              
              <Divider />
              
              <div>
                <Text strong style={{ color: '#52c41a' }}>✓</Text> Tự động phát hiện trùng lặp
                <br />
                <Text strong style={{ color: '#52c41a' }}>✓</Text> Kiểm tra định dạng dữ liệu
                <br />
                <Text strong style={{ color: '#52c41a' }}>✓</Text> Cập nhật tồn kho tự động
                <br />
                <Text strong style={{ color: '#52c41a' }}>✓</Text> Báo cáo chi tiết
              </div>
            </Card>
          </Col>
        </Row>
      )}

      {/* Step 1: Preview */}
      {currentStep === 1 && (
        <div>
          <Row gutter={16} style={{ marginBottom: '24px' }}>
            <Col span={6}>
              <Card>
                <div style={{ textAlign: 'center' }}>
                  <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
                    {importData.length}
                  </Title>
                  <Text>Tổng sản phẩm</Text>
                </div>
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <div style={{ textAlign: 'center' }}>
                  <Title level={3} style={{ margin: 0, color: '#52c41a' }}>
                    {importData.reduce((sum, item) => sum + item.quantity, 0).toLocaleString()}
                  </Title>
                  <Text>Tổng số lượng</Text>
                </div>
              </Card>
            </Col>
            <Col span={12}>
              <Card>
                <div style={{ textAlign: 'center' }}>
                  <Title level={3} style={{ margin: 0, color: '#fa8c16' }}>
                    {formatVND(importData.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0))}
                  </Title>
                  <Text>Tổng giá trị</Text>
                </div>
              </Card>
            </Col>
          </Row>

          <Card 
            title="📋 Dữ liệu import"
            extra={
              <Space>
                <Button onClick={() => setCurrentStep(0)}>
                  Quay lại
                </Button>
                <Button 
                  type="primary" 
                  icon={<ImportOutlined />}
                  onClick={handleImport}
                  loading={importing}
                >
                  Bắt đầu import
                </Button>
              </Space>
            }
          >
            <Table
              columns={columns}
              dataSource={importData}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              scroll={{ x: 1000 }}
            />
          </Card>
        </div>
      )}

      {/* Step 2: Importing */}
      {currentStep === 2 && (
        <Card title="🔄 Đang thực hiện import...">
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <Progress
              type="circle"
              percent={importing ? 65 : 100}
              format={percent => `${percent}%`}
              size={120}
            />
            <div style={{ marginTop: '24px' }}>
              <Title level={4}>Đang xử lý dữ liệu...</Title>
              <Text type="secondary">
                Vui lòng đợi trong giây lát. Quá trình có thể mất vài phút.
              </Text>
            </div>
          </div>
        </Card>
      )}

      {/* Step 3: Results */}
      {currentStep === 3 && (
        <div>
          <Row gutter={16} style={{ marginBottom: '24px' }}>
            <Col span={8}>
              <Card>
                <div style={{ textAlign: 'center' }}>
                  <Title level={3} style={{ margin: 0, color: '#52c41a' }}>
                    {successCount}
                  </Title>
                  <Text>Thành công</Text>
                </div>
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <div style={{ textAlign: 'center' }}>
                  <Title level={3} style={{ margin: 0, color: '#ff4d4f' }}>
                    {errorCount}
                  </Title>
                  <Text>Lỗi</Text>
                </div>
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <div style={{ textAlign: 'center' }}>
                  <Title level={3} style={{ margin: 0, color: '#fa8c16' }}>
                    {formatVND(totalValue)}
                  </Title>
                  <Text>Giá trị nhập</Text>
                </div>
              </Card>
            </Col>
          </Row>

          <Card 
            title="📊 Kết quả import"
            extra={
              <Space>
                <Button onClick={() => {
                  setCurrentStep(0);
                  setImportData([]);
                }}>
                  Import mới
                </Button>
                <Button type="primary">
                  Xuất báo cáo
                </Button>
              </Space>
            }
          >
            <Table
              columns={columns}
              dataSource={importData}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              scroll={{ x: 1000 }}
            />
          </Card>
        </div>
      )}
    </div>
  );
};

export default InventoryImportPage;