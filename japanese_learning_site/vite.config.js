import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import fs from 'fs'

export default defineConfig({
  plugins: [
    vue(),
    // 自定义插件：构建完成后复制文件到主目录
    {
      name: 'copy-to-main',
      writeBundle() {
        const distPath = path.resolve(__dirname, 'dist')
        const targetPath = path.resolve(__dirname, '../japanese_learning_site')
        
        // 确保目标目录存在
        if (!fs.existsSync(targetPath)) {
          fs.mkdirSync(targetPath, { recursive: true })
        }
        
        // 复制所有文件到目标目录
        const copyRecursive = (src, dest) => {
          const entries = fs.readdirSync(src, { withFileTypes: true })
          for (const entry of entries) {
            const srcPath = path.join(src, entry.name)
            const destPath = path.join(dest, entry.name)
            
            if (entry.isDirectory()) {
              if (!fs.existsSync(destPath)) {
                fs.mkdirSync(destPath, { recursive: true })
              }
              copyRecursive(srcPath, destPath)
            } else {
              fs.copyFileSync(srcPath, destPath)
            }
          }
        }
        
        copyRecursive(distPath, targetPath)
        console.log('✅ 文件已复制到主目录的 japanese_learning_site 文件夹')
      }
    }
  ],
  base: '/japanese_learning_site/', // 设置基础路径为你的子目录名
  server: {
    host: '0.0.0.0',
    port: 3000
  },
  build: {
    outDir: 'dist', // 先输出到本地 dist 目录
    assetsDir: 'assets',
    emptyOutDir: true
  }
})
