-- Create staff management tables
CREATE TABLE IF NOT EXISTS staff (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL UNIQUE,
  employee_code TEXT NOT NULL UNIQUE,
  position TEXT NOT NULL,
  department TEXT,
  hire_date DATE NOT NULL,
  salary REAL,
  commission_rate REAL DEFAULT 0,
  hourly_rate REAL,
  status TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'terminated')) DEFAULT 'active',
  manager_id TEXT,
  emergency_contact TEXT,
  emergency_phone TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (manager_id) REFERENCES staff(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_staff_user_id ON staff(user_id);
CREATE INDEX IF NOT EXISTS idx_staff_employee_code ON staff(employee_code);
CREATE INDEX IF NOT EXISTS idx_staff_status ON staff(status);
CREATE INDEX IF NOT EXISTS idx_staff_manager_id ON staff(manager_id);

-- Create shifts table
CREATE TABLE IF NOT EXISTS shifts (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  staff_id TEXT NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  break_duration INTEGER DEFAULT 0, -- in minutes
  type TEXT NOT NULL CHECK (type IN ('morning', 'afternoon', 'night', 'full_day')) DEFAULT 'full_day',
  status TEXT NOT NULL CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'no_show')) DEFAULT 'scheduled',
  actual_start_time TIME,
  actual_end_time TIME,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_shifts_staff_id ON shifts(staff_id);
CREATE INDEX IF NOT EXISTS idx_shifts_date ON shifts(date);
CREATE INDEX IF NOT EXISTS idx_shifts_status ON shifts(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_shifts_staff_date ON shifts(staff_id, date);

-- Create attendance table
CREATE TABLE IF NOT EXISTS attendance (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  staff_id TEXT NOT NULL,
  shift_id TEXT,
  date DATE NOT NULL,
  check_in_time DATETIME,
  check_out_time DATETIME,
  break_start_time DATETIME,
  break_end_time DATETIME,
  total_hours REAL,
  overtime_hours REAL DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'early_leave', 'half_day')) DEFAULT 'present',
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE,
  FOREIGN KEY (shift_id) REFERENCES shifts(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_attendance_staff_id ON attendance(staff_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_attendance_staff_date ON attendance(staff_id, date);

-- Create performance targets table
CREATE TABLE IF NOT EXISTS performance_targets (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  staff_id TEXT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  sales_target REAL DEFAULT 0,
  orders_target INTEGER DEFAULT 0,
  customer_satisfaction_target REAL DEFAULT 0,
  created_by TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_performance_targets_staff_id ON performance_targets(staff_id);
CREATE INDEX IF NOT EXISTS idx_performance_targets_period ON performance_targets(period_start, period_end);

-- Create performance records table
CREATE TABLE IF NOT EXISTS performance_records (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  staff_id TEXT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  sales_achieved REAL DEFAULT 0,
  orders_achieved INTEGER DEFAULT 0,
  customer_satisfaction REAL DEFAULT 0,
  commission_earned REAL DEFAULT 0,
  rating REAL DEFAULT 0,
  feedback TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_performance_records_staff_id ON performance_records(staff_id);
CREATE INDEX IF NOT EXISTS idx_performance_records_period ON performance_records(period_start, period_end);

-- Create commission records table
CREATE TABLE IF NOT EXISTS commission_records (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  staff_id TEXT NOT NULL,
  order_id TEXT NOT NULL,
  sale_amount REAL NOT NULL,
  commission_rate REAL NOT NULL,
  commission_amount REAL NOT NULL,
  period_month TEXT NOT NULL, -- YYYY-MM format
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'paid')) DEFAULT 'pending',
  paid_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_commission_records_staff_id ON commission_records(staff_id);
CREATE INDEX IF NOT EXISTS idx_commission_records_order_id ON commission_records(order_id);
CREATE INDEX IF NOT EXISTS idx_commission_records_period_month ON commission_records(period_month);
CREATE INDEX IF NOT EXISTS idx_commission_records_status ON commission_records(status);
