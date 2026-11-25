import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const configDirectory = path.dirname(fileURLToPath(import.meta.url));

// Plugin to duplicate index.html to 404.html for GitHub Pages SPA routing
function githubPagesSpaPlugin() {
  return {
    name: 'github-pages-spa',
    closeBundle() {
      const outDir = path.resolve(configDirectory, 'dist');
      const indexHtml = path.join(outDir, 'index.html');
      const notFoundHtml = path.join(outDir, '404.html');
      if (fs.existsSync(indexHtml)) {
        fs.copyFileSync(indexHtml, notFoundHtml);
        const appDir = path.join(outDir, 'app');
        fs.mkdirSync(appDir, { recursive: true });
        fs.copyFileSync(indexHtml, path.join(appDir, 'index.html'));
      }
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load environment variables from frontend dir and workspace root
  const rootEnv = loadEnv(mode, path.resolve(configDirectory, '..'), '');
  const localEnv = loadEnv(mode, process.cwd(), '');
  const env = { ...rootEnv, ...localEnv, ...process.env };

  const apiTarget = env.VITE_API_BASE_URL || 'http://localhost:8000';

  // In GitHub Actions, GITHUB_REPOSITORY is automatically "owner/repo-name"
  const repoName = env.GITHUB_REPOSITORY ? `/${env.GITHUB_REPOSITORY.split('/')[1]}/` : '';
  const base = env.BASE_PATH || env.VITE_BASE_PATH || repoName || '/';

  return {
    base,
    plugins: [react(), githubPagesSpaPlugin()],
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
        },
        '/health': {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
        },
        '/docs': {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
        },
        '/openapi.json': {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
        },
        '/static': {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});


