// App settings state
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface BusinessSettings {
  name: string;
  address: string;
  phone: string;
  email: string;
  taxCode: string;
  logo?: string;
}

interface TaxSettings {
  rate: number;
  inclusive: boolean;
  enabled: boolean;
}

interface PaymentSettings {
  enableCash: boolean;
  enableCard: boolean;
  enableVNPay: boolean;
  enableMoMo: boolean;
  enableZaloPay: boolean;
  vnpayMerchantId?: string;
  momoPartnerCode?: string;
  zalopayAppId?: string;
}

interface ReceiptSettings {
  template: string;
  header: string;
  footer: string;
  showLogo: boolean;
  showTax: boolean;
  showQR: boolean;
}

interface LoyaltySettings {
  enabled: boolean;
  pointsPerVND: number;
  pointsExpiryDays: number;
  tiers: Array<{
    id: string;
    name: string;
    minimumSpent: number;
    discountPercentage: number;
    pointsMultiplier: number;
  }>;
}

interface NotificationSettings {
  email: boolean;
  sms: boolean;
  push: boolean;
  lowStock: boolean;
  newOrder: boolean;
  paymentSuccess: boolean;
  paymentFailed: boolean;
}

interface SettingsStore {
  // State
  business: BusinessSettings;
  tax: TaxSettings;
  payment: PaymentSettings;
  receipt: ReceiptSettings;
  loyalty: LoyaltySettings;
  notification: NotificationSettings;
  language: 'vi' | 'en';
  timezone: string;
  currency: string;
  dateFormat: string;
  timeFormat: string;
  loading: boolean;
  error: string | null;

  // Actions
  setBusinessSettings: (settings: Partial<BusinessSettings>) => void;
  setTaxSettings: (settings: Partial<TaxSettings>) => void;
  setPaymentSettings: (settings: Partial<PaymentSettings>) => void;
  setReceiptSettings: (settings: Partial<ReceiptSettings>) => void;
  setLoyaltySettings: (settings: Partial<LoyaltySettings>) => void;
  setNotificationSettings: (settings: Partial<NotificationSettings>) => void;
  setLanguage: (language: 'vi' | 'en') => void;
  setTimezone: (timezone: string) => void;
  setCurrency: (currency: string) => void;
  setDateFormat: (format: string) => void;
  setTimeFormat: (format: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Utility actions
  getAllSettings: () => any;
  updateSettings: (settings: any) => void;
  resetToDefaults: () => void;
}

const defaultSettings = {
  business: {
    name: 'KhoAugment POS',
    address: '123 Đường ABC, Phường 1, Quận 1, TP Hồ Chí Minh',
    phone: '0901234567',
    email: 'info@khoaugment.com',
    taxCode: '1234567890',
  },
  tax: {
    rate: 0.1,
    inclusive: false,
    enabled: true,
  },
  payment: {
    enableCash: true,
    enableCard: true,
    enableVNPay: false,
    enableMoMo: false,
    enableZaloPay: false,
  },
  receipt: {
    template: 'standard',
    header: 'Cảm ơn quý khách đã mua hàng!',
    footer: 'Hẹn gặp lại quý khách!',
    showLogo: true,
    showTax: true,
    showQR: false,
  },
  loyalty: {
    enabled: true,
    pointsPerVND: 0.01,
    pointsExpiryDays: 365,
    tiers: [
      { id: 'bronze', name: 'Đồng', minimumSpent: 0, discountPercentage: 0, pointsMultiplier: 1 },
      { id: 'silver', name: 'Bạc', minimumSpent: 5000000, discountPercentage: 2, pointsMultiplier: 1.2 },
      { id: 'gold', name: 'Vàng', minimumSpent: 20000000, discountPercentage: 5, pointsMultiplier: 1.5 },
      { id: 'platinum', name: 'Bạch kim', minimumSpent: 50000000, discountPercentage: 8, pointsMultiplier: 2 },
      { id: 'diamond', name: 'Kim cương', minimumSpent: 100000000, discountPercentage: 10, pointsMultiplier: 2.5 },
    ],
  },
  notification: {
    email: true,
    sms: false,
    push: true,
    lowStock: true,
    newOrder: true,
    paymentSuccess: true,
    paymentFailed: true,
  },
  language: 'vi' as const,
  timezone: 'Asia/Ho_Chi_Minh',
  currency: 'VND',
  dateFormat: 'DD/MM/YYYY',
  timeFormat: 'HH:mm',
  loading: false,
  error: null,
};

export const useSettingsStore = create<SettingsStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...defaultSettings,

        // Setters
        setBusinessSettings: (settings) => set((state) => ({
          business: { ...state.business, ...settings },
        })),

        setTaxSettings: (settings) => set((state) => ({
          tax: { ...state.tax, ...settings },
        })),

        setPaymentSettings: (settings) => set((state) => ({
          payment: { ...state.payment, ...settings },
        })),

        setReceiptSettings: (settings) => set((state) => ({
          receipt: { ...state.receipt, ...settings },
        })),

        setLoyaltySettings: (settings) => set((state) => ({
          loyalty: { ...state.loyalty, ...settings },
        })),

        setNotificationSettings: (settings) => set((state) => ({
          notification: { ...state.notification, ...settings },
        })),

        setLanguage: (language) => set({ language }),
        setTimezone: (timezone) => set({ timezone }),
        setCurrency: (currency) => set({ currency }),
        setDateFormat: (format) => set({ dateFormat: format }),
        setTimeFormat: (format) => set({ timeFormat: format }),
        setLoading: (loading) => set({ loading }),
        setError: (error) => set({ error }),

        // Utility functions
        getAllSettings: () => {
          const state = get();
          return {
            business: state.business,
            tax: state.tax,
            payment: state.payment,
            receipt: state.receipt,
            loyalty: state.loyalty,
            notification: state.notification,
            language: state.language,
            timezone: state.timezone,
            currency: state.currency,
            dateFormat: state.dateFormat,
            timeFormat: state.timeFormat,
          };
        },

        updateSettings: (settings) => set((state) => ({
          ...state,
          ...settings,
        })),

        resetToDefaults: () => set(defaultSettings),
      }),
      {
        name: 'settings-store',
      }
    ),
    { name: 'SettingsStore' }
  )
);
