import { readFile } from 'node:fs/promises';

// Apply this rule in Render Dashboard; static hosting does not read this JSON.
export const profileSharingRedirects = JSON.parse(await readFile(new URL('../profile-sharing-redirects.json', import.meta.url), 'utf8'));
export function profileSharingRedirect(pathname) {
  const match = /^\/mua\/([a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12})$/i.exec(pathname);
  return match ? profileSharingRedirects[0].destination.replace(':muaId', match[1]) : null;
}
