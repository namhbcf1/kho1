// Barcode scanner integration service
export const scannerService = {
  async startScanning(callback: (barcode: string) => void) {
    try {
      if ('BarcodeDetector' in window) {
        const barcodeDetector = new (window as any).BarcodeDetector();
        
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        
        const video = document.createElement('video');
        video.srcObject = stream;
        video.play();
        
        const detectBarcodes = async () => {
          try {
            const barcodes = await barcodeDetector.detect(video);
            if (barcodes.length > 0) {
              callback(barcodes[0].rawValue);
              stream.getTracks().forEach(track => track.stop());
            } else {
              requestAnimationFrame(detectBarcodes);
            }
          } catch (error) {
            console.error('Barcode detection error:', error);
          }
        };
        
        video.addEventListener('loadedmetadata', detectBarcodes);
      } else {
        throw new Error('BarcodeDetector not supported');
      }
    } catch (error) {
      console.error('Scanner initialization failed:', error);
      throw error;
    }
  },

  async scanFromImage(imageFile: File): Promise<string | null> {
    try {
      if ('BarcodeDetector' in window) {
        const barcodeDetector = new (window as any).BarcodeDetector();
        const barcodes = await barcodeDetector.detect(imageFile);
        return barcodes.length > 0 ? barcodes[0].rawValue : null;
      }
      throw new Error('BarcodeDetector not supported');
    } catch (error) {
      console.error('Image scan failed:', error);
      return null;
    }
  },

  validateBarcode(barcode: string): boolean {
    // Basic barcode validation
    return /^[0-9]{8,13}$/.test(barcode);
  }
};
