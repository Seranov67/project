---
title: "Linux: DNS і WireGuard"
description: Перевірка systemd-resolved, обережний перезапуск DNS і керування тунелем wg-quick.
category: network
tags: [linux, dns, systemd-resolved, resolvectl, wireguard, wg-quick]
platforms: [linux]
testedWith: systemd-resolved · WireGuard tools
risk: changes-system
updated: 2026-09-16
order: 17
sources:
  - label: systemd — resolvectl
    url: https://www.freedesktop.org/software/systemd/man/latest/resolvectl.html
  - label: systemd — systemctl
    url: https://www.freedesktop.org/software/systemd/man/latest/systemctl.html
  - label: WireGuard — wg-quick
    url: https://man7.org/linux/man-pages/man8/wg-quick.8.html
---
Ці команди стосуються мережі поточної Linux-машини. На віддаленому сервері перед зміною DNS або VPN переконайтеся, що є запасний шлях доступу.

## Перевірити резолвер і DNS

> **Ризик: безпечно.** Читання стану не змінює налаштування.

```bash
systemctl status systemd-resolved --no-pager
resolvectl status
```

**Параметри:** `resolvectl` показує DNS-сервери для кожного інтерфейсу; перевірте також `resolv.conf`, якщо застосунок обходить resolved.

**Перевірка:** служба активна, а потрібний інтерфейс має очікувані DNS-сервери.

## Перевірити конкретне ім’я

> **Ризик: безпечно.** Запит лише читає DNS-відповідь.

```bash
resolvectl query example.com
```

**Параметри:** замініть `example.com` на домен, з яким є проблема; не публікуйте внутрішній hostname в тикеті або репозиторії без потреби.

**Перевірка:** адреса й інтерфейс відповідають очікуваним; порівняйте з результатом проблемного застосунку.

## Перезапустити systemd-resolved

> **Ризик: змінює систему.** На короткий час DNS-запити можуть не працювати; не робіть це через єдиний віддалений канал без резервного доступу.

```bash
sudo systemctl restart systemd-resolved
```

**Параметри:** команда з нотаток доречна, якщо саме служба зависла; вона не виправить неправильну адресу DNS у мережевій конфігурації.

**Перевірка:** `systemctl is-active systemd-resolved` повертає `active`, а `resolvectl query example.com` працює.

## Запустити WireGuard

> **Ризик: змінює систему.** Тунель може змінити маршрутизацію та DNS, зокрема розірвати поточне SSH-підключення.

```bash
sudo systemctl start wg-quick@wg0
sudo systemctl status wg-quick@wg0 --no-pager
```

**Параметри:** `wg0` — приклад назви інтерфейсу; файл конфігурації має відповідати `wg0.conf` і бути захищеним від стороннього читання.

**Перевірка:** `wg show` показує інтерфейс і, після обміну трафіком, handshake; потрібні маршрути доступні.

## Увімкнути автозапуск тунелю

> **Ризик: змінює систему.** Зміна переживе перезавантаження; оцініть вплив на мережу після boot.

```bash
sudo systemctl enable wg-quick@wg0
```

**Параметри:** `enable` не запускає тунель зараз; для негайного запуску використовуйте попередній сценарій.

**Перевірка:** `systemctl is-enabled wg-quick@wg0` повертає `enabled`, а після контрольного перезавантаження тунель піднімається.
