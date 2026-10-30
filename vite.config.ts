import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Запросы к /api проксируются на FastAPI (порт 8000).
 * Благодаря этому браузер видит интерфейс и API как один сайт:
 * cookie сессии и CSRF-токен работают без CORS-исключений.
 */
const apiProxy = {
  '/api': {
    target: 'http://127.0.0.1:8000',
    changeOrigin: false,
  },
}

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // host: true — сервер слушает все сетевые интерфейсы,
    // поэтому приложение открывается и с другого компьютера: http://<IP-адрес>:5173
    host: true,
    strictPort: true,
    proxy: apiProxy,
    // Папки сборки не участвуют в отслеживании, чтобы сборка не перезагружала страницу
    watch: { ignored: ['**/dist/**', '**/dist-standalone/**'] },
  },
  preview: {
    port: 4173,
    host: true,
    strictPort: true,
    proxy: apiProxy,
  },
})
