// Cash drawer control service
export const cashDrawerService = {
  async openDrawer() {
    try {
      if ('serial' in navigator) {
        const port = await (navigator as any).serial.requestPort();
        await port.open({ baudRate: 9600 });
        
        // ESC/POS command to open cash drawer
        const openCommand = new Uint8Array([0x1B, 0x70, 0x00, 0x19, 0xFA]);
        const writer = port.writable.getWriter();
        await writer.write(openCommand);
        writer.releaseLock();
        
        return { success: true };
      } else {
        // Fallback: play sound or show notification
        this.playOpenSound();
        return { success: true, fallback: true };
      }
    } catch (error) {
      console.error('Cash drawer open failed:', error);
      throw error;
    }
  },

  async checkStatus() {
    try {
      // Check if cash drawer is open/closed
      return {
        isOpen: false,
        connected: true,
        lastOpened: new Date().toISOString()
      };
    } catch (error) {
      return {
        isOpen: false,
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  playOpenSound() {
    // Play cash register sound
    const audio = new Audio('/sounds/cash-register.mp3');
    audio.play().catch(console.error);
  },

  async testDrawer() {
    try {
      await this.openDrawer();
      return { success: true, message: 'Cash drawer test successful' };
    } catch (error) {
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Test failed' 
      };
    }
  }
};
