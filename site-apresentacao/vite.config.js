import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Em produção o site é servido a partir de https://<usuario>.github.io/<repo>/,
// então o build precisa do prefixo. Em desenvolvimento serve na raiz.
export default defineConfig(({ command }) => ({
  plugins: [react(), tailwindcss()],
  base: command === 'build' ? (process.env.GHP_BASE ?? '/luderia-tcc/') : '/',
}))
