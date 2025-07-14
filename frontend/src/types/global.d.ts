// Global TypeScript declarations for KhoAugment POS
declare global {
  interface Window {
    // PWA install prompt
    deferredPrompt?: any;
    
    // Service Worker
    workbox?: any;
    
    // Vietnamese payment gateways
    VNPay?: any;
    MoMo?: any;
    ZaloPay?: any;
    
    // Barcode scanner
    BarcodeDetector?: any;
    
    // Thermal printer
    ThermalPrinter?: any;
    
    // Cash drawer
    CashDrawer?: any;
    
    // Cloudflare Analytics
    gtag?: (...args: any[]) => void;
    
    // Environment variables
    ENV?: {
      NODE_ENV: 'development' | 'production' | 'test';
      CLOUDFLARE_ACCOUNT_ID?: string;
      CLOUDFLARE_API_TOKEN?: string;
      VNPAY_MERCHANT_ID?: string;
      MOMO_PARTNER_CODE?: string;
      ZALOPAY_APP_ID?: string;
    };
  }

  // Navigator extensions
  interface Navigator {
    // Network Information API
    connection?: {
      effectiveType: string;
      downlink: number;
      rtt: number;
      saveData: boolean;
      addEventListener: (type: string, listener: EventListener) => void;
      removeEventListener: (type: string, listener: EventListener) => void;
    };
    
    // Web Share API
    share?: (data: {
      title?: string;
      text?: string;
      url?: string;
      files?: File[];
    }) => Promise<void>;
    
    // Vibration API
    vibrate?: (pattern: number | number[]) => boolean;
    
    // Wake Lock API
    wakeLock?: {
      request: (type: 'screen') => Promise<WakeLockSentinel>;
    };
    
    // Bluetooth API
    bluetooth?: {
      requestDevice: (options: any) => Promise<BluetoothDevice>;
    };
    
    // USB API
    usb?: {
      requestDevice: (options: any) => Promise<USBDevice>;
    };
  }

  interface WakeLockSentinel {
    released: boolean;
    type: string;
    release: () => Promise<void>;
    addEventListener: (type: string, listener: EventListener) => void;
    removeEventListener: (type: string, listener: EventListener) => void;
  }

  interface BluetoothDevice {
    id: string;
    name?: string;
    gatt?: BluetoothRemoteGATTServer;
  }

  interface BluetoothRemoteGATTServer {
    connected: boolean;
    device: BluetoothDevice;
    connect: () => Promise<BluetoothRemoteGATTServer>;
    disconnect: () => void;
    getPrimaryService: (service: string) => Promise<BluetoothRemoteGATTService>;
  }

  interface BluetoothRemoteGATTService {
    device: BluetoothDevice;
    uuid: string;
    getCharacteristic: (characteristic: string) => Promise<BluetoothRemoteGATTCharacteristic>;
  }

  interface BluetoothRemoteGATTCharacteristic {
    service: BluetoothRemoteGATTService;
    uuid: string;
    value?: DataView;
    writeValue: (value: BufferSource) => Promise<void>;
    readValue: () => Promise<DataView>;
    startNotifications: () => Promise<BluetoothRemoteGATTCharacteristic>;
    stopNotifications: () => Promise<BluetoothRemoteGATTCharacteristic>;
    addEventListener: (type: string, listener: EventListener) => void;
    removeEventListener: (type: string, listener: EventListener) => void;
  }

  interface USBDevice {
    usbVersionMajor: number;
    usbVersionMinor: number;
    usbVersionSubminor: number;
    deviceClass: number;
    deviceSubclass: number;
    deviceProtocol: number;
    vendorId: number;
    productId: number;
    deviceVersionMajor: number;
    deviceVersionMinor: number;
    deviceVersionSubminor: number;
    manufacturerName?: string;
    productName?: string;
    serialNumber?: string;
    configuration?: USBConfiguration;
    configurations: USBConfiguration[];
    opened: boolean;
    open: () => Promise<void>;
    close: () => Promise<void>;
    selectConfiguration: (configurationValue: number) => Promise<void>;
    claimInterface: (interfaceNumber: number) => Promise<void>;
    releaseInterface: (interfaceNumber: number) => Promise<void>;
    transferIn: (endpointNumber: number, length: number) => Promise<USBInTransferResult>;
    transferOut: (endpointNumber: number, data: BufferSource) => Promise<USBOutTransferResult>;
  }

  interface USBConfiguration {
    configurationValue: number;
    configurationName?: string;
    interfaces: USBInterface[];
  }

  interface USBInterface {
    interfaceNumber: number;
    alternate: USBAlternateInterface;
    alternates: USBAlternateInterface[];
    claimed: boolean;
  }

  interface USBAlternateInterface {
    alternateSetting: number;
    interfaceClass: number;
    interfaceSubclass: number;
    interfaceProtocol: number;
    interfaceName?: string;
    endpoints: USBEndpoint[];
  }

  interface USBEndpoint {
    endpointNumber: number;
    direction: 'in' | 'out';
    type: 'bulk' | 'interrupt' | 'isochronous';
    packetSize: number;
  }

  interface USBInTransferResult {
    data?: DataView;
    status: 'ok' | 'stall' | 'babble';
  }

  interface USBOutTransferResult {
    bytesWritten: number;
    status: 'ok' | 'stall';
  }

  // Barcode Detection API
  interface BarcodeDetector {
    detect: (source: ImageBitmapSource) => Promise<DetectedBarcode[]>;
    getSupportedFormats: () => Promise<BarcodeFormat[]>;
  }

  interface DetectedBarcode {
    boundingBox: DOMRectReadOnly;
    rawValue: string;
    format: BarcodeFormat;
    cornerPoints: Point2D[];
  }

  type BarcodeFormat = 
    | 'aztec'
    | 'code_128'
    | 'code_39'
    | 'code_93'
    | 'codabar'
    | 'data_matrix'
    | 'ean_13'
    | 'ean_8'
    | 'itf'
    | 'pdf417'
    | 'qr_code'
    | 'upc_a'
    | 'upc_e';

  interface Point2D {
    x: number;
    y: number;
  }

  // Web Locks API
  interface LockManager {
    request: (name: string, callback: (lock: Lock) => Promise<any>) => Promise<any>;
    request: (name: string, options: LockOptions, callback: (lock: Lock) => Promise<any>) => Promise<any>;
    query: () => Promise<LockManagerSnapshot>;
  }

  interface LockOptions {
    mode?: 'shared' | 'exclusive';
    ifAvailable?: boolean;
    steal?: boolean;
    signal?: AbortSignal;
  }

  interface Lock {
    name: string;
    mode: 'shared' | 'exclusive';
  }

  interface LockManagerSnapshot {
    held: LockInfo[];
    pending: LockInfo[];
  }

  interface LockInfo {
    name: string;
    mode: 'shared' | 'exclusive';
    clientId: string;
  }

  // Extend Navigator with locks
  interface Navigator {
    locks?: LockManager;
  }

  // Vite environment variables
  interface ImportMeta {
    env: {
      VITE_API_BASE_URL?: string;
      VITE_CLOUDFLARE_ACCOUNT_ID?: string;
      VITE_CLOUDFLARE_API_TOKEN?: string;
      MODE?: string;
      PROD?: boolean;
      DEV?: boolean;
      [key: string]: any;
    };
  }
}

// Module declarations
declare module '*.svg' {
  const content: string;
  export default content;
}

declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}

declare module '*.jpeg' {
  const content: string;
  export default content;
}

declare module '*.gif' {
  const content: string;
  export default content;
}

declare module '*.webp' {
  const content: string;
  export default content;
}

declare module '*.ico' {
  const content: string;
  export default content;
}

declare module '*.css' {
  const classes: { [key: string]: string };
  export default classes;
}

declare module '*.scss' {
  const classes: { [key: string]: string };
  export default classes;
}

declare module '*.sass' {
  const classes: { [key: string]: string };
  export default classes;
}

declare module '*.less' {
  const classes: { [key: string]: string };
  export default classes;
}

// Vietnamese payment gateway types
declare namespace VNPay {
  interface Config {
    vnp_TmnCode: string;
    vnp_HashSecret: string;
    vnp_Url: string;
    vnp_ReturnUrl: string;
  }

  interface PaymentData {
    vnp_Amount: number;
    vnp_Command: string;
    vnp_CreateDate: string;
    vnp_CurrCode: string;
    vnp_IpAddr: string;
    vnp_Locale: string;
    vnp_OrderInfo: string;
    vnp_OrderType: string;
    vnp_ReturnUrl: string;
    vnp_TmnCode: string;
    vnp_TxnRef: string;
    vnp_Version: string;
  }
}

declare namespace MoMo {
  interface Config {
    partnerCode: string;
    accessKey: string;
    secretKey: string;
    endpoint: string;
    returnUrl: string;
    notifyUrl: string;
  }

  interface PaymentData {
    partnerCode: string;
    accessKey: string;
    requestId: string;
    amount: number;
    orderId: string;
    orderInfo: string;
    returnUrl: string;
    notifyUrl: string;
    extraData: string;
    requestType: string;
    signature: string;
  }
}

declare namespace ZaloPay {
  interface Config {
    appId: string;
    key1: string;
    key2: string;
    endpoint: string;
    callbackUrl: string;
  }

  interface PaymentData {
    appId: string;
    appTransId: string;
    appUser: string;
    appTime: number;
    item: string;
    embedData: string;
    amount: number;
    description: string;
    bankCode: string;
    mac: string;
  }
}

export {};
