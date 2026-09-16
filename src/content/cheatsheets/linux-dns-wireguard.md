---
title: "Linux: DNS і WireGuard"
description: Перевірка systemd-resolved, перезапуск DNS і керування тунелем wg-quick.
category: network
tags: [linux, dns, systemd-resolved, resolvectl, wireguard, wg-quick]
platforms: [linux]
testedWith: systemd-resolved · WireGuard tools
risk: changes-system
updated: 2026-09-16
order: 17
quickCmd: "sudo systemctl start wg-quick@wg0 && sudo systemctl enable wg-quick@wg0"
sources:
  - label: systemd — resolvectl
    url: https://www.freedesktop.org/software/systemd/man/latest/resolvectl.html
  - label: WireGuard — wg-quick
    url: https://man7.org/linux/man-pages/man8/wg-quick.8.html
---

## Швидкі команди

```bash
# Перевірити DNS
systemctl status systemd-resolved --no-pager
resolvectl status
resolvectl query example.com

# Перезапустити DNS-службу
sudo systemctl restart systemd-resolved

# WireGuard: запустити, увімкнути автозапуск, перевірити стан
sudo systemctl start wg-quick@wg0
sudo systemctl enable wg-quick@wg0
sudo systemctl status wg-quick@wg0 --no-pager
wg show
```

---

## Перевірити резолвер і DNS

> **Ризик: безпечно.** Читання стану не змінює налаштування.

```bash
systemctl status systemd-resolved --no-pager
resolvectl status
```

**Параметри:** `resolvectl` показує DNS-сервери для кожного інтерфейсу. Перевірте також `/etc/resolv.conf`, якщо застосунок обходить resolved.

**Перевірка:** служба активна, потрібний інтерфейс має очікувані DNS-сервери.

## Перевірити конкретне ім'я

> **Ризик: безпечно.** Запит лише читає DNS-відповідь.

```bash
resolvectl query example.com
```

**Параметри:** замініть `example.com` на домен, з яким є проблема.

**Перевірка:** адреса й інтерфейс відповідають очікуваним.

## Перезапустити systemd-resolved

> **Ризик: змінює систему.** На короткий час DNS-запити можуть не працювати. Не робіть це через єдиний віддалений канал без резервного доступу.

```bash
sudo systemctl restart systemd-resolved
systemctl is-active systemd-resolved
```

**Параметри:** доречно лише якщо служба зависла; не виправить неправильну адресу DNS у мережевій конфігурації.

**Перевірка:** `is-active` повертає `active`, `resolvectl query example.com` працює.

## Запустити WireGuard

> **Ризик: змінює систему.** Тунель може змінити маршрутизацію та DNS — зокрема розірвати поточне SSH-підключення.

```bash
sudo systemctl start wg-quick@wg0
sudo systemctl status wg-quick@wg0 --no-pager
wg show
```

**Параметри:** `wg0` — приклад назви інтерфейсу; файл конфігурації має бути `/etc/wireguard/wg0.conf` із правами `600`.

**Перевірка:** `wg show` показує інтерфейс і handshake після першого трафіку.

## Увімкнути автозапуск тунелю

> **Ризик: змінює систему.** Зміна діє після перезавантаження; оцініть вплив на мережу після boot.

```bash
sudo systemctl enable wg-quick@wg0
systemctl is-enabled wg-quick@wg0
```

**Параметри:** `enable` не запускає тунель зараз — для негайного запуску використовуйте `start` вище.

**Перевірка:** `is-enabled` повертає `enabled`.
