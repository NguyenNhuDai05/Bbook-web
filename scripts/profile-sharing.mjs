import { readFile } from 'node:fs/promises';

// Apply this rule in Render Dashboard; static hosting does not read this JSON.
export const profileSharingRedirects = JSON.parse(await readFile(new URL('../profile-sharing-redirects.json', import.meta.url), 'utf8'));
export function profileSharingRedirect(pathname) {
  const match = /^\/(mua|posts)\/([a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12})$/i.exec(pathname);
  if (!match) return null;
  const key = match[1].toLowerCase() === 'posts' ? 'postId' : 'muaId';
  const rule = profileSharingRedirects.find(rule => rule.source === `/${match[1].toLowerCase()}/:${key}`);
  return rule ? rule.destination.replace(`:${key}`, match[2]) : null;
}
