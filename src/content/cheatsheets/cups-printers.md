---
title: "CUPS: принтери й черга"
description: Стан принтерів, доступні опції, друк, черга, скасування job і діагностика служби.
category: operations
tags: [cups, printing, printer, lp, lpstat, linux]
platforms: [linux, macos]
testedWith: CUPS 2.4+
risk: changes-system
updated: 2026-09-15
order: 12
featured: false
sources:
  - label: OpenPrinting CUPS — Command-Line Printing
    url: https://openprinting.github.io/cups/doc/options.html
  - label: OpenPrinting CUPS — lpstat
    url: https://openprinting.github.io/cups/doc/man-lpstat.html
  - label: OpenPrinting CUPS — cancel
    url: https://openprinting.github.io/cups/doc/man-cancel.html
---
У командах використовуйте точне CUPS-ім’я принтера з `lpstat -p`. Перед масовим друком надішліть одну тестову сторінку й перевірте media, duplex і чергу.

## Побачити повний стан CUPS

> **Ризик: безпечно.** Команда показує scheduler, default destination, принтери та jobs.

```bash
lpstat -t
```

**Параметри:** для короткого списку destinations використовуйте `lpstat -e`; для accepted/running стану — `lpstat -p`.

**Перевірка:** scheduler має бути запущений, а потрібний принтер — enabled і accepting requests.

## Переглянути підтримувані опції

> **Ризик: безпечно.** Зірочка біля значення позначає поточний default.

```bash
lpoptions -p <printer> -l
```

**Параметри:** назви опцій і значень залежать від driver/IPP capabilities; не вгадуйте їх.

**Перевірка:** знайдіть потрібні `PageSize`, `InputSlot`, `ColorModel` і `sides` перед друком.

## Встановити default-принтер користувача

> **Ризик: змінює локальні налаштування користувача.** Це не змінює системний default для інших користувачів.

```bash
lpoptions -d <printer>
```

**Параметри:** `<printer>` має точно збігатися з destination CUPS.

**Перевірка:** default destination має змінитися.

```bash
lpstat -d
```

## Надрукувати PDF із явними опціями

> **Ризик: змінює фізичну чергу.** Спочатку використайте невеликий тестовий документ.

```bash
lp -d <printer> -o media=A4 -o sides=two-sided-long-edge -- <file.pdf>
```

**Параметри:** `-d` задає destination; значення `media` і `sides` мають бути серед результатів `lpoptions -l`.

**Перевірка:** команда повертає request ID; знайдіть його у черзі.

```bash
lpstat -o <printer>
```

## Скасувати конкретне завдання

> **Ризик: незворотно для job.** Скасований документ потрібно буде надіслати повторно.

```bash
cancel <printer>-<job-id>
```

**Параметри:** повний request ID беріть із `lpstat -o`, а не складайте з приблизного номера.

**Перевірка:** job має зникнути зі списку not-completed.

```bash
lpstat -W not-completed -o <printer>
```

## Призупинити й повернути принтер

> **Ризик: змінює систему.** Existing jobs залишаться у черзі; потрібні адміністративні права CUPS.

```bash
sudo cupsdisable -r 'Maintenance' <printer>
sudo cupsenable <printer>
```

**Параметри:** reason пояснює користувачам, чому черга зупинена; `cupsenable` відновлює обробку.

**Перевірка:** звірте enabled/disabled state і причину.

```bash
lpstat -p <printer> -l
```

## Діагностувати завислу чергу

> **Ризик: безпечно.** Спочатку збережіть job ID, час і повідомлення про стан.

```bash
lpstat -W not-completed -o
journalctl -u cups -n 100 --no-pager
```

**Параметри:** назва systemd unit може бути `cups.service`; на macOS journalctl недоступний — використовуйте Console або CUPS error_log.

**Перевірка:** після усунення причини job має перейти зі stopped/pending у processing або завершитися.
