---
title: "rsync: копія з сервера на ПК"
description: Пробний запуск, копіювання через SSH зі збереженням прогресу та перевірка результату.
category: network
tags: [linux, rsync, ssh, backup, transfer, files]
platforms: [linux, macos]
testedWith: rsync 3.x · OpenSSH
risk: changes-system
updated: 2026-09-16
order: 18
sources:
  - label: rsync — офіційний посібник
    url: https://rsync.samba.org/ftp/rsync/rsync.1
---

## Швидкі команди

```bash
# Пробний запуск (нічого не копіює)
rsync -avzn --itemize-changes <user>@<server>:/path/to/source/ /path/to/destination/

# Копіювати з прогресом
rsync -avz --progress <user>@<server>:/path/to/source/ /path/to/destination/

# Продовжити після переривання
rsync -avz --partial --info=progress2 <user>@<server>:/path/to/source/ /path/to/destination/

# Перевірити результат (контрольні суми, без запису)
rsync -avznc --itemize-changes <user>@<server>:/path/to/source/ /path/to/destination/
```

---

## Перевірити джерело й місце призначення

> **Ризик: безпечно.** Команди нічого не копіюють.

```bash
ssh <user>@<server> 'ls -ld /path/to/source'
df -h /path/to/destination
```

Перевірте, що локальний диск змонтовано і на ньому достатньо місця.

**Параметри:** дивіться деталі вище у блоці команд.

**Перевірка:** SSH відкривається, джерело існує.

## Пробний запуск

> **Ризик: безпечно.** `--dry-run` показує план без передавання файлів.

```bash
rsync -avzn --itemize-changes <user>@<server>:/path/to/source/ /path/to/destination/
```

`/` після `source/` означає «вміст теки»; без неї копіюватиметься сама тека.

**Параметри:** дивіться деталі вище у блоці команд.

**Перевірка:** список файлів і напрямок відповідають очікуваному.

## Скопіювати файли

> **Ризик: змінює систему.** Існуючі локальні файли з тим самим шляхом можуть бути оновлені. Не додавайте `--delete` без окремого плану.

```bash
rsync -avz --progress <user>@<server>:/path/to/source/ /path/to/destination/
```

`-a` — зберігає атрибути, `-v` — показує файли, `-z` — стискає потік.

**Параметри:** дивіться деталі вище у блоці команд.

**Перевірка:** команда завершилась з кодом `0`.

## Продовжити після переривання

> **Ризик: змінює систему.** Повторний запуск синхронізує відсутні або змінені файли.

```bash
rsync -avz --partial --info=progress2 <user>@<server>:/path/to/source/ /path/to/destination/
```

`--partial` зберігає незавершений файл для продовження.

**Параметри:** дивіться деталі вище.

**Перевірка:** перевірте результат виконаної команди.
## Перевірити дані після копії

> **Ризик: безпечно.** `-c` порівнює вміст за контрольними сумами; `-n` нічого не записує.

```bash
rsync -avznc --itemize-changes <user>@<server>:/path/to/source/ /path/to/destination/
```

**Параметри:** дивіться деталі вище у блоці команд.

**Перевірка:** немає файлів, які потрібно повторно скопіювати.
