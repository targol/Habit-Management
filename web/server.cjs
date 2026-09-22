const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const PORT = 3000;
const HOST = '0.0.0.0';
const DIST_DIR = path.join(__dirname, 'dist');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.apk': 'application/vnd.android.package-archive',
};

const server = http.createServer((req, res) => {
  // CORS & Security headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  let reqPath = req.url.split('?')[0];

  // Handle persistent storage API
  if (reqPath === '/api/apk-info') {
    const candidateApkPaths = [
      path.join(DIST_DIR, 'javaneh.apk'),
      path.join(__dirname, 'public', 'javaneh.apk'),
      path.join(__dirname, '..', 'dist', 'javaneh.apk'),
      path.join(__dirname, '..', '.build-outputs', 'app-debug.apk'),
    ];
    const apkFile = candidateApkPaths.find(p => fs.existsSync(p));
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    if (apkFile) {
      try {
        const stat = fs.statSync(apkFile);
        res.writeHead(200);
        res.end(JSON.stringify({
          available: true,
          filename: 'javaneh.apk',
          size: stat.size,
          formattedSize: (stat.size / (1024 * 1024)).toFixed(2) + ' MB',
          sha256: '4aec4194adeeaa023f0f7453371a9ccc21d3d92d0b4afc8d9bbfb4cf824be280',
          acceptRanges: true,
        }));
        return;
      } catch (e) {
        console.error('[ApkInfo] Error reading apk:', e);
      }
    }
    res.writeHead(404);
    res.end(JSON.stringify({ available: false, error: 'APK not found' }));
    return;
  }

  // Handle persistent storage API
  if (reqPath === '/api/data') {
    const DB_DIR = path.resolve(__dirname, '..', 'data');
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
          res.writeHead(200);
          res.end(content);
          return;
        } catch (err) {
          console.error('[Storage] Failed to read db.json:', err);
        }
      }
      res.writeHead(200);
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
          fs.writeFileSync(DB_FILE, JSON.stringify(parsed, null, 2), 'utf-8');
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.writeHead(200);
          res.end(JSON.stringify({ success: true, timestamp: Date.now() }));
        } catch (err) {
          console.error('[Storage] Failed to write db.json:', err);
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
        }
      });
      return;
    }
  }

  // Direct APK download route with HTTP Range (206 Partial Content) support
  if (reqPath === '/javaneh.apk') {
    const candidateApkPaths = [
      path.join(DIST_DIR, 'javaneh.apk'),
      path.join(__dirname, 'public', 'javaneh.apk'),
      path.join(__dirname, '..', 'dist', 'javaneh.apk'),
      path.join(__dirname, '..', '.build-outputs', 'app-debug.apk'),
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
            res.writeHead(416, { 'Content-Range': `bytes */${totalSize}` });
            res.end();
            return;
          }

          const chunkSize = end - start + 1;
          res.writeHead(206, {
            'Content-Range': `bytes ${start}-${end}/${totalSize}`,
            'Content-Length': chunkSize,
          });

          if (req.method === 'HEAD') {
            res.end();
            return;
          }

          const stream = fs.createReadStream(apkFile, { start, end });
          stream.pipe(res);
          return;
        }

        res.writeHead(200, { 'Content-Length': totalSize });
        if (req.method === 'HEAD') {
          res.end();
          return;
        }
        fs.createReadStream(apkFile).pipe(res);
        return;
      } catch (e) {
        console.error('[Storage] Error streaming apk:', e);
      }
    }
  }

  if (reqPath === '/') reqPath = '/index.html';

  let filePath = path.join(DIST_DIR, reqPath);

  // Prevent path traversal
  if (!filePath.startsWith(DIST_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    // If not found, fallback to index.html (SPA routing)
    if (err || !stats.isFile()) {
      filePath = path.join(DIST_DIR, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Error loading application');
        return;
      }

      const headers = {
        'Content-Type': contentType,
        'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable',
      };
      if (ext === '.apk') {
        headers['Content-Disposition'] = 'attachment; filename="javaneh.apk"';
      }

      res.writeHead(200, headers);
      res.end(content);
    });
  });
});

server.listen(PORT, HOST, () => {
  console.log(`[Javaneh Web Server] Serving on http://${HOST}:${PORT}`);
});
