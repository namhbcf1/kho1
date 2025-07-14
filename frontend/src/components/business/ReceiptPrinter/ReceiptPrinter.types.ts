// Vietnamese receipt printer types with production features

export interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
  unit?: string;
  vatRate?: number;
  discount?: number;
  category?: string;
  barcode?: string;
}

export interface ReceiptOrder {
  id: string;
  items: ReceiptItem[];
  subtotal: number;
  discount: number;
  loyaltyDiscount?: number;
  vatAmount: number;
  total: number;
  paid: number;
  change: number;
  cashier: string;
  customer?: string;
  loyaltyCard?: string;
  paymentMethod: string;
  
  // Vietnamese business fields
  loyaltyPointsEarned?: number;
  totalLoyaltyPoints?: number;
  digitalReceiptUrl?: string;
  invoiceNumber?: string;
  
  // Timestamps
  createdAt: string;
  completedAt?: string;
}

export interface BusinessInfo {
  name: string;
  address: string;
  phone: string;
  taxCode?: string;
  logo?: string;
  website?: string;
  
  // Vietnamese business info
  businessLicense?: string;
  returnPolicy?: string;
  workingHours?: string;
  email?: string;
}

export interface PrinterSettings {
  printerType: string;
  connectionType: 'thermal_usb' | 'thermal_network' | 'browser' | 'pdf' | 'image' | 'usb';
  paperWidth: number;
  cutPaper: boolean;
  openDrawer: boolean;
  printLogo: boolean;
  printQR: boolean;
  fontSize: 'small' | 'normal' | 'large';
  copies: number;
  
  // Network settings
  networkIP?: string;
  networkPort?: number;
  
  // Encoding
  encoding?: string;
}

export type PrintFormat = 'standard' | 'detailed' | 'compact' | 'gift';

export interface ReceiptTemplateProps {
  order: ReceiptOrder;
  businessInfo: BusinessInfo;
  format?: PrintFormat;
  settings?: PrinterSettings;
  showLogo?: boolean;
}

export interface ReceiptPrinterProps {
  order: ReceiptOrder;
  businessInfo: BusinessInfo;
  onPrint?: () => void;
  disabled?: boolean;
  format?: PrintFormat;
  copies?: number;
}

// Vietnamese thermal printer command sets
export interface ThermalPrinterCommands {
  init: string;
  cutPaper: string;
  centerAlign: string;
  leftAlign: string;
  rightAlign: string;
  bold: string;
  normal: string;
  underline: string;
  largeFontSize: string;
  normalFontSize: string;
  smallFontSize: string;
  lineFeed: string;
  openDrawer: string;
}

export interface ThermalPrinter {
  name: string;
  width: number; // mm
  encoding: string;
  commands: ThermalPrinterCommands;
}

// Receipt generation options
export interface ReceiptGenerationOptions {
  includeHeader: boolean;
  includeFooter: boolean;
  includeLogo: boolean;
  includeQR: boolean;
  includeTaxBreakdown: boolean;
  includeLoyaltyInfo: boolean;
  paperWidth: number;
  fontSize: string;
}

// Print job status
export interface PrintJob {
  id: string;
  orderId: string;
  status: 'pending' | 'printing' | 'completed' | 'failed';
  printerType: string;
  copies: number;
  createdAt: string;
  completedAt?: string;
  errorMessage?: string;
}

// Cash drawer status
export interface CashDrawerStatus {
  isOpen: boolean;
  openedAt?: string;
  openedBy?: string;
  reason?: string;
}