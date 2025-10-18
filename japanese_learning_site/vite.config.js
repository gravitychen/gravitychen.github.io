import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  base: '/',
  server: {
    host: '0.0.0.0',
    port: 8080,
    open: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    // 优化构建
    rollupOptions: {
      output: {
        manualChunks: {
          // 将 Vue 相关库分离
          'vue-vendor': ['vue', 'vue-router', 'pinia'],
          // 将 Firebase 相关库分离
          'firebase-vendor': ['firebase/app', 'firebase/auth', 'firebase/firestore']
        }
      }
    },
    // 压缩配置
    minify: 'esbuild',
    // 资源内联阈值
    assetsInlineLimit: 4096
  },
  // 优化依赖预构建
  optimizeDeps: {
    include: ['vue', 'vue-router', 'pinia', 'firebase/app', 'firebase/auth', 'firebase/firestore']
  }
})
