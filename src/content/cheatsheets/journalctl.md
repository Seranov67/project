---
title: "journalctl: журнали systemd"
description: Фільтрація журналів за unit, часом, boot і рівнем помилки та контроль розміру архіву.
category: services
tags: [systemd, journalctl, logs, boot, troubleshooting]
platforms: [linux]
testedWith: systemd 255+
risk: changes-system
updated: 2026-09-15
order: 4
featured: false
quickCmd: "journalctl -u <service> -n 100 --no-pager"
sources:
  - label: journalctl manual
    url: https://www.freedesktop.org/software/systemd/man/latest/journalctl.html
  - label: journald.conf manual
    url: https://www.freedesktop.org/software/systemd/man/latest/journald.conf.html
---
`journalctl` читає структурований systemd journal. Поєднуйте unit, часовий діапазон і boot, щоб не шукати помилку в усьому архіві.

## Показати останні записи unit

> **Ризик: безпечно.** Команда лише читає журнал.

```bash
journalctl -u <service> -n 100 --no-pager
```

**Параметри:** `-u` фільтрує unit, `-n 100` залишає останні 100 подій.

**Перевірка:** додайте `--output=short-iso-precise`, якщо потрібно точно зіставити час із зовнішньою системою.

## Стежити за новими записами

> **Ризик: безпечно.** Потік завершується через `Ctrl+C`.

```bash
journalctl -u <service> -f
```

**Параметри:** `-f` працює як follow; додайте `-n 30`, щоб перед підключенням побачити короткий контекст.

**Перевірка:** виконайте контрольну дію сервісу й перевірте появу нового запису.

## Обмежити поточним завантаженням

> **Ризик: безпечно.** Корисно, коли старі помилки вже не стосуються поточного boot.

```bash
journalctl -b -u <service> --no-pager
```

**Параметри:** `-b` без аргументу означає поточне завантаження; `-b -1` — попереднє.

**Перевірка:** перегляньте доступні boot та їхні часові межі.

```bash
journalctl --list-boots
```

## Знайти помилки високого пріоритету

> **Ризик: безпечно.** Діапазон `0..3` включає emergency, alert, critical і error.

```bash
journalctl -b -p 0..3 --no-pager
```

**Параметри:** додайте `-u <service>`, щоб залишити помилки одного unit.

**Перевірка:** розширте діапазон до `0..4`, якщо потрібні також warning.

## Вибрати точний часовий діапазон

> **Ризик: безпечно.** Локальний часовий пояс застосовується, якщо offset не вказано.

```bash
journalctl -u <service> --since '2026-09-15 14:00:00' --until '2026-09-15 14:15:00' --no-pager
```

**Параметри:** обидві межі включні; для оперативної роботи допустимі значення `-1h`, `today` або `yesterday`.

**Перевірка:** додайте `-o short-iso`, щоб кожний рядок показував однозначний час.

## Оцінити й звільнити місце journal

> **Ризик: незворотно.** Vacuum видаляє архівні journal-файли; потрібні події спочатку експортуйте.

```bash
journalctl --disk-usage
sudo journalctl --rotate --vacuum-size=1G
```

**Параметри:** `--rotate` спершу закриває активні файли, `--vacuum-size=1G` залишає архіви в заданому ліміті.

**Перевірка:** повторний звіт має показати менше використаного місця.

```bash
journalctl --disk-usage
```
