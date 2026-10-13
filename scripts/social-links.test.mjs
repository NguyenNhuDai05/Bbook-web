import test from 'node:test';
import assert from 'node:assert/strict';
import { socialRedirect, socialRedirects } from './social-links.mjs';

test('three exact social routes preserve all fixed UTM parameters on same origin', () => {
  assert.equal(socialRedirects.length, 3);
  for (const [pathname, source] of [['/fb', 'facebook'], ['/tt', 'tiktok'], ['/threads', 'threads']]) {
    const destination = socialRedirect(pathname);
    assert.equal(destination, `/?utm_source=${source}&utm_medium=social&utm_campaign=bbook_launch`);
    assert.ok(destination.startsWith('/?'));
    const url = new URL(destination, 'https://bbookmakeup.com');
    assert.equal(url.origin, 'https://bbookmakeup.com');
    assert.equal(url.pathname, '/');
    assert.deepEqual([...url.searchParams], [['utm_source', source], ['utm_medium', 'social'], ['utm_campaign', 'bbook_launch']]);
    assert.equal(socialRedirect(url.pathname), null); // Destination is never a redirect source.
    assert.equal(socialRedirects.find(rule => rule.source === pathname).type, 'redirect');
  }
});
test('homepage, existing pages/assets and similar paths are never redirected', () => {
  for (const pathname of ['/', '/privacy', '/privacy/', '/delete-account', '/delete-account/', '/assets/downloads/bbook-android.apk', '/analytics.js', '/facebook', '/fb/other', '/tt/other', '/threads/other', '/not-found']) assert.equal(socialRedirect(pathname), null);
});
