import { access, readdir, readFile } from 'node:fs/promises';

const contentDir = new URL('../src/content/cheatsheets/', import.meta.url);
const files = (await readdir(contentDir)).filter((file) => file.endsWith('.md'));
const required = [
  new URL('../dist/index.html', import.meta.url),
  new URL('../dist/about/index.html', import.meta.url),
  new URL('../dist/404.html', import.meta.url),
  new URL('../dist/pagefind/pagefind.js', import.meta.url),
  new URL('../dist/sitemap-index.xml', import.meta.url),
  ...files.map((file) => new URL(`../dist/cards/${file.replace(/\.md$/, '')}/index.html`, import.meta.url)),
];

await Promise.all(required.map((path) => access(path)));

for (const file of files) {
  const route = new URL(`../dist/cards/${file.replace(/\.md$/, '')}/index.html`, import.meta.url);
  const html = await readFile(route, 'utf8');
  if (!html.includes('data-pagefind-body')) throw new Error(`${file}: сторінка не позначена для Pagefind.`);
  if (!html.includes('Копіювати команду')) throw new Error(`${file}: відсутній copy-контрол.`);
}

console.log(`Build gate: ${files.length} маршрутів, sitemap і Pagefind-артефакти присутні.`);
