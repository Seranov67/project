---
title: "Windows: оновлення та AutoCAD"
description: Підготовка Windows 11 до 25H2 і відновлення налаштувань AutoCAD через підтримувані засоби.
category: windows
tags: [windows, 24h2, 25h2, setup, autocad, autodesk]
platforms: [windows]
testedWith: Windows 11 24H2 · AutoCAD
risk: changes-system
updated: 2026-09-16
order: 16
sources:
  - label: Microsoft — Windows 11 25H2 для ІТ
    url: https://learn.microsoft.com/en-us/windows/whats-new/whats-new-windows-11-version-25h2
  - label: Microsoft — параметри Windows Setup
    url: https://learn.microsoft.com/en-us/windows-hardware/manufacture/desktop/windows-setup-command-line-options?view=windows-11
  - label: Autodesk — скидання AutoCAD
    url: https://www.autodesk.com/support/technical/article/caas/sfdcarticles/sfdcarticles/How-to-reset-AutoCAD-to-defaults.html
---
Для переходу Windows 11 з 24H2 на 25H2 Microsoft використовує enablement package. Команда `setup.exe /product server` із нотаток не є стандартною інструкцією для оновлення клієнтської Windows, тому її тут немає. Для AutoCAD спершу використовуйте офіційне «Reset Settings to Default» із резервною копією.

## Визначити версію Windows

> **Ризик: безпечно.** Перевірка версії не змінює систему.

```powershell
Get-ComputerInfo | Select-Object WindowsProductName, WindowsVersion, OsBuildNumber
```

**Параметри:** звірте редакцію, версію і build; команда виконується на комп’ютері, який плануєте оновити.

**Перевірка:** підтверджено саме Windows 11 24H2, а не Windows Server чи іншу версію.

## Підготувати підтримуване оновлення

> **Ризик: безпечно.** Підготовка не запускає оновлення; вона зменшує ризик простою й втрати даних.

```powershell
Get-Volume | Select-Object DriveLetter, SizeRemaining, HealthStatus
```

**Параметри:** перевірте вільне місце на системному томі, резервну копію, сумісність програм та доступний спосіб розгортання — Windows Update, WSUS або керований пакет 25H2.

**Перевірка:** є актуальна резервна копія й план повернення; потрібний пакет схвалено для цієї групи машин.

## Запустити 25H2 через керований канал

> **Ризик: змінює систему.** Оновлення може вимагати перезавантаження й тимчасово перервати роботу.

```text
Windows Update / WSUS / Configuration Manager → схвалений пакет Windows 11 25H2
```

**Параметри:** для 24H2 використовуйте enablement package, який описує Microsoft; `DynamicUpdate Disable` вимикає отримання оновлень під час Setup і застосовується лише за окремим планом інсталяції.

**Перевірка:** після перезавантаження `Get-ComputerInfo` показує очікувану версію, програми запускаються, а історія оновлень не містить помилки.

## Встановити AutoCAD із перевіреного пакета

> **Ризик: змінює систему.** Старі версії AutoCAD можуть бути несумісні з сучасною Windows; перевірте право використання та підтримку перед встановленням.

```cmd
msiexec /i "C:\path\to\acad.msi" /L*V "%TEMP%\autocad-install.log"
```

**Параметри:** прикладовий шлях замінює особисту директорію користувача; використовуйте лише автентичний інсталяційний пакет.

**Перевірка:** журнал не містить фатальної помилки, AutoCAD запускається під потрібним користувачем.

## Скинути пошкоджені налаштування AutoCAD

> **Ризик: змінює систему.** Персоналізація може бути втрачена, тому виберіть варіант із резервною копією.

```text
Закрийте AutoCAD → Пуск → AutoCAD → Reset Settings to Default → Back up and Reset Settings
```

**Параметри:** шлях `HKCU\Software\Autodesk\AutoCAD\...` залежить від версії й мови. Autodesk не радить редагувати реєстр напряму; не видаляйте старий `ACAD-1:409` без окремої діагностики.

**Перевірка:** AutoCAD запускається з типовим профілем; потрібні налаштування можна повернути з резервної копії.
