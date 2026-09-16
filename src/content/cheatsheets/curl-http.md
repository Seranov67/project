---
title: "curl: HTTP-діагностика"
description: Заголовки, статус, redirects, таймінги, TLS і контрольовані JSON-запити з terminal.
category: network
tags: [curl, http, https, tls, api, troubleshooting]
platforms: [linux, windows, macos]
testedWith: curl 8+
risk: changes-system
updated: 2026-09-15
order: 8
featured: false
sources:
  - label: curl command line manual
    url: https://curl.se/docs/manpage.html
  - label: Everything curl — HTTP
    url: https://everything.curl.dev/http/
---
Для діагностики додавайте `--fail-with-body --show-error`: curl поверне ненульовий код на HTTP 4xx/5xx, але збереже тіло відповіді для аналізу.

## Побачити заголовки відповіді

> **Ризик: безпечно для GET.** Сервер усе одно може вести access log і рахувати запит.

```bash
curl --silent --show-error --dump-header - --output /dev/null <url>
```

**Параметри:** `--dump-header -` друкує headers у stdout, `--output /dev/null` прибирає body.

**Перевірка:** знайдіть status line, `content-type`, cache headers і request ID.

## Отримати лише HTTP-статус

> **Ризик: безпечно для GET.** Зручно для health check та shell-умов.

```bash
curl --silent --output /dev/null --write-out '%{http_code}\n' <url>
```

**Параметри:** `%{http_code}` — фінальний статус; без `--location` redirect залишиться статусом `3xx`.

**Перевірка:** додайте `--fail`, якщо shell має отримати помилку на 4xx/5xx.

## Простежити redirects без downgrade

> **Ризик: безпечно для GET.** Обмеження протоколу не дозволяє redirect з HTTPS на HTTP.

```bash
curl --location --max-redirs 5 --proto-redir '=https' --fail-with-body --show-error <url>
```

**Параметри:** `--location` переходить за `Location`, `--max-redirs` зупиняє цикл.

**Перевірка:** покажіть фінальний URL і статус.

```bash
curl --location --silent --output /dev/null --write-out '%{url_effective} %{http_code}\n' <url>
```

## Розкласти затримку на етапи

> **Ризик: безпечно для GET.** Таймінги вимірюються з боку поточного host.

```bash
curl --silent --output /dev/null --write-out 'dns=%{time_namelookup}s connect=%{time_connect}s tls=%{time_appconnect}s first_byte=%{time_starttransfer}s total=%{time_total}s\n' <url>
```

**Параметри:** `first_byte` включає попередні етапи й час обробки сервером; `total` — повну передачу.

**Перевірка:** повторіть кілька разів, щоб відокремити стабільну затримку від одиничного промаху cache.

## Надіслати JSON і не приховати помилку

> **Ризик: змінює зовнішню систему.** POST може створити запис або запустити дію; спершу використайте test endpoint чи dry-run API.

```bash
curl --fail-with-body --show-error --request POST \
  --header 'Content-Type: application/json' \
  --data-binary @<payload.json> \
  <url>
```

**Параметри:** `--data-binary @file` передає файл без перетворення нових рядків; токени беріть із захищеної змінної, а не вписуйте в history.

**Перевірка:** збережіть request ID зі відповіді та виконайте окремий GET, якщо API його підтримує.

## Перевірити TLS negotiation

> **Ризик: безпечно.** Verbose-вивід може містити host, cookies й authorization headers — не публікуйте його без очищення.

```bash
curl --verbose --tlsv1.2 --output /dev/null <https-url>
```

**Параметри:** `--tlsv1.2` задає мінімальну, а не максимальну версію TLS; сертифікат усе одно перевіряється.

**Перевірка:** у stderr звірте protocol, cipher, subject, issuer і результат перевірки сертифіката. Не додавайте `--insecure` як виправлення.
