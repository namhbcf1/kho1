// Complete Vietnamese staff management types with role-based permissions

// Vietnamese staff roles with proper hierarchy
export type StaffRole = 
  | 'admin'                    // Quản trị viên
  | 'quan_ly'                  // Quản lý
  | 'thu_ngan'                 // Thu ngân  
  | 'nhan_vien_ban_hang'       // Nhân viên bán hàng
  | 'nhan_vien_kho'            // Nhân viên kho
  | 'ke_toan';                 // Kế toán

// Staff status according to Vietnamese labor law
export type StaffStatus = 
  | 'active'                   // Đang làm việc
  | 'probation'                // Thử việc
  | 'maternity_leave'          // Nghỉ thai sản
  | 'sick_leave'               // Nghỉ ốm
  | 'annual_leave'             // Nghỉ phép năm
  | 'suspended'                // Tạm ngừng
  | 'terminated';              // Nghỉ việc

// Contract types in Vietnam
export type ContractType = 
  | 'full_time'                // Toàn thời gian
  | 'part_time'                // Bán thời gian
  | 'seasonal'                 // Theo mùa
  | 'project_based'            // Theo dự án
  | 'internship';              // Thực tập

// Vietnamese shift types
export type ShiftType = 
  | 'ca_sang'                  // Ca sáng (6:00-14:00)
  | 'ca_chieu'                 // Ca chiều (14:00-22:00)
  | 'ca_dem'                   // Ca đêm (22:00-6:00)
  | 'ca_hanh_chinh';           // Ca hành chính (8:00-17:00)

// Main staff interface with Vietnamese business data
export interface Staff {
  id: string;
  employeeCode: string;         // Mã nhân viên
  name: string;                 // Họ và tên
  email: string;
  phone: string;                // Số điện thoại Việt Nam
  nationalId: string;           // CMND/CCCD
  socialInsurance: string;      // Số BHXH
  role: StaffRole;
  status: StaffStatus;
  contractType: ContractType;
  
  // Personal information
  address: {
    street: string;
    ward: string;               // Phường/Xã
    district: string;           // Quận/Huyện
    province: string;           // Tỉnh/Thành phố
  };
  birthDate: string;
  gender: 'male' | 'female' | 'other';
  maritalStatus: 'single' | 'married' | 'divorced' | 'widowed';
  
  // Employment details
  hireDate: string;             // Ngày vào làm
  probationEndDate?: string;    // Ngày hết thử việc
  terminationDate?: string;     // Ngày nghỉ việc
  department: string;           // Phòng ban
  position: string;             // Chức vụ
  location: string;             // Địa điểm làm việc
  
  // Salary and benefits
  baseSalary: number;           // Lương cơ bản
  allowances: {
    transport: number;          // Phụ cấp đi lại
    lunch: number;              // Phụ cấp ăn trưa
    phone: number;              // Phụ cấp điện thoại
    responsibility: number;     // Phụ cấp trách nhiệm
    other: number;              // Phụ cấp khác
  };
  commissionRate: number;       // Tỷ lệ hoa hồng (%)
  overtimeRate: number;         // Tỷ lệ làm thêm giờ
  
  // Performance targets
  targets: {
    monthlySales: number;       // Chỉ tiêu doanh thu tháng
    monthlyOrders: number;      // Chỉ tiêu đơn hàng tháng
    customerSatisfaction: number; // Chỉ tiêu hài lòng khách hàng
    upsellRate: number;         // Tỷ lệ bán kèm
  };
  
  // Permissions and access
  permissions: string[];
  lastLogin?: string;
  isActive: boolean;
  
  // Training and development
  skillLevel: 'junior' | 'intermediate' | 'senior' | 'expert';
  certifications: string[];
  trainingRecords: StaffTraining[];
  
  // System fields
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

// Staff performance tracking
export interface StaffPerformance {
  id: string;
  staffId: string;
  period: string;               // YYYY-MM format
  
  // Sales performance
  salesTarget: number;
  salesAchieved: number;
  salesGrowth: number;
  
  // Order performance
  ordersTarget: number;
  ordersAchieved: number;
  averageOrderValue: number;
  
  // Customer metrics
  customersServed: number;
  customerSatisfactionScore: number;
  customerRetentionRate: number;
  customerComplaintsResolved: number;
  
  // Productivity metrics
  hoursWorked: number;
  overtimeHours: number;
  productivityScore: number;
  
  // Quality metrics
  errorRate: number;
  accuracyRate: number;
  punctualityScore: number;
  
  // Financial performance
  commission: number;
  bonus: number;
  penalties: number;
  
  // Overall rating
  overallRating: number;        // 1-5 scale
  managerComments: string;
  improvementAreas: string[];
  achievements: string[];
  
  createdAt: string;
  evaluatedBy: string;
}

// Staff shift management with Vietnamese business hours
export interface StaffShift {
  id: string;
  staffId: string;
  staffName: string;
  date: string;                 // YYYY-MM-DD
  shiftType: ShiftType;
  startTime: string;            // HH:mm format
  endTime: string;              // HH:mm format
  breakTime: number;            // Minutes
  
  // Attendance tracking
  checkInTime?: string;         // Actual check-in time
  checkOutTime?: string;        // Actual check-out time
  isLate: boolean;
  isEarlyLeave: boolean;
  overtimeMinutes: number;
  
  // Shift details
  location: string;
  supervisor: string;
  notes: string;
  
  // Status
  status: 'scheduled' | 'in_progress' | 'completed' | 'absent' | 'cancelled';
  reason?: string;              // For absence or cancellation
  
  // Holiday and special pay
  isHoliday: boolean;
  holidayMultiplier: number;    // Pay multiplier for holidays
  isNightShift: boolean;
  nightShiftBonus: number;
  
  createdAt: string;
  createdBy: string;
}

// Staff attendance with Vietnamese labor law compliance
export interface StaffAttendance {
  id: string;
  staffId: string;
  date: string;
  
  // Time tracking
  checkInTime: string;
  checkOutTime?: string;
  totalHours: number;
  regularHours: number;
  overtimeHours: number;
  
  // Break tracking
  breakStartTime?: string;
  breakEndTime?: string;
  totalBreakTime: number;
  
  // Status
  status: 'present' | 'absent' | 'late' | 'early_leave' | 'holiday' | 'sick_leave';
  isApproved: boolean;
  approvedBy?: string;
  
  // Location tracking
  checkInLocation: string;
  checkOutLocation?: string;
  
  // Notes and reasons
  notes: string;
  leaveReason?: string;
  leaveType?: 'annual' | 'sick' | 'maternity' | 'personal' | 'bereavement';
  
  // Pay calculation
  basePay: number;
  overtimePay: number;
  holidayPay: number;
  totalPay: number;
  
  createdAt: string;
}

// Commission calculation with Vietnamese business logic
export interface StaffCommission {
  id: string;
  staffId: string;
  period: string;               // YYYY-MM format
  
  // Sales data
  totalSales: number;
  targetSales: number;
  achievementRate: number;
  
  // Commission calculation
  baseCommissionRate: number;
  bonusCommissionRate: number;  // For exceeding targets
  totalCommissionRate: number;
  
  // Commission amounts
  baseCommission: number;
  bonusCommission: number;
  tetBonus: number;             // Vietnamese New Year bonus
  otherBonuses: number;
  totalCommission: number;
  
  // Deductions
  advances: number;             // Tạm ứng
  penalties: number;
  netCommission: number;
  
  // Payment status
  isPaid: boolean;
  paidDate?: string;
  paymentMethod: 'cash' | 'bank_transfer';
  
  calculatedAt: string;
  calculatedBy: string;
}

// Salary calculation with Vietnamese tax and insurance
export interface StaffSalary {
  id: string;
  staffId: string;
  period: string;               // YYYY-MM format
  
  // Basic salary components
  baseSalary: number;
  allowances: {
    transport: number;
    lunch: number;
    phone: number;
    responsibility: number;
    other: number;
  };
  
  // Variable pay
  commission: number;
  bonus: number;
  overtimePay: number;
  holidayPay: number;
  nightShiftBonus: number;
  
  // Gross salary
  grossSalary: number;
  
  // Deductions (Vietnamese law)
  socialInsurance: number;      // 8% employee contribution
  healthInsurance: number;      // 1.5% employee contribution
  unemploymentInsurance: number; // 1% employee contribution
  personalIncomeTax: number;    // Progressive tax rate
  unionFee: number;             // 1% (if applicable)
  advances: number;             // Tạm ứng
  otherDeductions: number;
  
  // Net salary
  totalDeductions: number;
  netSalary: number;
  
  // Employer contributions (for reference)
  employerSocialInsurance: number;     // 17.5%
  employerHealthInsurance: number;     // 3%
  employerUnemploymentInsurance: number; // 1%
  employerAccidentInsurance: number;   // 0.5%
  
  // Payment details
  paymentDate: string;
  paymentMethod: 'cash' | 'bank_transfer';
  bankAccount?: string;
  
  // Status
  isApproved: boolean;
  approvedBy?: string;
  isPaid: boolean;
  
  calculatedAt: string;
  calculatedBy: string;
}

// Staff training and development
export interface StaffTraining {
  id: string;
  staffId: string;
  title: string;
  description: string;
  type: 'orientation' | 'skill_development' | 'safety' | 'compliance' | 'leadership';
  
  // Training details
  provider: string;
  duration: number;             // Hours
  startDate: string;
  endDate: string;
  location: string;
  
  // Requirements
  isRequired: boolean;
  prerequisites: string[];
  
  // Progress tracking
  status: 'assigned' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  progress: number;             // Percentage
  score?: number;               // If assessment required
  passingScore: number;
  
  // Certification
  certificateIssued: boolean;
  certificateNumber?: string;
  certificateExpiryDate?: string;
  
  // Costs
  cost: number;
  fundingSource: 'company' | 'government' | 'self_funded';
  
  // Feedback
  trainerFeedback: string;
  participantFeedback: string;
  effectiveness: number;        // 1-5 rating
  
  assignedAt: string;
  assignedBy: string;
  completedAt?: string;
}

// Staff performance evaluation
export interface StaffEvaluation {
  id: string;
  staffId: string;
  evaluationPeriod: string;     // YYYY-MM format
  evaluationType: 'probation' | 'annual' | 'promotion' | 'disciplinary';
  
  // Evaluation criteria (1-5 scale)
  criteria: {
    jobKnowledge: number;
    workQuality: number;
    productivity: number;
    communication: number;
    teamwork: number;
    leadership: number;
    problemSolving: number;
    customerService: number;
    attendance: number;
    punctuality: number;
  };
  
  // Goals and achievements
  previousGoals: string[];
  goalsAchieved: string[];
  newGoals: string[];
  
  // Strengths and areas for improvement
  strengths: string[];
  areasForImprovement: string[];
  developmentPlan: string;
  
  // Overall assessment
  overallRating: number;        // Average of criteria
  recommendation: 'promote' | 'retain' | 'improve' | 'terminate';
  
  // Comments
  managerComments: string;
  employeeComments: string;
  hrComments: string;
  
  // Action items
  actionItems: string[];
  followUpDate: string;
  
  // Signatures and approval
  employeeAcknowledged: boolean;
  employeeSignatureDate?: string;
  managerSignatureDate: string;
  hrApprovalDate?: string;
  
  createdAt: string;
  evaluatedBy: string;
  updatedAt: string;
}

// Staff target setting
export interface StaffTarget {
  id: string;
  staffId: string;
  period: string;               // YYYY-MM format
  
  // Sales targets
  salesTarget: number;
  ordersTarget: number;
  customersTarget: number;
  upsellTarget: number;
  
  // Quality targets
  customerSatisfactionTarget: number;
  accuracyTarget: number;
  
  // Productivity targets
  hoursTarget: number;
  productivityTarget: number;
  
  // Status
  isActive: boolean;
  setDate: string;
  setBy: string;
  lastReviewDate?: string;
}

// Staff filters for search and reporting
export interface StaffFilters {
  search?: string;
  role?: StaffRole;
  status?: StaffStatus;
  department?: string;
  location?: string;
  skillLevel?: string;
  hireDate?: { start: string; end: string };
  isActive?: boolean;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Staff permissions for role-based access control
export interface StaffPermissions {
  staff: {
    create: boolean;
    read: boolean;
    update: boolean;
    delete: boolean;
  };
  sales: {
    create: boolean;
    read: boolean;
    update: boolean;
    delete: boolean;
  };
  inventory: {
    create: boolean;
    read: boolean;
    update: boolean;
    delete: boolean;
  };
  customers: {
    create: boolean;
    read: boolean;
    update: boolean;
    delete: boolean;
  };
  reports: {
    read: boolean;
    create: boolean;
    export: boolean;
  };
  settings: {
    read: boolean;
    update: boolean;
  };
  finance: {
    read: boolean;
    create: boolean;
    update: boolean;
  };
}