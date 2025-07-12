// Staff API calls
export const staffService = {
  async getStaff() {
    const response = await fetch('/api/staff');
    return response.json();
  },

  async getStaffById(id: string) {
    const response = await fetch(`/api/staff/${id}`);
    return response.json();
  },

  async createStaff(staffData: any) {
    const response = await fetch('/api/staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(staffData),
    });
    return response.json();
  },

  async updateStaff(id: string, staffData: any) {
    const response = await fetch(`/api/staff/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(staffData),
    });
    return response.json();
  },

  async deleteStaff(id: string) {
    const response = await fetch(`/api/staff/${id}`, {
      method: 'DELETE',
    });
    return response.json();
  },

  async getPerformance(staffId: string, period: string) {
    const response = await fetch(`/api/staff/${staffId}/performance?period=${period}`);
    return response.json();
  },

  async getCommission(staffId: string, month: string) {
    const response = await fetch(`/api/staff/${staffId}/commission?month=${month}`);
    return response.json();
  },

  async updateTargets(staffId: string, targets: any) {
    const response = await fetch(`/api/staff/${staffId}/targets`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(targets),
    });
    return response.json();
  },

  async getShifts(staffId: string, date: string) {
    const response = await fetch(`/api/staff/${staffId}/shifts?date=${date}`);
    return response.json();
  },

  async createShift(shiftData: any) {
    const response = await fetch('/api/staff/shifts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(shiftData),
    });
    return response.json();
  },
};
