---
title: "Guardant: клієнт мережевої ліцензії"
description: Перевірка gnclient.ini, DNS і портів сервера Guardant Net.
category: operations
tags: [guardant, license, gnclient, dns, network, windows]
platforms: [windows]
testedWith: Guardant Net · gnclient.ini
risk: changes-system
updated: 2026-09-16
order: 19
quickCmd: "Test-NetConnection <license-server> -Port 3186"
sources:
  - label: Guardant — база знань про мережевий ключ
    url: https://dev.guardant.ru/display/KB/0010
  - label: Guardant — робота мережевого захисту
    url: https://dev.guardant.com/display/PUB/Guardant%2Bnetwork%2Bprotection%2Bprinciple%2Bof%2Boperation
---

## Швидкі команди

```powershell
# Перевірити DNS сервера ліцензій
Resolve-DnsName <license-server>

# Перевірити доступність портів
Test-NetConnection <license-server> -Port 3186
Test-NetConnection <license-server> -Port 3187
```

```ini
# Мінімальний gnclient.ini
[CLIENT]
UUID={00000000000000000000000000000000}
RECONNECT_TRY_NUMBER = 2
BC_RE-SEARCH_SERVER = NO

[SERVER]
IP_NAME = <license-server>
PORT = 3186
MESSAGE_PORT = 3187
BC_ADDR = 255.255.255.255
SEARCH_REQUESTS_NUMBER = 1

[TIMEOUT]
TO_SEARCH = 5
TO_RECEIVE = 30
```

---

## Знайти файл клієнта

> **Ризик: безпечно.**

Файл `gnclient.ini` зазвичай лежить поруч із захищеним застосунком або у місці, яке вказав постачальник ПЗ.

Не копіюйте повний вміст файлу в публічний тикет — він може містити UUID та ідентифікатори клієнта.

**Параметри:** дивіться деталі вище.

**Перевірка:** перевірте результат виконаної команди.
## Перевірити DNS і порти

> **Ризик: безпечно.** Діагностика не змінює налаштування.

```powershell
Resolve-DnsName <license-server>
Test-NetConnection <license-server> -Port 3186
Test-NetConnection <license-server> -Port 3187
```

`3186` — порт ліцензування, `3187` — порт повідомлень. Фактичні значення визначає конфігурація сервера.

**Параметри:** дивіться деталі вище у блоці команд.

**Перевірка:** `TcpTestSucceeded: True` на обох портах. Якщо ні — перевірте маршрут, firewall і службу сервера.

## Оновити gnclient.ini

> **Ризик: змінює систему.** Помилка в портах або UUID зупинить видачу ліцензії. Збережіть оригінал перед зміною.

```ini
[SERVER]
IP_NAME = <license-server>
PORT = 3186
MESSAGE_PORT = 3187
```

Не підставляйте вигаданий UUID з прикладу — використовуйте той, що згенерував сервер Guardant.

**Параметри:** дивіться деталі вище у блоці команд.

**Перевірка:** після перезапуску застосунку ліцензія знаходиться, сервер фіксує звернення клієнта.

## Діагностика без широкомовного пошуку

> **Ризик: безпечно.**

Якщо `BC_RE-SEARCH_SERVER = NO`, клієнт не шукає сервер у мережі — він читає лише `IP_NAME`. Перевірте, що `IP_NAME` вказує на актуальний hostname або IP.

```powershell
Resolve-DnsName <license-server>
Test-NetConnection <license-server> -Port 3186
```

**Параметри:** дивіться деталі вище у блоці команд.

**Перевірка:** DNS і порт доступні, версії клієнта та сервера сумісні.
