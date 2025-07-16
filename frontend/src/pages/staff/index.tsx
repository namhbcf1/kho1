import {
    BarChartOutlined,
    ClockCircleOutlined,
    DeleteOutlined,
    DollarOutlined,
    EditOutlined,
    LockOutlined,
    PlusOutlined,
    ScheduleOutlined,
    SearchOutlined,
    TeamOutlined,
    UnlockOutlined,
    UserOutlined
} from '@ant-design/icons';
import type { TabsProps } from 'antd';
import {
    Avatar,
    Badge,
    Button,
    Card,
    Col,
    Form,
    Input,
    Modal,
    Popconfirm,
    Row,
    Select,
    Space,
    Statistic,
    Table,
    Tabs,
    Tag,
    Typography
} from 'antd';
import React, { useState } from 'react';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

// Mock data for staff
const mockStaffData = [
  {
    id: '1',
    name: 'Nguyễn Văn A',
    email: 'nguyenvana@example.com',
    phone: '0901234567',
    role: 'admin',
    department: 'Quản lý',
    status: 'active',
    avatar: null,
    hireDate: '2023-01-15',
    sales: 45800000,
  },
  {
    id: '2',
    name: 'Trần Thị B',
    email: 'tranthib@example.com',
    phone: '0912345678',
    role: 'cashier',
    department: 'Thu ngân',
    status: 'active',
    avatar: null,
    hireDate: '2023-02-20',
    sales: 32500000,
  },
  {
    id: '3',
    name: 'Lê Văn C',
    email: 'levanc@example.com',
    phone: '0923456789',
    role: 'inventory',
    department: 'Kho hàng',
    status: 'inactive',
    avatar: null,
    hireDate: '2023-03-10',
    sales: 0,
  },
  {
    id: '4',
    name: 'Phạm Thị D',
    email: 'phamthid@example.com',
    phone: '0934567890',
    role: 'sales',
    department: 'Bán hàng',
    status: 'active',
    avatar: null,
    hireDate: '2023-04-05',
    sales: 28900000,
  },
  {
    id: '5',
    name: 'Hoàng Văn E',
    email: 'hoangvane@example.com',
    phone: '0945678901',
    role: 'sales',
    department: 'Bán hàng',
    status: 'active',
    avatar: null,
    hireDate: '2023-05-12',
    sales: 35600000,
  },
];

const roles = [
  { value: 'admin', label: 'Quản trị viên', color: '#108ee9' },
  { value: 'manager', label: 'Quản lý', color: '#722ed1' },
  { value: 'cashier', label: 'Thu ngân', color: '#52c41a' },
  { value: 'sales', label: 'Nhân viên bán hàng', color: '#faad14' },
  { value: 'inventory', label: 'Nhân viên kho', color: '#fa8c16' },
];

const StaffPage: React.FC<{ initialTab?: string }> = ({ initialTab = 'list' }) => {
  const [staff, setStaff] = useState(mockStaffData);
  const [searchText, setSearchText] = useState('');
  const [visible, setVisible] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any>(null);
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  // Filter staff based on search text and role filter
  const filteredStaff = staff.filter(
    (s) =>
      (searchText === '' ||
        s.name.toLowerCase().includes(searchText.toLowerCase()) ||
        s.email.toLowerCase().includes(searchText.toLowerCase()) ||
        s.phone.includes(searchText)) &&
      (selectedRole === null || s.role === selectedRole)
  );

  const activeStaff = staff.filter(s => s.status === 'active').length;
  const totalSales = staff.reduce((sum, s) => sum + s.sales, 0);

  // Function to add new staff
  const handleAddStaff = () => {
    setEditingStaff(null);
    form.resetFields();
    setVisible(true);
  };

  // Function to edit staff
  const handleEditStaff = (record: any) => {
    setEditingStaff(record);
    form.setFieldsValue(record);
    setVisible(true);
  };

  // Function to submit form
  const handleSubmit = () => {
    form
      .validateFields()
      .then((values) => {
        if (editingStaff) {
          // Update existing staff
          const updatedStaff = staff.map((s) =>
            s.id === editingStaff.id ? { ...s, ...values } : s
          );
          setStaff(updatedStaff);
        } else {
          // Add new staff
          const newStaff = {
            id: `${staff.length + 1}`,
            ...values,
            status: 'active',
            avatar: null,
            hireDate: new Date().toISOString().split('T')[0],
            sales: 0,
          };
          setStaff([...staff, newStaff]);
        }
        setVisible(false);
        form.resetFields();
      })
      .catch((info) => {
        console.log('Validate Failed:', info);
      });
  };

  // Function to delete staff
  const handleDeleteStaff = (id: string) => {
    setStaff(staff.filter((s) => s.id !== id));
  };

  // Function to toggle staff status
  const handleToggleStatus = (record: any) => {
    const updatedStaff = staff.map((s) =>
      s.id === record.id
        ? { ...s, status: s.status === 'active' ? 'inactive' : 'active' }
        : s
    );
    setStaff(updatedStaff);
  };

  // Table columns
  const columns = [
    {
      title: 'Nhân viên',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: any) => (
        <Space>
          <Avatar icon={<UserOutlined />} />
          <div>
            <div>{text}</div>
            <div style={{ fontSize: '12px', color: 'rgba(0, 0, 0, 0.45)' }}>
              {record.email}
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Số điện thoại',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: 'Vai trò',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => {
        const roleInfo = roles.find((r) => r.value === role);
        return <Tag color={roleInfo?.color}>{roleInfo?.label}</Tag>;
      },
      filters: roles.map((role) => ({
        text: role.label,
        value: role.value,
      })),
      onFilter: (value: any, record: any) => record.role === value,
    },
    {
      title: 'Bộ phận',
      dataIndex: 'department',
      key: 'department',
    },
    {
      title: 'Ngày vào làm',
      dataIndex: 'hireDate',
      key: 'hireDate',
      render: (date: string) => new Date(date).toLocaleDateString('vi-VN'),
    },
    {
      title: 'Doanh số',
      dataIndex: 'sales',
      key: 'sales',
      render: (sales: number) => (
        <span>{sales.toLocaleString('vi-VN')}₫</span>
      ),
      sorter: (a: any, b: any) => a.sales - b.sales,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Badge
          status={status === 'active' ? 'success' : 'default'}
          text={status === 'active' ? 'Đang làm việc' : 'Đã nghỉ việc'}
        />
      ),
      filters: [
        { text: 'Đang làm việc', value: 'active' },
        { text: 'Đã nghỉ việc', value: 'inactive' },
      ],
      onFilter: (value: any, record: any) => record.status === value,
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (text: any, record: any) => (
        <Space size="small">
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditStaff(record)}
          />
          <Popconfirm
            title={`${record.status === 'active' ? 'Vô hiệu hóa' : 'Kích hoạt'} tài khoản này?`}
            onConfirm={() => handleToggleStatus(record)}
            okText="Đồng ý"
            cancelText="Hủy"
          >
            <Button
              size="small"
              icon={record.status === 'active' ? <LockOutlined /> : <UnlockOutlined />}
              type={record.status === 'active' ? 'default' : 'primary'}
            />
          </Popconfirm>
          <Popconfirm
            title="Xóa nhân viên này?"
            description="Thao tác này không thể hoàn tác!"
            onConfirm={() => handleDeleteStaff(record.id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // Tabs configuration
  const items: TabsProps['items'] = [
    {
      key: 'list',
      label: (
        <span>
          <TeamOutlined /> Nhân viên
        </span>
      ),
      children: (
        <div>
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <Input
              placeholder="Tìm kiếm theo tên, email, số điện thoại..."
              prefix={<SearchOutlined />}
              style={{ width: 300 }}
              allowClear
              onChange={(e) => setSearchText(e.target.value)}
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddStaff}
            >
              Thêm nhân viên
            </Button>
          </div>

          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Tổng nhân viên"
                  value={staff.length}
                  prefix={<TeamOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Đang làm việc"
                  value={activeStaff}
                  prefix={<UserOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Đã nghỉ việc"
                  value={staff.length - activeStaff}
                  prefix={<UserOutlined />}
                  valueStyle={{ color: '#999' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Tổng doanh số"
                  value={totalSales}
                  prefix={<DollarOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                  formatter={(value) => `${(value as number).toLocaleString('vi-VN')}₫`}
                />
              </Card>
            </Col>
          </Row>

          <Card title="Danh sách nhân viên">
            <Table
              columns={columns}
              dataSource={filteredStaff}
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </div>
      ),
    },
    {
      key: 'schedule',
      label: (
        <span>
          <ScheduleOutlined /> Ca làm việc
        </span>
      ),
      children: (
        <Card title="Lịch làm việc nhân viên">
          <div style={{ textAlign: 'center', padding: 40 }}>
            <ClockCircleOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
            <Title level={4}>Tính năng đang được phát triển</Title>
            <Text>Chức năng quản lý ca làm việc sẽ sớm được triển khai</Text>
          </div>
        </Card>
      ),
    },
    {
      key: 'performance',
      label: (
        <span>
          <BarChartOutlined /> Hiệu suất
        </span>
      ),
      children: (
        <Card title="Báo cáo hiệu suất nhân viên">
          <div style={{ textAlign: 'center', padding: 40 }}>
            <BarChartOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
            <Title level={4}>Tính năng đang được phát triển</Title>
            <Text>Chức năng báo cáo hiệu suất sẽ sớm được triển khai</Text>
          </div>
        </Card>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Title level={2}>Quản lý nhân viên</Title>
      </div>

      <Tabs 
        activeKey={activeTab} 
        items={items} 
        onChange={(key) => setActiveTab(key)} 
      />

      <Modal
        title={editingStaff ? 'Chỉnh sửa nhân viên' : 'Thêm nhân viên mới'}
        open={visible}
        onOk={handleSubmit}
        onCancel={() => setVisible(false)}
        okText={editingStaff ? 'Cập nhật' : 'Thêm'}
        cancelText="Hủy"
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="name"
                label="Tên nhân viên"
                rules={[{ required: true, message: 'Vui lòng nhập tên nhân viên' }]}
              >
                <Input placeholder="Nhập tên nhân viên" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: 'Vui lòng nhập email' },
                  { type: 'email', message: 'Email không hợp lệ' }
                ]}
              >
                <Input placeholder="Email" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="phone"
                label="Số điện thoại"
                rules={[
                  { required: true, message: 'Vui lòng nhập số điện thoại' },
                  { pattern: /^[0-9]{10}$/, message: 'Số điện thoại phải có 10 chữ số' }
                ]}
              >
                <Input placeholder="Số điện thoại" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="role"
                label="Vai trò"
                rules={[{ required: true, message: 'Vui lòng chọn vai trò' }]}
              >
                <Select placeholder="Chọn vai trò">
                  {roles.map((role) => (
                    <Option key={role.value} value={role.value}>
                      {role.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="department"
                label="Bộ phận"
                rules={[{ required: true, message: 'Vui lòng nhập bộ phận' }]}
              >
                <Input placeholder="Bộ phận" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default StaffPage; 