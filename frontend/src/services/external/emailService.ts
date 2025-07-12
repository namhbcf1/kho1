// Email notifications service
export const emailService = {
  async sendEmail(to: string, subject: string, content: string, template?: string) {
    try {
      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, subject, content, template })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || 'Email send failed');
      }
      
      return data;
    } catch (error) {
      console.error('Email send failed:', error);
      throw error;
    }
  },

  async sendOrderReceipt(email: string, orderData: any) {
    const subject = `Hóa đơn điện tử - Đơn hàng ${orderData.orderNumber}`;
    const content = this.generateReceiptHTML(orderData);
    
    return this.sendEmail(email, subject, content, 'order-receipt');
  },

  async sendWelcomeEmail(email: string, customerData: any) {
    const subject = 'Chào mừng bạn đến với KhoAugment POS';
    const content = `
      <h2>Xin chào ${customerData.name}!</h2>
      <p>Cảm ơn bạn đã trở thành khách hàng của chúng tôi.</p>
      <p>Bạn đã được tích <strong>${customerData.initialPoints} điểm</strong> vào tài khoản.</p>
      <p>Hạng thành viên hiện tại: <strong>${customerData.tier}</strong></p>
    `;
    
    return this.sendEmail(email, subject, content, 'welcome');
  },

  async sendLoyaltyUpdate(email: string, loyaltyData: any) {
    const subject = 'Cập nhật điểm thưởng';
    const content = `
      <h2>Cập nhật điểm thưởng</h2>
      <p>Bạn vừa tích được <strong>${loyaltyData.pointsEarned} điểm</strong></p>
      <p>Tổng điểm hiện tại: <strong>${loyaltyData.totalPoints} điểm</strong></p>
      <p>Hạng thành viên: <strong>${loyaltyData.tier}</strong></p>
    `;
    
    return this.sendEmail(email, subject, content, 'loyalty-update');
  },

  async sendPromotionEmail(email: string, promotion: any) {
    const subject = `Ưu đãi đặc biệt: ${promotion.title}`;
    const content = `
      <h2>${promotion.title}</h2>
      <p>${promotion.description}</p>
      <p><strong>Giảm giá: ${promotion.discount}%</strong></p>
      <p>Mã khuyến mãi: <strong>${promotion.code}</strong></p>
      <p>Có hiệu lực từ ${promotion.startDate} đến ${promotion.endDate}</p>
    `;
    
    return this.sendEmail(email, subject, content, 'promotion');
  },

  async sendPasswordReset(email: string, resetData: any) {
    const subject = 'Đặt lại mật khẩu - KhoAugment POS';
    const content = `
      <h2>Đặt lại mật khẩu</h2>
      <p>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản ${email}</p>
      <p>Nhấp vào liên kết sau để đặt lại mật khẩu:</p>
      <a href="${resetData.resetUrl}" style="
        background: #1890ff;
        color: white;
        padding: 12px 24px;
        text-decoration: none;
        border-radius: 4px;
        display: inline-block;
      ">Đặt lại mật khẩu</a>
      <p>Liên kết này sẽ hết hạn sau 1 giờ.</p>
    `;
    
    return this.sendEmail(email, subject, content, 'password-reset');
  },

  generateReceiptHTML(orderData: any): string {
    return `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <h2 style="text-align: center; color: #1890ff;">HÓA ĐƠN ĐIỆN TỬ</h2>
        
        <div style="border: 1px solid #ddd; padding: 20px; margin: 20px 0;">
          <h3>Thông tin đơn hàng</h3>
          <p><strong>Mã đơn hàng:</strong> ${orderData.orderNumber}</p>
          <p><strong>Ngày:</strong> ${new Date(orderData.createdAt).toLocaleDateString('vi-VN')}</p>
          <p><strong>Khách hàng:</strong> ${orderData.customerName || 'Khách lẻ'}</p>
        </div>
        
        <div style="border: 1px solid #ddd; padding: 20px; margin: 20px 0;">
          <h3>Chi tiết sản phẩm</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #f5f5f5;">
                <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Sản phẩm</th>
                <th style="padding: 8px; text-align: center; border: 1px solid #ddd;">SL</th>
                <th style="padding: 8px; text-align: right; border: 1px solid #ddd;">Đơn giá</th>
                <th style="padding: 8px; text-align: right; border: 1px solid #ddd;">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              ${orderData.items.map((item: any) => `
                <tr>
                  <td style="padding: 8px; border: 1px solid #ddd;">${item.name}</td>
                  <td style="padding: 8px; text-align: center; border: 1px solid #ddd;">${item.quantity}</td>
                  <td style="padding: 8px; text-align: right; border: 1px solid #ddd;">${item.price.toLocaleString('vi-VN')}đ</td>
                  <td style="padding: 8px; text-align: right; border: 1px solid #ddd;">${item.total.toLocaleString('vi-VN')}đ</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        <div style="border: 1px solid #ddd; padding: 20px; margin: 20px 0;">
          <div style="text-align: right;">
            <p><strong>Tạm tính: ${orderData.subtotal.toLocaleString('vi-VN')}đ</strong></p>
            <p>Giảm giá: -${orderData.discount.toLocaleString('vi-VN')}đ</p>
            <p>Thuế VAT: ${orderData.tax.toLocaleString('vi-VN')}đ</p>
            <h3 style="color: #1890ff;">Tổng cộng: ${orderData.total.toLocaleString('vi-VN')}đ</h3>
          </div>
        </div>
        
        <div style="text-align: center; margin: 20px 0;">
          <p>Cảm ơn quý khách đã mua hàng!</p>
          <p style="font-size: 12px; color: #666;">
            Đây là hóa đơn điện tử được tạo tự động. Vui lòng không trả lời email này.
          </p>
        </div>
      </div>
    `;
  },

  async getEmailTemplates() {
    try {
      const response = await fetch('/api/email/templates');
      const data = await response.json();
      return data.templates || [];
    } catch (error) {
      console.error('Get email templates failed:', error);
      return [];
    }
  }
};
