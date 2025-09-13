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
    // Vite optimizations for better build performance
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            ui: ['@radix-ui/react-label', '@radix-ui/react-slot'],
            payments: ['@stripe/stripe-js', '@stripe/react-stripe-js'],
          }
        }
      }
    },
    ssr: {
      noExternal: ['@medusajs/js-sdk']
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
