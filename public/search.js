import { searchCards } from './card-search.js';
const dialog = document.querySelector('#site-search');
const input = document.querySelector('#search-input');
const results = document.querySelector('#search-results');
let timer;
let request = 0;
function message(text) { results.replaceChildren(); const p = document.createElement('p'); p.className = 'search-empty'; p.textContent = text; results.append(p); }
async function renderSearch(query) {
  const current = ++request;
  if (!query.trim()) { message('Введіть команду, задачу або назву інструмента.'); return; }
  message('Шукаємо…');
  try {
    const cards = await searchCards(query);
    if (current !== request) return;
    results.replaceChildren();
    if (!cards.length) { message('Нічого не знайдено. Спробуйте коротшу фразу.'); return; }
    for (const card of cards.slice(0, 20)) {
      const link = document.createElement('a'); link.className = 'search-result'; link.href = `/cards/${card.id}`;
      const title = document.createElement('strong'); title.textContent = card.title;
      const description = document.createElement('span'); description.textContent = card.description;
      link.append(title, description);
      if (card.command) { const code = document.createElement('code'); code.textContent = card.command; link.append(code); }
      results.append(link);
    }
  } catch { if (current === request) message('Пошук тимчасово недоступний. Спробуйте ще раз.'); }
}
function openSearch() {
  const local = document.querySelector('[data-sheet-search]');
  if (local) { local.focus(); local.scrollIntoView({ block: 'center', behavior: 'smooth' }); return; }
  if (!dialog.open) dialog.showModal();
  input.focus();
}
document.querySelectorAll('[data-open-search]').forEach((button) => button.addEventListener('click', openSearch));
document.querySelector('[data-close-search]')?.addEventListener('click', () => dialog.close());
dialog?.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
document.addEventListener('keydown', (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement) || target.closest('input, textarea, select, [contenteditable="true"]')) return;
  if (event.key === '/' || ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k')) { event.preventDefault(); openSearch(); }
});
input?.addEventListener('input', () => { ++request; clearTimeout(timer); timer = setTimeout(() => renderSearch(input.value), 100); });
document.querySelectorAll('[data-search-suggestion]').forEach((button) => button.addEventListener('click', () => { input.value = button.dataset.searchSuggestion; input.focus(); renderSearch(input.value); }));
