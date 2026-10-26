const menu = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#navigation');
function closeMenu() { menu.setAttribute('aria-expanded', 'false'); menu.setAttribute('aria-label', 'Mở menu'); navigation.classList.remove('open'); }
menu.addEventListener('click', () => { const open = menu.getAttribute('aria-expanded') !== 'true'; menu.setAttribute('aria-expanded', String(open)); menu.setAttribute('aria-label', open ? 'Đóng menu' : 'Mở menu'); navigation.classList.toggle('open', open); });
navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => { if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') { closeMenu(); menu.focus(); } });
document.querySelector('#year').textContent = new Date().getFullYear();
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
