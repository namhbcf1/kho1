// Complete Vietnamese staff management page with role-based permissions
import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  Space, 
  Tabs, 
  Row, 
  Col, 
  Statistic, 
  Alert,
  Spin,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Switch,
  TreeSelect,
  Upload,
  message,
  Typography,
  Badge,
  Tag,
  Tooltip,
  Progress
} from 'antd';
import { 
  PlusOutlined, 
  BarChartOutlined,
  UserOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  TrophyOutlined,
  ExportOutlined,
  ImportOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  CalendarOutlined,
  TeamOutlined,
  SettingOutlined,
  BellOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  WarningOutlined
} from '@ant-design/icons';
import { staffService } from '../../features/staff/services/staffService';
import { 
  Staff, 
  StaffFilters, 
  StaffRole, 
  StaffStatus,
  StaffPerformance,
  StaffShift,
  StaffAttendance 
} from '../../features/staff/types/staff.types';
import { formatVND } from '../../utils/formatters/vndCurrency';
import { validateVietnamesePhone, vietnamesePhoneRule, vietnameseNameRule } from '../../utils/validators/vietnameseValidation';
import { usePage } from '../../stores';
import dayjs from 'dayjs';

const { TabPane } = Tabs;
const { Option } = Select;
const { Search } = Input;
const { Title, Text } = Typography;
const { confirm } = Modal;

// Vietnamese departments
const VIETNAMESE_DEPARTMENTS = [
  'Bán hàng',
  'Kho',
  'Kế toán',
  'Hành chính',
  'Bảo vệ',
  'Làm sạch',
  'Quản lý'
];

export const StaffPage: React.FC = () => {
  // State management
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filters and pagination
  const [filters, setFilters] = useState<StaffFilters>({
    page: 1,
    pageSize: 20
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<StaffRole | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<StaffStatus | 'all'>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  
  // Modal states
  const [staffModalVisible, setStaffModalVisible] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [performanceModalVisible, setPerformanceModalVisible] = useState(false);
  const [selectedStaffForPerformance, setSelectedStaffForPerformance] = useState<Staff | null>(null);
  const [attendanceModalVisible, setAttendanceModalVisible] = useState(false);
  
  // Performance data
  const [performanceData, setPerformanceData] = useState<{ [key: string]: StaffPerformance }>({});
  const [todayAttendance, setTodayAttendance] = useState<StaffAttendance[]>([]);
  
  // Forms
  const [staffForm] = Form.useForm();
  const [performanceForm] = Form.useForm();
  const { setPageTitle, setBreadcrumbs } = usePage();

  // Load initial data
  useEffect(() => {
    setPageTitle('Quản lý nhân viên');
    setBreadcrumbs([
      { title: 'Nhân viên' },
    ]);
    loadStaffData();
    loadTodayAttendance();
  }, [setPageTitle, setBreadcrumbs]);

  // Reload when filters change
  useEffect(() => {
    loadStaffData();
  }, [filters, searchQuery, selectedRole, selectedStatus, selectedDepartment]);

  const loadStaffData = async () => {
    try {
      setLoading(true);
      setError(null);

      const currentFilters: StaffFilters = {
        ...filters,
        search: searchQuery || undefined,
        role: selectedRole === 'all' ? undefined : selectedRole,
        status: selectedStatus === 'all' ? undefined : selectedStatus
      };

      const result = await staffService.getStaff(currentFilters);
      setStaff(result.staff);
      
      // Load performance data for active staff
      const activeStaff = result.staff.filter(s => s.isActive);
      const performancePromises = activeStaff.map(async (s) => {
        try {
          const performance = await staffService.getStaffPerformance(s.id, dayjs().format('YYYY-MM'));
          return { [s.id]: performance };
        } catch {
          return { [s.id]: null };
        }
      });
      
      const performanceResults = await Promise.all(performancePromises);
      const performanceMap = performanceResults.reduce((acc, curr) => ({ ...acc, ...curr }), {});
      setPerformanceData(performanceMap);
      
    } catch (err: any) {
      setError('Không thể tải danh sách nhân viên. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const loadTodayAttendance = async () => {
    try {
      const today = dayjs().format('YYYY-MM-DD');
      // This would typically load all staff attendance for today
      // For now, we'll simulate it
      setTodayAttendance([]);
    } catch (err) {
      console.error('Error loading attendance:', err);
    }
  };

  // Staff management handlers
  const handleAddStaff = () => {
    setEditingStaff(null);
    staffForm.resetFields();
    
    // Set default values with Vietnamese business logic
    staffForm.setFieldsValue({
      role: 'nhan_vien_ban_hang',
      status: 'probation',
      contractType: 'full_time',
      isActive: true,
      skillLevel: 'junior',
      baseSalary: 5000000, // Vietnamese minimum wage region
      allowances: {
        transport: 500000,
        lunch: 730000, // 30 days * ~25k per meal
        phone: 200000,
        responsibility: 0,
        other: 0
      },
      commissionRate: 2,
      overtimeRate: 1.5,
      targets: {
        monthlySales: 50000000,
        monthlyOrders: 100,
        customerSatisfaction: 4.5,
        upsellRate: 15
      },
      location: 'TP. Hồ Chí Minh',
      department: 'Bán hàng'
    });
    
    setStaffModalVisible(true);
  };

  const handleEditStaff = (staff: Staff) => {
    setEditingStaff(staff);
    staffForm.setFieldsValue({
      ...staff,
      birthDate: staff.birthDate ? dayjs(staff.birthDate) : null,
      hireDate: staff.hireDate ? dayjs(staff.hireDate) : null,
      probationEndDate: staff.probationEndDate ? dayjs(staff.probationEndDate) : null
    });
    setStaffModalVisible(true);
  };

  const handleDeleteStaff = (staff: Staff) => {
    confirm({
      title: 'Xác nhận xóa nhân viên',
      content: `Bạn có chắc muốn xóa nhân viên "${staff.name}"? Hành động này không thể hoàn tác.`,
      icon: <ExclamationCircleOutlined />,
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await staffService.deleteStaff(staff.id);
          message.success('Đã xóa nhân viên thành công');
          loadStaffData();
        } catch (err: any) {
          message.error(err.message || 'Không thể xóa nhân viên');
        }
      },
    });
  };

  const handleSaveStaff = async (values: any) => {
    try {
      setSaving(true);
      
      // Process Vietnamese business data
      const staffData = {
        ...values,
        birthDate: values.birthDate ? values.birthDate.toISOString() : undefined,
        hireDate: values.hireDate ? values.hireDate.toISOString() : undefined,
        probationEndDate: values.probationEndDate ? values.probationEndDate.toISOString() : undefined,
        employeeCode: editingStaff?.employeeCode || undefined, // Will be auto-generated for new staff
        socialInsurance: editingStaff?.socialInsurance || undefined, // Will be auto-generated
        permissions: staffService.getRolePermissions(values.role),
        certifications: values.certifications || [],
        trainingRecords: []
      };

      if (editingStaff) {
        await staffService.updateStaff(editingStaff.id, staffData);
        message.success('Đã cập nhật thông tin nhân viên thành công');
      } else {
        await staffService.createStaff(staffData);
        message.success('Đã thêm nhân viên mới thành công');
      }
      
      setStaffModalVisible(false);
      staffForm.resetFields();
      loadStaffData();
    } catch (err: any) {
      message.error(err.message || 'Không thể lưu thông tin nhân viên');
    } finally {
      setSaving(false);
    }
  };

  // Performance management
  const handleViewPerformance = (staff: Staff) => {
    setSelectedStaffForPerformance(staff);
    setPerformanceModalVisible(true);
  };

  // Calculate Vietnamese business statistics
  const totalStaff = staff.length;
  const activeStaff = staff.filter(s => s.isActive).length;
  const onProbation = staff.filter(s => s.status === 'probation').length;
  const onLeave = staff.filter(s => ['sick_leave', 'annual_leave', 'maternity_leave'].includes(s.status)).length;
  
  const totalSalaryBudget = staff
    .filter(s => s.isActive)
    .reduce((sum, s) => sum + s.baseSalary + Object.values(s.allowances).reduce((a, b) => a + b, 0), 0);
  
  const averagePerformance = Object.values(performanceData)
    .filter(p => p)
    .reduce((sum, p) => sum + (p?.overallRating || 0), 0) / Object.values(performanceData).filter(p => p).length || 0;

  // Table columns with Vietnamese business logic
  const staffColumns = [
    {
      title: 'Nhân viên',
      key: 'employee',
      render: (_: any, record: Staff) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <UserOutlined className="text-blue-600" />
          </div>
          <div>
            <div className="font-medium">{record.name}</div>
            <div className="text-xs text-gray-500">
              {record.employeeCode} | {record.email}
            </div>
            <div className="text-xs text-gray-400">
              {record.phone} | {record.nationalId}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Chức vụ & Phòng ban',
      key: 'role',
      render: (_: any, record: Staff) => (
        <div>
          <Tag color="blue">
            {staffService.getAvailableRoles().find(r => r.value === record.role)?.label || record.role}
          </Tag>
          <div className="text-sm mt-1">{record.position}</div>
          <div className="text-xs text-gray-500">{record.department}</div>
        </div>
      ),
    },
    {
      title: 'Trạng thái',
      key: 'status',
      render: (_: any, record: Staff) => {
        const statusConfig = {
          active: { color: 'green', text: 'Đang làm việc' },
          probation: { color: 'orange', text: 'Thử việc' },
          maternity_leave: { color: 'purple', text: 'Nghỉ thai sản' },
          sick_leave: { color: 'red', text: 'Nghỉ ốm' },
          annual_leave: { color: 'blue', text: 'Nghỉ phép' },
          suspended: { color: 'volcano', text: 'Tạm ngừng' },
          terminated: { color: 'default', text: 'Nghỉ việc' }
        };
        
        const config = statusConfig[record.status] || statusConfig.active;
        
        return (
          <div>
            <Tag color={config.color}>{config.text}</Tag>
            {record.contractType && (
              <div className="text-xs text-gray-500 mt-1">
                {record.contractType === 'full_time' ? 'Toàn thời gian' : 
                 record.contractType === 'part_time' ? 'Bán thời gian' : 
                 record.contractType === 'seasonal' ? 'Theo mùa' : 
                 record.contractType === 'project_based' ? 'Theo dự án' : 'Thực tập'}
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: 'Lương & Hoa hồng',
      key: 'salary',
      render: (_: any, record: Staff) => {
        const totalAllowances = Object.values(record.allowances).reduce((a, b) => a + b, 0);
        const grossSalary = record.baseSalary + totalAllowances;
        
        return (
          <div>
            <div className="font-medium text-green-600">
              {formatVND(grossSalary)}
            </div>
            <div className="text-xs text-gray-500">
              Cơ bản: {formatVND(record.baseSalary)}
            </div>
            <div className="text-xs text-gray-500">
              PC: {formatVND(totalAllowances)}
            </div>
            <div className="text-xs">
              <Tag color="orange">HH {record.commissionRate}%</Tag>
            </div>
          </div>
        );
      },
    },
    {
      title: 'Hiệu suất',
      key: 'performance',
      render: (_: any, record: Staff) => {
        const performance = performanceData[record.id];
        
        if (!performance) {
          return <Text type="secondary">Chưa có dữ liệu</Text>;
        }
        
        const achievementRate = (performance.salesAchieved / performance.salesTarget) * 100;
        
        return (
          <div>
            <Progress 
              percent={Math.min(achievementRate, 100)} 
              size="small"
              status={achievementRate >= 100 ? 'success' : achievementRate >= 80 ? 'active' : 'exception'}
            />
            <div className="text-xs text-gray-500 mt-1">
              {formatVND(performance.salesAchieved)} / {formatVND(performance.salesTarget)}
            </div>
            <div className="text-xs">
              Đánh giá: {performance.overallRating.toFixed(1)}/5.0
            </div>
          </div>
        );
      },
    },
    {
      title: 'Ngày vào làm',
      dataIndex: 'hireDate',
      key: 'hireDate',
      render: (hireDate: string, record: Staff) => (
        <div>
          <div>{dayjs(hireDate).format('DD/MM/YYYY')}</div>
          <div className="text-xs text-gray-500">
            {dayjs().diff(dayjs(hireDate), 'month')} tháng
          </div>
          {record.probationEndDate && record.status === 'probation' && (
            <div className="text-xs text-orange-500">
              Hết thử việc: {dayjs(record.probationEndDate).format('DD/MM/YYYY')}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Hành động',
      key: 'actions',
      width: 120,
      render: (_: any, record: Staff) => (
        <Space direction="vertical" size="small">
          <Space>
            <Tooltip title="Xem chi tiết">
              <Button
                type="link"
                size="small"
                icon={<EyeOutlined />}
                onClick={() => handleViewPerformance(record)}
              />
            </Tooltip>
            <Tooltip title="Chỉnh sửa">
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleEditStaff(record)}
              />
            </Tooltip>
            <Tooltip title="Xóa">
              <Button
                type="link"
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleDeleteStaff(record)}
              />
            </Tooltip>
          </Space>
        </Space>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="Lỗi tải dữ liệu"
        description={error}
        type="error"
        showIcon
        action={
          <Button size="small" danger onClick={loadStaffData}>
            Thử lại
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Overview */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Tổng nhân viên"
              value={totalStaff}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Đang làm việc"
              value={activeStaff}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Thử việc"
              value={onProbation}
              valueStyle={{ color: '#faad14' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Tổng chi phí lương"
              value={totalSalaryBudget}
              formatter={(value) => formatVND(Number(value))}
              prefix={<DollarOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Main Management Card */}
      <Card
        title="Danh sách nhân viên"
        extra={
          <Space>
            <Button icon={<ImportOutlined />}>
              Nhập Excel
            </Button>
            <Button icon={<ExportOutlined />}>
              Xuất báo cáo
            </Button>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={handleAddStaff}
            >
              Thêm nhân viên
            </Button>
          </Space>
        }
      >
        {/* Filters */}
        <Row gutter={[16, 16]} className="mb-4">
          <Col xs={24} md={8}>
            <Search
              placeholder="Tìm kiếm tên hoặc mã nhân viên..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} md={4}>
            <Select
              style={{ width: '100%' }}
              value={selectedRole}
              onChange={setSelectedRole}
              placeholder="Chức vụ"
            >
              <Option value="all">Tất cả chức vụ</Option>
              {staffService.getAvailableRoles().map(role => (
                <Option key={role.value} value={role.value}>
                  {role.label}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} md={4}>
            <Select
              style={{ width: '100%' }}
              value={selectedStatus}
              onChange={setSelectedStatus}
              placeholder="Trạng thái"
            >
              <Option value="all">Tất cả trạng thái</Option>
              <Option value="active">Đang làm việc</Option>
              <Option value="probation">Thử việc</Option>
              <Option value="sick_leave">Nghỉ ốm</Option>
              <Option value="annual_leave">Nghỉ phép</Option>
              <Option value="terminated">Nghỉ việc</Option>
            </Select>
          </Col>
          <Col xs={24} md={4}>
            <Select
              style={{ width: '100%' }}
              value={selectedDepartment}
              onChange={setSelectedDepartment}
              placeholder="Phòng ban"
            >
              <Option value="all">Tất cả phòng ban</Option>
              {VIETNAMESE_DEPARTMENTS.map(dept => (
                <Option key={dept} value={dept}>
                  {dept}
                </Option>
              ))}
            </Select>
          </Col>
        </Row>

        {/* Staff Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                {staffColumns.map(col => (
                  <th key={col.key} className="text-left p-3 font-medium">
                    {col.title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {staff.map(member => (
                <tr key={member.id} className="border-b hover:bg-gray-50">
                  {staffColumns.map(col => (
                    <td key={col.key} className="p-3">
                      {col.render ? col.render(null, member) : member[col.dataIndex as keyof Staff]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add/Edit Staff Modal */}
      <Modal
        title={editingStaff ? 'Chỉnh sửa nhân viên' : 'Thêm nhân viên mới'}
        open={staffModalVisible}
        onCancel={() => setStaffModalVisible(false)}
        footer={null}
        width={800}
      >
        <Form
          form={staffForm}
          layout="vertical"
          onFinish={handleSaveStaff}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Họ và tên"
                name="name"
                rules={[
                  { required: true, message: 'Vui lòng nhập họ và tên' },
                  vietnameseNameRule
                ]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Email"
                name="email"
                rules={[
                  { required: true, message: 'Vui lòng nhập email' },
                  { type: 'email', message: 'Email không đúng định dạng' }
                ]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Số điện thoại"
                name="phone"
                rules={[
                  { required: true, message: 'Vui lòng nhập số điện thoại' },
                  vietnamesePhoneRule
                ]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="CMND/CCCD"
                name="nationalId"
                rules={[
                  { required: true, message: 'Vui lòng nhập CMND/CCCD' },
                  { pattern: /^\d{9}$|^\d{12}$/, message: 'CMND (9 số) hoặc CCCD (12 số)' }
                ]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Chức vụ"
                name="role"
                rules={[{ required: true, message: 'Vui lòng chọn chức vụ' }]}
              >
                <Select>
                  {staffService.getAvailableRoles().map(role => (
                    <Option key={role.value} value={role.value}>
                      {role.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Phòng ban"
                name="department"
                rules={[{ required: true, message: 'Vui lòng chọn phòng ban' }]}
              >
                <Select>
                  {VIETNAMESE_DEPARTMENTS.map(dept => (
                    <Option key={dept} value={dept}>
                      {dept}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="Lương cơ bản"
                name="baseSalary"
                rules={[{ required: true, message: 'Vui lòng nhập lương cơ bản' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
                  addonAfter="₫"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Hoa hồng (%)"
                name="commissionRate"
                rules={[{ required: true, message: 'Vui lòng nhập tỷ lệ hoa hồng' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  max={50}
                  formatter={(value) => `${value}%`}
                  parser={(value) => value!.replace('%', '')}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Ngày vào làm"
                name="hireDate"
                rules={[{ required: true, message: 'Vui lòng chọn ngày vào làm' }]}
              >
                <DatePicker 
                  style={{ width: '100%' }}
                  format="DD/MM/YYYY"
                />
              </Form.Item>
            </Col>
          </Row>

          <div className="flex justify-end space-x-2">
            <Button onClick={() => setStaffModalVisible(false)}>
              Hủy
            </Button>
            <Button type="primary" htmlType="submit" loading={saving}>
              {editingStaff ? 'Cập nhật' : 'Thêm mới'}
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Performance Modal */}
      <Modal
        title={`Hiệu suất làm việc - ${selectedStaffForPerformance?.name}`}
        open={performanceModalVisible}
        onCancel={() => setPerformanceModalVisible(false)}
        footer={null}
        width={600}
      >
        {selectedStaffForPerformance && performanceData[selectedStaffForPerformance.id] && (
          <div className="space-y-4">
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Statistic
                  title="Doanh thu đạt được"
                  value={performanceData[selectedStaffForPerformance.id].salesAchieved}
                  formatter={(value) => formatVND(Number(value))}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Chỉ tiêu tháng"
                  value={performanceData[selectedStaffForPerformance.id].salesTarget}
                  formatter={(value) => formatVND(Number(value))}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Đơn hàng hoàn thành"
                  value={performanceData[selectedStaffForPerformance.id].ordersAchieved}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Đánh giá tổng thể"
                  value={performanceData[selectedStaffForPerformance.id].overallRating}
                  suffix="/ 5.0"
                />
              </Col>
            </Row>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default StaffPage;