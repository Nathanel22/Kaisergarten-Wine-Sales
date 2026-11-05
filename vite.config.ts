import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ command, isPreview }) => ({
  // Preserve localhost development; production assets live below the repository path.
  base: command === 'build' || isPreview ? '/Kaisergarten-Wine-Sales/' : '/',
  plugins: [react()],
  server: {
    host: 'localhost',
    port: 5173,
  },
}));
