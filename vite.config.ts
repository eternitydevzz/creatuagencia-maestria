import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// decodeURIComponent: la ruta del proyecto puede contener espacios (%20)
const path = (rel: string) => decodeURIComponent(new URL(rel, import.meta.url).pathname)

export default defineConfig({
  plugins: [react()],
  // @shared: código que comparten el navegador y la Edge Function (catálogo de problemas y huella de las respuestas)
  resolve: { alias: { '@shared': path('./supabase/functions/_shared'), '@': path('./src') } },
  server: { port: 5173, strictPort: true },
})
