export const normalize = (value) => String(value ?? '').normalize('NFKC').toLocaleLowerCase('uk').replace(/[’ʼ`]/g, "'").replace(/\s+/g, ' ').trim();

export function rankCards(cards, query) {
  const tokens = normalize(query).split(' ').filter(Boolean);
  if (!tokens.length) return cards;
  return cards.map((card, order) => {
    const title = normalize(card.title);
    const command = normalize(card.command);
    const text = normalize([card.title, card.description, card.command, ...(card.tags ?? []), card.body ?? '', card.category, ...(card.platforms ?? [])].join(' '));
    if (!tokens.every((token) => text.includes(token))) return null;
    const score = tokens.reduce((sum, token) => sum + (title.includes(token) ? 5 : 0) + (command.includes(token) ? 3 : 0), 0);
    return { card, score, order };
  }).filter(Boolean).sort((a, b) => b.score - a.score || a.order - b.order).map((item) => item.card);
}

let indexPromise;
export function loadCards() {
  if (!indexPromise) {
    indexPromise = fetch('/search-index.json').then((response) => {
      if (!response.ok) throw new Error('Не вдалося завантажити пошук.');
      return response.json();
    }).then((index) => index.cards).catch((error) => { indexPromise = undefined; throw error; });
  }
  return indexPromise;
}
export async function searchCards(query) { return rankCards(await loadCards(), query); }
