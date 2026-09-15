# OpsCards

Легкий DevOps-first довідник: перевірена команда, рівень ризику, пояснення параметрів і спосіб підтвердити результат на одній сторінці.

## Що входить у перший реліз

- 12 Markdown-карток у шести категоріях: Linux, Services, Containers, Network, Git та Operations;
- 5–8 сценаріїв у кожній картці, deep links і copy button для кожного code block;
- фільтри за категорією та платформою;
- повнотекстовий пошук Pagefind за назвами, командами, тегами й описами;
- Shiki-підсвічування під час build, системна світла/темна тема та print styles;
- статичний output, sitemap, metadata, 404 і конфігурація Vercel.

## Стек

Astro 7 генерує статичний HTML. Content Collections перевіряють frontmatter, Shiki підсвічує код під час build, а Pagefind індексує готові сторінки без сервера, API чи бази даних. Клієнтський JavaScript використовується лише для пошуку, copy, теми та фільтрів.

## Локальний запуск

Потрібен Node.js 22.19 або новіший.

```bash
npm ci
npm run dev
```

У dev-режимі каталог і сторінки працюють одразу. Повнотекстовий пошук потребує готового Pagefind-індексу:

```bash
npm run build
npm run preview
```

## Додавання картки

Створіть файл `src/content/cheatsheets/<slug>.md`. Frontmatter перевіряється схемою з `src/content.config.ts`.

```yaml
---
title: Docker logs
description: Перегляд і фільтрація логів контейнера
category: containers
tags: [docker, logs, troubleshooting]
platforms: [linux, windows, macos]
testedWith: Docker CLI 28+
risk: safe
updated: 2026-09-15
order: 13
featured: false
sources:
  - label: Docker CLI reference
    url: https://docs.docker.com/reference/cli/docker/container/logs/
---
```

Кожний із 5–8 розділів `##` повинен мати блок `Ризик`, пояснення `Параметри` й команду або критерій `Перевірка`. `npm run check` перевіряє цю редакційну угоду та типи.

## Vercel

Підключіть GitHub-репозиторій до Vercel. `vercel.json` фіксує Astro, `npm run build` і каталог `dist`; гілки та pull requests отримують Preview Deployments, а `main` — production deployment. Для власного canonical URL задайте `PUBLIC_SITE_URL` у production environment.

## Структура

```text
src/
├── components/          UI та мінімальні інтеракції
├── content/cheatsheets/ Markdown-картки
├── data/                Категорії й словники
├── layouts/             Спільний HTML layout і metadata
├── pages/               Каталог, категорії, картки, about, 404
└── styles/              Тема, responsive і print CSS
scripts/                 Content/build quality gates
public/                  Favicon, robots і пошуковий runtime
```
