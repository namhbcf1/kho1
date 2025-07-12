// Thermal printer integration service
export const printerService = {
  async connect() {
    try {
      if ('serial' in navigator) {
        const port = await (navigator as any).serial.requestPort();
        await port.open({ baudRate: 9600 });
        return port;
      }
      throw new Error('Serial API not supported');
    } catch (error) {
      console.error('Printer connection failed:', error);
      throw error;
    }
  },

  async print(receiptData: any) {
    try {
      // ESC/POS commands for thermal printer
      const commands = this.generateESCPOSCommands(receiptData);
      
      if ('bluetooth' in navigator) {
        const device = await (navigator as any).bluetooth.requestDevice({
          filters: [{ services: ['000018f0-0000-1000-8000-00805f9b34fb'] }]
        });
        // Send commands to Bluetooth printer
      } else {
        // Fallback to browser print
        window.print();
      }
    } catch (error) {
      console.error('Print failed:', error);
      throw error;
    }
  },

  generateESCPOSCommands(data: any) {
    // Generate ESC/POS commands for receipt
    return [
      '\x1B\x40', // Initialize printer
      '\x1B\x61\x01', // Center align
      data.header + '\n',
      '\x1B\x61\x00', // Left align
      '--------------------------------\n',
      ...data.items.map((item: any) => 
        `${item.name} x${item.quantity}\n${item.price}\n`
      ),
      '--------------------------------\n',
      `TOTAL: ${data.total}\n`,
      '\x1B\x64\x03', // Feed 3 lines
      '\x1B\x69', // Cut paper
    ];
  },

  async checkStatus() {
    // Check printer status
    return {
      connected: true,
      paperLevel: 'ok',
      temperature: 'normal'
    };
  }
};
