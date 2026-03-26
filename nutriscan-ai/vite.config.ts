import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    
    let apiKey = env.GEMINI_API_KEY;
    if (!apiKey && env.GEMENI_API_KEY) {
      console.log("⚠️  NOTE: Found 'GEMENI_API_KEY' (typo). Using it as GEMINI_API_KEY.");
      apiKey = env.GEMENI_API_KEY;
    }

    if (!apiKey) {
      console.warn("⚠️  WARNING: GEMINI_API_KEY is not set in your .env file. The app will not function correctly.");
    } else {
      console.log("✅ GEMINI_API_KEY loaded successfully.");
    }

    return {
      base: '/HackWestern12/',
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(apiKey),
        'process.env.GEMINI_API_KEY': JSON.stringify(apiKey)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
