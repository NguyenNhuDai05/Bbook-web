// Điền URL cửa hàng khi ứng dụng được phát hành công khai.
const appLinks = { android: '' };
const menu = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#navigation');
function closeMenu() { menu.setAttribute('aria-expanded', 'false'); menu.setAttribute('aria-label', 'Mở menu'); navigation.classList.remove('open'); }
menu.addEventListener('click', () => { const open = menu.getAttribute('aria-expanded') !== 'true'; menu.setAttribute('aria-expanded', String(open)); menu.setAttribute('aria-label', open ? 'Đóng menu' : 'Mở menu'); navigation.classList.toggle('open', open); });
navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => { if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') { closeMenu(); menu.focus(); } });
document.querySelector('#year').textContent = new Date().getFullYear();
for (const [platform, url] of Object.entries(appLinks)) {
  const link = document.querySelector(`[data-store="${platform}"]`);
  if (url && /^https:\/\//.test(url)) { link.href = url; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.removeAttribute('aria-disabled'); link.querySelector('small').textContent = 'Tải ứng dụng trên'; link.setAttribute('aria-label', 'Tải BBook trên Google Play'); }
  else link.setAttribute('aria-disabled', 'true');
}
const viewer = document.querySelector('.image-viewer');
const viewerImage = viewer.querySelector('.viewer-image');
let previousFocus;
document.querySelectorAll('[data-preview]').forEach(button => button.addEventListener('click', () => {
  const source = button.querySelector('img'); previousFocus = button;
  viewerImage.src = source.src; viewerImage.alt = source.alt;
  viewer.querySelector('.viewer-caption').textContent = source.alt;
  viewer.showModal();
}));
viewer.querySelector('.viewer-close').addEventListener('click', () => viewer.close());
viewer.addEventListener('close', () => { viewerImage.removeAttribute('src'); previousFocus?.focus({ preventScroll: true }); });
viewer.addEventListener('click', event => { const rect = viewer.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) viewer.close(); });
if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const observer = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); } }), { threshold: 0.08 });
  document.querySelectorAll('[data-reveal]').forEach(element => { element.classList.add('reveal-ready'); observer.observe(element); });
}
