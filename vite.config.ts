import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon-16.png', 'favicon-32.png', 'apple-touch-icon.png'],
      workbox: {
        // The bundled seed dataset (see local-facts-fallback below) is
        // only ever loaded when Supabase isn't configured — i.e. local
        // dev. Precaching ~2 MB that production clients never request
        // would just bloat every install, so it's excluded.
        globIgnores: ['**/local-facts-fallback-*.js'],
      },
      manifest: {
        name: 'semico',
        short_name: 'semico',
        description: 'A TikTok-style feed of bite-sized knowledge.',
        theme_color: '#0F0B17',
        background_color: '#0F0B17',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: '/icons/pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/pwa-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: '/icons/pwa-maskable-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: '/icons/pwa-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Pin the lazily-imported seed dataset to a predictable chunk
        // name so the service worker can exclude it by glob above.
        manualChunks(id) {
          if (id.includes('src/data/facts')) return 'local-facts-fallback'
        },
      },
    },
  },
})
