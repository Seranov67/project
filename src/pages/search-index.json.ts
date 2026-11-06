import { getCollection } from 'astro:content';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';

export async function GET() {
  const entries = (await getCollection('cheatsheets')).sort((a, b) => a.data.order - b.data.order);
  const cards = await Promise.all(entries.map(async (entry) => {
    const raw = await readFile(resolve('src/content/cheatsheets', `${entry.id}.md`));
    const contentSha = createHash('sha1').update(`blob ${raw.length}\0`).update(raw).digest('hex');
    return {
      id: entry.id, title: entry.data.title, description: entry.data.description,
      category: entry.data.category, platforms: entry.data.platforms, tags: entry.data.tags,
      command: entry.data.quickCmd ?? '', body: entry.body ?? '', contentSha,
    };
  }));
  return new Response(JSON.stringify({ cards }), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
}
