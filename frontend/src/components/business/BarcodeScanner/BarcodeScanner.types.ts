// Enhanced barcode scanner types for Vietnamese POS system

export interface BarcodeScannerProps {
  onScan?: (code: string) => void;
  onError?: (error: string) => void;
  visible: boolean;
  onClose?: () => void;
  scanFormats?: string[];
  autoStart?: boolean;
  continuous?: boolean;
  beep?: boolean;
  timeout?: number;
  
  // Vietnamese POS specific
  productLookup?: boolean;
  inventoryCheck?: boolean;
  priceCheck?: boolean;
  allowManualInput?: boolean;
  validateFormat?: boolean;
}

export interface BarcodeDisplayProps {
  code: string;
  format?: 'text' | 'monospace';
  style?: React.CSSProperties;
  showFormat?: boolean;
  showTimestamp?: boolean;
}

export interface BarcodeScanResult {
  text: string;
  format: string;
  timestamp: number;
  confidence?: number;
  
  // Vietnamese business data
  productInfo?: {
    id: string;
    name: string;
    price: number;
    stock: number;
    unit: string;
    vatRate: number;
  };
  isValid: boolean;
  errorMessage?: string;
}

export interface CameraConstraints {
  facingMode: 'user' | 'environment';
  width?: { ideal: number; min: number };
  height?: { ideal: number; min: number };
  aspectRatio?: { ideal: number };
  frameRate?: { ideal: number; min: number };
  
  // Advanced camera controls
  torch?: boolean;
  zoom?: number;
  focusMode?: 'manual' | 'auto' | 'continuous';
}

// Vietnamese barcode formats commonly used in retail
export interface VietnameseBarcodeFormats {
  EAN_13: boolean;     // International standard
  EAN_8: boolean;      // Short version
  CODE_128: boolean;   // Internal products
  CODE_39: boolean;    // Legacy products
  UPC_A: boolean;      // US products
  UPC_E: boolean;      // US short version
  QR_CODE: boolean;    // Digital receipts, promotions
  DATA_MATRIX: boolean; // Small items
  PDF_417: boolean;     // Documents
}

// Scanner performance settings
export interface ScannerSettings {
  scanInterval: number;        // ms between scan attempts
  maxScanAttempts: number;     // before giving up
  confidenceThreshold: number; // minimum confidence level
  enableBeep: boolean;
  enableVibration: boolean;
  enableFlash: boolean;
  autoFocus: boolean;
  
  // Vietnamese specific
  validateVietnameseProducts: boolean;
  checkProductAvailability: boolean;
  showPriceOnScan: boolean;
  autoAddToCart: boolean;
}

// Error types for Vietnamese context
export enum BarcodeScanError {
  CAMERA_ACCESS_DENIED = 'camera_access_denied',
  CAMERA_NOT_FOUND = 'camera_not_found',
  CAMERA_IN_USE = 'camera_in_use',
  BROWSER_NOT_SUPPORTED = 'browser_not_supported',
  INVALID_BARCODE_FORMAT = 'invalid_barcode_format',
  PRODUCT_NOT_FOUND = 'product_not_found',
  PRODUCT_OUT_OF_STOCK = 'product_out_of_stock',
  SCAN_TIMEOUT = 'scan_timeout',
  UNKNOWN_ERROR = 'unknown_error'
}

// Scanner status
export interface ScannerStatus {
  isActive: boolean;
  isScanning: boolean;
  hasCamera: boolean;
  hasFlash: boolean;
  lastScanTime?: number;
  scanCount: number;
  errorCount: number;
  batteryOptimized: boolean;
}

// Barcode validation rules for Vietnamese products
export interface BarcodeValidationRules {
  minLength: number;
  maxLength: number;
  allowedFormats: string[];
  requireCheckDigit: boolean;
  customValidator?: (code: string) => boolean;
}

// Product lookup result
export interface ProductLookupResult {
  found: boolean;
  product?: {
    id: string;
    name: string;
    price: number;
    sellPrice: number;
    stock: number;
    unit: string;
    vatRate: number;
    category: string;
    brand?: string;
    description?: string;
    images: string[];
    barcode: string;
    sku: string;
    
    // Vietnamese specific
    origin?: string;
    qualityStandard?: string;
    isPerishable: boolean;
    expiryDate?: string;
  };
  suggestions?: ProductLookupResult['product'][];
  error?: string;
}