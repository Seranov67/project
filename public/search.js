const dialog = document.querySelector('#site-search');
const input = document.querySelector('#search-input');
const results = document.querySelector('#search-results');
let pagefind;
let timer;

const setMessage = (message, symbol = '⌘') => {
  if (!results) return;
  results.replaceChildren();
  const empty = document.createElement('div');
  empty.className = 'search-empty';
  const icon = document.createElement('span');
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = symbol;
  const text = document.createElement('p');
  text.textContent = message;
  empty.append(icon, text);
  results.append(empty);
};

const loadPagefind = async () => {
  if (pagefind) return pagefind;
  pagefind = await import('/pagefind/pagefind.js');
  await pagefind.init();
  return pagefind;
};

const renderSearch = async (query) => {
  if (!results) return;
  if (query.trim().length < 2) {
    setMessage('Введіть щонайменше два символи.');
    return;
  }

  setMessage('Шукаємо у перевірених картках…', '…');
  try {
    const engine = await loadPagefind();
    const search = await engine.search(query.trim());
    const items = await Promise.all(search.results.slice(0, 8).map((item) => item.data()));
    results.replaceChildren();

    if (items.length === 0) {
      setMessage('Нічого не знайдено. Спробуйте назву інструмента або коротшу фразу.', '∅');
      return;
    }

    for (const item of items) {
      const link = document.createElement('a');
      link.className = 'search-result';
      link.href = item.url.length > 1 ? item.url.replace(/\/$/, '') : item.url;
      const title = document.createElement('strong');
      title.textContent = item.meta?.title ?? item.url;
      const excerpt = document.createElement('span');
      const parsed = new DOMParser().parseFromString(item.excerpt ?? '', 'text/html');
      excerpt.textContent = parsed.body.textContent?.replace(/\s+/g, ' ').trim() ?? '';
      link.append(title, excerpt);
      results.append(link);
    }
  } catch (error) {
    console.warn('OpsCards search is unavailable', error);
    setMessage('Пошуковий індекс доступний у зібраній версії сайту.', '!');
  }
};

const openSearch = () => {
  if (!dialog?.open) dialog?.showModal();
  window.setTimeout(() => input?.focus(), 30);
  loadPagefind().catch(() => undefined);
};

document.querySelectorAll('[data-open-search]').forEach((button) => button.addEventListener('click', openSearch));
document.querySelector('[data-close-search]')?.addEventListener('click', () => dialog?.close());
dialog?.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
document.addEventListener('keydown', (event) => {
  const target = event.target;
  if (event.key === '/' && target instanceof HTMLElement && !target.matches('input, textarea, select, [contenteditable="true"]')) {
    event.preventDefault();
    openSearch();
  }
});
input?.addEventListener('input', () => {
  window.clearTimeout(timer);
  timer = window.setTimeout(() => renderSearch(input.value), 160);
});
