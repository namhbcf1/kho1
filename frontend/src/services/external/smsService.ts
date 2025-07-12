// Vietnamese SMS providers service
export const smsService = {
  async sendSMS(phone: string, message: string, provider: string = 'default') {
    try {
      const response = await fetch('/api/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, message, provider })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || 'SMS send failed');
      }
      
      return data;
    } catch (error) {
      console.error('SMS send failed:', error);
      throw error;
    }
  },

  async sendOrderConfirmation(phone: string, orderData: any) {
    const message = `KhoAugment POS: Đơn hàng ${orderData.orderNumber} đã được xác nhận. Tổng tiền: ${orderData.total}đ. Cảm ơn quý khách!`;
    return this.sendSMS(phone, message);
  },

  async sendLoyaltyUpdate(phone: string, points: number, tier: string) {
    const message = `KhoAugment POS: Bạn vừa tích được ${points} điểm. Hạng hiện tại: ${tier}. Cảm ơn quý khách thân thiết!`;
    return this.sendSMS(phone, message);
  },

  async sendPromotion(phone: string, promotion: any) {
    const message = `KhoAugment POS: ${promotion.title} - Giảm ${promotion.discount}%. Áp dụng từ ${promotion.startDate} đến ${promotion.endDate}. Mã: ${promotion.code}`;
    return this.sendSMS(phone, message);
  },

  async sendPaymentReminder(phone: string, orderData: any) {
    const message = `KhoAugment POS: Đơn hàng ${orderData.orderNumber} chưa thanh toán. Vui lòng hoàn tất thanh toán. Hotline: 1900xxxx`;
    return this.sendSMS(phone, message);
  },

  validateVietnamesePhone(phone: string): boolean {
    // Vietnamese phone number validation
    const phoneRegex = /^(\+84|84|0)(3[2-9]|5[6|8|9]|7[0|6-9]|8[1-6|8|9]|9[0-4|6-9])[0-9]{7}$/;
    return phoneRegex.test(phone);
  },

  formatVietnamesePhone(phone: string): string {
    // Format to international format
    if (phone.startsWith('0')) {
      return '+84' + phone.substring(1);
    }
    if (phone.startsWith('84')) {
      return '+' + phone;
    }
    if (!phone.startsWith('+84')) {
      return '+84' + phone;
    }
    return phone;
  },

  async getSMSBalance() {
    try {
      const response = await fetch('/api/sms/balance');
      const data = await response.json();
      return data.balance || 0;
    } catch (error) {
      console.error('Get SMS balance failed:', error);
      return 0;
    }
  },

  async getSMSHistory(limit: number = 50) {
    try {
      const response = await fetch(`/api/sms/history?limit=${limit}`);
      const data = await response.json();
      return data.history || [];
    } catch (error) {
      console.error('Get SMS history failed:', error);
      return [];
    }
  }
};
