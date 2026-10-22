import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // host: true — сервер слушает все сетевые интерфейсы,
    // поэтому приложение открывается и с другого компьютера: http://<IP-адрес>:5173
    host: true,
    strictPort: true,
    // Папки сборки не участвуют в отслеживании, чтобы сборка не перезагружала страницу
    watch: { ignored: ['**/dist/**', '**/dist-standalone/**'] },
  },
  preview: {
    port: 4173,
    host: true,
    strictPort: true,
  },
})
