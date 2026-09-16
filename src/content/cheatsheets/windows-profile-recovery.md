---
title: "Windows: профіль і Recovery-розділ"
description: Діагностика помилки входу і прибирання зайвої букви Recovery без видалення профілю.
category: windows
tags: [windows, profilelist, user-profile, recovery, partition, powershell]
platforms: [windows]
testedWith: Windows 11 · PowerShell 5.1+
risk: changes-system
updated: 2026-09-16
order: 15
quickCmd: "Get-Partition | Format-Table DiskNumber,PartitionNumber,DriveLetter,Type,Size"
sources:
  - label: Microsoft — події служби профілів
    url: https://learn.microsoft.com/en-us/troubleshoot/windows-server/user-profiles-and-logon/troubleshoot-user-profiles-events
  - label: Microsoft — Remove-PartitionAccessPath
    url: https://learn.microsoft.com/en-us/powershell/module/storage/remove-partitionaccesspath?view=windowsserver2025-ps
---

## Швидкі команди

```powershell
# Знайти помилку профілю в журналі
Get-WinEvent -FilterHashtable @{LogName='Application'; ProviderName='Microsoft-Windows-User Profiles Service'; StartTime=(Get-Date).AddDays(-2)} | Select-Object -First 30 TimeCreated, Id, Message

# Переглянути профілі та SID
Get-CimInstance Win32_UserProfile | Select-Object SID, LocalPath, Loaded, Special

# Список розділів (знайти Recovery)
Get-Partition | Format-Table DiskNumber, PartitionNumber, DriveLetter, Type, Size

# Зберегти ProfileList (backup перед ремонтом)
reg export "HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion\ProfileList" "%USERPROFILE%\Desktop\ProfileList-backup.reg"

# Прибрати букву Recovery (замініть R на фактичну)
Remove-PartitionAccessPath -DriveLetter R -AccessPath 'R:' -WhatIf
Remove-PartitionAccessPath -DriveLetter R -AccessPath 'R:'
```

---

## Знайти помилку завантаження профілю

> **Ризик: безпечно.** Журнал допомагає відрізнити помилку профілю від проблем диска.

```powershell
Get-WinEvent -FilterHashtable @{LogName='Application'; ProviderName='Microsoft-Windows-User Profiles Service'; StartTime=(Get-Date).AddDays(-2)} | Select-Object -First 30 TimeCreated, Id, Message
```

**Параметри:** дивіться деталі вище у блоці команд.

**Перевірка:** запишіть ID події та шлях до профілю.

## Зіставити SID з ProfileList

> **Ризик: безпечно.** Перегляд, не зміна.

```powershell
Get-CimInstance Win32_UserProfile | Select-Object SID, LocalPath, Loaded, Special
reg query "HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion\ProfileList"
```

Шукайте SID потрібного користувача і значення `ProfileImagePath`. Позначка `.bak` сама по собі — не достатній діагноз. Не видаляйте всю гілку `ProfileList`.

**Параметри:** дивіться деталі вище.

**Перевірка:** перевірте результат виконаної команди.
## Зберегти backup ProfileList

> **Ризик: безпечно.** Робіть до будь-яких змін у реєстрі.

```cmd
reg export "HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion\ProfileList" "%USERPROFILE%\Desktop\ProfileList-backup.reg"
```

**Параметри:** дивіться деталі вище.

**Перевірка:** перевірте результат виконаної команди.
## Визначити Recovery-розділ

> **Ризик: безпечно.** Лише перегляд.

```powershell
Get-Partition | Format-Table DiskNumber, PartitionNumber, DriveLetter, Type, Size
```

Звірте тип, розмір і номер диска. Буква може бути не `R`.

**Параметри:** дивіться деталі вище.

**Перевірка:** перевірте результат виконаної команди.
## Прибрати зайву букву Recovery

> **Ризик: змінює систему.** Спочатку запустіть із `-WhatIf`. Помилковий вибір тома зробить його недоступним.

```powershell
# Перевірити без змін
Remove-PartitionAccessPath -DriveLetter R -AccessPath 'R:' -WhatIf

# Застосувати (замініть R на фактичну букву)
Remove-PartitionAccessPath -DriveLetter R -AccessPath 'R:'
```

**Параметри:** дивіться деталі вище у блоці команд.

**Перевірка:** `Get-Partition` показує розділ без букви; завантаження Windows і середовище відновлення доступні.
