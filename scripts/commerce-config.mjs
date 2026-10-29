import { writeFile } from 'node:fs/promises';
import path from 'node:path';
export async function writeCommerceConfig(directory) {
  const origin = process.env.MUA_API_ORIGIN || 'https://api.bbookmakeup.com';
  const url = new URL(origin);
  if (!(url.protocol === 'https:' || url.hostname === 'localhost' || url.hostname === '127.0.0.1') || url.username || url.password || url.pathname !== '/' || url.search || url.hash) throw new Error('Invalid MUA_API_ORIGIN');
  await writeFile(path.join(directory, 'commerce-config.js'), `window.BBOOK_COMMERCE_CONFIG = ${JSON.stringify({ apiOrigin: url.origin })};\n`);
}
