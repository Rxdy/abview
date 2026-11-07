/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
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

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  define: {
    __APP_VERSION__: JSON.stringify(version),
  },
  test: {
    globals: true,
    environment: 'jsdom'
  },
})