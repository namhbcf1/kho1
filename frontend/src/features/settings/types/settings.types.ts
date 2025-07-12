// Settings TypeScript types
export interface BusinessSettings {
  name: string;
  address: string;
  phone: string;
  email: string;
  taxCode: string;
  website?: string;
  logo?: string;
  description?: string;
}

export interface TaxSettings {
  enabled: boolean;
  rate: number;
  inclusive: boolean;
  method: 'exclusive' | 'inclusive';
  taxNumber?: string;
  taxOffice?: string;
  exemptProducts?: string[];
}

export interface PaymentSettings {
  enableCash: boolean;
  enableCard: boolean;
  enableVNPay: boolean;
  enableMoMo: boolean;
  enableZaloPay: boolean;
  vnpayMerchantId?: string;
  vnpaySecretKey?: string;
  vnpayReturnUrl?: string;
  momoPartnerCode?: string;
  momoAccessKey?: string;
  momoSecretKey?: string;
  momoReturnUrl?: string;
  zalopayAppId?: string;
  zalopayKey1?: string;
  zalopayKey2?: string;
  zalopayCallbackUrl?: string;
}

export interface ReceiptSettings {
  template: 'standard' | 'compact' | 'detailed' | 'thermal';
  paperSize: 'a4' | 'thermal_58' | 'thermal_80';
  showLogo: boolean;
  showTax: boolean;
  showQR: boolean;
  header: string;
  footer: string;
  customMessage?: string;
  logo?: string;
  fontSize: 'small' | 'medium' | 'large';
  language: 'vi' | 'en' | 'both';
}

export interface LanguageSettings {
  defaultLanguage: 'vi' | 'en';
  enableMultiLanguage: boolean;
  dateFormat: string;
  timeFormat: string;
  currency: string;
  timezone: string;
  numberFormat: 'vi' | 'en';
  firstDayOfWeek: 'monday' | 'sunday';
}

export interface BackupSettings {
  autoBackup: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string;
  retention: number;
  cloudBackup: boolean;
  cloudProvider?: 'r2' | 's3' | 'gcs';
}

export interface AppSettings {
  business: BusinessSettings;
  tax: TaxSettings;
  payment: PaymentSettings;
  receipt: ReceiptSettings;
  language: LanguageSettings;
  backup: BackupSettings;
}

export interface BackupFile {
  id: string;
  filename: string;
  createdAt: string;
  size: string;
  type: 'auto' | 'manual';
  status: 'completed' | 'failed' | 'in_progress';
}
