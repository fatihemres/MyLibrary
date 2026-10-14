import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { localReaderOnly } from './scripts/build/local-reader-policy';

export default defineConfig({
  plugins: [react(), localReaderOnly()],
  worker: { format: 'es', plugins: () => [localReaderOnly(true)] },
  clearScreen: false,
  server: { port: 1420, strictPort: true },
  envPrefix: ['VITE_', 'TAURI_ENV_'],
  build: { target: 'es2022' },
});
