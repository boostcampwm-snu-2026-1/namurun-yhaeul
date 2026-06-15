/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      'namumark-clone-core': fileURLToPath(
        new URL('./node_modules/namumark-clone-core/src/index.ts', import.meta.url),
      ),
      crypto: fileURLToPath(new URL('./src/shims/crypto.ts', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
  },
})
