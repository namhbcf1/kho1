// Cloudflare-specific constants
export const CLOUDFLARE_SERVICES = {
  PAGES: 'pages',
  WORKERS: 'workers',
  D1: 'd1',
  R2: 'r2',
  KV: 'kv',
  DURABLE_OBJECTS: 'durable_objects',
  ANALYTICS: 'analytics',
  STREAM: 'stream',
} as const;

export const CLOUDFLARE_REGIONS = {
  AUTO: 'auto',
  WNAM: 'wnam', // Western North America
  ENAM: 'enam', // Eastern North America
  WEU: 'weu',   // Western Europe
  EEU: 'eeu',   // Eastern Europe
  APAC: 'apac', // Asia Pacific
} as const;

export const R2_BUCKETS = {
  PRODUCT_IMAGES: 'product-images',
  RECEIPTS: 'receipts',
  BACKUPS: 'backups',
  DOCUMENTS: 'documents',
} as const;

export const KV_NAMESPACES = {
  CACHE: 'cache',
  SESSIONS: 'sessions',
  RATE_LIMITS: 'rate_limits',
  SETTINGS: 'settings',
} as const;

export const D1_DATABASES = {
  MAIN: 'main',
  ANALYTICS: 'analytics',
  LOGS: 'logs',
} as const;

export const WORKER_ROUTES = {
  API: '/api/*',
  WEBHOOKS: '/webhooks/*',
  CRON: '/cron/*',
} as const;

export const PAGES_FUNCTIONS = {
  API: '_worker.js',
  MIDDLEWARE: '_middleware.js',
} as const;

export const CLOUDFLARE_HEADERS = {
  CF_RAY: 'CF-Ray',
  CF_CONNECTING_IP: 'CF-Connecting-IP',
  CF_IPCOUNTRY: 'CF-IPCountry',
  CF_VISITOR: 'CF-Visitor',
  CF_CACHE_STATUS: 'CF-Cache-Status',
} as const;

export const CACHE_CONTROL = {
  NO_CACHE: 'no-cache, no-store, must-revalidate',
  SHORT: 'public, max-age=300', // 5 minutes
  MEDIUM: 'public, max-age=1800', // 30 minutes
  LONG: 'public, max-age=86400', // 24 hours
  STATIC: 'public, max-age=31536000, immutable', // 1 year
} as const;

export const WORKER_LIMITS = {
  CPU_TIME: 50, // milliseconds for free tier
  MEMORY: 128, // MB
  SUBREQUESTS: 50,
  SCRIPT_SIZE: 1, // MB
} as const;

export const R2_LIMITS = {
  MAX_OBJECT_SIZE: 5 * 1024 * 1024 * 1024, // 5GB
  MAX_UPLOAD_SIZE: 100 * 1024 * 1024, // 100MB per request
  MAX_MULTIPART_PARTS: 10000,
} as const;

export const KV_LIMITS = {
  KEY_SIZE: 512, // bytes
  VALUE_SIZE: 25 * 1024 * 1024, // 25MB
  METADATA_SIZE: 1024, // bytes
} as const;

export const D1_LIMITS = {
  DATABASE_SIZE: 500 * 1024 * 1024, // 500MB for free tier
  ROWS_READ: 25000000, // per day
  ROWS_WRITTEN: 100000, // per day
} as const;

export const ANALYTICS_EVENTS = {
  PAGE_VIEW: 'page_view',
  BUTTON_CLICK: 'button_click',
  FORM_SUBMIT: 'form_submit',
  API_CALL: 'api_call',
  ERROR: 'error',
  PERFORMANCE: 'performance',
} as const;

export const SECURITY_HEADERS = {
  CSP: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; media-src 'self'; object-src 'none'; frame-src 'none';",
  HSTS: 'max-age=31536000; includeSubDomains; preload',
  X_FRAME_OPTIONS: 'DENY',
  X_CONTENT_TYPE_OPTIONS: 'nosniff',
  REFERRER_POLICY: 'strict-origin-when-cross-origin',
} as const;
