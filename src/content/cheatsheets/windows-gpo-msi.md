---
title: "Windows: GPO та інсталяція MSI"
description: Оновлення політик, діагностика призначених застосунків і повторна інсталяція без очищення системного реєстру.
category: windows
tags: [windows, gpo, gpupdate, appmgmt, installer, msiexec, libreoffice]
platforms: [windows]
testedWith: Windows 11 · Windows Server 2025
risk: changes-system
updated: 2026-09-16
order: 13
featured: true
sources:
  - label: Microsoft — gpupdate
    url: https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/gpupdate
  - label: Microsoft — діагностика Group Policy Software Installation
    url: https://learn.microsoft.com/en-us/troubleshoot/windows-server/group-policy/troubleshoot-software-installations-debug-logging
  - label: Microsoft — msiexec
    url: https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/msiexec
---
Для програм, призначених через GPO, спочатку перевіряйте політику та журнали Windows Installer. Видалення гілок `AppMgmt` чи `Installer\\Products` може пошкодити облік інших програм; успішний окремий випадок з LibreOffice не робить таке очищення загальним рецептом.

## Подивитися застосовані політики

> **Ризик: безпечно.** Команда формує звіт без змін політик.

```cmd
gpresult /h "%TEMP%\gpresult.html"
```

**Параметри:** файл збережеться в тимчасовій теці поточного користувача; для повних даних комп’ютера запустіть консоль від адміністратора.

**Перевірка:** відкрийте звіт і знайдіть GPO, яка призначає потрібну програму.

## Примусово оновити політики

> **Ризик: змінює систему.** Політики можуть змінити налаштування комп’ютера й користувача.

```cmd
gpupdate /force
```

**Параметри:** `/force` повторно застосовує всі політики. Призначене користувачу ПЗ може потребувати нового входу, а призначене комп’ютеру — перезавантаження; не вимикайте живу робочу станцію без плану.

**Перевірка:** дочекайтеся завершення обробки та перевірте `gpresult` і стан програми після входу або перезавантаження.

## Знайти причину збою інсталяції

> **Ризик: безпечно.** Перегляд журналів не змінює встановлені пакети.

```powershell
Get-WinEvent -FilterHashtable @{LogName='Application'; ProviderName='MsiInstaller'; StartTime=(Get-Date).AddDays(-2)} | Select-Object -First 30 TimeCreated, Id, Message
```

**Параметри:** `AddDays(-2)` задає часовий інтервал; за потреби перегляньте також журнал `Microsoft-Windows-GroupPolicy/Operational`.

**Перевірка:** співставте час помилки, код MSI і назву пакета з фактичним запуском політики.

## Встановити довірений MSI вручну

> **Ризик: змінює систему.** Використовуйте пакет із перевіреного джерела й відповідної версії, узгодивши це з адміністратором GPO.

```cmd
msiexec /i "C:\path\to\package.msi" /L*V "%TEMP%\install.log"
```

**Параметри:** `/i` встановлює або налаштовує пакет, `/L*V` записує докладний журнал. Шлях до старого `acad.msi` з особистого робочого столу замінено на приклад.

**Перевірка:** перевірте код завершення, запис у «Встановлені програми» та останні рядки `install.log`.

## Перевірити системні ключі без видалення

> **Ризик: безпечно.** Це перегляд стану; не видаляйте весь кеш Windows Installer.

```cmd
reg query "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Group Policy\AppMgmt"
reg query "HKLM\SOFTWARE\Classes\Installer\Products"
```

**Параметри:** ключі можуть бути відсутні або відрізнятися між системами; `C:\Windows\Installer` містить кеш пакетів, а не тимчасові файли.

**Перевірка:** співставте знайдений продукт із журналом MSI й політикою; для ремонту використовуйте підтримуваний інсталятор або механізм GPO.
