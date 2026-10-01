import { mkdir, copyFile, cp, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '..');
const release = path.join(root, 'apk-release');
const manifest = JSON.parse(await readFile(path.join(release, 'manifest.json'), 'utf8'));
const apk = Buffer.concat(await Promise.all(manifest.parts.map(name => readFile(path.join(release, name)))));
if (apk.length !== manifest.size || createHash('sha256').update(apk).digest('hex') !== manifest.sha256) {
  throw new Error('APK release is incomplete or corrupted. Run npm run package:apk with the verified APK.');
}
await mkdir(path.join(root, 'assets/downloads'), { recursive: true });
await writeFile(path.join(root, 'assets/downloads/bbook-android.apk'), apk);
await mkdir(path.join(root, 'dist'), { recursive: true });
for (const file of ['index.html', 'styles.css', 'app.js', 'favicon.svg']) await copyFile(path.join(root, file), path.join(root, 'dist', file));
await cp(path.join(root, 'assets'), path.join(root, 'dist', 'assets'), { recursive: true });
console.log('Build hoàn tất: dist/');
