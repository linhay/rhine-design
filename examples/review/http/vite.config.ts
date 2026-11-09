import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { reviewPlugin } from '@linhey/rhine-design/review/vite';
export default defineConfig(({ command }) => ({
  root: import.meta.dirname, base: command === 'serve' ? '/review-http/' : './',
  plugins: [react(), reviewPlugin({ catalog: './catalog.tsx', routerBase: '/product/' })],
  build: { outDir: '../../../dist/review-http', emptyOutDir: true },
}));
