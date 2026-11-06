import { searchCards } from './card-search.js';

const sheet = document.querySelector('[data-sheet]');
const query = sheet?.querySelector('[data-sheet-search]');
const entries = Array.from(sheet?.querySelectorAll('[data-sheet-entry]') ?? []);
const groups = Array.from(sheet?.querySelectorAll('[data-sheet-group]') ?? []);
let tab = 'all';
let request = 0;
let timer;

async function applyFilters() {
  const current = ++request;
  const value = query.value.trim();
  let matches;
  if (value) {
    sheet.querySelector('[data-sheet-count]').textContent = 'Шукаємо…';
    try { matches = new Set((await searchCards(value)).map((card) => card.id)); }
    catch {
      if (current === request) sheet.querySelector('[data-sheet-count]').textContent = 'Пошук тимчасово недоступний. Спробуйте ще раз.';
      return;
    }
  }
  if (current !== request) return;
  let count = 0;
  for (const entry of entries) {
    const platform = tab === 'all' || (tab === 'shortcuts' ? entry.dataset.shortcuts === 'true' : entry.dataset.platforms.split(',').includes(tab));
    entry.hidden = !platform || (matches && !matches.has(entry.dataset.cardId));
    if (!entry.hidden) count++;
  }
  for (const group of groups) {
    const visible = Array.from(group.querySelectorAll('[data-sheet-entry]')).filter((entry) => !entry.hidden).length;
    group.hidden = visible === 0;
    group.querySelector('[data-group-count]').textContent = String(visible);
  }
  sheet.querySelector('[data-sheet-count]').textContent = `${count} карток${value ? ' знайдено' : ''}`;
  sheet.querySelector('[data-sheet-empty]').hidden = count > 0;
  sheet.querySelector('[data-sheet-reset]').hidden = !value && tab === 'all';
}

if (sheet) {
  query.addEventListener('input', () => { ++request; clearTimeout(timer); timer = setTimeout(applyFilters, 100); });
  sheet.querySelectorAll('[data-sheet-tab]').forEach((button) => button.addEventListener('click', () => {
    tab = button.dataset.sheetTab;
    sheet.querySelectorAll('[data-sheet-tab]').forEach((other) => other.setAttribute('aria-pressed', String(other === button)));
    applyFilters();
  }));
  sheet.querySelector('[data-sheet-reset]').addEventListener('click', () => {
    tab = 'all'; query.value = '';
    sheet.querySelectorAll('[data-sheet-tab]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.sheetTab === 'all')));
    applyFilters(); query.focus();
  });
  const htmlCache = new Map();
  async function loadDetails(details) {
    const container = details.querySelector('[data-detail-content]');
    if (details.dataset.loaded || details.dataset.loading) return;
    details.dataset.loading = 'true';
    container.textContent = 'Завантажуємо пояснення…';
    try {
      const id = details.dataset.cardDetails;
      let html = htmlCache.get(id);
      if (!html) {
        const response = await fetch(`/cards/${encodeURIComponent(id)}/`);
        if (!response.ok) throw new Error('Load failed');
        const doc = new DOMParser().parseFromString(await response.text(), 'text/html');
        const prose = doc.querySelector('.cheat-main > .prose');
        if (!prose) throw new Error('Missing content');
        html = prose.innerHTML + (doc.querySelector('.source-panel')?.outerHTML ?? '');
        htmlCache.set(id, html);
      }
      container.innerHTML = html;
      container.querySelectorAll('pre').forEach((pre) => {
        const code = pre.querySelector('code');
        if (!code) return;
        const button = document.createElement('button'); button.type = 'button'; button.className = 'copy-button';
        button.textContent = 'Копіювати'; button.dataset.copyCommand = code.textContent;
        button.setAttribute('aria-label', 'Копіювати команду'); pre.append(button);
      });
      container.querySelectorAll('[id]').forEach((element) => { element.id = `${id}-${element.id}`; });
      container.querySelectorAll('a[href^="#"]').forEach((link) => { link.href = `#${id}-${link.getAttribute('href').slice(1)}`; });
      details.dataset.loaded = 'true';
    } catch {
      container.replaceChildren();
      const message = document.createElement('p'); message.textContent = 'Не вдалося завантажити пояснення.';
      const retry = document.createElement('button'); retry.type = 'button'; retry.textContent = 'Повторити';
      retry.addEventListener('click', () => loadDetails(details));
      const link = document.createElement('a'); link.href = `/cards/${encodeURIComponent(details.dataset.cardDetails)}`; link.textContent = 'Відкрити інструкцію';
      container.append(message, retry, ' ', link);
    } finally { delete details.dataset.loading; }
  }
  sheet.querySelectorAll('[data-card-details]').forEach((details) => details.addEventListener('toggle', () => { if (details.open) loadDetails(details); }));
  const oldId = location.hash.slice(1).replace(/^card-total-commander-files$/, 'card-midnight-commander-files');
  if (oldId.startsWith('card-')) {
    const target = document.getElementById(oldId);
    if (target) {
      const details = target.querySelector('[data-card-details]');
      if (details) details.open = true;
      requestAnimationFrame(() => target.scrollIntoView({ block: 'start' }));
    }
  }
}

document.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-copy-command]');
  if (!button) return;
  const label = button.textContent;
  try { await navigator.clipboard.writeText(button.dataset.copyCommand); button.textContent = 'Скопійовано'; }
  catch { button.textContent = 'Виділіть текст'; }
  setTimeout(() => { button.textContent = label; }, 1600);
});
