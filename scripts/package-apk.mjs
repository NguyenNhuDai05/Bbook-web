import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const apk = await readFile(path.join(root, 'assets/downloads/bbook-android.apk'));
const directory = path.join(root, 'apk-release');
await mkdir(directory, { recursive: true });
const parts = [];
const chunkSize = 40 * 1024 * 1024;
for (let offset = 0; offset < apk.length; offset += chunkSize) {
  const name = `android-${parts.length + 1}.part`;
  await writeFile(path.join(directory, name), apk.subarray(offset, offset + chunkSize));
  parts.push(name);
}
await writeFile(path.join(directory, 'manifest.json'), JSON.stringify({
  size: apk.length, sha256: createHash('sha256').update(apk).digest('hex'), parts,
}, null, 2) + '\n');
console.log('APK packaged in apk-release/; commit these files with the website.');
