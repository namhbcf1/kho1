import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react({
      fastRefresh: true,
      babel: {
        plugins: [
          ['@babel/plugin-transform-react-jsx', { runtime: 'automatic' }]
        ]
      }
    }),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/kho1-api-production\.bangachieu2\.workers\.dev\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24, // 24 hours
              },
              cacheKeyWillBeUsed: async ({ request }) => {
                return `${request.url}?lang=vi`;
              },
            },
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
          {
            urlPattern: /\.(?:woff|woff2|ttf|otf)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'fonts-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
            },
          },
        ],
      },
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'KhoAugment POS - Hệ thống bán hàng Việt Nam',
        short_name: 'KhoAugment POS',
        description: 'Hệ thống quản lý bán hàng hiện đại cho doanh nghiệp Việt Nam',
        theme_color: '#d4380d',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        lang: 'vi-VN',
        dir: 'ltr',
        icons: [
          {
            src: 'icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ],
        categories: ['business', 'productivity', 'finance'],
        shortcuts: [
          {
            name: 'Bán hàng',
            short_name: 'POS',
            description: 'Mở giao diện bán hàng',
            url: '/pos',
            icons: [{ src: 'icons/pos-shortcut.png', sizes: '96x96' }]
          },
          {
            name: 'Sản phẩm',
            short_name: 'Products',
            description: 'Quản lý sản phẩm',
            url: '/products',
            icons: [{ src: 'icons/products-shortcut.png', sizes: '96x96' }]
          },
          {
            name: 'Báo cáo',
            short_name: 'Reports',
            description: 'Xem báo cáo bán hàng',
            url: '/analytics',
            icons: [{ src: 'icons/analytics-shortcut.png', sizes: '96x96' }]
          }
        ]
      },
      devOptions: {
        enabled: true,
        type: 'module'
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@features': path.resolve(__dirname, './src/features'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@services': path.resolve(__dirname, './src/services'),
      '@stores': path.resolve(__dirname, './src/stores'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@types': path.resolve(__dirname, './src/types'),
      '@constants': path.resolve(__dirname, './src/constants'),
      '@assets': path.resolve(__dirname, './src/assets'),
      '@shared': path.resolve(__dirname, '../shared/src'),
      '@shared/types': path.resolve(__dirname, '../shared/src/types'),
      '@shared/schemas': path.resolve(__dirname, '../shared/src/schemas'),
      '@shared/constants': path.resolve(__dirname, '../shared/src/constants'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
    cors: {
      origin: [
        'http://localhost:3000',
        'https://kho1.pages.dev',
        'https://kho1-api-production.bangachieu2.workers.dev'
      ],
      credentials: true
    },
    proxy: {
      '/api': {
        target: 'https://kho1-api-production.bangachieu2.workers.dev',
        changeOrigin: true,
        secure: true,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
        },
      }
    }
  },
  
  preview: {
    host: '0.0.0.0',
    port: 4173,
    strictPort: true,
    cors: true
  },
  
  build: {
    target: 'es2020',
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'esbuild',
    cssCodeSplit: true,
    
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          antd: ['antd', '@ant-design/icons'],
          charts: ['@ant-design/plots'],
          utils: ['lodash', 'dayjs'],
          
          vietnamese: [
            './src/utils/formatters/vndCurrency.ts',
            './src/utils/formatters/vietnameseDate.ts',
            './src/utils/validation/phoneValidation.ts',
            './src/utils/validation/addressValidation.ts'
          ],
          
          business: [
            './src/services/business/analyticsService.ts',
            './src/services/business/customerService.ts',
            './src/services/business/inventoryService.ts',
            './src/services/business/orderService.ts',
            './src/services/business/productService.ts'
          ],
          
          auth: [
            './src/services/auth/authService.ts',
            './src/services/auth/permissionService.ts',
            './src/utils/security/csrfProtection.ts',
            './src/utils/storage/secureStorageAdapter.ts'
          ]
        },
        
        chunkFileNames: 'js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `images/[name]-[hash][extname]`;
          }
          if (/woff2?|eot|ttf|otf/i.test(ext)) {
            return `fonts/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        }
      }
    },
    
    cssMinify: 'esbuild',
    reportCompressedSize: true,
    assetsInlineLimit: 4096,
  },
  
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'antd',
      '@ant-design/icons',
      'lodash',
      'dayjs',
      '@ant-design/plots',
      'react-router-dom',
      'zustand'
    ],
    exclude: []
  },
  
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `
          @import "@/styles/variables.scss";
          @import "@/styles/vietnamese-mixins.scss";
        `
      }
    },
    postcss: {
      plugins: [
        require('autoprefixer'),
        require('cssnano')({
          preset: 'default'
        })
      ]
    }
  },
  
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
    __VIETNAMESE_LOCALE__: JSON.stringify('vi-VN'),
    __CURRENCY_CODE__: JSON.stringify('VND'),
  },
  
  esbuild: {
    charset: 'utf8',
    legalComments: 'none',
    target: 'es2020'
  }
});
