---
title: "Grafana Loki: практичні LogQL-запити"
description: Вибір stream, текстові й regex-фільтри, JSON-поля та метрики з логів у Grafana Explore.
category: operations
tags: [grafana, loki, logql, logs, observability, troubleshooting]
platforms: [linux, windows, macos]
testedWith: Grafana 12 · Loki 3
risk: safe
updated: 2026-09-15
order: 11
featured: true
quickCmd: "logcli query '{job=\"systemd\"}' --limit 50"
sources:
  - label: Grafana Loki — LogQL
    url: https://grafana.com/docs/loki/latest/query/
  - label: Grafana Loki — Query examples
    url: https://grafana.com/docs/loki/latest/query/query_examples/
---
Спочатку звужуйте stream точними labels, а потім застосовуйте line filters і parser. Широкі regex-запити на довгому діапазоні коштують дорожче та дають більше шуму.

## Вибрати stream за точними labels

> **Ризик: безпечно.** Запит лише читає логи; починайте з короткого time range.

```text
{cluster="prod", namespace="payments", app="api"}
```

**Параметри:** labels індексуються; використовуйте стабільні низькокардинальні поля на кшталт cluster, namespace та app.

**Перевірка:** у Explore відкрийте label browser і звірте, що вибрані labels існують у потрібному datasource.

## Залишити рядки з текстом

> **Ризик: безпечно.** Точний line filter дешевший і зрозуміліший за regex.

```text
{app="api"} |= "error" != "/health"
```

**Параметри:** `|=` залишає рядки з `error`, `!=` відкидає health-check шум; порівняння чутливе до регістру.

**Перевірка:** тимчасово приберіть другий фільтр і оцініть, скільки подій він виключає.

## Знайти кілька варіантів через regex

> **Ризик: безпечно, але дорожче.** Спершу звузьте labels і time range.

```text
{app="api"} |~ "(?i)timeout|deadline exceeded|connection reset"
```

**Параметри:** `|~` застосовує регулярний вираз; `(?i)` вмикає нечутливість до регістру.

**Перевірка:** перегляньте representative рядки, щоб regex не захоплював звичайні повідомлення.

## Розібрати JSON і відфільтрувати статус

> **Ризик: безпечно.** Parser працює під час query й не змінює збережені логи.

```text
{app="api"} | json | __error__="" | status >= 500
```

**Параметри:** `| json` витягує поля; `__error__=""` прибирає рядки, які не вдалося розібрати.

**Перевірка:** додайте `| line_format "{{.status}} {{.method}} {{.path}}"`, щоб перевірити extracted labels.

## Порахувати події за рівнем

> **Ризик: безпечно.** Metric query рахує кількість рядків у sliding window.

```text
sum by (level) (
  count_over_time({app="api"} | json | __error__="" [5m])
)
```

**Параметри:** `[5m]` — вікно агрегації; `sum by (level)` групує серії за витягнутим JSON-полем.

**Перевірка:** переключіть Explore у режим time series і звірте пік із сирими логами того самого інтервалу.

## Побачити найшумніші HTTP-шляхи

> **Ризик: безпечно.** Висококардинальні raw URL краще нормалізувати в застосунку до route template.

```text
topk(10,
  sum by (path) (
    count_over_time({app="nginx"} | json | __error__="" [5m])
  )
)
```

**Параметри:** `topk(10, …)` залишає десять найбільших серій; поле `path` має бути присутнім у JSON.

**Перевірка:** переконайтеся, що query не групує за query string або унікальним ID.
