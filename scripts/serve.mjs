import http from 'node:http';
import { stat } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import path from 'node:path';
import { writeAnalyticsConfig } from './analytics-config.mjs';
import { loadEnvFile } from 'node:process';
import { socialRedirect } from './social-links.mjs';
import { profileSharingRedirect } from './profile-sharing.mjs';
const root = path.resolve(import.meta.dirname, '..');
// Node 22+: keep shell/Render values authoritative; local values stay out of Git.
try { loadEnvFile(path.join(root, '.env.local')); } catch (error) { if (error.code !== 'ENOENT') throw error; }
await writeAnalyticsConfig(root);
const types = { '.html': 'text/html; charset=utf-8', '.json': 'application/json', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif' };
const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    const destination = socialRedirect(url.pathname) || profileSharingRedirect(url.pathname);
    if (destination && ['GET', 'HEAD'].includes(req.method)) {
      res.writeHead(301, { Location: destination, 'Cache-Control': 'no-cache' });
      res.end();
      return;
    }
    const routes = { '/privacy': '/privacy.html', '/privacy/': '/privacy.html', '/delete-account': '/delete-account.html', '/delete-account/': '/delete-account.html' };
    const pathname = decodeURIComponent(url.pathname);
    const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : routes[pathname] || pathname));
    const relative = path.relative(root, file);
    const isAsset = relative.startsWith('assets' + path.sep) && path.extname(file) !== '.json' && Object.hasOwn(types, path.extname(file));
    const isAssociation = relative === path.join('.well-known', 'assetlinks.json');
    if (relative.startsWith('..') || path.isAbsolute(relative) || (!['index.html', 'styles.css', 'app.js', 'analytics.js', 'apk-counter.js', 'analytics-config.js', 'privacy.html', 'delete-account.html', 'legal.css'].includes(relative) && !isAsset && !isAssociation)) { res.writeHead(404); res.end('Not found'); return; }
    const info = await stat(file);
    if (!info.isFile()) { res.writeHead(404); res.end('Not found'); return; }
    const headers = { 'Content-Type': types[path.extname(file)], 'Content-Length': info.size, 'Cache-Control': 'no-cache' };
    res.writeHead(200, headers);
    if (req.method === 'HEAD') { res.end(); return; }
    const stream = createReadStream(file);
    stream.on('error', () => res.destroy());
    res.on('close', () => stream.destroy());
    stream.pipe(res);
  } catch { res.writeHead(404); res.end('Not found'); }
});
server.listen(Number(process.env.PORT || 5173), '127.0.0.1', () => console.log(`BBook: http://localhost:${server.address().port}`));
