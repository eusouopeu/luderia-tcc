import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import pkg from './package.json'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  /* o preview do Claude escolhe a porta pela variável PORT */
  server: process.env.PORT ? { port: Number(process.env.PORT), strictPort: true } : undefined,
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
})
