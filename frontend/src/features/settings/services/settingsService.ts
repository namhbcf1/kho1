// Settings API calls
export const settingsService = {
  async getSettings() {
    const response = await fetch('/api/settings');
    return response.json();
  },

  async updateBusinessSettings(businessData: any) {
    const response = await fetch('/api/settings/business', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(businessData),
    });
    return response.json();
  },

  async updateTaxSettings(taxData: any) {
    const response = await fetch('/api/settings/tax', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taxData),
    });
    return response.json();
  },

  async updatePaymentSettings(paymentData: any) {
    const response = await fetch('/api/settings/payment', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentData),
    });
    return response.json();
  },

  async updateReceiptSettings(receiptData: any) {
    const response = await fetch('/api/settings/receipt', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(receiptData),
    });
    return response.json();
  },

  async updateLanguageSettings(languageData: any) {
    const response = await fetch('/api/settings/language', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(languageData),
    });
    return response.json();
  },

  async updateBackupSettings(backupData: any) {
    const response = await fetch('/api/settings/backup', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(backupData),
    });
    return response.json();
  },

  async createBackup() {
    const response = await fetch('/api/backup/create', {
      method: 'POST',
    });
    return response.json();
  },

  async getBackupHistory() {
    const response = await fetch('/api/backup/history');
    return response.json();
  },

  async downloadBackup(backupId: string) {
    const response = await fetch(`/api/backup/download/${backupId}`);
    return response.blob();
  },

  async restoreBackup(backupId: string) {
    const response = await fetch(`/api/backup/restore/${backupId}`, {
      method: 'POST',
    });
    return response.json();
  },
};
