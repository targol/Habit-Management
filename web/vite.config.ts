import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function persistentStoragePlugin(): Plugin {
  return {
    name: 'persistent-storage-plugin',
    configureServer(server) {
      // Direct APK download handler with full HTTP Range (206 Partial Content) support for mobile download managers
      server.middlewares.use((req, res, next) => {
        const urlPath = req.url ? req.url.split('?')[0] : '';
        if (urlPath === '/javaneh.apk') {
          const candidateApkPaths = [
            path.resolve(__dirname, 'public/javaneh.apk'),
            path.resolve(__dirname, '../dist/javaneh.apk'),
            path.resolve(__dirname, '../.build-outputs/app-debug.apk'),
          ];
          const apkFile = candidateApkPaths.find(p => fs.existsSync(p));
          if (apkFile) {
            try {
              const stat = fs.statSync(apkFile);
              const totalSize = stat.size;
              const rangeHeader = req.headers.range;

              res.setHeader('Content-Type', 'application/vnd.android.package-archive');
              res.setHeader('Content-Disposition', 'attachment; filename="javaneh.apk"');
              res.setHeader('Accept-Ranges', 'bytes');
              res.setHeader('Cache-Control', 'public, max-age=86400');

              if (rangeHeader && rangeHeader.startsWith('bytes=')) {
                const parts = rangeHeader.replace(/bytes=/, '').split('-');
                const start = parseInt(parts[0], 10);
                const end = parts[1] ? parseInt(parts[1], 10) : totalSize - 1;

                if (isNaN(start) || start >= totalSize || (parts[1] && end >= totalSize) || start > end) {
                  res.statusCode = 416; // Range Not Satisfiable
                  res.setHeader('Content-Range', `bytes */${totalSize}`);
                  res.end();
                  return;
                }

                const chunkSize = end - start + 1;
                res.statusCode = 206; // Partial Content
                res.setHeader('Content-Range', `bytes ${start}-${end}/${totalSize}`);
                res.setHeader('Content-Length', chunkSize);

                if (req.method === 'HEAD') {
                  res.end();
                  return;
                }

                const stream = fs.createReadStream(apkFile, { start, end });
                stream.pipe(res);
                return;
              }

              res.statusCode = 200;
              res.setHeader('Content-Length', totalSize);
              if (req.method === 'HEAD') {
                res.end();
                return;
              }
              const stream = fs.createReadStream(apkFile);
              stream.pipe(res);
              return;
            } catch (err) {
              console.error('[Storage] Error streaming apk in Vite:', err);
            }
          }
        }
        next();
      });

      server.middlewares.use('/api/data', (req, res, next) => {
        const DB_DIR = path.resolve(__dirname, '../data');
        const DB_FILE = path.join(DB_DIR, 'javaneh_db.json');

        if (!fs.existsSync(DB_DIR)) {
          try {
            fs.mkdirSync(DB_DIR, { recursive: true });
          } catch (err) {
            console.error('[Storage] Failed to create data dir:', err);
          }
        }

        if (req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          if (fs.existsSync(DB_FILE)) {
            try {
              const content = fs.readFileSync(DB_FILE, 'utf-8');
              res.statusCode = 200;
              res.end(content);
              return;
            } catch (err) {
              console.error('[Storage] Failed to read db.json:', err);
            }
          }
          res.statusCode = 200;
          res.end(JSON.stringify({ initialized: false, tasks: [], goals: [], habits: [], categories: null }));
          return;
        }

        if (req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              const parsed = JSON.parse(body);
              const BACKUP_FILE = path.join(DB_DIR, 'javaneh_db_backup.json');
              let existing: any = null;
              if (fs.existsSync(DB_FILE)) {
                try {
                  const currentStr = fs.readFileSync(DB_FILE, 'utf-8');
                  existing = JSON.parse(currentStr);
                  // Keep a safety backup before writing
                  fs.writeFileSync(BACKUP_FILE, currentStr, 'utf-8');
                } catch (e) {
                  console.warn('[Storage] Backup creation failed:', e);
                }
              }

              // Non-destructive preservation: if incoming has empty arrays, don't wipe existing valid items
              const safeData = { ...parsed };
              if (existing) {
                if ((!Array.isArray(safeData.tasks) || safeData.tasks.length === 0) && Array.isArray(existing.tasks) && existing.tasks.length > 0) {
                  safeData.tasks = existing.tasks;
                }
                if ((!Array.isArray(safeData.goals) || safeData.goals.length === 0) && Array.isArray(existing.goals) && existing.goals.length > 0) {
                  safeData.goals = existing.goals;
                }
                if ((!Array.isArray(safeData.habits) || safeData.habits.length === 0) && Array.isArray(existing.habits) && existing.habits.length > 0) {
                  safeData.habits = existing.habits;
                }
              }

              fs.writeFileSync(DB_FILE, JSON.stringify(safeData, null, 2), 'utf-8');
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.statusCode = 200;
              res.end(JSON.stringify({ success: true, timestamp: Date.now() }));
            } catch (err) {
              console.error('[Storage] Failed to write db.json:', err);
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
            }
          });
          return;
        }

        next();
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  base: './',
  publicDir: path.resolve(__dirname, 'public'),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  plugins: [react(), tailwindcss(), persistentStoragePlugin()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
    strictPort: true,
    allowedHosts: true,
  },
  preview: {
    port: 3000,
    host: '0.0.0.0',
    strictPort: true,
    allowedHosts: true,
  },
});
