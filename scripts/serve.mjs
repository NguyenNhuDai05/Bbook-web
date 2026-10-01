import http from 'node:http';
import { stat } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '..');
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.apk': 'application/vnd.android.package-archive' };
const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    const file = path.resolve(root, '.' + decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname));
    const relative = path.relative(root, file);
    const isAsset = relative.startsWith('assets' + path.sep) && Object.hasOwn(types, path.extname(file));
    if (relative.startsWith('..') || path.isAbsolute(relative) || (!['index.html', 'styles.css', 'app.js', 'favicon.svg'].includes(relative) && !isAsset)) { res.writeHead(404); res.end('Not found'); return; }
    const info = await stat(file);
    if (!info.isFile()) { res.writeHead(404); res.end('Not found'); return; }
    const headers = { 'Content-Type': types[path.extname(file)], 'Content-Length': info.size, 'Cache-Control': 'no-cache' };
    if (path.extname(file) === '.apk') headers['Content-Disposition'] = 'attachment; filename="bbook-android.apk"';
    res.writeHead(200, headers);
    if (req.method === 'HEAD') { res.end(); return; }
    const stream = createReadStream(file);
    stream.on('error', () => res.destroy());
    res.on('close', () => stream.destroy());
    stream.pipe(res);
  } catch { res.writeHead(404); res.end('Not found'); }
});
server.listen(Number(process.env.PORT || 5173), '127.0.0.1', () => console.log(`BBook: http://localhost:${server.address().port}`));
