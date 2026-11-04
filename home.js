'use strict';
document.getElementById('year').textContent = new Date().getFullYear();
const menu = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav');
function closeMenu() { nav.classList.remove('menu-open'); menu.setAttribute('aria-expanded', 'false'); }
menu.addEventListener('click', () => { const open = menu.getAttribute('aria-expanded') !== 'true'; nav.classList.toggle('menu-open', open); menu.setAttribute('aria-expanded', String(open)); });
document.querySelectorAll('#main-nav a').forEach(a => a.addEventListener('click', closeMenu));
document.addEventListener('click', event => { if (!nav.contains(event.target)) closeMenu(); });
document.addEventListener('keydown', event => { if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') { closeMenu(); menu.focus(); } });
addEventListener('resize', () => { if (innerWidth > 800) closeMenu(); });
document.querySelectorAll('[data-note-filter]').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('[data-note-filter]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  let count = 0;
  document.querySelectorAll('[data-note-category]').forEach(note => { note.hidden = button.dataset.noteFilter !== 'all' && note.dataset.noteCategory !== button.dataset.noteFilter; if (!note.hidden) count++; });
  document.getElementById('note-status').textContent = `显示 ${count} 篇${button.dataset.noteFilter === 'all' ? '记录' : button.dataset.noteFilter}`;
}));
const share = document.getElementById('share-note');
share?.addEventListener('click', async () => {
  const status = document.getElementById('share-status');
  const url = new URL(location.href); url.search = ''; url.hash = '';
  try { await navigator.clipboard.writeText(url.href); status.textContent = '文章链接已复制。'; }
  catch { status.textContent = `请复制此链接：${url.href}`; }
});
