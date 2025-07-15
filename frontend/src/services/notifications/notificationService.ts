// Enhanced notification service for Vietnamese POS system
import { message, notification, Modal } from 'antd';
import { CheckCircleOutlined, ExclamationCircleOutlined, WarningOutlined, InfoCircleOutlined } from '@ant-design/icons';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface NotificationConfig {
  title?: string;
  message: string;
  type: NotificationType;
  duration?: number;
  showProgress?: boolean;
  actions?: Array<{
    label: string;
    handler: () => void;
    type?: 'primary' | 'default' | 'danger';
  }>;
  persistent?: boolean;
  onClose?: () => void;
  onClick?: () => void;
}

export interface ToastConfig {
  message: string;
  type: NotificationType;
  duration?: number;
  onClose?: () => void;
}

class NotificationService {
  private readonly defaultDuration = 4.5; // seconds
  private readonly persistentDuration = 0; // persistent

  // Toast notifications (simple messages)
  toast(config: ToastConfig): void {
    const { message: msg, type, duration = this.defaultDuration, onClose } = config;

    switch (type) {
      case 'success':
        message.success(msg, duration, onClose);
        break;
      case 'error':
        message.error(msg, duration || 6, onClose); // Longer duration for errors
        break;
      case 'warning':
        message.warning(msg, duration || 5, onClose);
        break;
      case 'info':
        message.info(msg, duration, onClose);
        break;
    }
  }

  // Rich notifications with actions
  notify(config: NotificationConfig): void {
    const {
      title,
      message: msg,
      type,
      duration,
      actions,
      persistent = false,
      onClose,
      onClick,
    } = config;

    const icon = this.getIcon(type);
    const finalDuration = persistent ? this.persistentDuration : (duration || this.getDefaultDuration(type));

    const btn = actions?.length ? (
      <div style={{ marginTop: 8 }}>
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={action.handler}
            style={{
              marginRight: 8,
              padding: '4px 8px',
              border: '1px solid #d9d9d9',
              borderRadius: 4,
              background: action.type === 'primary' ? '#1890ff' : 'white',
              color: action.type === 'primary' ? 'white' : 'black',
              cursor: 'pointer',
            }}
          >
            {action.label}
          </button>
        ))}
      </div>
    ) : undefined;

    notification[type]({
      message: title || this.getDefaultTitle(type),
      description: msg,
      icon,
      duration: finalDuration,
      btn,
      onClose,
      onClick,
      style: {
        cursor: onClick ? 'pointer' : 'default',
      },
    });
  }

  // Business-specific notifications
  businessSuccess(message: string, title = 'Thành công'): void {
    this.toast({
      type: 'success',
      message,
    });
  }

  businessError(message: string, title = 'Lỗi'): void {
    this.toast({
      type: 'error',
      message,
      duration: 6, // Longer for errors
    });
  }

  businessWarning(message: string, title = 'Cảnh báo'): void {
    this.toast({
      type: 'warning',
      message,
      duration: 5,
    });
  }

  businessInfo(message: string, title = 'Thông tin'): void {
    this.toast({
      type: 'info',
      message,
    });
  }

  // Vietnamese POS specific notifications
  posTransactionSuccess(amount: number, method: string): void {
    this.notify({
      type: 'success',
      title: 'Giao dịch thành công',
      message: `Thanh toán ${this.formatVND(amount)} bằng ${method}`,
      duration: 3,
    });
  }

  posTransactionError(error: string): void {
    this.notify({
      type: 'error',
      title: 'Giao dịch thất bại',
      message: error,
      persistent: true,
      actions: [
        {
          label: 'Thử lại',
          handler: () => window.location.reload(),
          type: 'primary',
        },
        {
          label: 'Hủy',
          handler: () => notification.destroy(),
        },
      ],
    });
  }

  inventoryLowStock(productName: string, currentStock: number, minStock: number): void {
    this.notify({
      type: 'warning',
      title: 'Cảnh báo tồn kho thấp',
      message: `Sản phẩm "${productName}" chỉ còn ${currentStock} (tối thiểu: ${minStock})`,
      persistent: true,
      actions: [
        {
          label: 'Xem chi tiết',
          handler: () => {
            // Navigate to product detail
            window.location.href = `/products/view/${productName}`;
          },
          type: 'primary',
        },
        {
          label: 'Nhập hàng',
          handler: () => {
            // Navigate to inventory management
            window.location.href = '/products/inventory';
          },
        },
      ],
    });
  }

  customerLoyaltyUpgrade(customerName: string, newTier: string): void {
    this.notify({
      type: 'success',
      title: 'Khách hàng thăng hạng',
      message: `${customerName} đã lên hạng ${newTier}`,
      duration: 5,
      actions: [
        {
          label: 'Xem thông tin',
          handler: () => {
            // Navigate to customer detail
          },
          type: 'primary',
        },
      ],
    });
  }

  dailySalesReport(totalSales: number, orderCount: number): void {
    this.notify({
      type: 'info',
      title: 'Báo cáo bán hàng hôm nay',
      message: `Doanh thu: ${this.formatVND(totalSales)} - Đơn hàng: ${orderCount}`,
      duration: 8,
      actions: [
        {
          label: 'Xem chi tiết',
          handler: () => {
            window.location.href = '/analytics/sales';
          },
          type: 'primary',
        },
      ],
    });
  }

  // System notifications
  systemMaintenance(startTime: Date, duration: number): void {
    this.notify({
      type: 'warning',
      title: 'Bảo trì hệ thống',
      message: `Hệ thống sẽ bảo trì từ ${startTime.toLocaleString('vi-VN')} trong ${duration} phút`,
      persistent: true,
    });
  }

  systemBackupComplete(): void {
    this.notify({
      type: 'success',
      title: 'Sao lưu hoàn tất',
      message: 'Dữ liệu đã được sao lưu thành công',
      duration: 3,
    });
  }

  networkError(): void {
    this.notify({
      type: 'error',
      title: 'Lỗi kết nối',
      message: 'Không thể kết nối đến máy chủ. Đang hoạt động offline.',
      persistent: true,
      actions: [
        {
          label: 'Thử lại',
          handler: () => window.location.reload(),
          type: 'primary',
        },
      ],
    });
  }

  // Confirmation modals
  confirmDelete(itemName: string, onConfirm: () => void, onCancel?: () => void): void {
    Modal.confirm({
      title: 'Xác nhận xóa',
      content: `Bạn có chắc chắn muốn xóa "${itemName}"? Hành động này không thể hoàn tác.`,
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: onConfirm,
      onCancel,
      icon: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />,
    });
  }

  confirmLogout(onConfirm: () => void): void {
    Modal.confirm({
      title: 'Đăng xuất',
      content: 'Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?',
      okText: 'Đăng xuất',
      cancelText: 'Hủy',
      onOk: onConfirm,
      icon: <InfoCircleOutlined />,
    });
  }

  confirmPayment(amount: number, method: string, onConfirm: () => void): void {
    Modal.confirm({
      title: 'Xác nhận thanh toán',
      content: `Xác nhận thanh toán ${this.formatVND(amount)} bằng ${method}?`,
      okText: 'Xác nhận',
      cancelText: 'Hủy',
      onOk: onConfirm,
      icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
    });
  }

  // Loading states
  showLoading(message = 'Đang xử lý...', key = 'loading'): void {
    message.loading({
      content: message,
      key,
      duration: 0, // Persistent until hidden
    });
  }

  hideLoading(key = 'loading'): void {
    message.destroy(key);
  }

  // Progress notifications
  showProgress(message: string, progress: number, key = 'progress'): void {
    message.loading({
      content: `${message} (${Math.round(progress)}%)`,
      key,
      duration: 0,
    });
  }

  // Utility methods
  private getIcon(type: NotificationType) {
    switch (type) {
      case 'success':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'error':
        return <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />;
      case 'warning':
        return <WarningOutlined style={{ color: '#faad14' }} />;
      case 'info':
        return <InfoCircleOutlined style={{ color: '#1890ff' }} />;
    }
  }

  private getDefaultTitle(type: NotificationType): string {
    switch (type) {
      case 'success':
        return 'Thành công';
      case 'error':
        return 'Lỗi';
      case 'warning':
        return 'Cảnh báo';
      case 'info':
        return 'Thông tin';
    }
  }

  private getDefaultDuration(type: NotificationType): number {
    switch (type) {
      case 'error':
        return 6; // Longer for errors
      case 'warning':
        return 5; // Medium for warnings
      default:
        return this.defaultDuration;
    }
  }

  private formatVND(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  }

  // Clear all notifications
  clear(): void {
    notification.destroy();
    message.destroy();
  }
}

// Create singleton instance
export const notificationService = new NotificationService();

// Export convenience methods
export const {
  toast,
  notify,
  businessSuccess,
  businessError,
  businessWarning,
  businessInfo,
  posTransactionSuccess,
  posTransactionError,
  inventoryLowStock,
  customerLoyaltyUpgrade,
  confirmDelete,
  confirmLogout,
  confirmPayment,
  showLoading,
  hideLoading,
  showProgress,
  clear,
} = notificationService;

export default notificationService;