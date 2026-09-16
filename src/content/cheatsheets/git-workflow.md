---
title: "Git: щоденний workflow"
description: Перевірка змін, синхронізація, окрема гілка, точковий stage, commit і перший push.
category: git
tags: [git, branch, diff, commit, push, rebase]
platforms: [linux, windows, macos]
testedWith: Git 2.50+
risk: changes-system
updated: 2026-09-15
order: 9
featured: true
quickCmd: 'git status && git add -p && git commit -m "feat: ..."'
sources:
  - label: Git reference
    url: https://git-scm.com/docs
  - label: Pro Git — Git Branching
    url: https://git-scm.com/book/en/v2/Git-Branching-Branches-in-a-Nutshell
---
Надійний цикл починається з `status` і review diff. Комітьте одну логічну зміну, а перед push синхронізуйтеся з remote без переписування чужої історії.

## Побачити стан без зайвого шуму

> **Ризик: безпечно.** Короткий формат зручний і для людини, і для скрипта.

```bash
git status --short --branch
```

**Параметри:** перші два символи показують стан index і working tree; `??` означає untracked-файл.

**Перевірка:** перед перемиканням гілки переконайтеся, що розумієте кожний рядок.

## Переглянути unstaged і staged diff

> **Ризик: безпечно.** Обидві команди лише читають зміни.

```bash
git diff --check
git diff
git diff --cached
```

**Параметри:** `--check` ловить conflict markers і помилки whitespace; `--cached` показує саме майбутній commit.

**Перевірка:** перед commit у staged diff не повинно бути секретів, generated output чи випадкових файлів.

## Оновити дані про remote

> **Ризик: безпечно для working tree.** `fetch --prune` оновлює remote-tracking refs і прибирає застарілі посилання.

```bash
git fetch --prune origin
```

**Параметри:** команда не merge-ить і не rebase-ить поточну гілку.

**Перевірка:** подивіться розбіжність із upstream.

```bash
git status --short --branch
git log --oneline --left-right HEAD...@{upstream}
```

## Створити окрему робочу гілку

> **Ризик: змінює локальні refs.** Створюйте гілку від явно перевіреної бази.

```bash
git switch -c <branch-name>
```

**Параметри:** `<branch-name>` має коротко описувати одну зміну, наприклад `feat/log-search`.

**Перевірка:** зірочка має стояти біля нової гілки.

```bash
git branch --show-current
```

## Додати лише потрібні фрагменти

> **Ризик: змінює index.** Working tree не переписується; невдалий stage можна безпечно скасувати.

```bash
git add --patch -- <path>
```

**Параметри:** у prompt `y` додає hunk, `n` пропускає, `s` намагається розділити його на менші частини.

**Перевірка:** прочитайте staged diff повністю.

```bash
git diff --cached --check && git diff --cached
```

## Створити commit і опублікувати гілку

> **Ризик: змінює історію та remote.** Push робить commit видимим іншим учасникам репозиторію.

```bash
git commit -m '<type>: <short imperative summary>'
git push --set-upstream origin HEAD
```

**Параметри:** `--set-upstream` зв’язує локальну гілку з remote; `HEAD` не вимагає дублювати її ім’я.

**Перевірка:** status має показати clean tree і синхронізацію з upstream.

```bash
git status --short --branch
```
