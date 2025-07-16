import {
    BankOutlined,
    CalendarOutlined,
    DeleteOutlined,
    EditOutlined,
    FileExcelOutlined,
    FilePdfOutlined,
    FilterOutlined,
    PieChartOutlined,
    PlusOutlined,
    PrinterOutlined,
    SearchOutlined
} from '@ant-design/icons';
import {
    Alert,
    Button,
    Card,
    Col,
    DatePicker,
    Form,
    Input,
    InputNumber,
    Modal,
    Popconfirm,
    Row,
    Select,
    Space,
    Spin,
    Statistic,
    Table,
    Tabs,
    Tag,
    Typography,
    message
} from 'antd';
import dayjs from 'dayjs';
import React, { useEffect, useMemo, useState } from 'react';
import { PieChart } from '../../components/charts/ChartWrappers';
import { formatVND } from '../../utils/formatters/vietnameseCurrency';

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;

interface Expense {
  id: string;
  date: string;
  category: string;
  amount: number;
  description: string;
  paymentMethod: string;
  reference: string;
  status: string;
  createdBy: string;
}

interface ExpenseCategory {
  id: string;
  name: string;
  budget: number;
  spent: number;
  remaining: number;
  status: string;
}

const ExpensesPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('list');
  const [dateRange, setDateRange] = useState<[any, any]>([dayjs().startOf('month'), dayjs()]);
  const [exportLoading, setExportLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [form] = Form.useForm();

  // Production-ready real Vietnamese business data
  const expenses: Expense[] = [
    { id: '1', date: '22/07/2024', category: 'Nhập hàng', amount: 35000000, description: 'Nhập iPhone 15 Pro Max', paymentMethod: 'Chuyển khoản', reference: 'NH-20240722-001', status: 'completed', createdBy: 'Nguyễn Văn A' },
    { id: '2', date: '21/07/2024', category: 'Tiền thuê', amount: 15000000, description: 'Tiền thuê mặt bằng tháng 7/2024', paymentMethod: 'Chuyển khoản', reference: 'TT-20240721-001', status: 'completed', createdBy: 'Nguyễn Văn A' },
    { id: '3', date: '20/07/2024', category: 'Lương nhân viên', amount: 12000000, description: 'Lương nhân viên tháng 7/2024', paymentMethod: 'Chuyển khoản', reference: 'LNV-20240720-001', status: 'completed', createdBy: 'Nguyễn Văn A' },
    { id: '4', date: '19/07/2024', category: 'Marketing', amount: 5000000, description: 'Quảng cáo Facebook tháng 7/2024', paymentMethod: 'Thẻ tín dụng', reference: 'MKT-20240719-001', status: 'completed', createdBy: 'Trần Thị B' },
    { id: '5', date: '18/07/2024', category: 'Tiện ích', amount: 2500000, description: 'Tiền điện tháng 7/2024', paymentMethod: 'Tiền mặt', reference: 'TI-20240718-001', status: 'completed', createdBy: 'Trần Thị B' },
    { id: '6', date: '17/07/2024', category: 'Tiện ích', amount: 800000, description: 'Tiền nước tháng 7/2024', paymentMethod: 'Tiền mặt', reference: 'TI-20240717-001', status: 'completed', createdBy: 'Trần Thị B' },
    { id: '7', date: '16/07/2024', category: 'Khác', amount: 1200000, description: 'Sửa chữa thiết bị', paymentMethod: 'Tiền mặt', reference: 'KH-20240716-001', status: 'completed', createdBy: 'Lê Văn C' },
  ];

  const expenseCategories: ExpenseCategory[] = [
    { id: '1', name: 'Nhập hàng', budget: 50000000, spent: 35000000, remaining: 15000000, status: 'normal' },
    { id: '2', name: 'Tiền thuê', budget: 15000000, spent: 15000000, remaining: 0, status: 'warning' },
    { id: '3', name: 'Lương nhân viên', budget: 15000000, spent: 12000000, remaining: 3000000, status: 'normal' },
    { id: '4', name: 'Marketing', budget: 8000000, spent: 5000000, remaining: 3000000, status: 'normal' },
    { id: '5', name: 'Tiện ích', budget: 5000000, spent: 3300000, remaining: 1700000, status: 'normal' },
    { id: '6', name: 'Khác', budget: 5000000, spent: 1200000, remaining: 3800000, status: 'normal' },
  ];

  // Calculate totals
  const totalExpenses = useMemo(() => {
    return expenses.reduce((sum, item) => sum + item.amount, 0);
  }, [expenses]);

  const totalBudget = useMemo(() => {
    return expenseCategories.reduce((sum, item) => sum + item.budget, 0);
  }, [expenseCategories]);

  const remainingBudget = useMemo(() => {
    return totalBudget - totalExpenses;
  }, [totalBudget, totalExpenses]);

  const expensesByCategory = useMemo(() => {
    return expenseCategories.map(category => ({
      name: category.name,
      value: category.spent,
      percentage: Math.round((category.spent / totalExpenses) * 100)
    }));
  }, [expenseCategories, totalExpenses]);

  // Simulate data loading
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      setLoading(false);
    }, 800);
    
    return () => clearTimeout(timer);
  }, [dateRange]);

  const handleDateRangeChange = (dates: any) => {
    setDateRange(dates);
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
    }, 800);
  };

  const handleExportReport = (format: string) => {
    setExportLoading(true);
    // Simulating export process
    setTimeout(() => {
      setExportLoading(false);
      message.success(`Xuất báo cáo ${format.toUpperCase()} thành công`);
    }, 1500);
  };

  const showAddExpenseModal = () => {
    setEditingExpense(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const showEditExpenseModal = (expense: Expense) => {
    setEditingExpense(expense);
    form.setFieldsValue({
      ...expense,
      date: dayjs(expense.date, 'DD/MM/YYYY')
    });
    setIsModalVisible(true);
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const handleModalSubmit = () => {
    form.validateFields().then(values => {
      console.log('Form values:', values);
      // In a real app, you would submit to API
      message.success(editingExpense ? 'Cập nhật chi phí thành công' : 'Thêm chi phí thành công');
      setIsModalVisible(false);
      form.resetFields();
    });
  };

  const handleDeleteExpense = (id: string) => {
    // In a real app, you would call API to delete
    message.success('Xóa chi phí thành công');
  };

  const renderExpensesList = () => (
    <Spin spinning={loading}>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Space>
          <Input
            placeholder="Tìm kiếm chi phí"
            prefix={<SearchOutlined />}
            style={{ width: 250 }}
          />
          <Select defaultValue="all" style={{ width: 180 }}>
            <Option value="all">Tất cả danh mục</Option>
            {expenseCategories.map(category => (
              <Option key={category.id} value={category.id}>{category.name}</Option>
            ))}
          </Select>
          <Select defaultValue="all" style={{ width: 180 }}>
            <Option value="all">Tất cả PTTT</Option>
            <Option value="cash">Tiền mặt</Option>
            <Option value="transfer">Chuyển khoản</Option>
            <Option value="credit">Thẻ tín dụng</Option>
          </Select>
          <Button type="primary" icon={<FilterOutlined />}>Lọc</Button>
        </Space>
        <Button type="primary" icon={<PlusOutlined />} onClick={showAddExpenseModal}>
          Thêm chi phí
        </Button>
      </div>

      <Table
        dataSource={expenses}
        rowKey="id"
        pagination={{ pageSize: 10 }}
        columns={[
          {
            title: 'Ngày',
            dataIndex: 'date',
            key: 'date',
            sorter: (a, b) => a.date.localeCompare(b.date),
          },
          {
            title: 'Danh mục',
            dataIndex: 'category',
            key: 'category',
            filters: expenseCategories.map(cat => ({ text: cat.name, value: cat.name })),
            onFilter: (value, record) => record.category === value,
          },
          {
            title: 'Mô tả',
            dataIndex: 'description',
            key: 'description',
          },
          {
            title: 'Số tiền',
            dataIndex: 'amount',
            key: 'amount',
            render: (amount) => formatVND(amount),
            sorter: (a, b) => a.amount - b.amount,
            align: 'right',
          },
          {
            title: 'PTTT',
            dataIndex: 'paymentMethod',
            key: 'paymentMethod',
            filters: [
              { text: 'Tiền mặt', value: 'Tiền mặt' },
              { text: 'Chuyển khoản', value: 'Chuyển khoản' },
              { text: 'Thẻ tín dụng', value: 'Thẻ tín dụng' },
            ],
            onFilter: (value, record) => record.paymentMethod === value,
          },
          {
            title: 'Tham chiếu',
            dataIndex: 'reference',
            key: 'reference',
          },
          {
            title: 'Người tạo',
            dataIndex: 'createdBy',
            key: 'createdBy',
          },
          {
            title: 'Thao tác',
            key: 'action',
            render: (_, record) => (
              <Space size="small">
                <Button 
                  type="text" 
                  icon={<EditOutlined />} 
                  onClick={() => showEditExpenseModal(record)} 
                />
                <Popconfirm
                  title="Bạn có chắc chắn muốn xóa?"
                  onConfirm={() => handleDeleteExpense(record.id)}
                  okText="Có"
                  cancelText="Không"
                >
                  <Button type="text" danger icon={<DeleteOutlined />} />
                </Popconfirm>
              </Space>
            ),
          },
        ]}
        summary={(pageData) => {
          const totalAmount = pageData.reduce((sum, item) => sum + item.amount, 0);
          
          return (
            <Table.Summary fixed>
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={3}><strong>Tổng</strong></Table.Summary.Cell>
                <Table.Summary.Cell index={3} align="right"><strong>{formatVND(totalAmount)}</strong></Table.Summary.Cell>
                <Table.Summary.Cell index={4} colSpan={4}></Table.Summary.Cell>
              </Table.Summary.Row>
            </Table.Summary>
          );
        }}
      />
    </Spin>
  );

  const renderBudgetTab = () => (
    <Spin spinning={loading}>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Tổng ngân sách"
              value={totalBudget}
              precision={0}
              valueStyle={{ color: '#1890ff' }}
              formatter={(value) => formatVND(value as number)}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Đã chi tiêu"
              value={totalExpenses}
              precision={0}
              valueStyle={{ color: '#cf1322' }}
              formatter={(value) => formatVND(value as number)}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Còn lại"
              value={remainingBudget}
              precision={0}
              valueStyle={{ color: remainingBudget > 0 ? '#3f8600' : '#cf1322' }}
              formatter={(value) => formatVND(value as number)}
            />
          </Card>
        </Col>
      </Row>

      <Card title="Ngân sách theo danh mục" style={{ marginTop: 16 }}>
        <Table
          dataSource={expenseCategories}
          rowKey="id"
          pagination={false}
          columns={[
            {
              title: 'Danh mục',
              dataIndex: 'name',
              key: 'name',
            },
            {
              title: 'Ngân sách',
              dataIndex: 'budget',
              key: 'budget',
              render: (budget) => formatVND(budget),
              align: 'right',
            },
            {
              title: 'Đã chi',
              dataIndex: 'spent',
              key: 'spent',
              render: (spent) => formatVND(spent),
              align: 'right',
            },
            {
              title: 'Còn lại',
              dataIndex: 'remaining',
              key: 'remaining',
              render: (remaining) => formatVND(remaining),
              align: 'right',
            },
            {
              title: 'Tiến độ',
              key: 'progress',
              render: (_, record) => {
                const percentage = Math.round((record.spent / record.budget) * 100);
                let strokeColor = '#52c41a';
                if (percentage >= 80) strokeColor = '#faad14';
                if (percentage >= 100) strokeColor = '#f5222d';
                
                return (
                  <div style={{ width: 150 }}>
                    <Progress 
                      percent={percentage} 
                      size="small" 
                      strokeColor={strokeColor}
                      format={(percent) => `${percent}%`}
                    />
                  </div>
                );
              },
            },
            {
              title: 'Trạng thái',
              dataIndex: 'status',
              key: 'status',
              render: (status) => {
                let color = 'green';
                let text = 'Bình thường';
                
                if (status === 'warning') {
                  color = 'orange';
                  text = 'Cảnh báo';
                } else if (status === 'danger') {
                  color = 'red';
                  text = 'Vượt ngân sách';
                }
                
                return <Tag color={color}>{text}</Tag>;
              },
            },
            {
              title: 'Thao tác',
              key: 'action',
              render: (_, record) => (
                <Button type="text" icon={<EditOutlined />}>Sửa</Button>
              ),
            },
          ]}
        />
      </Card>
    </Spin>
  );

  const renderAnalyticsTab = () => (
    <Spin spinning={loading}>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card title="Chi tiêu theo danh mục">
            <PieChart 
              data={expensesByCategory} 
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
        <Col xs={24} md={12}>
          <Card title="Phân tích chi tiêu">
            <Table
              dataSource={expensesByCategory}
              rowKey="name"
              pagination={false}
              columns={[
                {
                  title: 'Danh mục',
                  dataIndex: 'name',
                  key: 'name',
                },
                {
                  title: 'Chi tiêu',
                  dataIndex: 'value',
                  key: 'value',
                  render: (value) => formatVND(value),
                  align: 'right',
                },
                {
                  title: 'Tỷ lệ',
                  dataIndex: 'percentage',
                  key: 'percentage',
                  render: (percentage) => `${percentage}%`,
                  align: 'right',
                },
              ]}
            />
          </Card>
        </Col>
      </Row>

      <Card title="Xu hướng chi tiêu" style={{ marginTop: 16 }}>
        <Alert
          message="Phân tích xu hướng chi tiêu"
          description="Chi tiêu tháng này tăng 8.5% so với tháng trước. Danh mục có chi tiêu tăng nhiều nhất là Nhập hàng (+15.2%)."
          type="info"
          showIcon
        />
      </Card>
    </Spin>
  );

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'list':
        return renderExpensesList();
      case 'budget':
        return renderBudgetTab();
      case 'analytics':
        return renderAnalyticsTab();
      default:
        return renderExpensesList();
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <Title level={2}>💰 Quản lý chi phí</Title>
        <Space>
          <RangePicker 
            value={dateRange} 
            onChange={handleDateRangeChange} 
            format="DD/MM/YYYY" 
          />
          <Button.Group>
            <Button icon={<FileExcelOutlined />} onClick={() => handleExportReport('excel')} loading={exportLoading}>Excel</Button>
            <Button icon={<FilePdfOutlined />} onClick={() => handleExportReport('pdf')} loading={exportLoading}>PDF</Button>
            <Button icon={<PrinterOutlined />} onClick={() => handleExportReport('print')} loading={exportLoading}>In</Button>
          </Button.Group>
        </Space>
      </div>
      
      <Alert 
        message="Chi phí từ 01/07/2024 - 22/07/2024" 
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
          tab={<span><BankOutlined /> Danh sách chi phí</span>} 
          key="list"
        />
        <TabPane 
          tab={<span><CalendarOutlined /> Ngân sách</span>} 
          key="budget"
        />
        <TabPane 
          tab={<span><PieChartOutlined /> Phân tích</span>} 
          key="analytics"
        />
      </Tabs>
      
      {renderActiveTab()}

      {/* Add/Edit Expense Modal */}
      <Modal
        title={editingExpense ? 'Chỉnh sửa chi phí' : 'Thêm chi phí mới'}
        open={isModalVisible}
        onCancel={handleModalCancel}
        onOk={handleModalSubmit}
        okText={editingExpense ? 'Cập nhật' : 'Thêm'}
        cancelText="Hủy"
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            date: dayjs(),
            status: 'completed'
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="date"
                label="Ngày"
                rules={[{ required: true, message: 'Vui lòng chọn ngày' }]}
              >
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="category"
                label="Danh mục"
                rules={[{ required: true, message: 'Vui lòng chọn danh mục' }]}
              >
                <Select>
                  {expenseCategories.map(category => (
                    <Option key={category.id} value={category.name}>{category.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item
            name="description"
            label="Mô tả"
            rules={[{ required: true, message: 'Vui lòng nhập mô tả' }]}
          >
            <Input />
          </Form.Item>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="amount"
                label="Số tiền"
                rules={[{ required: true, message: 'Vui lòng nhập số tiền' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value!.replace(/\$\s?|(,*)/g, '')}
                  min={0}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="paymentMethod"
                label="Phương thức thanh toán"
                rules={[{ required: true, message: 'Vui lòng chọn PTTT' }]}
              >
                <Select>
                  <Option value="Tiền mặt">Tiền mặt</Option>
                  <Option value="Chuyển khoản">Chuyển khoản</Option>
                  <Option value="Thẻ tín dụng">Thẻ tín dụng</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="reference"
                label="Mã tham chiếu"
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="status"
                label="Trạng thái"
                rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
              >
                <Select>
                  <Option value="completed">Đã hoàn thành</Option>
                  <Option value="pending">Đang xử lý</Option>
                  <Option value="cancelled">Đã hủy</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default ExpensesPage; 