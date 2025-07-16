// Enhanced Admin Dashboard - 2025 Modern UI/UX
import {
    AlertOutlined,
    AppstoreOutlined,
    ArrowDownOutlined,
    ArrowUpOutlined,
    BarChartOutlined,
    BellOutlined,
    CalendarOutlined,
    CameraOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    CloudDownloadOutlined,
    CrownOutlined,
    DashboardOutlined,
    DatabaseOutlined,
    DollarOutlined,
    DownloadOutlined,
    EyeOutlined,
    FileTextOutlined,
    FilterOutlined,
    FireOutlined,
    FundOutlined,
    GiftOutlined,
    GlobalOutlined,
    HeartOutlined,
    InfoCircleOutlined,
    LineChartOutlined,
    PieChartOutlined,
    PlusOutlined,
    PrinterOutlined,
    RightOutlined,
    SearchOutlined,
    SettingOutlined,
    ShoppingCartOutlined,
    StarOutlined,
    SyncOutlined,
    TeamOutlined,
    TrophyOutlined,
    UserOutlined,
    WarningOutlined
} from '@ant-design/icons';
import {
    Badge,
    Button,
    Card,
    Col,
    DatePicker,
    Dropdown,
    Empty,
    Input,
    List,
    Progress,
    Row,
    Select,
    Space,
    Statistic,
    Table,
    Tabs,
    Tag,
    Timeline,
    Tooltip,
    Typography,
    Avatar,
    Divider,
    message,
    Modal,
    Form,
    Switch,
    Slider,
    Rate,
    Checkbox,
    Radio,
    Alert,
    Descriptions,
    Popover,
    Spin,
    Collapse,
    Drawer,
    BackTop,
    Affix,
    Breadcrumb,
    notification,
    Result,
    Skeleton,
    Steps,
    Transfer,
    Tree,
    Upload,
    Cascader,
    AutoComplete,
    Mentions,
    TimePicker,
    ConfigProvider
} from 'antd';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DualAxes, Pie, Line, Column } from '../../components/charts/ChartWrappers';
import { motion, AnimatePresence } from 'framer-motion';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Search } = Input;
const { Panel } = Collapse;
const { Step } = Steps;

// Enhanced Vietnamese currency formatter
const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
};

// Enhanced date formatter
const formatDate = (date: string | Date) => {
    return dayjs(date).format('DD/MM/YYYY HH:mm');
};

const AdminDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [selectedPeriod, setSelectedPeriod] = useState('today');
    const [activeTab, setActiveTab] = useState('overview');
    const [alertModalVisible, setAlertModalVisible] = useState(false);
    const [settingsDrawerVisible, setSettingsDrawerVisible] = useState(false);

    // Enhanced Dashboard Data with Vietnamese business metrics
    const [dashboardData, setDashboardData] = useState({
        // Core Business Metrics
        totalRevenue: 125680000,
        totalOrders: 1247,
        totalCustomers: 3456,
        totalProducts: 2890,
        averageOrder: 195000,
        
        // Growth Metrics
        revenueGrowth: 18.5,
        orderGrowth: 12.3,
        customerGrowth: 25.2,
        productGrowth: 8.7,
        
        // Operational Metrics
        lowStockProducts: 23,
        pendingOrders: 45,
        processingOrders: 78,
        completedOrders: 1124,
        
        // Financial Metrics
        grossProfit: 45680000,
        netProfit: 32450000,
        totalCost: 80000000,
        totalTax: 12568000,
        
        // Staff Performance
        activeStaff: 15,
        topPerformer: 'Nguyễn Văn A',
        averagePerformance: 87.5,
        
        // Customer Insights
        returningCustomers: 2156,
        newCustomers: 1300,
        customerSatisfaction: 4.7,
        loyaltyMembers: 1890,
        
        // Inventory Status
        totalStock: 45678,
        lowStockAlert: 23,
        outOfStock: 5,
        fastMoving: 156,
        
        // Payment Methods
        cashPayments: 45,
        cardPayments: 35,
        digitalPayments: 20,
        
        // Regional Performance
        hanoi: 35,
        hochiminh: 28,
        danang: 15,
        others: 22
    });

    // Real-time data simulation
    const [realtimeData, setRealtimeData] = useState({
        onlineUsers: 127,
        activeTerminals: 8,
        pendingNotifications: 12,
        systemStatus: 'healthy',
        serverLoad: 67,
        databaseSize: 2.4,
        backupStatus: 'completed',
        lastBackup: '2025-01-16 02:00:00',
        
        // Live transactions
        liveTransactions: [
            { id: 'TXN001', amount: 2450000, customer: 'Nguyễn Thị B', time: '13:45', status: 'completed' },
            { id: 'TXN002', amount: 1890000, customer: 'Trần Văn C', time: '13:42', status: 'processing' },
            { id: 'TXN003', amount: 3200000, customer: 'Lê Thị D', time: '13:38', status: 'completed' }
        ]
    });

    // Enhanced chart data for Vietnamese business
    const salesTrendData = [
        { date: '10/01', revenue: 8200000, orders: 42, profit: 3100000 },
        { date: '11/01', revenue: 9800000, orders: 51, profit: 3650000 },
        { date: '12/01', revenue: 7900000, orders: 38, profit: 2890000 },
        { date: '13/01', revenue: 11700000, orders: 58, profit: 4230000 },
        { date: '14/01', revenue: 10200000, orders: 47, profit: 3840000 },
        { date: '15/01', revenue: 13100000, orders: 62, profit: 4850000 },
        { date: '16/01', revenue: 14900000, orders: 71, profit: 5560000 }
    ];

    const categoryPerformance = [
        { type: 'Điện thoại', value: 45600000, percentage: 36.3, growth: 12.5 },
        { type: 'Laptop', value: 38900000, percentage: 31.0, growth: 8.2 },
        { type: 'Phụ kiện', value: 15400000, percentage: 12.3, growth: 22.1 },
        { type: 'Tablet', value: 12200000, percentage: 9.7, growth: 5.8 },
        { type: 'Đồng hồ', value: 13580000, percentage: 10.8, growth: 15.3 }
    ];

    const topProducts = [
        { name: 'iPhone 15 Pro Max', sold: 234, revenue: 81900000, stock: 45, trend: 'up' },
        { name: 'Samsung Galaxy S24', sold: 198, revenue: 59400000, stock: 67, trend: 'up' },
        { name: 'MacBook Air M3', sold: 156, revenue: 51480000, stock: 23, trend: 'down' },
        { name: 'iPad Pro 12.9', sold: 143, revenue: 42900000, stock: 89, trend: 'up' },
        { name: 'AirPods Pro 2', sold: 289, revenue: 19623000, stock: 156, trend: 'up' }
    ];

    const customerAnalytics = [
        { segment: 'VIP', count: 245, revenue: 89600000, avgSpend: 365500 },
        { segment: 'Thường xuyên', count: 1234, revenue: 45600000, avgSpend: 126800 },
        { segment: 'Mới', count: 1567, revenue: 23400000, avgSpend: 89200 },
        { segment: 'Không hoạt động', count: 678, revenue: 5600000, avgSpend: 45600 }
    ];

    // System alerts and notifications
    const systemAlerts = [
        { 
            id: 1, 
            type: 'warning', 
            title: 'Sắp hết hàng', 
            message: 'iPhone 15 Pro Max chỉ còn 5 chiếc trong kho',
            time: '5 phút trước',
            action: 'Nhập hàng'
        },
        { 
            id: 2, 
            type: 'info', 
            title: 'Thanh toán thành công', 
            message: 'Đơn hàng #DH2025001 đã được thanh toán',
            time: '12 phút trước',
            action: 'Xem chi tiết'
        },
        { 
            id: 3, 
            type: 'success', 
            title: 'Backup hoàn thành', 
            message: 'Sao lưu dữ liệu ngày 16/01/2025 thành công',
            time: '2 giờ trước',
            action: 'Tải về'
        },
        { 
            id: 4, 
            type: 'error', 
            title: 'Lỗi thanh toán', 
            message: 'Giao dịch VNPay #VNP789 thất bại',
            time: '3 giờ trước',
            action: 'Xử lý'
        }
    ];

    // Performance metrics
    const performanceMetrics = [
        { metric: 'Hiệu suất hệ thống', value: 94, target: 95, status: 'good' },
        { metric: 'Thời gian phản hồi', value: 98, target: 95, status: 'excellent' },
        { metric: 'Tỷ lệ lỗi', value: 1.2, target: 2, status: 'excellent' },
        { metric: 'Độ tin cậy', value: 99.8, target: 99, status: 'excellent' },
        { metric: 'Bảo mật', value: 96, target: 95, status: 'good' }
    ];

    // Staff performance data
    const staffPerformance = [
        { name: 'Nguyễn Văn A', sales: 145, revenue: 89600000, rating: 4.9, efficiency: 95 },
        { name: 'Trần Thị B', sales: 132, revenue: 78400000, rating: 4.7, efficiency: 88 },
        { name: 'Lê Văn C', sales: 118, revenue: 65200000, rating: 4.5, efficiency: 82 },
        { name: 'Phạm Thị D', sales: 106, revenue: 56800000, rating: 4.3, efficiency: 78 },
        { name: 'Hoàng Văn E', sales: 94, revenue: 48900000, rating: 4.1, efficiency: 75 }
    ];

    // Initialize dashboard
    useEffect(() => {
        const timer = setTimeout(() => {
            setLoading(false);
        }, 1500);

        // Simulate real-time updates
        const interval = setInterval(() => {
            setRealtimeData(prev => ({
                ...prev,
                onlineUsers: Math.max(prev.onlineUsers + Math.floor(Math.random() * 10) - 5, 50),
                pendingNotifications: Math.max(prev.pendingNotifications + Math.floor(Math.random() * 3) - 1, 0),
                serverLoad: Math.min(Math.max(prev.serverLoad + Math.floor(Math.random() * 6) - 3, 30), 90)
            }));
        }, 5000);

        return () => {
            clearTimeout(timer);
            clearInterval(interval);
        };
    }, []);

    // Enhanced KPI cards with animations
    const renderKPICards = () => {
        const kpis = [
            {
                title: 'Tổng doanh thu',
                value: dashboardData.totalRevenue,
                format: formatVND,
                icon: <DollarOutlined />,
                growth: dashboardData.revenueGrowth,
                color: '#1890ff',
                target: 150000000,
                description: 'Mục tiêu tháng: 150tr'
            },
            {
                title: 'Tổng đơn hàng',
                value: dashboardData.totalOrders,
                icon: <ShoppingCartOutlined />,
                growth: dashboardData.orderGrowth,
                color: '#52c41a',
                target: 1500,
                description: 'Tăng 12.3% so với tháng trước'
            },
            {
                title: 'Khách hàng',
                value: dashboardData.totalCustomers,
                icon: <UserOutlined />,
                growth: dashboardData.customerGrowth,
                color: '#722ed1',
                target: 4000,
                description: 'Khách hàng mới: 1,300'
            },
            {
                title: 'Lợi nhuận ròng',
                value: dashboardData.netProfit,
                format: formatVND,
                icon: <FundOutlined />,
                growth: 15.8,
                color: '#fa8c16',
                target: 40000000,
                description: 'Tỷ lệ lợi nhuận: 25.8%'
            },
            {
                title: 'Sản phẩm',
                value: dashboardData.totalProducts,
                icon: <AppstoreOutlined />,
                growth: dashboardData.productGrowth,
                color: '#13c2c2',
                target: 3000,
                description: 'Sản phẩm mới: 145'
            },
            {
                title: 'Nhân viên',
                value: dashboardData.activeStaff,
                icon: <TeamOutlined />,
                growth: 7.1,
                color: '#eb2f96',
                target: 20,
                description: 'Hiệu suất TB: 87.5%'
            }
        ];

        return (
            <Row gutter={[16, 16]}>
                {kpis.map((kpi, index) => (
                    <Col key={index} xs={24} sm={12} md={8} lg={6} xl={4}>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <Card 
                                className="kpi-card gradient-card"
                                loading={loading}
                                hoverable
                                style={{ 
                                    height: '100%',
                                    background: `linear-gradient(135deg, ${kpi.color}15 0%, ${kpi.color}05 100%)`,
                                    border: `1px solid ${kpi.color}20`,
                                    borderRadius: '12px',
                                    overflow: 'hidden'
                                }}
                            >
                                <div className="kpi-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                    <div className="kpi-icon" style={{ 
                                        backgroundColor: `${kpi.color}20`, 
                                        padding: '8px', 
                                        borderRadius: '8px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        {React.cloneElement(kpi.icon, { style: { color: kpi.color, fontSize: '20px' } })}
                                    </div>
                                    <div className="kpi-growth">
                                        {kpi.growth > 0 ? (
                                            <Tag color="success" style={{ margin: 0 }}>
                                                <ArrowUpOutlined /> {kpi.growth}%
                                            </Tag>
                                        ) : (
                                            <Tag color="error" style={{ margin: 0 }}>
                                                <ArrowDownOutlined /> {Math.abs(kpi.growth)}%
                                            </Tag>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="kpi-content">
                                    <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: 4 }}>
                                        {kpi.title}
                                    </Text>
                                    <Title level={3} style={{ margin: 0, color: kpi.color, fontSize: '24px' }}>
                                        {kpi.format ? kpi.format(kpi.value) : kpi.value.toLocaleString('vi-VN')}
                                    </Title>
                                    <Text type="secondary" style={{ fontSize: '11px' }}>
                                        {kpi.description}
                                    </Text>
                                </div>
                                
                                <div className="kpi-progress" style={{ marginTop: 8 }}>
                                    <Progress
                                        percent={Math.round((kpi.value / kpi.target) * 100)}
                                        strokeColor={kpi.color}
                                        size="small"
                                        showInfo={false}
                                    />
                                </div>
                            </Card>
                        </motion.div>
                    </Col>
                ))}
            </Row>
        );
    };

    // Enhanced alerts section
    const renderAlertsSection = () => (
        <Card 
            title={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Space>
                        <AlertOutlined style={{ color: '#fa8c16' }} />
                        <span>Thông báo hệ thống</span>
                        <Badge count={systemAlerts.length} />
                    </Space>
                    <Button size="small" onClick={() => setAlertModalVisible(true)}>
                        Xem tất cả
                    </Button>
                </div>
            }
            className="alerts-card"
            style={{ height: '100%' }}
        >
            <List
                dataSource={systemAlerts.slice(0, 4)}
                renderItem={alert => (
                    <List.Item style={{ padding: '8px 0' }}>
                        <List.Item.Meta
                            avatar={
                                <Avatar 
                                    style={{ 
                                        backgroundColor: alert.type === 'warning' ? '#fa8c16' :
                                                        alert.type === 'error' ? '#ff4d4f' :
                                                        alert.type === 'success' ? '#52c41a' : '#1890ff'
                                    }}
                                    icon={
                                        alert.type === 'warning' ? <WarningOutlined /> :
                                        alert.type === 'error' ? <CloseCircleOutlined /> :
                                        alert.type === 'success' ? <CheckCircleOutlined /> : <InfoCircleOutlined />
                                    }
                                />
                            }
                            title={<Text strong>{alert.title}</Text>}
                            description={
                                <div>
                                    <Text type="secondary" style={{ fontSize: '12px' }}>{alert.message}</Text>
                                    <br />
                                    <Text type="secondary" style={{ fontSize: '11px' }}>{alert.time}</Text>
                                </div>
                            }
                        />
                        <Button size="small" type="primary" ghost>
                            {alert.action}
                        </Button>
                    </List.Item>
                )}
            />
        </Card>
    );

    // Enhanced real-time section
    const renderRealTimeSection = () => (
        <Card 
            title={
                <Space>
                    <SyncOutlined spin style={{ color: '#52c41a' }} />
                    <span>Theo dõi thời gian thực</span>
                </Space>
            }
            className="realtime-card"
            style={{ height: '100%' }}
        >
            <Row gutter={[16, 16]}>
                <Col span={12}>
                    <Statistic
                        title="Người dùng online"
                        value={realtimeData.onlineUsers}
                        prefix={<UserOutlined style={{ color: '#1890ff' }} />}
                        suffix="người"
                        valueStyle={{ color: '#1890ff' }}
                    />
                </Col>
                <Col span={12}>
                    <Statistic
                        title="Terminal hoạt động"
                        value={realtimeData.activeTerminals}
                        prefix={<DatabaseOutlined style={{ color: '#52c41a' }} />}
                        suffix="máy"
                        valueStyle={{ color: '#52c41a' }}
                    />
                </Col>
                <Col span={24}>
                    <Divider style={{ margin: '12px 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <Text strong>Tải hệ thống</Text>
                        <Text>{realtimeData.serverLoad}%</Text>
                    </div>
                    <Progress 
                        percent={realtimeData.serverLoad} 
                        strokeColor={realtimeData.serverLoad > 80 ? '#ff4d4f' : realtimeData.serverLoad > 60 ? '#fa8c16' : '#52c41a'}
                        size="small"
                    />
                </Col>
                <Col span={24}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <Text strong>Kích thước DB</Text>
                        <Text>{realtimeData.databaseSize} GB</Text>
                    </div>
                    <Progress percent={48} strokeColor="#722ed1" size="small" />
                </Col>
            </Row>
        </Card>
    );

    // Enhanced performance section
    const renderPerformanceSection = () => (
        <Card 
            title={
                <Space>
                    <TrophyOutlined style={{ color: '#fa8c16' }} />
                    <span>Hiệu suất hệ thống</span>
                </Space>
            }
            className="performance-card"
            style={{ height: '100%' }}
        >
            {performanceMetrics.map((metric, index) => (
                <div key={index} style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <Text strong style={{ fontSize: '12px' }}>{metric.metric}</Text>
                        <div>
                            <Text style={{ fontSize: '12px', marginRight: 8 }}>{metric.value}%</Text>
                            {metric.status === 'excellent' && <Badge status="success" />}
                            {metric.status === 'good' && <Badge status="processing" />}
                            {metric.status === 'warning' && <Badge status="warning" />}
                        </div>
                    </div>
                    <Progress 
                        percent={metric.value} 
                        strokeColor={
                            metric.status === 'excellent' ? '#52c41a' :
                            metric.status === 'good' ? '#1890ff' : '#fa8c16'
                        }
                        size="small"
                        showInfo={false}
                    />
                </div>
            ))}
        </Card>
    );

    // Enhanced charts section
    const renderChartsSection = () => (
        <Row gutter={[16, 16]}>
            <Col xs={24} lg={16}>
                <Card 
                    title={
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Space>
                                <LineChartOutlined style={{ color: '#1890ff' }} />
                                <span>Xu hướng doanh thu</span>
                            </Space>
                            <Space>
                                <Select defaultValue="7days" size="small" style={{ width: 120 }}>
                                    <Option value="7days">7 ngày</Option>
                                    <Option value="30days">30 ngày</Option>
                                    <Option value="90days">90 ngày</Option>
                                </Select>
                                <Button size="small" icon={<FilterOutlined />}>Lọc</Button>
                            </Space>
                        </div>
                    }
                    className="chart-card"
                    style={{ height: '400px' }}
                >
                    <DualAxes data={salesTrendData} height={300} />
                </Card>
            </Col>
            <Col xs={24} lg={8}>
                <Card 
                    title={
                        <Space>
                            <PieChartOutlined style={{ color: '#722ed1' }} />
                            <span>Phân bổ theo danh mục</span>
                        </Space>
                    }
                    className="chart-card"
                    style={{ height: '400px' }}
                >
                    <Pie data={categoryPerformance} height={300} />
                </Card>
            </Col>
        </Row>
    );

    // Enhanced tables section
    const renderTablesSection = () => {
        const productColumns = [
            {
                title: 'Sản phẩm',
                dataIndex: 'name',
                key: 'name',
                render: (text: string, record: any) => (
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar shape="square" size="small" style={{ marginRight: 8, backgroundColor: '#f0f2f5' }}>
                            {text[0]}
                        </Avatar>
                        <div>
                            <Text strong>{text}</Text>
                            <br />
                            <Text type="secondary" style={{ fontSize: '11px' }}>
                                Tồn: {record.stock}
                            </Text>
                        </div>
                    </div>
                )
            },
            {
                title: 'Đã bán',
                dataIndex: 'sold',
                key: 'sold',
                render: (value: number) => (
                    <Text strong>{value.toLocaleString('vi-VN')}</Text>
                )
            },
            {
                title: 'Doanh thu',
                dataIndex: 'revenue',
                key: 'revenue',
                render: (value: number) => (
                    <Text strong style={{ color: '#1890ff' }}>{formatVND(value)}</Text>
                )
            },
            {
                title: 'Xu hướng',
                dataIndex: 'trend',
                key: 'trend',
                render: (trend: string) => (
                    <Tag color={trend === 'up' ? 'success' : 'error'}>
                        {trend === 'up' ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                        {trend === 'up' ? 'Tăng' : 'Giảm'}
                    </Tag>
                )
            }
        ];

        const staffColumns = [
            {
                title: 'Nhân viên',
                dataIndex: 'name',
                key: 'name',
                render: (text: string, record: any) => (
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar style={{ marginRight: 8, backgroundColor: '#1890ff' }}>
                            {text.split(' ').pop()?.charAt(0)}
                        </Avatar>
                        <div>
                            <Text strong>{text}</Text>
                            <br />
                            <Rate disabled defaultValue={record.rating} style={{ fontSize: '12px' }} />
                        </div>
                    </div>
                )
            },
            {
                title: 'Doanh số',
                dataIndex: 'sales',
                key: 'sales',
                render: (value: number) => (
                    <Text strong>{value} đơn</Text>
                )
            },
            {
                title: 'Doanh thu',
                dataIndex: 'revenue',
                key: 'revenue',
                render: (value: number) => (
                    <Text strong style={{ color: '#52c41a' }}>{formatVND(value)}</Text>
                )
            },
            {
                title: 'Hiệu suất',
                dataIndex: 'efficiency',
                key: 'efficiency',
                render: (value: number) => (
                    <div>
                        <Text strong>{value}%</Text>
                        <Progress 
                            percent={value} 
                            size="small" 
                            showInfo={false}
                            strokeColor={value > 90 ? '#52c41a' : value > 75 ? '#1890ff' : '#fa8c16'}
                        />
                    </div>
                )
            }
        ];

        return (
            <Row gutter={[16, 16]}>
                <Col xs={24} lg={12}>
                    <Card 
                        title={
                            <Space>
                                <FireOutlined style={{ color: '#fa8c16' }} />
                                <span>Sản phẩm bán chạy</span>
                            </Space>
                        }
                        extra={<Button type="link" size="small">Xem tất cả</Button>}
                        className="table-card"
                    >
                        <Table 
                            columns={productColumns}
                            dataSource={topProducts}
                            pagination={false}
                            size="small"
                            rowKey="name"
                        />
                    </Card>
                </Col>
                <Col xs={24} lg={12}>
                    <Card 
                        title={
                            <Space>
                                <CrownOutlined style={{ color: '#722ed1' }} />
                                <span>Nhân viên xuất sắc</span>
                            </Space>
                        }
                        extra={<Button type="link" size="small">Xem tất cả</Button>}
                        className="table-card"
                    >
                        <Table 
                            columns={staffColumns}
                            dataSource={staffPerformance}
                            pagination={false}
                            size="small"
                            rowKey="name"
                        />
                    </Card>
                </Col>
            </Row>
        );
    };

    // Main dashboard header
    const renderDashboardHeader = () => (
        <div className="dashboard-header" style={{ marginBottom: 24 }}>
            <div className="dashboard-title">
                <Title level={2} style={{ margin: 0, color: '#1890ff' }}>
                    <DashboardOutlined /> Dashboard Quản trị
                </Title>
                <Paragraph style={{ margin: 0, color: '#666' }}>
                    Tổng quan toàn diện về hoạt động kinh doanh - Cập nhật: {formatDate(new Date())}
                </Paragraph>
            </div>
            <div className="dashboard-actions">
                <Space size="middle">
                    <Select 
                        value={selectedPeriod} 
                        onChange={setSelectedPeriod}
                        style={{ width: 120 }}
                    >
                        <Option value="today">Hôm nay</Option>
                        <Option value="week">Tuần này</Option>
                        <Option value="month">Tháng này</Option>
                        <Option value="year">Năm này</Option>
                    </Select>
                    <RangePicker 
                        format="DD/MM/YYYY"
                        placeholder={['Từ ngày', 'Đến ngày']}
                    />
                    <Button 
                        type="primary" 
                        icon={<DownloadOutlined />}
                        onClick={() => message.success('Đang xuất báo cáo...')}
                    >
                        Xuất báo cáo
                    </Button>
                    <Button 
                        icon={<SettingOutlined />}
                        onClick={() => setSettingsDrawerVisible(true)}
                    >
                        Cài đặt
                    </Button>
                </Space>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div style={{ padding: '20px' }}>
                <Skeleton avatar paragraph={{ rows: 4 }} />
                <Skeleton avatar paragraph={{ rows: 4 }} />
                <Skeleton avatar paragraph={{ rows: 4 }} />
            </div>
        );
    }

    return (
        <ConfigProvider
            theme={{
                token: {
                    colorPrimary: '#1890ff',
                    borderRadius: 8,
                    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                }
            }}
        >
            <div className="admin-dashboard" style={{ padding: '20px', background: '#f5f5f5', minHeight: '100vh' }}>
                {renderDashboardHeader()}
                
                {/* System Status Alert */}
                <Alert
                    message={
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>Hệ thống đang hoạt động bình thường - Hiệu suất: 94% - Uptime: 99.9%</span>
                            <Space>
                                <Badge status="success" text="Healthy" />
                                <Button size="small" type="link">Chi tiết</Button>
                            </Space>
                        </div>
                    }
                    type="success"
                    showIcon
                    closable
                    style={{ marginBottom: 24 }}
                />

                {/* KPI Cards */}
                {renderKPICards()}

                {/* Quick Actions */}
                <Card style={{ margin: '24px 0' }}>
                    <Title level={4} style={{ marginBottom: 16 }}>
                        <RightOutlined style={{ color: '#1890ff' }} /> Thao tác nhanh
                    </Title>
                    <Row gutter={[16, 16]}>
                        <Col xs={12} sm={8} md={6} lg={4}>
                            <Button 
                                type="primary" 
                                block 
                                icon={<PlusOutlined />}
                                onClick={() => navigate('/products/add')}
                            >
                                Thêm sản phẩm
                            </Button>
                        </Col>
                        <Col xs={12} sm={8} md={6} lg={4}>
                            <Button 
                                block 
                                icon={<ShoppingCartOutlined />}
                                onClick={() => navigate('/pos')}
                            >
                                Mở POS
                            </Button>
                        </Col>
                        <Col xs={12} sm={8} md={6} lg={4}>
                            <Button 
                                block 
                                icon={<UserOutlined />}
                                onClick={() => navigate('/customers')}
                            >
                                Quản lý KH
                            </Button>
                        </Col>
                        <Col xs={12} sm={8} md={6} lg={4}>
                            <Button 
                                block 
                                icon={<FileTextOutlined />}
                                onClick={() => navigate('/reports')}
                            >
                                Báo cáo
                            </Button>
                        </Col>
                        <Col xs={12} sm={8} md={6} lg={4}>
                            <Button 
                                block 
                                icon={<DatabaseOutlined />}
                                onClick={() => message.info('Đang sao lưu dữ liệu...')}
                            >
                                Sao lưu
                            </Button>
                        </Col>
                        <Col xs={12} sm={8} md={6} lg={4}>
                            <Button 
                                block 
                                icon={<SettingOutlined />}
                                onClick={() => navigate('/settings')}
                            >
                                Cài đặt
                            </Button>
                        </Col>
                    </Row>
                </Card>

                {/* Real-time monitoring */}
                <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                    <Col xs={24} sm={12} md={8}>
                        {renderAlertsSection()}
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                        {renderRealTimeSection()}
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                        {renderPerformanceSection()}
                    </Col>
                </Row>

                {/* Charts */}
                {renderChartsSection()}

                {/* Tables */}
                <div style={{ marginTop: 24 }}>
                    {renderTablesSection()}
                </div>

                {/* Live Transactions */}
                <Card 
                    title={
                        <Space>
                            <SyncOutlined spin style={{ color: '#52c41a' }} />
                            <span>Giao dịch trực tiếp</span>
                        </Space>
                    }
                    style={{ marginTop: 24 }}
                >
                    <Timeline>
                        {realtimeData.liveTransactions.map((txn, index) => (
                            <Timeline.Item
                                key={txn.id}
                                color={txn.status === 'completed' ? 'green' : 'blue'}
                                dot={txn.status === 'completed' ? <CheckCircleOutlined /> : <SyncOutlined spin />}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <Text strong>{txn.id}</Text> - {txn.customer}
                                        <br />
                                        <Text type="secondary" style={{ fontSize: '12px' }}>
                                            {txn.time} - {txn.status === 'completed' ? 'Hoàn thành' : 'Đang xử lý'}
                                        </Text>
                                    </div>
                                    <Text strong style={{ color: '#1890ff' }}>
                                        {formatVND(txn.amount)}
                                    </Text>
                                </div>
                            </Timeline.Item>
                        ))}
                    </Timeline>
                </Card>

                {/* Back to top */}
                <BackTop />

                {/* Alerts Modal */}
                <Modal
                    title="Tất cả thông báo"
                    open={alertModalVisible}
                    onCancel={() => setAlertModalVisible(false)}
                    footer={null}
                    width={800}
                >
                    <List
                        dataSource={systemAlerts}
                        renderItem={alert => (
                            <List.Item
                                actions={[
                                    <Button key="action" type="primary" size="small">
                                        {alert.action}
                                    </Button>
                                ]}
                            >
                                <List.Item.Meta
                                    avatar={
                                        <Avatar 
                                            style={{ 
                                                backgroundColor: alert.type === 'warning' ? '#fa8c16' :
                                                                alert.type === 'error' ? '#ff4d4f' :
                                                                alert.type === 'success' ? '#52c41a' : '#1890ff'
                                            }}
                                            icon={
                                                alert.type === 'warning' ? <WarningOutlined /> :
                                                alert.type === 'error' ? <CloseCircleOutlined /> :
                                                alert.type === 'success' ? <CheckCircleOutlined /> : <InfoCircleOutlined />
                                            }
                                        />
                                    }
                                    title={alert.title}
                                    description={
                                        <div>
                                            <Text>{alert.message}</Text>
                                            <br />
                                            <Text type="secondary" style={{ fontSize: '12px' }}>
                                                {alert.time}
                                            </Text>
                                        </div>
                                    }
                                />
                            </List.Item>
                        )}
                    />
                </Modal>

                {/* Settings Drawer */}
                <Drawer
                    title="Cài đặt Dashboard"
                    placement="right"
                    onClose={() => setSettingsDrawerVisible(false)}
                    open={settingsDrawerVisible}
                    width={400}
                >
                    <Form layout="vertical">
                        <Form.Item label="Chế độ hiển thị">
                            <Radio.Group defaultValue="light">
                                <Radio value="light">Sáng</Radio>
                                <Radio value="dark">Tối</Radio>
                                <Radio value="auto">Tự động</Radio>
                            </Radio.Group>
                        </Form.Item>
                        <Form.Item label="Tự động làm mới">
                            <Switch defaultChecked />
                        </Form.Item>
                        <Form.Item label="Thời gian làm mới (giây)">
                            <Slider defaultValue={30} min={10} max={300} />
                        </Form.Item>
                        <Form.Item label="Hiển thị thông báo">
                            <Switch defaultChecked />
                        </Form.Item>
                        <Form.Item label="Âm thanh thông báo">
                            <Switch />
                        </Form.Item>
                    </Form>
                </Drawer>
            </div>
        </ConfigProvider>
    );
};

export default AdminDashboard;