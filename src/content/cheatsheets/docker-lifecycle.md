---
title: "Docker: життєвий цикл контейнера"
description: Образи, запуск, зупинка, виконання команд і контрольоване видалення контейнерів.
category: containers
tags: [docker, containers, run, exec, stop, rm]
platforms: [linux, windows, macos]
testedWith: Docker CLI 28+
risk: destructive
updated: 2026-09-15
order: 5
featured: false
sources:
  - label: Docker CLI — container commands
    url: https://docs.docker.com/reference/cli/docker/container/
  - label: Docker CLI — docker run
    url: https://docs.docker.com/reference/cli/docker/container/run/
---
Контейнер варто вважати відтворюваним процесом, а дані — зберігати у volume або зовнішньому сервісі. Перед видаленням перевірте mounts і потрібність локальних змін.

## Побачити всі контейнери

> **Ризик: безпечно.** Без `-a` Docker приховує зупинені контейнери.

```bash
docker ps -a --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}'
```

**Параметри:** формат залишає поля, потрібні для швидкої діагностики, та не змінює стан.

**Перевірка:** для одного контейнера звірте точний статус через `docker inspect`.

## Завантажити образ і зафіксувати digest

> **Ризик: змінює локальний cache.** Не покладайтеся на mutable-тег у production без контролю digest.

```bash
docker pull <image>:<tag>
docker image inspect <image>:<tag> --format '{{json .RepoDigests}}'
```

**Параметри:** `<image>` містить registry/namespace за потреби; `<tag>` має бути явним.

**Перевірка:** `RepoDigests` повинен містити очікуваний `sha256` із trusted registry.

## Запустити відтворюваний контейнер

> **Ризик: змінює систему.** Публікація порту й mount відкривають доступ до host; не монтуйте Docker socket без крайньої потреби.

```bash
docker run -d --name <name> --restart unless-stopped -p 127.0.0.1:<host-port>:<container-port> <image>:<tag>
```

**Параметри:** binding на `127.0.0.1` не відкриває порт зовнішнім інтерфейсам; `--restart unless-stopped` переживає reboot.

**Перевірка:** контейнер має бути `Up`, а port mapping — відповідати команді.

```bash
docker ps --filter "name=^/<name>$"
docker port <name>
```

## Виконати діагностичну команду всередині

> **Ризик: залежить від команди.** Сам `exec` не перезапускає контейнер, але процес усередині може змінити його файлову систему.

```bash
docker exec -it <container> sh
```

**Параметри:** `-i` тримає stdin, `-t` виділяє terminal; мінімальні образи часто не містять `bash`.

**Перевірка:** виконайте `id` і `pwd`, щоб розуміти користувача та робочий каталог.

## Зупинити з grace period

> **Ризик: змінює систему.** Контейнер отримає сигнал завершення, а після timeout Docker примусово його зупинить.

```bash
docker stop --timeout 30 <container>
```

**Параметри:** 30 секунд мають покривати cleanup застосунку й завершення активних запитів.

**Перевірка:** статус має починатися з `Exited`.

```bash
docker ps -a --filter "name=^/<container>$" --format '{{.Status}}'
```

## Видалити зупинений контейнер

> **Ризик: незворотно.** Буде втрачено writable layer контейнера. Named volumes не видаляються без `-v`, але спершу перевірте mounts.

```bash
docker inspect --format '{{json .Mounts}}' <container>
docker rm <container>
```

**Параметри:** не додавайте `-f`, доки контейнер можна коректно зупинити; не додавайте `-v` без окремого рішення про дані.

**Перевірка:** фільтр не має повертати контейнер.

```bash
docker ps -a --filter "name=^/<container>$" --format '{{.ID}}'
```
