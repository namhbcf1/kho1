export interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
}

export interface ReceiptOrder {
  id: string;
  items: ReceiptItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paid: number;
  change: number;
  cashier: string;
  customer?: string;
  paymentMethod: string;
}

export interface BusinessInfo {
  name: string;
  address: string;
  phone: string;
  taxCode?: string;
  logo?: string;
  website?: string;
}

export interface ReceiptTemplateProps {
  order: ReceiptOrder;
  businessInfo: BusinessInfo;
  showLogo?: boolean;
}

export interface ReceiptPrinterProps {
  order: ReceiptOrder;
  businessInfo: BusinessInfo;
  onPrint?: () => void;
  disabled?: boolean;
}
