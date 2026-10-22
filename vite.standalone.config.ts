import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

/**
 * Сборка в один автономный HTML-файл.
 * Результат — dist-standalone/index.html: его можно скопировать на любой компьютер
 * и открыть двойным щелчком, без установки Node.js и без локального сервера.
 */
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  build: {
    outDir: 'dist-standalone',
    emptyOutDir: true,
    target: 'es2018',
    cssCodeSplit: false,
    assetsInlineLimit: 100_000_000,
  },
})
