import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import fs from 'fs';
import path from 'path';

function apkApiMiddleware(): Plugin {
  return {
    name: 'apk-api-middleware',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split('?')[0] || '';

        // Handle /api/data (robust file-based persistence outside /public and /dist)
        if (url === '/api/data') {
          const DB_DIR = path.resolve(__dirname, '..', 'data');
          const SNAPSHOTS_DIR = path.join(DB_DIR, 'snapshots');
          const mainDbFile = path.join(DB_DIR, 'javaneh_db.json');
          const backupDbFile = path.join(DB_DIR, 'javaneh_db_backup.json');

          if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
          if (!fs.existsSync(SNAPSHOTS_DIR)) fs.mkdirSync(SNAPSHOTS_DIR, { recursive: true });

          res.setHeader('Content-Type', 'application/json; charset=utf-8');

          if (req.method === 'GET') {
            const candidateFiles = [mainDbFile, backupDbFile];
            for (const file of candidateFiles) {
              if (fs.existsSync(file)) {
                try {
                  const content = fs.readFileSync(file, 'utf-8');
                  const parsed = JSON.parse(content);
                  if (parsed && (parsed.goals?.length || parsed.tasks?.length || parsed.habits?.length || parsed.categories?.length)) {
                    res.statusCode = 200;
                    res.end(content);
                    return;
                  }
                } catch (e) {}
              }
            }
            // Check snapshots if primary files empty
            try {
              const snapshotFiles = fs.readdirSync(SNAPSHOTS_DIR)
                .filter(f => f.startsWith('snapshot-') && f.endsWith('.json'))
                .sort().reverse();
              if (snapshotFiles.length > 0) {
                const latestSnap = path.join(SNAPSHOTS_DIR, snapshotFiles[0]);
                const snapContent = fs.readFileSync(latestSnap, 'utf-8');
                res.statusCode = 200;
                res.end(snapContent);
                return;
              }
            } catch (e) {}

            res.statusCode = 200;
            res.end(JSON.stringify({ initialized: false, tasks: [], goals: [], habits: [], categories: null }));
            return;
          }

          if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', () => {
              try {
                const parsed = JSON.parse(body);
                const hasValidContent = parsed && (
                  (Array.isArray(parsed.goals) && parsed.goals.length > 0) ||
                  (Array.isArray(parsed.tasks) && parsed.tasks.length > 0) ||
                  (Array.isArray(parsed.habits) && parsed.habits.length > 0) ||
                  (Array.isArray(parsed.categories) && parsed.categories.length > 0) ||
                  Boolean(parsed.userProfile?.name)
                );

                if (hasValidContent) {
                  const formatted = JSON.stringify(parsed, null, 2);
                  const tmpFile = path.join(DB_DIR, `javaneh_db.json.tmp.${Date.now()}`);

                  // 1. Write atomic temp file then rename
                  fs.writeFileSync(tmpFile, formatted, 'utf-8');
                  if (fs.existsSync(mainDbFile)) {
                    try {
                      fs.copyFileSync(mainDbFile, backupDbFile);
                    } catch (e) {}
                  }
                  fs.renameSync(tmpFile, mainDbFile);

                  // 2. Rolling snapshot in data/snapshots/
                  try {
                    const snapFile = path.join(SNAPSHOTS_DIR, `snapshot-${Date.now()}.json`);
                    fs.writeFileSync(snapFile, formatted, 'utf-8');
                    const allSnaps = fs.readdirSync(SNAPSHOTS_DIR)
                      .filter(f => f.startsWith('snapshot-') && f.endsWith('.json'))
                      .sort();
                    if (allSnaps.length > 20) {
                      for (let i = 0; i < allSnaps.length - 20; i++) {
                        fs.unlinkSync(path.join(SNAPSHOTS_DIR, allSnaps[i]));
                      }
                    }
                  } catch (e) {}
                }

                res.statusCode = 200;
                res.end(JSON.stringify({ success: true, timestamp: Date.now() }));
              } catch (e) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'INVALID_JSON' }));
              }
            });
            return;
          }
        }

        // Handle /api/snapshots (list available snapshots in data directory)
        if (url === '/api/snapshots') {
          const DB_DIR = path.resolve(__dirname, '..', 'data');
          const SNAPSHOTS_DIR = path.join(DB_DIR, 'snapshots');
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          try {
            if (fs.existsSync(SNAPSHOTS_DIR)) {
              const files = fs.readdirSync(SNAPSHOTS_DIR)
                .filter(f => f.startsWith('snapshot-') && f.endsWith('.json'))
                .sort().reverse();
              const list = files.slice(0, 15).map(f => {
                const stat = fs.statSync(path.join(SNAPSHOTS_DIR, f));
                const ts = parseInt(f.replace('snapshot-', '').replace('.json', ''), 10);
                return { filename: f, timestamp: ts, size: stat.size };
              });
              res.statusCode = 200;
              res.end(JSON.stringify({ snapshots: list }));
              return;
            }
          } catch (e) {}
          res.statusCode = 200;
          res.end(JSON.stringify({ snapshots: [] }));
          return;
        }

        // Handle /api/apk-info
        if (url === '/api/apk-info') {
          const candidatePaths = [
            path.resolve(__dirname, 'public', 'javaneh.apk'),
            path.resolve(__dirname, '..', 'public', 'javaneh.apk'),
            path.resolve(__dirname, 'dist', 'javaneh.apk'),
            path.resolve(__dirname, '..', 'dist', 'javaneh.apk'),
          ];
          let found = candidatePaths.find(p => fs.existsSync(p));

          if (!found) {
            const base64File = path.resolve(__dirname, '..', 'scripts', 'javaneh.apk.base64');
            if (fs.existsSync(base64File)) {
              try {
                const b64 = fs.readFileSync(base64File, 'utf-8').trim();
                const buffer = Buffer.from(b64, 'base64');
                const targetPath = path.resolve(__dirname, 'public', 'javaneh.apk');
                fs.writeFileSync(targetPath, buffer);
                found = targetPath;
              } catch (e) {}
            }
          }

          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          if (found) {
            try {
              const stat = fs.statSync(found);
              res.statusCode = 200;
              res.end(JSON.stringify({
                available: true,
                filename: 'javaneh.apk',
                size: stat.size,
                formattedSize: (stat.size / (1024 * 1024)).toFixed(2) + ' MB',
              }));
              return;
            } catch {}
          }
          res.statusCode = 404;
          res.end(JSON.stringify({
            available: false,
            error: 'فایل APK هنوز تولید نشده است. می‌توانید برنامه را مستقیماً به عنوان PWA روی گوشی نصب کنید.',
          }));
          return;
        }

        // Handle /javaneh.apk or /api/download-apk
        if (url === '/javaneh.apk' || url === '/api/download-apk' || url.endsWith('.apk')) {
          const candidatePaths = [
            path.resolve(__dirname, 'public', 'javaneh.apk'),
            path.resolve(__dirname, '..', 'public', 'javaneh.apk'),
            path.resolve(__dirname, 'dist', 'javaneh.apk'),
            path.resolve(__dirname, '..', 'dist', 'javaneh.apk'),
          ];
          let found = candidatePaths.find(p => fs.existsSync(p));

          if (!found) {
            const base64File = path.resolve(__dirname, '..', 'scripts', 'javaneh.apk.base64');
            if (fs.existsSync(base64File)) {
              try {
                const b64 = fs.readFileSync(base64File, 'utf-8').trim();
                const buffer = Buffer.from(b64, 'base64');
                const targetPath = path.resolve(__dirname, 'public', 'javaneh.apk');
                fs.writeFileSync(targetPath, buffer);
                found = targetPath;
              } catch (e) {}
            }
            if (!found) {
              try {
                const scriptPath = path.resolve(__dirname, '..', 'scripts', 'build-real-apk.sh');
                if (fs.existsSync(scriptPath)) {
                  const { execSync } = require('child_process');
                  execSync(`bash "${scriptPath}"`, { stdio: 'pipe' });
                  found = candidatePaths.find(p => fs.existsSync(p));
                }
              } catch (genErr) {
                console.error('[APK AutoGen Notice]:', genErr);
              }
            }
          }

          if (found) {
            try {
              const stat = fs.statSync(found);
              if (stat.size > 50000) {
                res.setHeader('Content-Type', 'application/vnd.android.package-archive');
                res.setHeader('Content-Disposition', 'attachment; filename="javaneh.apk"');
                res.setHeader('Content-Length', stat.size);
                res.setHeader('Accept-Ranges', 'bytes');
                res.setHeader('Cache-Control', 'no-cache');

                const readStream = fs.createReadStream(found);

                readStream.on('error', (streamErr) => {
                  console.error('[APK Streaming Error]:', streamErr);
                  if (!res.headersSent) {
                    res.statusCode = 500;
                    res.setHeader('Content-Type', 'application/json; charset=utf-8');
                    res.end(JSON.stringify({
                      error: 'APK_STREAMING_FAILED',
                      message: 'خطا در خواندن و استریم فایل بسته نصبی APK: ' + (streamErr?.message || 'خطای استریم فایل'),
                    }));
                  } else {
                    res.destroy(streamErr);
                  }
                });

                res.on('error', (resErr) => {
                  console.error('[APK Response Error]:', resErr);
                  readStream.destroy();
                });

                readStream.pipe(res);
                return;
              }
            } catch (err: any) {
              console.error('[APK Setup Error]:', err);
              if (!res.headersSent) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                res.end(JSON.stringify({
                  error: 'APK_STREAMING_FAILED',
                  message: 'خطا در آماده‌سازی استریم فایل APK: ' + (err?.message || 'خطای فایل سرور'),
                }));
                return;
              }
            }
          }

          // Do NOT let Vite fall back to index.html! Return 404 JSON/text!
          res.statusCode = 404;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({
            error: 'APK_NOT_FOUND',
            message: 'فایل کامل APK روی این سرور وب موجود نیست. لطفاً دستور بیلد را جهت ساخت فایل کامل اجرا کنید.',
          }));
          return;
        }

        next();
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss(), apkApiMiddleware()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: true,
    hmr: {
      overlay: false,
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: true,
  },
});

