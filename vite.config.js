import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

const API_HOST = 'http://192.168.60.161:8080';
const DATA_NORMALIZER_API_HOST = 'http://192.168.60.161:8080';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/DataFlowService': {
        target: API_HOST, DATA_NORMALIZER_API_HOST,
        changeOrigin: true,
        secure: false
      }
    }
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/web-component.jsx'),
      name: 'DataFlowBuilder',
      fileName: (format) => `data-flow-builder.${format}.js`,
      formats: ['es', 'umd']
    },
    rollupOptions: {
      external: [],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM'
        }
      }
    }
  }
})
