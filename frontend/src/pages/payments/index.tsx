import {
    BankOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    CloseCircleOutlined,
    CreditCardOutlined,
    DollarOutlined,
    ExportOutlined,
    FilterOutlined,
    QrcodeOutlined,
    SearchOutlined,
    SyncOutlined,
    WalletOutlined
} from '@ant-design/icons';
import type { TabsProps } from 'antd';
import {
    Badge,
    Button,
    Card,
    Col,
    DatePicker,
    Divider,
    Input,
    Row,
    Select,
    Space,
    Statistic,
    Table,
    Tabs,
    Tag,
    Tooltip,
    Typography
} from 'antd';
import React, { useState } from 'react';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

// Mock data for the payments page
const paymentMethods = [
  { id: 'cash', name: 'Tiền mặt', icon: <DollarOutlined style={{ color: '#52c41a' }} /> },
  { id: 'vnpay', name: 'VNPay', icon: <QrcodeOutlined style={{ color: '#1890ff' }} /> },
  { id: 'momo', name: 'MoMo', icon: <WalletOutlined style={{ color: '#eb2f96' }} /> },
  { id: 'zalopay', name: 'ZaloPay', icon: <WalletOutlined style={{ color: '#2f54eb' }} /> },
  { id: 'bank', name: 'Chuyển khoản', icon: <BankOutlined style={{ color: '#722ed1' }} /> },
  { id: 'card', name: 'Thẻ', icon: <CreditCardOutlined style={{ color: '#fa8c16' }} /> },
];

// Mock transaction data
const generateTransactions = () => {
  const statuses = ['completed', 'pending', 'failed'];
  const methods = paymentMethods.map(m => m.id);
  
  return Array.from({ length: 50 }, (_, i) => {
    const amount = Math.floor(Math.random() * 10000000) + 50000;
    const methodId = methods[Math.floor(Math.random() * methods.length)];
    const method = paymentMethods.find(m => m.id === methodId)!;
    
    return {
      id: `TX${String(i + 1).padStart(4, '0')}`,
      orderId: `DH${String(Math.floor(Math.random() * 1000)).padStart(4, '0')}`,
      amount,
      method: methodId,
      methodName: method.name,
      methodIcon: method.icon,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      customer: `Khách hàng ${i + 1}`,
      date: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)),
      transactionId: Math.random().toString(36).substring(2, 15),
    };
  });
};

const transactions = generateTransactions();

const PaymentsPage: React.FC<{ initialTab?: string }> = ({ initialTab = 'transactions' }) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [dateRange, setDateRange] = useState<[any, any] | null>(null);

  // Filter transactions based on selected filters
  const filteredTransactions = transactions.filter(tx => {
    if (selectedStatus && tx.status !== selectedStatus) return false;
    if (selectedMethod && tx.method !== selectedMethod) return false;
    if (searchText && !tx.id.includes(searchText) && 
        !tx.orderId.includes(searchText) && 
        !tx.customer.toLowerCase().includes(searchText.toLowerCase())) return false;
    
    if (dateRange && dateRange[0] && dateRange[1]) {
      const txDate = new Date(tx.date);
      const startDate = new Date(dateRange[0]);
      const endDate = new Date(dateRange[1]);
      
      if (txDate < startDate || txDate > endDate) return false;
    }
    
    return true;
  });

  // Calculate statistics
  const totalTransactions = filteredTransactions.length;
  const successfulTransactions = filteredTransactions.filter(tx => tx.status === 'completed').length;
  const pendingTransactions = filteredTransactions.filter(tx => tx.status === 'pending').length;
  const failedTransactions = filteredTransactions.filter(tx => tx.status === 'failed').length;
  
  const totalAmount = filteredTransactions
    .filter(tx => tx.status === 'completed')
    .reduce((sum, tx) => sum + tx.amount, 0);
  
  const methodTotals = filteredTransactions
    .filter(tx => tx.status === 'completed')
    .reduce((acc, tx) => {
      acc[tx.method] = (acc[tx.method] || 0) + tx.amount;
      return acc;
    }, {} as Record<string, number>);

  // Status tag renderer
  const renderStatusTag = (status: string) => {
    switch (status) {
      case 'completed':
        return <Tag icon={<CheckCircleOutlined />} color="success">Thành công</Tag>;
      case 'pending':
        return <Tag icon={<ClockCircleOutlined />} color="warning">Đang xử lý</Tag>;
      case 'failed':
        return <Tag icon={<CloseCircleOutlined />} color="error">Thất bại</Tag>;
      default:
        return <Tag>Không xác định</Tag>;
    }
  };

  // Define the columns for the transaction table
  const columns = [
    {
      title: 'Mã GD',
      dataIndex: 'id',
      key: 'id',
      render: (text: string) => <a>{text}</a>,
    },
    {
      title: 'Đơn hàng',
      dataIndex: 'orderId',
      key: 'orderId',
      render: (text: string) => <a>{text}</a>,
    },
    {
      title: 'Khách hàng',
      dataIndex: 'customer',
      key: 'customer',
    },
    {
      title: 'Số tiền',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => (
        <Text strong>
          {amount.toLocaleString('vi-VN')}₫
        </Text>
      ),
      sorter: (a: any, b: any) => a.amount - b.amount,
    },
    {
      title: 'Phương thức',
      dataIndex: 'method',
      key: 'method',
      render: (_: string, record: any) => (
        <Space>
          {record.methodIcon}
          <span>{record.methodName}</span>
        </Space>
      ),
      filters: paymentMethods.map(method => ({ text: method.name, value: method.id })),
      onFilter: (value: any, record: any) => record.method === value,
    },
    {
      title: 'Ngày GD',
      dataIndex: 'date',
      key: 'date',
      render: (date: Date) => date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
      sorter: (a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: renderStatusTag,
      filters: [
        { text: 'Thành công', value: 'completed' },
        { text: 'Đang xử lý', value: 'pending' },
        { text: 'Thất bại', value: 'failed' },
      ],
      onFilter: (value: any, record: any) => record.status === value,
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (record: any) => (
        <Space size="small">
          <Tooltip title="Xem chi tiết">
            <Button size="small" icon={<SearchOutlined />} />
          </Tooltip>
          {record.status === 'pending' && (
            <Tooltip title="Đồng bộ trạng thái">
              <Button size="small" icon={<SyncOutlined />} />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  // Define the tabs for the page
  const tabs: TabsProps['items'] = [
    {
      key: 'transactions',
      label: (
        <span>
          <DollarOutlined />
          Giao dịch
        </span>
      ),
      children: (
        <div>
          <div style={{ marginBottom: 16 }}>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={8} md={6} lg={6}>
                <Input
                  placeholder="Tìm theo mã GD, đơn hàng, khách hàng"
                  prefix={<SearchOutlined />}
                  onChange={e => setSearchText(e.target.value)}
                  allowClear
                />
              </Col>
              <Col xs={24} sm={8} md={6} lg={6}>
                <Select
                  placeholder="Phương thức thanh toán"
                  style={{ width: '100%' }}
                  allowClear
                  onChange={value => setSelectedMethod(value)}
                >
                  {paymentMethods.map(method => (
                    <Option key={method.id} value={method.id}>
                      <Space>
                        {method.icon}
                        {method.name}
                      </Space>
                    </Option>
                  ))}
                </Select>
              </Col>
              <Col xs={24} sm={8} md={6} lg={6}>
                <Select
                  placeholder="Trạng thái"
                  style={{ width: '100%' }}
                  allowClear
                  onChange={value => setSelectedStatus(value)}
                >
                  <Option value="completed">
                    <CheckCircleOutlined style={{ color: '#52c41a' }} /> Thành công
                  </Option>
                  <Option value="pending">
                    <ClockCircleOutlined style={{ color: '#faad14' }} /> Đang xử lý
                  </Option>
                  <Option value="failed">
                    <CloseCircleOutlined style={{ color: '#f5222d' }} /> Thất bại
                  </Option>
                </Select>
              </Col>
              <Col xs={24} sm={8} md={6} lg={6}>
                <RangePicker
                  style={{ width: '100%' }}
                  placeholder={['Từ ngày', 'Đến ngày']}
                  onChange={value => setDateRange(value)}
                />
              </Col>
            </Row>
          </div>
          
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic 
                  title="Tổng giao dịch" 
                  value={totalTransactions} 
                  valueStyle={{ color: '#1890ff' }}
                  prefix={<CreditCardOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic 
                  title="Thành công" 
                  value={successfulTransactions} 
                  valueStyle={{ color: '#52c41a' }}
                  prefix={<CheckCircleOutlined />}
                  suffix={<Text type="secondary">{`/${totalTransactions}`}</Text>}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic 
                  title="Đang xử lý" 
                  value={pendingTransactions}
                  valueStyle={{ color: '#faad14' }}
                  prefix={<ClockCircleOutlined />}
                  suffix={<Text type="secondary">{`/${totalTransactions}`}</Text>}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic 
                  title="Thất bại" 
                  value={failedTransactions}
                  valueStyle={{ color: '#f5222d' }}
                  prefix={<CloseCircleOutlined />}
                  suffix={<Text type="secondary">{`/${totalTransactions}`}</Text>}
                />
              </Card>
            </Col>
          </Row>

          <Card 
            title="Danh sách giao dịch"
            extra={
              <Space>
                <Button icon={<FilterOutlined />}>Lọc</Button>
                <Button icon={<ExportOutlined />}>Xuất báo cáo</Button>
              </Space>
            }
          >
            <Table 
              columns={columns} 
              dataSource={filteredTransactions}
              rowKey="id"
              pagination={{ 
                pageSize: 10,
                showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} giao dịch` 
              }}
            />
          </Card>
        </div>
      ),
    },
    {
      key: 'config',
      label: (
        <span>
          <CreditCardOutlined />
          Cổng thanh toán
        </span>
      ),
      children: (
        <div>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <Card 
                title={
                  <Space>
                    <img 
                      src="https://cdn.haitrieu.com/wp-content/uploads/2022/10/Icon-VNPAY-QR-350x274.png" 
                      alt="VNPay" 
                      style={{ width: 24, height: 24 }} 
                    />
                    <span>VNPay</span>
                  </Space>
                }
                extra={<Badge status="success" text="Đang hoạt động" />}
              >
                <div style={{ marginBottom: 16 }}>
                  <Text>Cổng thanh toán trực tuyến VNPay hỗ trợ thanh toán QR, thẻ ngân hàng và ví điện tử.</Text>
                </div>
                <Divider />
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div>
                    <Text type="secondary">Terminal ID:</Text>
                    <div>********</div>
                  </div>
                  <div>
                    <Text type="secondary">Secret Key:</Text>
                    <div>********</div>
                  </div>
                </Space>
                <Divider />
                <Space>
                  <Button type="primary">Cấu hình</Button>
                  <Button>Kiểm tra kết nối</Button>
                </Space>
              </Card>
            </Col>
            
            <Col xs={24} md={8}>
              <Card 
                title={
                  <Space>
                    <img 
                      src="https://upload.wikimedia.org/wikipedia/vi/f/fe/MoMo_Logo.png" 
                      alt="MoMo" 
                      style={{ width: 24, height: 24 }} 
                    />
                    <span>MoMo</span>
                  </Space>
                }
                extra={<Badge status="success" text="Đang hoạt động" />}
              >
                <div style={{ marginBottom: 16 }}>
                  <Text>Ví điện tử MoMo hỗ trợ thanh toán qua ứng dụng di động với nhiều ưu đãi.</Text>
                </div>
                <Divider />
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div>
                    <Text type="secondary">Partner Code:</Text>
                    <div>********</div>
                  </div>
                  <div>
                    <Text type="secondary">Access Key:</Text>
                    <div>********</div>
                  </div>
                </Space>
                <Divider />
                <Space>
                  <Button type="primary">Cấu hình</Button>
                  <Button>Kiểm tra kết nối</Button>
                </Space>
              </Card>
            </Col>
            
            <Col xs={24} md={8}>
              <Card 
                title={
                  <Space>
                    <img 
                      src="https://cdn.haitrieu.com/wp-content/uploads/2022/10/Icon-ZaloPay-350x274.png" 
                      alt="ZaloPay" 
                      style={{ width: 24, height: 24 }} 
                    />
                    <span>ZaloPay</span>
                  </Space>
                }
                extra={<Badge status="success" text="Đang hoạt động" />}
              >
                <div style={{ marginBottom: 16 }}>
                  <Text>ZaloPay là giải pháp thanh toán trực tuyến của Zalo dành cho doanh nghiệp.</Text>
                </div>
                <Divider />
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div>
                    <Text type="secondary">App ID:</Text>
                    <div>********</div>
                  </div>
                  <div>
                    <Text type="secondary">Key 1:</Text>
                    <div>********</div>
                  </div>
                </Space>
                <Divider />
                <Space>
                  <Button type="primary">Cấu hình</Button>
                  <Button>Kiểm tra kết nối</Button>
                </Space>
              </Card>
            </Col>
          </Row>
        </div>
      ),
    },
    {
      key: 'reports',
      label: (
        <span>
          <BankOutlined />
          Báo cáo
        </span>
      ),
      children: (
        <div>
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col span={24}>
              <Card title="Báo cáo thanh toán theo phương thức">
                <Row gutter={[16, 16]}>
                  {paymentMethods.map(method => {
                    const amount = methodTotals[method.id] || 0;
                    return (
                      <Col key={method.id} xs={24} sm={12} md={8} lg={8} xl={4}>
                        <Card>
                          <Statistic 
                            title={
                              <Space>
                                {method.icon}
                                {method.name}
                              </Space>
                            }
                            value={amount} 
                            valueStyle={{ color: '#1890ff' }}
                            formatter={value => `${(Number(value) || 0).toLocaleString('vi-VN')}₫`}
                          />
                        </Card>
                      </Col>
                    );
                  })}
                </Row>
              </Card>
            </Col>
          </Row>

          <Card title="Tổng quan doanh thu">
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12}>
                <Statistic 
                  title="Tổng doanh thu" 
                  value={totalAmount} 
                  precision={0}
                  valueStyle={{ color: '#3f8600' }}
                  prefix={<DollarOutlined />}
                  formatter={value => `${(Number(value) || 0).toLocaleString('vi-VN')}₫`}
                />
              </Col>
              <Col xs={24} sm={12}>
                <Statistic 
                  title="Giao dịch thành công" 
                  value={successfulTransactions} 
                  suffix={`/ ${totalTransactions}`}
                  valueStyle={{ color: '#3f8600' }}
                  prefix={<CheckCircleOutlined />}
                />
              </Col>
            </Row>
          </Card>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={2}>Quản lý thanh toán</Title>
      </div>

      <Tabs 
        defaultActiveKey={activeTab} 
        items={tabs}
        onChange={(key) => setActiveTab(key)}
        tabBarStyle={{ marginBottom: 16 }}
      />
    </div>
  );
};

export default PaymentsPage; 