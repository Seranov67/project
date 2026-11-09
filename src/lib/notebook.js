import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parse } from 'yaml';

const cardsDir = resolve('src/content/cheatsheets');
const editsDir = resolve('src/data/notebook-notes');
const books = ['workstations', 'servers', 'network', 'files', 'deploy'];
const platforms = ['linux', 'windows', 'macos'];
const defaultBooks = {
  windows: 'workstations', services: 'servers', containers: 'servers',
  linux: 'files', network: 'network', operations: 'deploy', git: 'deploy',
};
const bookOverrides = {
  'cups-printers': 'workstations',
  'guardant-network-license': 'workstations',
  'linux-processes-disks': 'servers',
  'grafana-loki': 'servers',
  'rsync-remote-copy': 'files',
};

export const noteIdPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*--(?:\d+|[a-f0-9]{16})$|^local-[a-f0-9-]{36}$/;
export const blobSha = (raw) => createHash('sha1').update('blob ' + raw.length + '\0').update(raw).digest('hex');

function splitSections(body) {
  const sections = [];
  let current;
  let fence = '';
  for (const line of body.split(/\r?\n/)) {
    const delimiter = line.match(/^\s*([`~]{3,})/);
    if (delimiter) {
      if (!fence) fence = delimiter[1][0];
      else if (fence === delimiter[1][0]) fence = '';
    }
    const heading = !fence && line.match(/^## (.+)$/);
    if (heading) {
      current = { title: heading[1].trim(), lines: [] };
      sections.push(current);
    } else if (current) {
      current.lines.push(line);
    }
  }
  return sections.filter((section) => section.title !== 'Швидкі команди');
}

export function readCardNotes(id, data, body, symptoms) {
  const base = {
    book: bookOverrides[id] ?? defaultBooks[data.category] ?? 'servers',
    originId: id,
    originTitle: data.title,
    platforms: data.platforms,
    tags: data.tags ?? [],
    sources: data.sources ?? [],
    revision: '',
  };
  const sections = splitSections(body);
  if (!sections.length) {
    return [{ ...base, id: id + '--0', title: data.title, command: data.quickCmd ?? '',
      lang: '', description: body.trim() || data.description, symptoms: symptoms[id + '--0'] ?? [] }];
  }
  return sections.map(({ title, lines }) => {
    let description = lines.join('\n');
    const marker = description.match(/^\s*<!-- opscards-note: (\d+) -->[ \t]*\n?/);
    const suffix = marker?.[1] ?? createHash('sha256').update(title).digest('hex').slice(0, 16);
    const noteId = id + '--' + suffix;
    if (marker) description = description.slice(marker[0].length);
    const block = description.match(/^```([^\r\n]*)\r?\n([\s\S]*?)^```[ \t]*$/m);
    if (block) description = description.replace(block[0], '');
    description = description.replace(/^---[ \t]*$/gm, '')
      .replace(/^\*\*Параметри:\*\* [Дд]ивіться деталі вище[^\n]*\n?/gm, '')
      .replace(/^\*\*Перевірка:\*\* [Пп]еревірте результат виконаної команди\.\n?/gm, '').trim();
    return { ...base, id: noteId, title, description: description || data.description,
      command: block?.[2].trim() ?? '', lang: block?.[1].trim() ?? '', symptoms: symptoms[noteId] ?? [] };
  });
}

function text(value, max) {
  return typeof value === 'string' && value.length <= max;
}

export function validateNotebookNote(note, id) {
  if (!note || note.id !== id || !noteIdPattern.test(id) ||
      !text(note.title, 200) || !note.title.trim() || !books.includes(note.book) ||
      !text(note.command, 4000) || !text(note.description, 8000) ||
      !(note.command.trim() || note.description.trim()) ||
      !text(note.originId, 100) || !text(note.originTitle, 200) || !text(note.lang, 50) ||
      !Array.isArray(note.platforms) || note.platforms.some((platform) => !platforms.includes(platform)) ||
      !Array.isArray(note.tags) || note.tags.length > 64 || note.tags.some((tag) => !text(tag, 100)) ||
      !Array.isArray(note.symptoms) || note.symptoms.some((phrase) => !text(phrase, 2000) || !phrase.trim() || /[\r\n]/.test(phrase)) ||
      note.symptoms.join('\n').length > 2000 ||
      !Array.isArray(note.sources) || note.sources.length > 30 ||
      note.sources.some((source) => !source || !text(source.label, 200) || !text(source.url, 1000) || !/^https?:\/\//i.test(source.url))) {
    throw new Error('Перевірте довжину та формат полів нотатки.');
  }
  const { title, book, command, description, originId, originTitle, lang, symptoms, sources, tags } = note;
  return { id, title, book, command, description, originId, originTitle, lang,
    symptoms, sources: sources.map(({ label, url }) => ({ label, url })), tags, platforms: note.platforms };
}

export async function notebookRecords() {
  const symptoms = JSON.parse(await readFile(resolve('src/data/notebook-symptoms.json'), 'utf8'));
  const files = (await readdir(cardsDir)).filter((file) => file.endsWith('.md'));
  const cards = await Promise.all(files.map(async (file) => {
    const raw = await readFile(resolve(cardsDir, file), 'utf8');
    const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/);
    if (!match) throw new Error('Некоректний заголовок картки: ' + file);
    return { id: file.slice(0, -3), data: parse(match[1]), body: match[2] };
  }));
  cards.sort((a, b) => (a.data.order ?? 9999) - (b.data.order ?? 9999));
  const notes = new Map();
  for (const card of cards) {
    for (const note of readCardNotes(card.id, card.data, card.body, symptoms)) {
      if (notes.has(note.id)) throw new Error('Дублікат ідентифікатора нотатки: ' + note.id);
      notes.set(note.id, note);
    }
  }

  const edits = await readdir(editsDir).catch((error) => {
    if (error.code === 'ENOENT') return [];
    throw error;
  });
  for (const file of edits.filter((name) => name.endsWith('.json')).sort()) {
    const raw = await readFile(resolve(editsDir, file));
    const note = validateNotebookNote(JSON.parse(raw.toString('utf8')), file.slice(0, -5));
    notes.set(note.id, { ...note, revision: blobSha(raw) });
  }
  return [...notes.values()];
}
