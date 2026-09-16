import { readdir, readFile } from 'node:fs/promises';

const contentDir = new URL('../src/content/cheatsheets/', import.meta.url);
const files = (await readdir(contentDir)).filter((file) => file.endsWith('.md')).sort();
const failures = [];

if (files.length < 12) failures.push(`Перший реліз має містити щонайменше 12 карток; знайдено ${files.length}.`);

for (const file of files) {
  const text = await readFile(new URL(file, contentDir), 'utf8');
  // "Швидкі команди" — службова секція без обов'язкових полів формату
  const allHeadings = text.match(/^##\s+.+$/gm) ?? [];
  const scenarios = allHeadings.filter((h) => !/^##\s+Швидкі команди\s*$/.test(h));
  const risks = text.match(/^> \*\*Ризик:/gm) ?? [];
  const parameters = text.match(/\*\*Параметри:\*\*/g) ?? [];
  const verifications = text.match(/\*\*Перевірка:\*\*/g) ?? [];
  const privateData = [
    /\b(?:10\.\d{1,3}|192\.168|172\.(?:1[6-9]|2\d|3[01]))\.\d{1,3}\.\d{1,3}\b/i,
    /\b[a-z0-9-]+(?:\.[a-z0-9-]+)*\.local\b/i,
    /\b(?:[0-9a-f]{2}:){5}[0-9a-f]{2}\b/i,
    /\b(?:--pass(?:word)?|ansible_(?:ssh_)?pass(?:word)?)\s*(?:=|\s+)\s*\S+/i,
  ];

  if (scenarios.length < 4 || scenarios.length > 8) {
    failures.push(`${file}: потрібно 4–8 сценаріїв (без «Швидкі команди»); знайдено ${scenarios.length}.`);
  }
  if (risks.length !== scenarios.length) failures.push(`${file}: кожний сценарій повинен мати рівень ризику.`);
  if (parameters.length !== scenarios.length) failures.push(`${file}: кожний сценарій повинен пояснювати параметри.`);
  if (verifications.length !== scenarios.length) failures.push(`${file}: кожний сценарій повинен мати перевірку результату.`);
  if (privateData.some((pattern) => pattern.test(text))) failures.push(`${file}: можливі внутрішня адреса, MAC або пароль у публічному контенті.`);
}

if (failures.length > 0) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(`Content gate: ${files.length} карток відповідають формату OpsCards.`);
