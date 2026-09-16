---
title: "Windows: GPO та інсталяція MSI"
description: Оновлення політик, діагностика призначених застосунків і встановлення MSI вручну.
category: windows
tags: [windows, gpo, gpupdate, appmgmt, installer, msiexec, libreoffice]
platforms: [windows]
testedWith: Windows 11 · Windows Server 2025
risk: changes-system
updated: 2026-09-16
order: 13
featured: true
quickCmd: "gpupdate /force && gpresult /h %TEMP%\\gpresult.html"
sources:
  - label: Microsoft — gpupdate
    url: https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/gpupdate
  - label: Microsoft — діагностика Group Policy Software Installation
    url: https://learn.microsoft.com/en-us/troubleshoot/windows-server/group-policy/troubleshoot-software-installations-debug-logging
  - label: Microsoft — msiexec
    url: https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/msiexec
---

## Швидкі команди

```cmd
:: Перегляд застосованих GPO (звіт)
gpresult /h "%TEMP%\gpresult.html"

:: Примусово оновити всі політики
gpupdate /force

:: Переглянути помилки інсталяції MSI за останні 2 дні
```
```powershell
Get-WinEvent -FilterHashtable @{LogName='Application'; ProviderName='MsiInstaller'; StartTime=(Get-Date).AddDays(-2)} | Select-Object -First 30 TimeCreated, Id, Message
```
```cmd
:: Встановити MSI вручну з докладним логом
msiexec /i "C:\path\to\package.msi" /L*V "%TEMP%\install.log"

:: Перевірити ключі реєстру GPO/Installer (без змін)
reg query "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Group Policy\AppMgmt"
reg query "HKLM\SOFTWARE\Classes\Installer\Products"
```

---

## Подивитися застосовані політики

> **Ризик: безпечно.** Формує звіт без змін.

```cmd
gpresult /h "%TEMP%\gpresult.html"
```

Файл з'явиться в тимчасовій теці. Для повних даних комп'ютера запустіть від адміністратора.

**Параметри:** дивіться деталі вище у блоці команд.

**Перевірка:** знайдіть GPO, яка призначає потрібну програму.

## Примусово оновити політики

> **Ризик: змінює систему.** Політики можуть змінити налаштування. Призначене через GPO ПЗ може потребувати перезавантаження.

```cmd
gpupdate /force
```

**Параметри:** дивіться деталі вище у блоці команд.

**Перевірка:** після входу або перезавантаження перевірте `gpresult` і стан програми.

## Знайти причину збою інсталяції

> **Ризик: безпечно.** Перегляд журналів не змінює пакети.

```powershell
Get-WinEvent -FilterHashtable @{LogName='Application'; ProviderName='MsiInstaller'; StartTime=(Get-Date).AddDays(-2)} | Select-Object -First 30 TimeCreated, Id, Message
```

**Параметри:** дивіться деталі вище у блоці команд.

**Перевірка:** співставте час помилки, код MSI і назву пакета з запуском політики.

## Встановити MSI вручну

> **Ризик: змінює систему.** Використовуйте пакет із перевіреного джерела.

```cmd
msiexec /i "C:\path\to\package.msi" /L*V "%TEMP%\install.log"
```

`/i` — встановлює, `/L*V` — докладний лог. Перевірте лог після завершення.

**Параметри:** дивіться деталі вище у блоці команд.

**Перевірка:** код завершення `0`, запис у «Встановлені програми».

## Перевірити системні ключі

> **Ризик: безпечно.** Перегляд, не видалення.

```cmd
reg query "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Group Policy\AppMgmt"
reg query "HKLM\SOFTWARE\Classes\Installer\Products"
```

`C:\Windows\Installer` — кеш пакетів, не тимчасові файли. Якщо не допомогло `AppMgmt`, перевірте `Classes\Installer\Products`.

**Параметри:** дивіться деталі вище у блоці команд.

**Перевірка:** знайдений продукт співставте з журналом MSI і GPO-політикою.
