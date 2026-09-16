---
title: "Git: відновлення без втрати змін"
description: Скасування stage, stash, reflog, повернення загубленого commit і безпечний revert спільної історії.
category: git
tags: [git, recovery, restore, reflog, stash, revert]
platforms: [linux, windows, macos]
testedWith: Git 2.50+
risk: destructive
updated: 2026-09-15
order: 10
featured: false
quickCmd: "git log --oneline -10 && git stash list"
sources:
  - label: git-restore manual
    url: https://git-scm.com/docs/git-restore
  - label: git-reflog manual
    url: https://git-scm.com/docs/git-reflog
  - label: git-revert manual
    url: https://git-scm.com/docs/git-revert
---
Спочатку зупиніться й створіть точку відновлення. Не запускайте `reset --hard`, `clean -fd` або force push, доки не збережете потрібні зміни й не зрозумієте межі втрати.

## Прибрати файл зі stage

> **Ризик: безпечно для working tree.** Вміст файлу не змінюється — скасовується лише його staged-стан.

```bash
git restore --staged -- <path>
```

**Параметри:** `--` відокремлює шлях від опцій; можна вказати кілька явних шляхів.

**Перевірка:** зміна має перейти з лівої колонки status у праву.

```bash
git status --short
```

## Тимчасово сховати tracked і untracked зміни

> **Ризик: змінює working tree.** Після stash перевірте, що запис створено, перш ніж робити інші операції.

```bash
git stash push --include-untracked -m '<reason>'
```

**Параметри:** `--include-untracked` додає нові файли, але не ignored-файли.

**Перевірка:** запис має бути першим у списку, а tree — чистим.

```bash
git stash list -n 3
git status --short
```

## Повернути stash без його видалення

> **Ризик: змінює working tree.** `apply` безпечніший за `pop`, бо залишає резервну копію у stash list.

```bash
git stash apply stash@{0}
```

**Параметри:** перевірте номер через `git stash list`; shell PowerShell приймає цей аргумент без пробілів.

**Перевірка:** перегляньте status і diff; видаляйте stash лише після повної перевірки.

## Знайти попереднє положення HEAD

> **Ризик: безпечно.** Reflog локальний і показує переміщення refs, включно з rebase та reset.

```bash
git reflog --date=iso --decorate -n 30
```

**Параметри:** шукайте commit до помилкової операції за часом, повідомленням і hash.

**Перевірка:** прочитайте commit, не перемикаючи гілку.

```bash
git show --stat --oneline <commit>
```

## Закріпити загублений commit новою гілкою

> **Ризик: змінює локальні refs, але не файли поточної гілки.** Це безпечна точка перед подальшим відновленням.

```bash
git branch recovery/<short-name> <commit>
```

**Параметри:** `<commit>` беріть лише з перевіреного `reflog`/`show`.

**Перевірка:** нова ref має вказувати на потрібний hash.

```bash
git log -1 --oneline recovery/<short-name>
```

## Скасувати спільний commit новим commit

> **Ризик: змінює історію, але не переписує її.** Для вже опублікованої гілки це безпечніше за reset і force push.

```bash
git revert --no-commit <commit>
git diff --cached
git commit -m 'revert: <reason>'
```

**Параметри:** `--no-commit` дає перевірити результат до створення commit; для merge-commit потрібне окреме рішення про mainline.

**Перевірка:** запустіть тести й перегляньте сумарний diff до push.

## Відкинути локальні зміни одного файла

> **Ризик: незворотно.** Незакомічені зміни цього файла буде втрачено. Спершу скопіюйте diff або зробіть stash.

```bash
git diff -- <path>
git restore --source=HEAD --worktree -- <path>
```

**Параметри:** команда торкається лише явного `<path>` і не змінює staged-версію файла.

**Перевірка:** unstaged diff для цього шляху має бути порожнім.

```bash
git diff -- <path>
```
