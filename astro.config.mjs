// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import vercel from '@astrojs/vercel';
import sitemap from '@astrojs/sitemap';
import compress from 'astro-compress';

// https://astro.build/config
export default defineConfig({
  site: 'https://troybbq.com', // Your production domain
  integrations: [
    react(),
    tailwind({
      applyBaseStyles: false,
    }),
    sitemap({
      customPages: [
        'https://troybbq.com/menu',
        'https://troybbq.com/catering',
        'https://troybbq.com/about',
        'https://troybbq.com/contact',
        'https://troybbq.com/cart',
        'https://troybbq.com/checkout'
      ],
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date(),
    }),
    compress({
      CSS: true,
      HTML: {
        'html-minifier-terser': {
          removeAttributeQuotes: false,
          collapseWhitespace: true,
          removeComments: true,
        },
      },
      Image: false, // We'll handle images separately
      JavaScript: true,
      SVG: true,
    }),
  ],
  output: 'server',
  adapter: vercel({
    webAnalytics: {
      enabled: true
    },
    speedInsights: {
      enabled: true
    }
  }),
  build: {
    assets: '_astro',
    inlineStylesheets: 'auto',
    // Split bundles more aggressively for perfect caching
    split: true,
  },
  image: {
    // Built-in Image optimization
    remotePatterns: [
      {
        protocol: 'https'
      }
    ]
  },
  compressHTML: true,
  vite: {
    // Advanced Vite optimizations for perfect performance
    build: {
      rollupOptions: {
        output: {
          // Aggressive manual chunking for optimal loading
          manualChunks: (id) => {
            // Critical vendor chunks
            if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
              return 'react-core';
            }

            // UI components - load together for better caching
            if (id.includes('@radix-ui/') || id.includes('lucide-react')) {
              return 'ui-lib';
            }

            // Payment providers - lazy load only when needed
            if (id.includes('@stripe/') || id.includes('react-square-web-payments-sdk') || id.includes('squareup')) {
              return 'payments';
            }

            // Form handling
            if (id.includes('react-hook-form') || id.includes('@hookform/') || id.includes('zod')) {
              return 'forms';
            }

            // Database and API
            if (id.includes('@neondatabase/') || id.includes('pg') || id.includes('@medusajs/')) {
              return 'database';
            }

            // Admin components - completely separate
            if (id.includes('src/components/admin/') || id.includes('src/pages/admin/')) {
              return 'admin';
            }

            // Performance and monitoring
            if (id.includes('web-vitals')) {
              return 'performance';
            }

            // Utilities and styling
            if (id.includes('tailwind') || id.includes('clsx') || id.includes('class-variance-authority')) {
              return 'utils';
            }

            // Large dependencies that can be split
            if (id.includes('node_modules/') && id.length > 100) {
              const chunks = id.split('node_modules/')[1].split('/')[0];
              return `vendor-${chunks}`;
            }
          },

          // Optimize chunk naming for better caching
          chunkFileNames: (chunkInfo) => {
            if (chunkInfo.facadeModuleId && chunkInfo.facadeModuleId.includes('src/pages/admin/')) {
              return 'chunks/admin-[name]-[hash].js';
            }
            return 'chunks/[name]-[hash].js';
          },

          // Optimize asset naming
          assetFileNames: (assetInfo) => {
            if (assetInfo.name?.endsWith('.css')) {
              return 'assets/styles-[hash][extname]';
            }
            if (assetInfo.name?.match(/\.(png|jpg|jpeg|svg|webp|avif)$/)) {
              return 'assets/images/[name]-[hash][extname]';
            }
            return 'assets/[name]-[hash][extname]';
          }
        },

        // Tree shaking optimizations
        treeshake: {
          moduleSideEffects: false,
          propertyReadSideEffects: false,
          unknownGlobalSideEffects: false
        }
      },

      // Aggressive minification
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
          pure_funcs: ['console.log', 'console.info', 'console.debug'],
          dead_code: true,
          reduce_vars: true,
          collapse_vars: true,
          inline: 2
        },
        mangle: {
          toplevel: true,
          safari10: true
        },
        format: {
          comments: false
        }
      },

      // Target modern browsers for smaller bundles
      target: ['es2022', 'chrome89', 'firefox89', 'safari15'],

      // Optimize chunk sizes more aggressively
      chunkSizeWarningLimit: 500,

      // Enable source maps only in development
      sourcemap: false,

      // CSS optimization
      cssCodeSplit: true,
      cssMinify: 'lightningcss',

      // Module preloading
      modulePreload: true,

      // Optimize assets
      assetsInlineLimit: 2048, // Inline assets < 2KB
    },

    // SSR optimizations
    ssr: {
      noExternal: ['@medusajs/js-sdk', 'web-vitals'],
      target: 'node18'
    },

    // Aggressive dependency optimization
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        '@radix-ui/react-label',
        '@radix-ui/react-slot',
        'clsx',
        'tailwind-merge'
      ],
      exclude: [
        '@stripe/stripe-js',
        'react-square-web-payments-sdk',
        'squareup',
        '@medusajs/js-sdk'
      ]
    },

    // Advanced esbuild optimizations
    esbuild: {
      drop: ['console', 'debugger'],
      legalComments: 'none',
      minifyIdentifiers: true,
      minifySyntax: true,
      minifyWhitespace: true,
      treeShaking: true
    },

    // Performance plugins and configuration
    plugins: [],

    // Worker optimizations
    worker: {
      format: 'es'
    },

    // JSON optimizations
    json: {
      namedExports: false,
      stringify: true
    }
  },
  server: {
    port: 4005,
    host: true
  },
  preview: {
    port: 4005,
    host: true
  }
});
