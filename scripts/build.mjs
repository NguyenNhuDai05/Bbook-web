import { mkdir, copyFile, cp, rm } from 'node:fs/promises';
import path from 'node:path';
import './generate-legal.mjs';
import { writeAnalyticsConfig } from './analytics-config.mjs';
const root = path.resolve(import.meta.dirname, '..');
// Replace only the generated output, including APKs left by an older build.
const output = path.resolve(root, 'dist');
if (path.dirname(output) !== root || path.basename(output) !== 'dist') throw new Error('Unsafe build output path.');
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await writeAnalyticsConfig(path.join(root, 'dist'));
for (const file of ['index.html', 'styles.css', 'app.js', 'analytics.js', 'apk-counter.js', 'favicon.svg', 'privacy.html', 'delete-account.html', 'legal.css']) await copyFile(path.join(root, file), path.join(root, 'dist', file));
const assets = path.join(root, 'assets');
await cp(assets, path.join(output, 'assets'), { recursive: true, filter: source => {
  const relative = path.relative(assets, source);
  return relative !== 'downloads' && !relative.startsWith('downloads' + path.sep) && path.extname(source).toLowerCase() !== '.apk';
} });
for (const directory of ['privacy', 'delete-account']) await cp(path.join(root, directory), path.join(root, 'dist', directory), { recursive: true });
await mkdir(path.join(root, 'dist', '.well-known'), { recursive: true });
await copyFile(path.join(root, '.well-known', 'assetlinks.json'), path.join(root, 'dist', '.well-known', 'assetlinks.json'));
console.log('Build hoàn tất: dist/');
