---
title: "systemd: керування службами"
description: Статус, запуск, автозапуск і безпечне застосування змін unit-файлів.
category: services
tags: [systemd, systemctl, service, unit, linux]
platforms: [linux]
testedWith: systemd 255+
risk: changes-system
updated: 2026-09-15
order: 3
featured: true
sources:
  - label: systemctl manual
    url: https://www.freedesktop.org/software/systemd/man/latest/systemctl.html
  - label: systemd.unit manual
    url: https://www.freedesktop.org/software/systemd/man/latest/systemd.unit.html
---
`systemctl` керує unit-ами systemd. Для змін стану зазвичай потрібен `sudo`; спочатку читайте статус і журнал, а вже потім перезапускайте службу.

## Перевірити поточний стан

> **Ризик: безпечно.** Команда нічого не змінює й повертає ненульовий код, якщо unit неактивний.

```bash
systemctl status <service> --no-pager --full
```

**Параметри:** `<service>` — наприклад `nginx.service`; `--full` не обрізає довгі рядки, `--no-pager` одразу повертає prompt.

**Перевірка:** для автоматизації отримайте лише machine-friendly стан.

```bash
systemctl is-active <service>
```

## Запустити або зупинити службу

> **Ризик: змінює систему.** Зупинка може перервати активні запити або залежні процеси.

```bash
sudo systemctl start <service>
sudo systemctl stop <service>
```

**Параметри:** використовуйте повне ім’я з `.service`, якщо в системі є unit-и з однаковою базовою назвою.

**Перевірка:** команда має надрукувати `active` або `inactive` відповідно до очікування.

```bash
systemctl is-active <service>
```

## Перезапустити після зміни конфігурації

> **Ризик: змінює систему.** Перед restart запустіть перевірку конфігурації самого сервісу, якщо вона доступна.

```bash
sudo systemctl restart <service>
```

**Параметри:** `restart` зупиняє й знову запускає unit; для сервісів із підтримкою reload віддавайте перевагу `reload`.

**Перевірка:** звірте стан і найновіші записи журналу.

```bash
systemctl is-active <service> && journalctl -u <service> -n 20 --no-pager
```

## Увімкнути автозапуск

> **Ризик: змінює систему.** Unit запускатиметься під час наступних завантажень; `--now` також запускає його одразу.

```bash
sudo systemctl enable --now <service>
```

**Параметри:** приберіть `--now`, якщо потрібно лише налаштувати наступне завантаження без старту зараз.

**Перевірка:** обидві команди мають повернути позитивний стан.

```bash
systemctl is-enabled <service>
systemctl is-active <service>
```

## Застосувати змінений unit-файл

> **Ризик: змінює систему.** `daemon-reload` перечитує unit-и, але сам по собі не перезапускає сервіс.

```bash
sudo systemctl daemon-reload
sudo systemctl restart <service>
```

**Параметри:** перша команда потрібна після редагування unit-файлу або drop-in; друга застосовує нову конфігурацію до процесу.

**Перевірка:** подивіться об’єднаний unit і переконайтеся, що drop-in підхоплено.

```bash
systemctl cat <service>
```

## Побачити причину невдалого запуску

> **Ризик: безпечно.** Обидві команди лише читають стан і журнал поточного boot.

```bash
systemctl status <service> --no-pager --full
journalctl -u <service> -b -n 80 --no-pager
```

**Параметри:** `-b` обмежує журнал поточним завантаженням; `-n 80` показує останні 80 рядків.

**Перевірка:** після виправлення повторіть запуск і переконайтеся, що `is-failed` повертає ненульовий код.

```bash
sudo systemctl start <service>
! systemctl is-failed <service>
```
