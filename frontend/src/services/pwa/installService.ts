// PWA installation prompts service
export const installService = {
  deferredPrompt: null as any,

  init() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.showInstallButton();
    });

    window.addEventListener('appinstalled', () => {
      this.hideInstallButton();
      this.trackInstallation();
    });
  },

  async promptInstall() {
    try {
      if (!this.deferredPrompt) {
        throw new Error('Install prompt not available');
      }

      this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      
      this.deferredPrompt = null;
      return outcome === 'accepted';
    } catch (error) {
      console.error('Install prompt failed:', error);
      return false;
    }
  },

  showInstallButton() {
    const installButton = document.getElementById('install-button');
    if (installButton) {
      installButton.style.display = 'block';
    }
    
    // Show install banner
    this.showInstallBanner();
  },

  hideInstallButton() {
    const installButton = document.getElementById('install-button');
    if (installButton) {
      installButton.style.display = 'none';
    }
    
    this.hideInstallBanner();
  },

  showInstallBanner() {
    const banner = document.createElement('div');
    banner.id = 'install-banner';
    banner.innerHTML = `
      <div style="
        position: fixed;
        bottom: 20px;
        left: 20px;
        right: 20px;
        background: #1890ff;
        color: white;
        padding: 16px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: space-between;
      ">
        <div>
          <strong>Cài đặt KhoAugment POS</strong>
          <div style="font-size: 14px; opacity: 0.9;">
            Truy cập nhanh hơn, hoạt động offline
          </div>
        </div>
        <div>
          <button onclick="installService.promptInstall()" style="
            background: white;
            color: #1890ff;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            margin-right: 8px;
            cursor: pointer;
          ">Cài đặt</button>
          <button onclick="installService.hideInstallBanner()" style="
            background: transparent;
            color: white;
            border: 1px solid white;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
          ">Bỏ qua</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(banner);
  },

  hideInstallBanner() {
    const banner = document.getElementById('install-banner');
    if (banner) {
      banner.remove();
    }
  },

  isInstalled() {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone ||
           document.referrer.includes('android-app://');
  },

  trackInstallation() {
    // Track PWA installation
    if (typeof gtag !== 'undefined') {
      gtag('event', 'pwa_install', {
        event_category: 'PWA',
        event_label: 'App Installed'
      });
    }
  },

  async checkForUpdates() {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.update();
      
      if (registration.waiting) {
        this.showUpdateAvailable();
      }
    } catch (error) {
      console.error('Update check failed:', error);
    }
  },

  showUpdateAvailable() {
    const updateBanner = document.createElement('div');
    updateBanner.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        left: 20px;
        right: 20px;
        background: #52c41a;
        color: white;
        padding: 16px;
        border-radius: 8px;
        z-index: 1000;
        text-align: center;
      ">
        <strong>Cập nhật mới có sẵn!</strong>
        <button onclick="location.reload()" style="
          background: white;
          color: #52c41a;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          margin-left: 16px;
          cursor: pointer;
        ">Cập nhật ngay</button>
      </div>
    `;
    
    document.body.appendChild(updateBanner);
  }
};
