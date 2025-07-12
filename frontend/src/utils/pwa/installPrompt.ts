// PWA install prompt utilities
export interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export class PWAInstallManager {
  private deferredPrompt: InstallPromptEvent | null = null;
  private installCallbacks: ((canInstall: boolean) => void)[] = [];
  private isInstalled: boolean = false;

  constructor() {
    this.setupEventListeners();
    this.checkInstallStatus();
  }

  private setupEventListeners(): void {
    // Listen for beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e as InstallPromptEvent;
      this.notifyInstallAvailable(true);
    });

    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      this.isInstalled = true;
      this.deferredPrompt = null;
      this.notifyInstallAvailable(false);
      console.log('PWA was installed');
    });

    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      this.isInstalled = true;
    }
  }

  private checkInstallStatus(): void {
    // Check various indicators that the app is installed
    this.isInstalled = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');
  }

  public async showInstallPrompt(): Promise<'accepted' | 'dismissed' | 'not-available'> {
    if (!this.deferredPrompt) {
      return 'not-available';
    }

    try {
      await this.deferredPrompt.prompt();
      const choiceResult = await this.deferredPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }

      this.deferredPrompt = null;
      this.notifyInstallAvailable(false);
      
      return choiceResult.outcome;
    } catch (error) {
      console.error('Error showing install prompt:', error);
      return 'not-available';
    }
  }

  public canInstall(): boolean {
    return !!this.deferredPrompt && !this.isInstalled;
  }

  public isAppInstalled(): boolean {
    return this.isInstalled;
  }

  public onInstallAvailable(callback: (canInstall: boolean) => void): void {
    this.installCallbacks.push(callback);
    // Immediately call with current state
    callback(this.canInstall());
  }

  public removeInstallCallback(callback: (canInstall: boolean) => void): void {
    const index = this.installCallbacks.indexOf(callback);
    if (index > -1) {
      this.installCallbacks.splice(index, 1);
    }
  }

  private notifyInstallAvailable(canInstall: boolean): void {
    this.installCallbacks.forEach(callback => callback(canInstall));
  }

  public getInstallInstructions(): { platform: string; instructions: string[] } {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (userAgent.includes('chrome') && !userAgent.includes('edg')) {
      return {
        platform: 'Chrome',
        instructions: [
          'Nhấp vào biểu tượng menu (3 chấm) ở góc trên bên phải',
          'Chọn "Cài đặt KhoAugment POS..."',
          'Nhấp "Cài đặt" trong hộp thoại xác nhận'
        ]
      };
    }
    
    if (userAgent.includes('firefox')) {
      return {
        platform: 'Firefox',
        instructions: [
          'Nhấp vào biểu tượng menu (3 dòng) ở góc trên bên phải',
          'Chọn "Cài đặt trang web này..."',
          'Nhấp "Cài đặt" để xác nhận'
        ]
      };
    }
    
    if (userAgent.includes('safari') && !userAgent.includes('chrome')) {
      return {
        platform: 'Safari',
        instructions: [
          'Nhấp vào biểu tượng "Chia sẻ" ở thanh công cụ',
          'Cuộn xuống và chọn "Thêm vào Màn hình chính"',
          'Nhấp "Thêm" để xác nhận'
        ]
      };
    }
    
    if (userAgent.includes('edg')) {
      return {
        platform: 'Edge',
        instructions: [
          'Nhấp vào biểu tượng menu (3 chấm) ở góc trên bên phải',
          'Chọn "Ứng dụng" > "Cài đặt trang web này làm ứng dụng"',
          'Nhấp "Cài đặt" để xác nhận'
        ]
      };
    }
    
    return {
      platform: 'Browser',
      instructions: [
        'Tìm tùy chọn "Cài đặt ứng dụng" hoặc "Thêm vào màn hình chính" trong menu trình duyệt',
        'Làm theo hướng dẫn để cài đặt ứng dụng'
      ]
    };
  }

  public trackInstallPromptShown(): void {
    // Track analytics event
    if (typeof gtag !== 'undefined') {
      gtag('event', 'pwa_install_prompt_shown', {
        event_category: 'PWA',
        event_label: 'Install Prompt Shown'
      });
    }
  }

  public trackInstallAccepted(): void {
    // Track analytics event
    if (typeof gtag !== 'undefined') {
      gtag('event', 'pwa_install_accepted', {
        event_category: 'PWA',
        event_label: 'Install Accepted'
      });
    }
  }

  public trackInstallDismissed(): void {
    // Track analytics event
    if (typeof gtag !== 'undefined') {
      gtag('event', 'pwa_install_dismissed', {
        event_category: 'PWA',
        event_label: 'Install Dismissed'
      });
    }
  }
}

// Singleton instance
export const pwaInstallManager = new PWAInstallManager();

// Convenience functions
export const showPWAInstallPrompt = (): Promise<'accepted' | 'dismissed' | 'not-available'> => {
  return pwaInstallManager.showInstallPrompt();
};

export const canInstallPWA = (): boolean => {
  return pwaInstallManager.canInstall();
};

export const isPWAInstalled = (): boolean => {
  return pwaInstallManager.isAppInstalled();
};

export const onPWAInstallAvailable = (callback: (canInstall: boolean) => void): void => {
  pwaInstallManager.onInstallAvailable(callback);
};

export const removePWAInstallCallback = (callback: (canInstall: boolean) => void): void => {
  pwaInstallManager.removeInstallCallback(callback);
};

export const getPWAInstallInstructions = (): { platform: string; instructions: string[] } => {
  return pwaInstallManager.getInstallInstructions();
};

// PWA detection utilities
export const isPWAContext = (): boolean => {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://')
  );
};

export const getPWADisplayMode = (): string => {
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return 'standalone';
  }
  if (window.matchMedia('(display-mode: minimal-ui)').matches) {
    return 'minimal-ui';
  }
  if (window.matchMedia('(display-mode: fullscreen)').matches) {
    return 'fullscreen';
  }
  return 'browser';
};

export const isPWASupported = (): boolean => {
  return 'serviceWorker' in navigator && 'PushManager' in window;
};

// PWA capabilities detection
export const getPWACapabilities = () => {
  return {
    serviceWorker: 'serviceWorker' in navigator,
    pushNotifications: 'PushManager' in window,
    backgroundSync: 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype,
    webShare: 'share' in navigator,
    webShareTarget: 'serviceWorker' in navigator,
    badging: 'setAppBadge' in navigator,
    shortcuts: 'getInstalledRelatedApps' in navigator,
    fileHandling: 'launchQueue' in window,
    urlHandling: 'registerProtocolHandler' in navigator,
  };
};
