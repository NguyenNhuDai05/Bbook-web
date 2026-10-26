import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { once } from 'node:events';

test('landing has valid local assets, anchor destinations and the real Play listing', async t => {
  const root = new URL('../', import.meta.url);
  const html = await readFile(new URL('index.html', root), 'utf8');
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(new Set(ids).size, ids.length, 'IDs must be unique');
  for (const [, target] of html.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.includes(target), `Missing anchor ${target}`);
  for (const anchor of ['main', 'customers', 'artists', 'showcase', 'how-it-works', 'release', 'download', 'faq', 'contact']) assert.ok(ids.includes(anchor));
  const storeLinks = [...html.matchAll(/<a\b[^>]*data-store="android"[^>]*>/g)];
  assert.ok(storeLinks.length >= 5);
  for (const [tag] of storeLinks) assert.match(tag, /href="https:\/\/play\.google\.com\/store\/apps\/details\?id=com\.bbook\.app"/);
  assert.equal((html.match(/<h1\b/g) || []).length, 1);
  assert.match(html, /<html lang="vi">/);
  assert.match(html, /<link rel="canonical" href="https:\/\/bbookmakeup\.com\/">/);
  assert.doesNotMatch(html, /data-apk-download|assets\/downloads\/|beauty-hero-/);
  const child = spawn(process.execPath, ['scripts/serve.mjs'], { cwd: root, env: { ...process.env, PORT: '0' }, stdio: ['ignore', 'pipe', 'pipe'] });
  t.after(async () => { if (child.exitCode === null) { child.kill(); await once(child, 'exit'); } });
  let stderr = '';
  child.stderr.on('data', data => { stderr += data; });
  const origin = await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(`Server startup timed out: ${stderr}`)), 10000);
    let output = '';
    child.once('error', error => { clearTimeout(timeout); reject(error); });
    child.once('exit', code => { clearTimeout(timeout); reject(new Error(`Server exited ${code}: ${stderr}`)); });
    child.stdout.on('data', data => { output += data; const match = /localhost:(\d+)/.exec(output); if (match) { clearTimeout(timeout); resolve(`http://127.0.0.1:${match[1]}`); } });
  });
  const assets = new Set([...html.matchAll(/(?:src|href|srcset)="((?:assets\/|app\.js|analytics[^" ]*\.js|apk-counter\.js|styles\.css)[^"]*)"/g)].map(match => match[1]));
  const socialImage = new URL(/property="og:image" content="([^"]+)"/.exec(html)[1]);
  assert.equal(socialImage.origin, 'https://bbookmakeup.com');
  assets.add(socialImage.pathname.slice(1));
  for (const asset of assets) {
    const response = await fetch(`${origin}/${asset}`, { signal: AbortSignal.timeout(5000) });
    assert.equal(response.status, 200, asset);
    if (asset.endsWith('.webp')) assert.equal(response.headers.get('content-type'), 'image/webp', asset);
    assert.ok((await response.arrayBuffer()).byteLength > 0, asset);
  }
});
