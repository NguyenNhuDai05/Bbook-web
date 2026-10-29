import test from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';

test('build removes stale APKs, excludes installer assets and preserves images, pages and association', async t => {
  const root = path.resolve(import.meta.dirname, '..');
  const temporary = path.resolve(tmpdir());
  const fixture = await mkdtemp(path.join(temporary, 'bbook-no-apk-'));
  t.after(async () => {
    if (path.dirname(path.resolve(fixture)) !== temporary || !path.basename(fixture).startsWith('bbook-no-apk-')) throw new Error('Unsafe fixture cleanup.');
    await rm(fixture, { recursive: true, force: true });
  });
  await mkdir(path.join(fixture, 'scripts'));
  for (const file of ['build.mjs', 'generate-legal.mjs', 'analytics-config.mjs', 'commerce-config.mjs']) await cp(path.join(root, 'scripts', file), path.join(fixture, 'scripts', file));
  for (const file of ['index.html', 'styles.css', 'app.js', 'analytics.js', 'apk-counter.js', 'legal.css', 'legal/content.json', '.well-known/assetlinks.json']) {
    const destination = path.join(fixture, file); await mkdir(path.dirname(destination), { recursive: true }); await cp(path.join(root, file), destination);
  }
  await cp(path.join(root, 'mua'), path.join(fixture, 'mua'), { recursive: true });
  await cp(path.join(root, 'assets', 'images'), path.join(fixture, 'assets', 'images'), { recursive: true });
  await mkdir(path.join(fixture, 'assets', 'downloads')); await writeFile(path.join(fixture, 'assets', 'downloads', 'bbook-android.apk'), 'legacy installer');
  await writeFile(path.join(fixture, 'assets', 'other.APK'), 'another installer');
  await mkdir(path.join(fixture, 'dist', 'assets', 'downloads'), { recursive: true });
  await writeFile(path.join(fixture, 'dist', 'assets', 'downloads', 'bbook-android.apk'), 'stale deployed installer');
  const result = spawnSync(process.execPath, ['scripts/build.mjs'], { cwd: fixture, encoding: 'utf8', timeout: 30000, env: { ...process.env, NEXT_PUBLIC_GA_MEASUREMENT_ID: '', APK_COUNTER_API_URL: '' } });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const files = await readdir(path.join(fixture, 'dist'), { recursive: true });
  assert.ok(!files.some(file => /\.apk$/i.test(file)), 'No old or new APK can survive in the published output');
  assert.ok(!files.some(file => file.split(path.sep).includes('downloads')));
  for (const file of await readdir(path.join(root, 'assets', 'images'))) assert.deepEqual(await readFile(path.join(fixture, 'dist', 'assets', 'images', file)), await readFile(path.join(root, 'assets', 'images', file)), `Image must remain unchanged: ${file}`);
  for (const file of ['index.html', 'styles.css', 'app.js', '.well-known/assetlinks.json']) assert.deepEqual(await readFile(path.join(fixture, 'dist', file)), await readFile(path.join(root, file)), file);
  for (const file of ['privacy/index.html', 'delete-account/index.html', 'privacy.html', 'delete-account.html']) assert.ok((await readFile(path.join(fixture, 'dist', file))).length > 0);
});
