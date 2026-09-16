---
title: Docker logs та inspect
description: Перегляд, фільтрація й діагностика стану контейнера без входу всередину.
category: containers
tags: [docker, logs, inspect, troubleshooting, containers]
platforms: [linux, windows, macos]
testedWith: Docker CLI 28+
risk: safe
updated: 2026-09-15
order: 6
featured: true
quickCmd: "docker logs --tail 100 -f <container>"
sources:
  - label: Docker CLI — docker container logs
    url: https://docs.docker.com/reference/cli/docker/container/logs/
  - label: Docker CLI — docker inspect
    url: https://docs.docker.com/reference/cli/docker/inspect/
---
Використовуйте `docker logs` для потоків stdout/stderr, а `docker inspect` — для фактичної конфігурації та runtime-стану контейнера. Ці команди нічого не змінюють.

## Показати останні логи

> **Ризик: безпечно.** Команда лише читає журнали контейнера.

```bash
docker logs --tail 100 <container>
```

**Параметри:** `<container>` — ім’я або ID контейнера; `--tail 100` обмежує відповідь останніми 100 рядками.

**Перевірка:** переконайтеся, що контейнер існує і його ім’я правильне.

```bash
docker ps -a --filter "name=<container>"
```

## Стежити за новими подіями

> **Ризик: безпечно.** Потік залишається відкритим, доки ви не натиснете `Ctrl+C`.

```bash
docker logs --follow --tail 50 <container>
```

**Параметри:** `--follow` продовжує читання, а `--tail 50` не виводить увесь архів перед підключенням.

**Перевірка:** згенеруйте контрольний запит до сервісу й перевірте, що новий запис з’явився у потоці.

## Додати часові позначки

> **Ризик: безпечно.** Формат часу — RFC3339Nano в UTC.

```bash
docker logs --timestamps --since 30m <container>
```

**Параметри:** `--since 30m` залишає записи лише за останні 30 хвилин; `--timestamps` додає час від Docker daemon.

**Перевірка:** найновіша позначка має відповідати поточному часу з урахуванням UTC.

```bash
date -u
```

## Знайти помилки у короткому вікні

> **Ризик: безпечно.** `grep` фільтрує локальний вивід і не впливає на контейнер.

```bash
docker logs --since 15m <container> 2>&1 | grep -Ei "error|fatal|panic"
```

**Параметри:** `2>&1` об’єднує stderr зі stdout; `-E` вмикає кілька шаблонів, `-i` ігнорує регістр.

**Перевірка:** повторіть без `grep`, якщо порожній результат суперечить симптомам — застосунок може використовувати інші слова або окремий log driver.

## Перевірити стан і код завершення

> **Ризик: безпечно.** Форматований `inspect` читає лише секцію стану.

```bash
docker inspect --format '{{json .State}}' <container>
```

**Параметри:** `.State` містить `Status`, `Running`, `ExitCode`, `OOMKilled`, `StartedAt` і `FinishedAt`.

**Перевірка:** для робочого контейнера очікуйте `"Running":true`; для завершеного процесу перевірте `ExitCode`.

## Побачити фактичні порти й мережі

> **Ризик: безпечно.** Допомагає звірити runtime-конфігурацію з compose-файлом.

```bash
docker inspect --format '{{json .NetworkSettings.Ports}}' <container>
docker inspect --format '{{json .NetworkSettings.Networks}}' <container>
```

**Параметри:** `Ports` показує опубліковані порти, `Networks` — адреси й мережеві aliases.

**Перевірка:** окремо перевірте порт, який слухає host.

```bash
docker port <container>
```
