---
title: "Windows: оновлення та AutoCAD"
description: Перевірка версії Windows 11, підготовка до 25H2 і скидання налаштувань AutoCAD.
category: windows
tags: [windows, 24h2, 25h2, setup, autocad, autodesk]
platforms: [windows]
testedWith: Windows 11 24H2 · AutoCAD
risk: changes-system
updated: 2026-09-16
order: 16
quickCmd: "Get-ComputerInfo | Select-Object WindowsProductName, WindowsVersion, OsBuildNumber"
sources:
  - label: Microsoft — Windows 11 25H2 для ІТ
    url: https://learn.microsoft.com/en-us/windows/whats-new/whats-new-windows-11-version-25h2
  - label: Microsoft — параметри Windows Setup
    url: https://learn.microsoft.com/en-us/windows-hardware/manufacture/desktop/windows-setup-command-line-options?view=windows-11
  - label: Autodesk — скидання AutoCAD
    url: https://www.autodesk.com/support/technical/article/caas/sfdcarticles/sfdcarticles/How-to-reset-AutoCAD-to-defaults.html
---

## Швидкі команди

```powershell
# Перевірити версію Windows
Get-ComputerInfo | Select-Object WindowsProductName, WindowsVersion, OsBuildNumber

# Перевірити вільне місце перед оновленням
Get-Volume | Select-Object DriveLetter, SizeRemaining, HealthStatus

# Встановити AutoCAD із MSI
msiexec /i "C:\path\to\acad.msi" /L*V "%TEMP%\autocad-install.log"

# Скинути налаштування AutoCAD (реєстр, залежить від версії)
# R16.2 = AutoCAD 2006 — замініть на свою версію
reg export "HKCU\Software\Autodesk\AutoCAD\R16.2\ACAD-1:409" "%USERPROFILE%\Desktop\autocad-backup.reg"
reg delete "HKCU\Software\Autodesk\AutoCAD\R16.2\ACAD-1:409" /f
```

---

## Визначити версію Windows

> **Ризик: безпечно.**

```powershell
Get-ComputerInfo | Select-Object WindowsProductName, WindowsVersion, OsBuildNumber
```

**Параметри:** дивіться деталі вище у блоці команд.

**Перевірка:** підтверджено Windows 11 24H2 перед запуском оновлення.

## Перевірити диск перед оновленням

> **Ризик: безпечно.** Підготовка зменшує ризик простою.

```powershell
Get-Volume | Select-Object DriveLetter, SizeRemaining, HealthStatus
```

Перевірте вільне місце на системному томі (потрібно ≥ 10 ГБ), наявність резервної копії та сумісність програм.

**Параметри:** дивіться деталі вище.

**Перевірка:** перевірте результат виконаної команди.
## Запустити 25H2

> **Ризик: змінює систему.** Оновлення може вимагати перезавантаження.

```text
Windows Update → перевірити наявність оновлень → Windows 11 25H2 Enablement Package
```

Або через WSUS / Configuration Manager для корпоративного парку машин.

**Перевірка після оновлення:**
```powershell
Get-ComputerInfo | Select-Object WindowsVersion, OsBuildNumber
```

**Параметри:** дивіться деталі вище.

**Перевірка:** перевірте результат виконаної команди.
## Встановити AutoCAD із MSI

> **Ризик: змінює систему.** Використовуйте автентичний пакет.

```cmd
msiexec /i "C:\path\to\acad.msi" /L*V "%TEMP%\autocad-install.log"
```

**Параметри:** дивіться деталі вище у блоці команд.

**Перевірка:** журнал не містить фатальної помилки, AutoCAD запускається.

## Скинути налаштування AutoCAD

> **Ризик: змінює систему.** Персоналізація буде втрачена. Зробіть backup реєстру перед видаленням.

```cmd
:: Спочатку — backup (замініть R16.2 на свою версію)
reg export "HKCU\Software\Autodesk\AutoCAD\R16.2\ACAD-1:409" "%USERPROFILE%\Desktop\autocad-backup.reg"

:: Потім — видалити ключ і запустити AutoCAD
reg delete "HKCU\Software\Autodesk\AutoCAD\R16.2\ACAD-1:409" /f
```

Або через GUI: **Пуск → AutoCAD → Reset Settings to Default → Back up and Reset Settings**.

**Параметри:** дивіться деталі вище у блоці команд.

**Перевірка:** AutoCAD запускається з типовим профілем.
