---
title: "Windows: діагностика RDP-клієнта"
description: Попередження перенаправлення й відновлення кешу ліцензій mstsc — покроково.
category: windows
tags: [windows, rdp, mstsc, redirection, mslicensing, registry]
platforms: [windows]
testedWith: Windows 11 · Remote Desktop Connection
risk: changes-system
updated: 2026-09-16
order: 14
quickCmd: 'reg delete "HKLM\Software\Microsoft\MSLicensing" /f'
sources:
  - label: Microsoft — попередження безпеки RDP
    url: https://learn.microsoft.com/en-us/windows-server/remote/remote-desktop-services/remotepc/understanding-security-warnings
  - label: Microsoft — очищення кешу ліцензій RDP
    url: https://learn.microsoft.com/en-us/troubleshoot/windows-server/remote/remove-terminal-server-licenses-from-rdp
---

## Швидкі команди

```cmd
:: Перевірити поточне налаштування діалогу
reg query "HKLM\Software\Policies\Microsoft\Windows NT\Terminal Services\Client" /v RedirectionWarningDialogVersion

:: Тимчасово повернути старий діалог (від адміністратора)
reg add "HKLM\Software\Policies\Microsoft\Windows NT\Terminal Services\Client" /v RedirectionWarningDialogVersion /t REG_DWORD /d 1 /f

:: Повернути стандартну поведінку
reg delete "HKLM\Software\Policies\Microsoft\Windows NT\Terminal Services\Client" /v RedirectionWarningDialogVersion /f

:: Зберегти кеш ліцензій (backup перед ремонтом)
reg export "HKLM\Software\Microsoft\MSLicensing" "%USERPROFILE%\Desktop\MSLicensing-backup.reg"

:: Очистити кеш ліцензій (від адміністратора, після backup)
reg delete "HKLM\Software\Microsoft\MSLicensing" /f
```

---

## Перевірити поточне налаштування діалогу

> **Ризик: безпечно.** Команда лише читає.

```cmd
reg query "HKLM\Software\Policies\Microsoft\Windows NT\Terminal Services\Client" /v RedirectionWarningDialogVersion
```

Відсутність значення означає стандартну поведінку Windows.

**Параметри:** дивіться деталі вище.

**Перевірка:** перевірте результат виконаної команди.
## Тимчасово повернути старий діалог

> **Ризик: змінює систему.** `1` повертає стару версію діалогу, а не вимикає всі попередження.

```cmd
reg add "HKLM\Software\Policies\Microsoft\Windows NT\Terminal Services\Client" /v RedirectionWarningDialogVersion /t REG_DWORD /d 1 /f
```

Потрібен запуск від адміністратора. `/f` не запитує підтвердження.

**Параметри:** дивіться деталі вище у блоці команд.

**Перевірка:** перезапустіть `mstsc.exe` і звірте поведінку.

## Повернути стандартну поведінку

> **Ризик: змінює систему.** Видаляється лише конкретне значення.

```cmd
reg delete "HKLM\Software\Policies\Microsoft\Windows NT\Terminal Services\Client" /v RedirectionWarningDialogVersion /f
```

Використовуйте лише якщо значення додано як локальний обхід, а не через GPO.

**Параметри:** дивіться деталі вище.

**Перевірка:** перевірте результат виконаної команди.
## Зберегти кеш ліцензій

> **Ризик: безпечно.** Ekspорт створює резервну копію.

```cmd
reg export "HKLM\Software\Microsoft\MSLicensing" "%USERPROFILE%\Desktop\MSLicensing-backup.reg"
```

Виконуйте тільки на клієнті з помилкою ліцензійного протоколу.

**Параметри:** дивіться деталі вище.

**Перевірка:** перевірте результат виконаної команди.
## Відновити ліцензійний кеш

> **Ризик: незворотно.** Видалення очищає локальні токени. Робіть після backup і перевірки доступності сервера ліцензій.

```cmd
reg delete "HKLM\Software\Microsoft\MSLicensing" /f
```

Потрібні права адміністратора. Після очищення запустіть `mstsc` від адміністратора — Windows відтворить ключ при першому підключенні.

**Параметри:** дивіться деталі вище у блоці команд.

**Перевірка:** підключення проходить без помилки протоколу.
