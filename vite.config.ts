import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  base: './', // 使用相对路径，适用于任何部署环境
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      output: {
        // 确保文件名的一致性
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        manualChunks(id) {
          // 将node_modules中的包分离成vendor chunk
          if (id.includes('node_modules')) {
            if (id.includes('element-plus')) {
              return 'element-plus'
            }
            if (id.includes('vue') || id.includes('pinia') || id.includes('@vue')) {
              return 'vue-vendor'
            }
            return 'vendor'
          }
        }
      }
    },
    // 增加chunk大小警告阈值
    chunkSizeWarningLimit: 1000
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use "@/styles/element-theme.scss" as *;`
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',  // 确保这里是本地8080
        changeOrigin: true,
        secure: false,
        rewrite: (path) => {
          const newPath = path.replace(/^\/api/, '');
          console.log('🔄 代理重写路径:', path, '->', newPath);
          return newPath;
        },
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('❌ 代理错误:', err.message);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // 修改这里的日志输出，指向本地服务
            console.log('📤 发送请求到本地服务器:', req.method, req.url, '-> http://localhost:8080' + req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('📥 从本地服务器收到响应:', proxyRes.statusCode, req.url);
          });
        }
      },
      '/ws': {
        // 将WebSocket目标也改为本地8080
        target: 'ws://localhost:8080',
        ws: true,
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on('error', (err) => {
            console.log('❌ WebSocket代理错误:', err.message);
          });
          proxy.on('open', () => {
            console.log('🔗 WebSocket代理连接已建立（本地服务器）');
          });
          proxy.on('close', () => {
            console.log('🔌 WebSocket代理连接已关闭');
          });
        }
      }
    },
    cors: true
  }
})