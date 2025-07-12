// Push notifications service
export const notificationService = {
  async requestPermission() {
    try {
      if (!('Notification' in window)) {
        throw new Error('Notifications not supported');
      }
      
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Notification permission failed:', error);
      return false;
    }
  },

  async subscribeToPush() {
    try {
      const registration = await navigator.serviceWorker.ready;
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(
          process.env.VITE_VAPID_PUBLIC_KEY || ''
        )
      });
      
      // Send subscription to server
      await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription)
      });
      
      return subscription;
    } catch (error) {
      console.error('Push subscription failed:', error);
      throw error;
    }
  },

  async showNotification(title: string, options?: NotificationOptions) {
    try {
      if (Notification.permission === 'granted') {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification(title, {
          icon: '/icons/icon-192x192.png',
          badge: '/icons/badge-72x72.png',
          ...options
        });
      }
    } catch (error) {
      console.error('Show notification failed:', error);
    }
  },

  async showOrderNotification(orderData: any) {
    await this.showNotification('Đơn hàng mới', {
      body: `Đơn hàng ${orderData.orderNumber} - ${orderData.total}đ`,
      tag: 'new-order',
      actions: [
        { action: 'view', title: 'Xem chi tiết' },
        { action: 'print', title: 'In hóa đơn' }
      ]
    });
  },

  async showLowStockNotification(products: any[]) {
    await this.showNotification('Cảnh báo tồn kho', {
      body: `${products.length} sản phẩm sắp hết hàng`,
      tag: 'low-stock',
      actions: [
        { action: 'view', title: 'Xem danh sách' }
      ]
    });
  },

  async showPaymentNotification(paymentData: any) {
    const status = paymentData.success ? 'thành công' : 'thất bại';
    await this.showNotification(`Thanh toán ${status}`, {
      body: `${paymentData.method} - ${paymentData.amount}đ`,
      tag: 'payment-status'
    });
  },

  urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    
    return outputArray;
  },

  async unsubscribeFromPush() {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        
        // Notify server
        await fetch('/api/notifications/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint })
        });
      }
    } catch (error) {
      console.error('Unsubscribe failed:', error);
    }
  }
};
