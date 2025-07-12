// Staff TypeScript types
export interface Staff {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'manager' | 'cashier' | 'staff';
  shift: string;
  active: boolean;
  hireDate: string;
  salary?: number;
  commissionRate?: number;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Performance {
  staffId: string;
  period: string;
  salesTarget: number;
  salesAchieved: number;
  ordersTarget: number;
  ordersAchieved: number;
  customerSatisfaction: number;
  commission: number;
  rating: number;
}

export interface Shift {
  id: string;
  staffId: string;
  date: string;
  startTime: string;
  endTime: string;
  type: 'morning' | 'afternoon' | 'night';
  status: 'scheduled' | 'completed' | 'cancelled';
}

export interface Commission {
  id: string;
  staffId: string;
  date: string;
  sales: number;
  rate: number;
  amount: number;
  orderId?: string;
}

export interface StaffTarget {
  staffId: string;
  period: string;
  salesTarget: number;
  ordersTarget: number;
  satisfactionTarget: number;
}
