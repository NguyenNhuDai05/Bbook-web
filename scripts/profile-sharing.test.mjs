import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { profileSharingRedirect, profileSharingRedirects } from './profile-sharing.mjs';

const id = '10000000-0000-0000-0000-000000000001';
test('public domain routes one profile to the fixed renderer without loops or open redirects', () => {
  assert.deepEqual(profileSharingRedirects, [{ source: '/mua/:muaId', destination: 'https://beautybook-v3bi.onrender.com/mua/:muaId', type: 'redirect' }, { source: '/posts/:postId', destination: 'https://beautybook-v3bi.onrender.com/posts/:postId', type: 'redirect' }]);
  assert.equal(profileSharingRedirect(`/mua/${id}`), `https://beautybook-v3bi.onrender.com/mua/${id}`);
  assert.equal(profileSharingRedirect(`/posts/${id}`), `https://beautybook-v3bi.onrender.com/posts/${id}`);
  assert.equal(profileSharingRedirect('/posts/not-an-id'), null);
  for (const path of ['/', '/privacy/', '/delete-account/', '/fb', '/.well-known/assetlinks.json', '/api/health', `/mua/${id}/extra`, '/mua/https://evil.test', '/mua/not-an-id']) assert.equal(profileSharingRedirect(path), null);
});

test('real HTTP server serves the signing association directly and preserves existing website paths', async t => {
  const child = spawn(process.execPath, ['scripts/serve.mjs'], { cwd: new URL('../', import.meta.url), env: { ...process.env, PORT: '0' }, stdio: ['ignore', 'pipe', 'pipe'] });
  t.after(async () => { if (child.exitCode === null) { child.kill(); await once(child, 'exit'); } });
  let stderr = '';
  child.stderr.on('data', data => { stderr += data; });
  const origin = await new Promise((resolve, reject) => {
    let output = '';
    const timeout = setTimeout(() => reject(new Error(`Server did not start: ${stderr}`)), 10000);
    child.once('error', error => { clearTimeout(timeout); reject(error); });
    child.once('exit', code => { clearTimeout(timeout); reject(new Error(`Server exited ${code}: ${stderr}`)); });
    child.stdout.on('data', data => { output += data; const match = /http:\/\/localhost:(\d+)/.exec(output); if (match) { clearTimeout(timeout); resolve(`http://127.0.0.1:${match[1]}`); } });
  });
  const get = path => fetch(`${origin}${path}`, { redirect: 'manual', signal: AbortSignal.timeout(5000) });
  const association = await get('/.well-known/assetlinks.json');
  assert.equal(association.status, 200); assert.equal(association.headers.get('location'), null); assert.match(association.headers.get('content-type'), /^application\/json/);
  const expected = JSON.parse(await readFile(new URL('../.well-known/assetlinks.json', import.meta.url), 'utf8'));
  assert.deepEqual(await association.json(), expected);
  assert.deepEqual(expected, [{ relation: ['delegate_permission/common.handle_all_urls'], target: { namespace: 'android_app', package_name: 'com.bbook.app', sha256_cert_fingerprints: ['6A:65:69:18:C6:1C:95:91:E8:8E:DB:D4:C0:52:6A:78:FA:45:D5:FE:A0:E4:78:52:71:29:FD:AA:CB:1C:BB:3C'] } }]);
  const profile = await get(`/mua/${id}?redirect=https://evil.test`);
  assert.equal(profile.status, 301); assert.equal(profile.headers.get('location'), `https://beautybook-v3bi.onrender.com/mua/${id}`);
  const post = await get(`/posts/${id}?muaId=wrong-owner`); assert.equal(post.status, 301); assert.equal(post.headers.get('location'), `https://beautybook-v3bi.onrender.com/posts/${id}`);
  const head = await fetch(`${origin}/.well-known/assetlinks.json`, { method: 'HEAD' }); assert.equal(head.status, 200); assert.equal(await head.text(), '');
  for (const path of ['/', '/privacy/', '/delete-account/', '/styles.css']) assert.equal((await get(path)).status, 200, path);
  const social = await get('/fb'); assert.equal(social.status, 301); assert.match(social.headers.get('location'), /^\/\?utm_source=facebook/);
  for (const path of ['/.well-known/other.json', '/profile-sharing-redirects.json', '/.env.local', '/mua/not-an-id']) assert.equal((await get(path)).status, 404, path);
});
