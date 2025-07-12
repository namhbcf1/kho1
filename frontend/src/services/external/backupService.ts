// External backup services
export const backupService = {
  async createBackup(type: 'full' | 'incremental' = 'full') {
    try {
      const response = await fetch('/api/backup/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || 'Backup creation failed');
      }
      
      return data;
    } catch (error) {
      console.error('Backup creation failed:', error);
      throw error;
    }
  },

  async restoreBackup(backupId: string) {
    try {
      const response = await fetch('/api/backup/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ backupId })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || 'Backup restoration failed');
      }
      
      return data;
    } catch (error) {
      console.error('Backup restoration failed:', error);
      throw error;
    }
  },

  async getBackupList() {
    try {
      const response = await fetch('/api/backup/list');
      const data = await response.json();
      return data.backups || [];
    } catch (error) {
      console.error('Get backup list failed:', error);
      return [];
    }
  },

  async deleteBackup(backupId: string) {
    try {
      const response = await fetch(`/api/backup/${backupId}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || 'Backup deletion failed');
      }
      
      return data;
    } catch (error) {
      console.error('Backup deletion failed:', error);
      throw error;
    }
  },

  async scheduleBackup(schedule: any) {
    try {
      const response = await fetch('/api/backup/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(schedule)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || 'Backup scheduling failed');
      }
      
      return data;
    } catch (error) {
      console.error('Backup scheduling failed:', error);
      throw error;
    }
  },

  async exportData(tables: string[], format: 'json' | 'csv' | 'excel' = 'json') {
    try {
      const response = await fetch('/api/backup/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tables, format })
      });
      
      if (!response.ok) {
        throw new Error('Data export failed');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `khoaugment-export-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return { success: true };
    } catch (error) {
      console.error('Data export failed:', error);
      throw error;
    }
  },

  async importData(file: File) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/backup/import', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || 'Data import failed');
      }
      
      return data;
    } catch (error) {
      console.error('Data import failed:', error);
      throw error;
    }
  },

  async getBackupSettings() {
    try {
      const response = await fetch('/api/backup/settings');
      const data = await response.json();
      return data.settings || {};
    } catch (error) {
      console.error('Get backup settings failed:', error);
      return {};
    }
  },

  async updateBackupSettings(settings: any) {
    try {
      const response = await fetch('/api/backup/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || 'Settings update failed');
      }
      
      return data;
    } catch (error) {
      console.error('Backup settings update failed:', error);
      throw error;
    }
  }
};
