import { fileURLToPath, URL } from 'node:url'
import { readFileSync } from 'node:fs'
import { versionDuChangelog } from './src/utils/versionChangelog'

// Version affichée dans le pied de page : une seule source, le dernier titre de CHANGELOG.md
// (à la racine du dépôt ; le Dockerfile l'y copie pour le build).
let changelog: string
try {
  changelog = readFileSync(new URL('../CHANGELOG.md', import.meta.url), 'utf8')
} catch {
  throw new Error('CHANGELOG.md introuvable à la racine du dépôt : la version de l\'app en dépend')
}
const version = versionDuChangelog(changelog)

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  ssr: {
    noExternal: ['qrcode', 'dijkstrajs', 'pngjs', 'yargs']
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3333',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
  define: {
    __APP_VERSION__: JSON.stringify(version),
    __VUE_PROD_DEVTOOLS__: false,
    __VUE_DEVTOOLS_GLOBAL_HOOK__: false,
  },
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: process.env.NODE_ENV === 'production',
        drop_debugger: process.env.NODE_ENV === 'production'
      }
    },
    rollupOptions: {
      output: {
        manualChunks: undefined // Ensure all deps are in one chunk
      }
    }
  }
})
