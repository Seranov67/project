import { readdir, readFile } from 'node:fs/promises';

const contentDir = new URL('../src/content/cheatsheets/', import.meta.url);
const files = (await readdir(contentDir)).filter((file) => file.endsWith('.md')).sort();
const failures = [];

if (files.length < 12) failures.push(`Перший реліз має містити щонайменше 12 карток; знайдено ${files.length}.`);

for (const file of files) {
  const text = await readFile(new URL(file, contentDir), 'utf8');
  const scenarios = text.match(/^##\s+.+$/gm) ?? [];
  const risks = text.match(/^> \*\*Ризик:/gm) ?? [];
  const parameters = text.match(/\*\*Параметри:\*\*/g) ?? [];
  const verifications = text.match(/\*\*Перевірка:\*\*/g) ?? [];

  if (scenarios.length < 5 || scenarios.length > 8) {
    failures.push(`${file}: потрібно 5–8 сценаріїв; знайдено ${scenarios.length}.`);
  }
  if (risks.length !== scenarios.length) failures.push(`${file}: кожний сценарій повинен мати рівень ризику.`);
  if (parameters.length !== scenarios.length) failures.push(`${file}: кожний сценарій повинен пояснювати параметри.`);
  if (verifications.length !== scenarios.length) failures.push(`${file}: кожний сценарій повинен мати перевірку результату.`);
}

if (failures.length > 0) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(`Content gate: ${files.length} карток відповідають формату OpsCards.`);
