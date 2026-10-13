import { readFile } from 'node:fs/promises';

// Exact rules for Render Dashboard; the local server mirrors these destinations.
// Render does not automatically consume this JSON or a _redirects file.
export const socialRedirects = JSON.parse(await readFile(new URL('../social-redirects.json', import.meta.url), 'utf8'));
const routes = new Map(socialRedirects.map(rule => [rule.source, rule.destination]));
export function socialRedirect(pathname) {
  return routes.get(pathname) || null;
}
