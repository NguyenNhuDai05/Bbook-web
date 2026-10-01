// Điền URL chính thức khi ứng dụng được phát hành.
const appLinks = { ios: '', android: '' };
const menu = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#navigation');
function closeMenu() { menu.setAttribute('aria-expanded', 'false'); navigation.classList.remove('open'); }
menu.addEventListener('click', () => { const open = menu.getAttribute('aria-expanded') !== 'true'; menu.setAttribute('aria-expanded', String(open)); navigation.classList.toggle('open', open); });
navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => { if (event.key === 'Escape') { closeMenu(); menu.focus(); } });
document.querySelector('#year').textContent = new Date().getFullYear();
for (const [platform, url] of Object.entries(appLinks)) {
  const link = document.querySelector(`[data-store="${platform}"]`);
  if (url && /^https:\/\//.test(url)) { link.href = url; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.querySelector('small').textContent = 'Tải ứng dụng trên'; link.setAttribute('aria-label', `Tải BBook trên ${platform === 'ios' ? 'App Store' : 'Google Play'}`); }
  else link.setAttribute('aria-disabled', 'true');
}
