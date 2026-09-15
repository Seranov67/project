---
title: SSH і SCP
description: Підключення, ключі, effective-конфігурація, port forwarding і передавання файлів.
category: network
tags: [ssh, scp, openssh, keys, tunnel, network]
platforms: [linux, windows, macos]
testedWith: OpenSSH 9+
risk: changes-system
updated: 2026-09-15
order: 7
featured: true
sources:
  - label: OpenBSD manual — ssh
    url: https://man.openbsd.org/ssh
  - label: OpenBSD manual — ssh_config
    url: https://man.openbsd.org/ssh_config
  - label: OpenBSD manual — scp
    url: https://man.openbsd.org/scp
---
Перший fingerprint нового host звіряйте через незалежний довірений канал. Не вимикайте перевірку host key заради швидкого підключення.

## Перевірити підключення з діагностикою

> **Ризик: безпечно.** `-v` показує етапи negotiation; не публікуйте повний debug-лог без перевірки адрес та імен.

```bash
ssh -v -o ConnectTimeout=10 <user>@<host>
```

**Параметри:** `<host>` — DNS-ім’я або IP; timeout обмежує лише встановлення з’єднання.

**Перевірка:** після входу виконайте `hostname` та `id`, щоб не працювати на неправильному host.

## Побачити effective-конфігурацію

> **Ризик: безпечно.** Команда об’єднує системний і користувацький конфіг без підключення.

```bash
ssh -G <alias> | grep -E '^(hostname|user|port|identityfile|proxyjump) '
```

**Параметри:** `<alias>` — Host із `~/.ssh/config` або звичайне ім’я сервера.

**Перевірка:** звірте `hostname`, `user`, `port` та шлях до потрібного ключа.

## Створити окремий ключ Ed25519

> **Ризик: змінює локальні файли.** Не перезаписуйте існуючий ключ; задайте унікальне ім’я.

```bash
ssh-keygen -t ed25519 -a 64 -f ~/.ssh/<key-name> -C '<purpose>'
```

**Параметри:** `-a 64` збільшує кількість KDF rounds для passphrase; `<purpose>` описує роль ключа, а не секрет.

**Перевірка:** покажіть fingerprint публічного ключа.

```bash
ssh-keygen -lf ~/.ssh/<key-name>.pub
```

## Додати публічний ключ на сервер

> **Ризик: змінює авторизацію.** Поточну сесію не закривайте, доки не перевірите новий вхід в окремому terminal.

```bash
ssh-copy-id -i ~/.ssh/<key-name>.pub <user>@<host>
```

**Параметри:** передається лише `.pub`; приватний файл без суфікса ніколи не копіюйте.

**Перевірка:** відкрийте нову сесію з явним ключем.

```bash
ssh -i ~/.ssh/<key-name> -o IdentitiesOnly=yes <user>@<host>
```

## Прокинути локальний порт

> **Ризик: змінює мережевий доступ локально.** Binding на `127.0.0.1` не відкриває tunnel іншим хостам.

```bash
ssh -N -L 127.0.0.1:<local-port>:<target-host>:<target-port> <user>@<jump-host>
```

**Параметри:** `-N` не запускає remote shell; `<target-host>` вирішується з боку jump host.

**Перевірка:** в іншому terminal зверніться до локального порту.

```bash
curl --fail --show-error http://127.0.0.1:<local-port>/
```

## Скопіювати файл із перевіркою

> **Ризик: змінює remote-файл.** Передавання на існуючий шлях може його замінити.

```bash
scp -p -- <local-file> <user>@<host>:<remote-path>
```

**Параметри:** `-p` зберігає час і mode; `--` відділяє локальні опції від шляху.

**Перевірка:** порівняйте SHA-256 локально й на сервері.

```bash
sha256sum <local-file>
ssh <user>@<host> 'sha256sum <remote-path>'
```
