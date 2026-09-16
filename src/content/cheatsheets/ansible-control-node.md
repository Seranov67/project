---
title: "Ansible: запуск playbook з керівної машини"
description: Інвентар, SSH-ключ, перевірка доступу й запуск playbook із правильної теки.
category: operations
tags: [ansible, inventory, ssh, playbook, linux, automation]
platforms: [linux]
testedWith: Ansible Core · OpenSSH
risk: changes-system
updated: 2026-09-16
order: 20
featured: true
sources:
  - label: Ansible — встановлення на control node
    url: https://docs.ansible.com/projects/ansible-core/devel/installation_guide/intro_installation.html
  - label: Ansible — privilege escalation
    url: https://docs.ansible.com/projects/ansible/latest/playbook_guide/playbooks_privilege_escalation.html
---
Ansible встановлюють на **керівній машині**, з якої запускають `ansible-playbook`. Віддалена машина зазвичай не потребує встановлення Ansible: їй потрібні SSH-доступ і середовище, потрібне модулям. Реальну адресу з нотаток прибрано; використовуйте окремий обліковий запис і `become` для адміністративних задач, якщо це дозволяє ваш playbook.

## Встановити Ansible на керівній машині

> **Ризик: змінює систему.** Встановлення додає пакети на ту машину, де ви запускаєте playbook.

```bash
sudo apt update
sudo apt install ansible
ansible --version
```

**Параметри:** ці команди стосуються Debian/Ubuntu control node. Не запускайте їх на кожному клієнті лише заради віддаленого керування.

**Перевірка:** `ansible --version` показує встановлену версію й шлях до конфігурації.

## Записати правильну адресу в inventory

> **Ризик: змінює систему.** Помилкова адреса може спрямувати playbook на інший комп’ютер.

```ini
[workstations]
client-01 ansible_host=<client-ip> ansible_user=<ssh-user>
```

**Параметри:** `ansible_host` — сучасна назва змінної для IP/hostname; `ansible_user` — реальний SSH-користувач. Публічна картка не містить внутрішньої IP-адреси або логіна `root`.

**Перевірка:** `ansible-inventory -i inventory.ini --list` показує один очікуваний хост і правильні змінні.

## Передати публічний SSH-ключ

> **Ризик: змінює систему.** Ключ отримує доступ до цільової машини; використовуйте тільки власний публічний ключ і перевірений hostname.

```bash
ssh-copy-id <ssh-user>@<client-ip>
ssh <ssh-user>@<client-ip> hostname
```

**Параметри:** `ssh-copy-id` додає публічний ключ до `authorized_keys`; приватний ключ ніколи не копіюйте на клієнт. Прямий SSH під `root` використовуйте лише якщо це явно передбачено політикою доступу.

**Перевірка:** SSH входить за ключем і повертає очікуване ім’я машини.

## Перевірити ціль перед запуском

> **Ризик: безпечно.** `ping` Ansible і `--list-hosts` не виконують інсталяцію.

```bash
cd /path/to/ansible-local
ansible -i inventory.ini workstations -m ping
ansible-playbook -i inventory.ini playbooks/install.yaml --list-hosts
```

**Параметри:** замініть шлях, inventory і назву playbook на локальні; `cd` забезпечує очікувані відносні шляхи.

**Перевірка:** відповідає потрібний клієнт, а `--list-hosts` показує лише заплановані машини.

## Запустити playbook контрольовано

> **Ризик: змінює систему.** Playbook може встановлювати пакети, змінювати конфігурацію та перезапускати служби.

```bash
cd /path/to/ansible-local
ansible-playbook -i inventory.ini playbooks/install.yaml --limit client-01
```

**Параметри:** `--limit` обмежує запуск одним перевіреним хостом. Якщо playbook потребує sudo, налаштуйте `become` у playbook або в inventory; не записуйте пароль у команду чи Git.

**Перевірка:** у підсумку `PLAY RECAP` немає `failed` чи `unreachable`; перевірте встановлену програму та її службу на цільовій машині.
