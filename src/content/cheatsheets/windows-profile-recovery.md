---
title: "Windows: профіль і Recovery-розділ"
description: Діагностика помилки входу й перевірка зайвої букви Recovery без видалення профілю або розділу.
category: windows
tags: [windows, profilelist, user-profile, recovery, partition, powershell]
platforms: [windows]
testedWith: Windows 11 · PowerShell 5.1+
risk: changes-system
updated: 2026-09-16
order: 15
sources:
  - label: Microsoft — події служби профілів
    url: https://learn.microsoft.com/en-us/troubleshoot/windows-server/user-profiles-and-logon/troubleshoot-user-profiles-events
  - label: Microsoft — Remove-PartitionAccessPath
    url: https://learn.microsoft.com/en-us/powershell/module/storage/remove-partitionaccesspath?view=windowsserver2025-ps
---
`ProfileList` і буква Recovery — окремі випадки діагностики Windows. Перш ніж змінювати будь-що, запишіть точний симптом, зробіть резервну копію та визначте потрібний SID або розділ.

## Знайти помилку завантаження профілю

> **Ризик: безпечно.** Журнал допомагає відрізнити помилку профілю від проблем диска чи прав доступу.

```powershell
Get-WinEvent -FilterHashtable @{LogName='Application'; ProviderName='Microsoft-Windows-User Profiles Service'; StartTime=(Get-Date).AddDays(-2)} | Select-Object -First 30 TimeCreated, Id, Message
```

**Параметри:** змініть інтервал `AddDays(-2)` відповідно до часу проблемного входу.

**Перевірка:** запишіть ID події та шлях до профілю; перевірте, чи існує папка користувача і чи доступний диск.

## Зіставити SID з ProfileList

> **Ризик: безпечно.** Перегляд реєстру не відновлює профіль, але запобігає зміні чужого SID.

```powershell
Get-CimInstance Win32_UserProfile | Select-Object SID, LocalPath, Loaded, Special
reg query "HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion\ProfileList"
```

**Параметри:** шукайте SID потрібного користувача та значення `ProfileImagePath`; позначка `.bak` сама по собі не є достатнім діагнозом.

**Перевірка:** SID, шлях і час помилки в журналі стосуються одного облікового запису. Не видаляйте всю гілку `ProfileList`.

## Зберегти налаштування профілю

> **Ризик: безпечно.** Експорт не змінює реєстр, але файл містить локальні ідентифікатори користувачів.

```cmd
reg export "HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion\ProfileList" "%USERPROFILE%\Desktop\ProfileList-backup.reg"
```

**Параметри:** запускайте від адміністратора; тримайте копію локально в захищеному місці, не завантажуйте її на публічний сайт.

**Перевірка:** файл створено. Подальше виправлення підбирайте за конкретним ID події, а не за універсальним перейменуванням ключів.

## Визначити Recovery-розділ

> **Ризик: безпечно.** Команда лише показує розділи; не плутайте Recovery з системним томом.

```powershell
Get-Partition | Format-Table DiskNumber, PartitionNumber, DriveLetter, Type, Size
```

**Параметри:** звірте тип, розмір і номер диска; буква може бути не `R`.

**Перевірка:** ідентифіковано саме Recovery-розділ, який помилково відображається в Провіднику.

## Прибрати зайву букву, не видаляючи розділ

> **Ризик: змінює систему.** Команда від’єднує тільки букву. Помилковий вибір тома зробить його недоступним за старим шляхом.

```powershell
Remove-PartitionAccessPath -DriveLetter R -AccessPath 'R:' -WhatIf
Remove-PartitionAccessPath -DriveLetter R -AccessPath 'R:'
```

**Параметри:** замініть `R` фактичною буквою після перевірки; спочатку перегляньте `-WhatIf`. Не застосовуйте до системного або робочого тома.

**Перевірка:** `Get-Partition` показує той самий розділ без букви, а завантаження Windows і середовище відновлення лишаються доступними.
