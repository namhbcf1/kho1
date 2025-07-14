// Vietnamese barcode scanning and receipt printing service
import { apiClient } from './client';
import type { 
  BarcodeScanResult, 
  ProductLookupResult,
  BarcodeValidationRules,
  VietnameseBarcodeFormats 
} from '../../components/business/BarcodeScanner/BarcodeScanner.types';
import type { 
  ReceiptOrder, 
  BusinessInfo, 
  PrintJob,
  PrinterSettings 
} from '../../components/business/ReceiptPrinter/ReceiptPrinter.types';

// Vietnamese barcode validation patterns
const VIETNAMESE_BARCODE_PATTERNS = {
  EAN_13: /^[0-9]{13}$/,
  EAN_8: /^[0-9]{8}$/,
  CODE_128: /^[A-Za-z0-9\-_\.\s]{1,48}$/,
  CODE_39: /^[A-Z0-9\-\.\s\$\/\+%\*]{1,43}$/,
  UPC_A: /^[0-9]{12}$/,
  UPC_E: /^[0-9]{8}$/,
  QR_CODE: /^.{1,2953}$/, // QR code can contain up to 2953 bytes
  INTERNAL_VIETNAMESE: /^VN[0-9A-Z]{6,15}$/ // Vietnamese internal format
};

// Vietnamese product categories that require special handling
const VIETNAMESE_PRODUCT_CATEGORIES = {
  FOOD: { vatRate: 5, requiresExpiry: true, unit: 'kg' },
  BEVERAGE: { vatRate: 10, requiresExpiry: true, unit: 'chai' },
  ELECTRONICS: { vatRate: 10, requiresExpiry: false, unit: 'cái' },
  CLOTHING: { vatRate: 10, requiresExpiry: false, unit: 'cái' },
  MEDICINE: { vatRate: 0, requiresExpiry: true, unit: 'hộp' },
  COSMETICS: { vatRate: 10, requiresExpiry: true, unit: 'cái' }
};

class BarcodeReceiptService {
  private readonly baseUrl = '/api/barcode-receipt';

  // Barcode scanning and validation
  async validateBarcode(code: string, format?: string): Promise<{ isValid: boolean; format?: string; error?: string }> {
    try {
      // Client-side validation first
      const clientValidation = this.validateBarcodeFormat(code);
      if (!clientValidation.isValid) {
        return clientValidation;
      }

      // Server-side validation for Vietnamese business rules
      const response = await apiClient.post(`${this.baseUrl}/validate`, {
        code,
        format,
        validateVietnameseRules: true
      });

      if (!response.ok) {
        throw new Error('Lỗi xác thực mã vạch');
      }

      return await response.json();
    } catch (error) {
      console.error('Barcode validation error:', error);
      return {
        isValid: false,
        error: 'Không thể xác thực mã vạch'
      };
    }
  }

  async lookupProduct(barcode: string): Promise<ProductLookupResult> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/product/${encodeURIComponent(barcode)}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return {
            found: false,
            error: 'Không tìm thấy sản phẩm với mã vạch này'
          };
        }
        throw new Error('Lỗi tra cứu sản phẩm');
      }

      const result = await response.json();
      
      // Enhance with Vietnamese business logic
      if (result.found && result.product) {
        result.product = this.enhanceProductWithVietnameseData(result.product);
      }

      return result;
    } catch (error) {
      console.error('Product lookup error:', error);
      return {
        found: false,
        error: 'Không thể tra cứu thông tin sản phẩm'
      };
    }
  }

  async scanAndLookup(barcode: string): Promise<BarcodeScanResult> {
    try {
      const timestamp = Date.now();
      
      // Validate barcode format
      const validation = await this.validateBarcode(barcode);
      if (!validation.isValid) {
        return {
          text: barcode,
          format: validation.format || 'unknown',
          timestamp,
          isValid: false,
          errorMessage: validation.error || 'Mã vạch không hợp lệ'
        };
      }

      // Lookup product information
      const productLookup = await this.lookupProduct(barcode);
      
      const result: BarcodeScanResult = {
        text: barcode,
        format: validation.format || 'unknown',
        timestamp,
        isValid: productLookup.found,
        confidence: 0.9 // High confidence for successful lookups
      };

      if (productLookup.found && productLookup.product) {
        result.productInfo = {
          id: productLookup.product.id,
          name: productLookup.product.name,
          price: productLookup.product.sellPrice || productLookup.product.price,
          stock: productLookup.product.stock,
          unit: productLookup.product.unit,
          vatRate: productLookup.product.vatRate
        };
      } else {
        result.errorMessage = productLookup.error || 'Sản phẩm không tồn tại';
      }

      return result;
    } catch (error) {
      console.error('Scan and lookup error:', error);
      return {
        text: barcode,
        format: 'unknown',
        timestamp: Date.now(),
        isValid: false,
        errorMessage: 'Lỗi quét mã vạch'
      };
    }
  }

  // Receipt printing services
  async generateReceipt(order: ReceiptOrder, businessInfo: BusinessInfo, settings?: PrinterSettings): Promise<string> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/receipt/generate`, {
        order: this.enhanceOrderWithVietnameseData(order),
        businessInfo,
        settings: settings || this.getDefaultPrinterSettings(),
        template: 'vietnamese_standard'
      });

      if (!response.ok) {
        throw new Error('Lỗi tạo hóa đơn');
      }

      const result = await response.json();
      return result.content;
    } catch (error) {
      console.error('Receipt generation error:', error);
      throw new Error('Không thể tạo hóa đơn');
    }
  }

  async printReceipt(order: ReceiptOrder, businessInfo: BusinessInfo, settings?: PrinterSettings): Promise<PrintJob> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/receipt/print`, {
        order: this.enhanceOrderWithVietnameseData(order),
        businessInfo,
        settings: settings || this.getDefaultPrinterSettings(),
        timestamp: new Date().toISOString()
      });

      if (!response.ok) {
        throw new Error('Lỗi in hóa đơn');
      }

      return await response.json();
    } catch (error) {
      console.error('Receipt printing error:', error);
      throw new Error('Không thể in hóa đơn');
    }
  }

  async generatePDFReceipt(order: ReceiptOrder, businessInfo: BusinessInfo): Promise<Blob> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/receipt/pdf`, {
        order: this.enhanceOrderWithVietnameseData(order),
        businessInfo,
        template: 'vietnamese_a4',
        includeVATBreakdown: true
      }, {
        responseType: 'blob'
      });

      if (!response.ok) {
        throw new Error('Lỗi tạo file PDF');
      }

      return await response.blob();
    } catch (error) {
      console.error('PDF generation error:', error);
      throw new Error('Không thể tạo file PDF hóa đơn');
    }
  }

  async openCashDrawer(printerSettings?: PrinterSettings): Promise<void> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/drawer/open`, {
        printerSettings: printerSettings || this.getDefaultPrinterSettings(),
        reason: 'receipt_printed',
        timestamp: new Date().toISOString()
      });

      if (!response.ok) {
        throw new Error('Lỗi mở ngăn kéo tiền');
      }
    } catch (error) {
      console.error('Cash drawer error:', error);
      // Don't throw error as this is not critical for the transaction
    }
  }

  // Barcode generation for Vietnamese products
  async generateBarcode(productId: string, format: string = 'EAN_13'): Promise<{ barcode: string; image: string }> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/barcode/generate`, {
        productId,
        format,
        country: 'VN', // Vietnamese country code
        includeCheckDigit: true
      });

      if (!response.ok) {
        throw new Error('Lỗi tạo mã vạch');
      }

      return await response.json();
    } catch (error) {
      console.error('Barcode generation error:', error);
      throw new Error('Không thể tạo mã vạch cho sản phẩm');
    }
  }

  // Business info management
  async getBusinessInfo(): Promise<BusinessInfo> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/business/info`);
      
      if (!response.ok) {
        throw new Error('Lỗi tải thông tin cửa hàng');
      }

      return await response.json();
    } catch (error) {
      console.error('Business info error:', error);
      throw new Error('Không thể tải thông tin cửa hàng');
    }
  }

  async updateBusinessInfo(businessInfo: Partial<BusinessInfo>): Promise<BusinessInfo> {
    try {
      const response = await apiClient.put(`${this.baseUrl}/business/info`, businessInfo);
      
      if (!response.ok) {
        throw new Error('Lỗi cập nhật thông tin cửa hàng');
      }

      return await response.json();
    } catch (error) {
      console.error('Business info update error:', error);
      throw new Error('Không thể cập nhật thông tin cửa hàng');
    }
  }

  // Printer management
  async testPrinter(settings: PrinterSettings): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/printer/test`, {
        settings,
        testContent: this.generateTestReceipt()
      });

      if (!response.ok) {
        throw new Error('Lỗi kiểm tra máy in');
      }

      return await response.json();
    } catch (error) {
      console.error('Printer test error:', error);
      return {
        success: false,
        message: 'Không thể kết nối với máy in'
      };
    }
  }

  async getPrinterStatus(settings: PrinterSettings): Promise<{ online: boolean; paperLevel: number; errors: string[] }> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/printer/status`, { settings });
      
      if (!response.ok) {
        throw new Error('Lỗi kiểm tra trạng thái máy in');
      }

      return await response.json();
    } catch (error) {
      console.error('Printer status error:', error);
      return {
        online: false,
        paperLevel: 0,
        errors: ['Không thể kết nối với máy in']
      };
    }
  }

  // Private helper methods
  private validateBarcodeFormat(code: string): { isValid: boolean; format?: string; error?: string } {
    if (!code || code.trim().length === 0) {
      return { isValid: false, error: 'Mã vạch không được để trống' };
    }

    // Check against Vietnamese barcode patterns
    for (const [format, pattern] of Object.entries(VIETNAMESE_BARCODE_PATTERNS)) {
      if (pattern.test(code)) {
        return { isValid: true, format };
      }
    }

    return { 
      isValid: false, 
      error: 'Định dạng mã vạch không được hỗ trợ'
    };
  }

  private enhanceProductWithVietnameseData(product: any): any {
    // Add Vietnamese business logic
    const category = this.detectProductCategory(product.name, product.category);
    const categoryInfo = VIETNAMESE_PRODUCT_CATEGORIES[category as keyof typeof VIETNAMESE_PRODUCT_CATEGORIES];

    if (categoryInfo) {
      product.vatRate = product.vatRate || categoryInfo.vatRate;
      product.unit = product.unit || categoryInfo.unit;
      product.requiresExpiry = categoryInfo.requiresExpiry;
    }

    // Add Vietnamese formatting
    product.formattedPrice = product.price?.toLocaleString('vi-VN') + 'đ';
    product.formattedStock = product.stock?.toLocaleString('vi-VN');

    return product;
  }

  private enhanceOrderWithVietnameseData(order: ReceiptOrder): ReceiptOrder {
    // Calculate Vietnamese VAT properly
    let totalVAT = 0;
    const enhancedItems = order.items.map(item => {
      const vatRate = item.vatRate || 10;
      const itemTotal = item.quantity * item.price;
      const vatAmount = (itemTotal * vatRate) / (100 + vatRate);
      totalVAT += vatAmount;

      return {
        ...item,
        vatAmount,
        totalWithVAT: itemTotal
      };
    });

    return {
      ...order,
      items: enhancedItems,
      vatAmount: totalVAT,
      formattedTotal: order.total.toLocaleString('vi-VN') + 'đ',
      createdAt: order.createdAt || new Date().toISOString()
    };
  }

  private detectProductCategory(name: string, category?: string): string {
    if (category) return category.toUpperCase();

    const nameUpper = name.toUpperCase();
    
    if (nameUpper.includes('THỨC ĂN') || nameUpper.includes('BÁNH') || nameUpper.includes('KẸO')) {
      return 'FOOD';
    }
    if (nameUpper.includes('NƯỚC') || nameUpper.includes('BEER') || nameUpper.includes('CHAI')) {
      return 'BEVERAGE';
    }
    if (nameUpper.includes('ĐIỆN') || nameUpper.includes('PHONE') || nameUpper.includes('MÁY')) {
      return 'ELECTRONICS';
    }
    if (nameUpper.includes('THUỐC') || nameUpper.includes('VITAMIN')) {
      return 'MEDICINE';
    }
    if (nameUpper.includes('MỸ PHẨM') || nameUpper.includes('SỮA RỬA')) {
      return 'COSMETICS';
    }

    return 'FOOD'; // Default category
  }

  private getDefaultPrinterSettings(): PrinterSettings {
    return {
      printerType: 'xprinter_xp80',
      connectionType: 'thermal_usb',
      paperWidth: 80,
      cutPaper: true,
      openDrawer: true,
      printLogo: true,
      printQR: true,
      fontSize: 'normal',
      copies: 1,
      encoding: 'utf-8'
    };
  }

  private generateTestReceipt(): string {
    return `
KIỂM TRA MÁY IN
================
Cửa hàng: Test Store
Địa chỉ: 123 Test Street
ĐT: 0123456789
MST: 0123456789
================
Thời gian: ${new Date().toLocaleString('vi-VN')}
Kiểm tra in ấn thành công!
Cảm ơn bạn đã sử dụng hệ thống POS Vietnam.
================
    `.trim();
  }
}

export const barcodeReceiptService = new BarcodeReceiptService();