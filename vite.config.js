import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  root: '.',
  server: {
    port: 3000,
    open: '/dev/',
    fs: {
      // Allow serving files from project root
      allow: ['.'],
      // Deny access to FUXA directory
      deny: ['FUXA/**/*']
    }
  },
  optimizeDeps: {
    // Exclude FUXA from dependency scanning
    exclude: ['FUXA'],
    // Only scan specific entry points
    entries: [
      'dev/index.html',
      'src/**/*.ts'
    ]
  },
  resolve: {
    alias: {
      '@fuxa-core': resolve(__dirname, 'src/fuxa-core'),
      '@tb-adapter': resolve(__dirname, 'src/tb-adapter'),
      '@widgets': resolve(__dirname, 'src/widgets')
    }
  },
  build: {
    outDir: 'dist',
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'TbScadaWidget',
      formats: ['es', 'umd'],
      fileName: (format) => `tb-scada-widget.${format}.js`
    },
    rollupOptions: {
      external: ['@svgdotjs/svg.js'],
      output: {
        globals: {
          '@svgdotjs/svg.js': 'SVG'
        }
      }
    }
  }
})
