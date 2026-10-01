import { mkdir, copyFile, cp } from 'node:fs/promises';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '..');
await mkdir(path.join(root, 'dist'), { recursive: true });
for (const file of ['index.html', 'styles.css', 'app.js', 'favicon.svg']) await copyFile(path.join(root, file), path.join(root, 'dist', file));
await cp(path.join(root, 'assets'), path.join(root, 'dist', 'assets'), { recursive: true });
console.log('Build hoàn tất: dist/');
