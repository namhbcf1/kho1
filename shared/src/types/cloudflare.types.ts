// Cloudflare service types
export interface CloudflareEnv {
  // D1 Database
  DB: D1Database;
  
  // KV Storage
  KV: KVNamespace;
  
  // R2 Storage
  R2: R2Bucket;
  
  // Environment variables
  JWT_SECRET: string;
  CORS_ORIGIN: string;
  VNPAY_MERCHANT_ID?: string;
  VNPAY_SECRET_KEY?: string;
  MOMO_PARTNER_CODE?: string;
  MOMO_ACCESS_KEY?: string;
  MOMO_SECRET_KEY?: string;
  ZALOPAY_APP_ID?: string;
  ZALOPAY_KEY1?: string;
  ZALOPAY_KEY2?: string;
  VAPID_PUBLIC_KEY?: string;
  VAPID_PRIVATE_KEY?: string;
}

export interface D1QueryResult<T = any> {
  results: T[];
  success: boolean;
  meta: {
    duration: number;
    rows_read: number;
    rows_written: number;
  };
}

export interface KVListResult {
  keys: Array<{
    name: string;
    expiration?: number;
    metadata?: any;
  }>;
  list_complete: boolean;
  cursor?: string;
}

export interface R2Object {
  key: string;
  version: string;
  size: number;
  etag: string;
  httpEtag: string;
  uploaded: Date;
  checksums: {
    md5?: ArrayBuffer;
    sha1?: ArrayBuffer;
    sha256?: ArrayBuffer;
    sha384?: ArrayBuffer;
    sha512?: ArrayBuffer;
  };
  httpMetadata?: {
    contentType?: string;
    contentLanguage?: string;
    contentDisposition?: string;
    contentEncoding?: string;
    cacheControl?: string;
    expires?: Date;
  };
  customMetadata?: Record<string, string>;
}

export interface R2ListResult {
  objects: R2Object[];
  truncated: boolean;
  cursor?: string;
  delimitedPrefixes: string[];
}

export interface CloudflareRequest extends Request {
  cf?: {
    colo: string;
    country: string;
    city: string;
    continent: string;
    latitude: string;
    longitude: string;
    postalCode: string;
    metroCode: string;
    region: string;
    regionCode: string;
    timezone: string;
    asn: number;
    asOrganization: string;
  };
}

export interface CloudflareAnalyticsEvent {
  timestamp: number;
  event: string;
  properties: Record<string, any>;
  userId?: string;
  sessionId?: string;
}

export interface CloudflareWorkerMetrics {
  cpuTime: number;
  wallTime: number;
  memoryUsage: number;
  subrequests: number;
}

export interface CloudflareCacheConfig {
  cacheKey?: string;
  cacheTtl?: number;
  cacheEverything?: boolean;
  cacheLevel?: 'basic' | 'simplified' | 'aggressive';
  edgeCacheTtl?: number;
  browserCacheTtl?: number;
}

export interface CloudflareRateLimitConfig {
  threshold: number;
  period: number;
  action: 'simulate' | 'ban' | 'challenge' | 'js_challenge';
  timeout?: number;
  response?: {
    content_type?: string;
    body?: string;
  };
}

export interface CloudflareSecurityHeaders {
  'Content-Security-Policy'?: string;
  'Strict-Transport-Security'?: string;
  'X-Frame-Options'?: string;
  'X-Content-Type-Options'?: string;
  'Referrer-Policy'?: string;
  'Permissions-Policy'?: string;
}

export interface CloudflarePagesFunctionContext {
  request: CloudflareRequest;
  env: CloudflareEnv;
  params: Record<string, string>;
  data: Record<string, any>;
  next: (input?: RequestInfo, init?: RequestInit) => Promise<Response>;
  waitUntil: (promise: Promise<any>) => void;
  passThroughOnException: () => void;
}
