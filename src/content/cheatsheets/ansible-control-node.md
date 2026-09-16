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
quickCmd: "ansible-playbook -i inventory.ini playbooks/install.yaml --limit client-01"
sources:
  - label: Ansible — встановлення на control node
    url: https://docs.ansible.com/projects/ansible-core/devel/installation_guide/intro_installation.html
  - label: Ansible — privilege escalation
    url: https://docs.ansible.com/projects/ansible/latest/playbook_guide/playbooks_privilege_escalation.html
---

## Швидкі команди

```bash
# 1. Встановити Ansible (тільки на керівній машині)
sudo apt update && sudo apt install ansible
ansible --version

# 2. Передати SSH-ключ на клієнта
ssh-copy-id <user>@<client-ip>
ssh <user>@<client-ip> hostname

# 3. Перевірити з'єднання
cd /path/to/ansible-local
ansible -i inventory.ini workstations -m ping

# 4. Запустити playbook
ansible-playbook -i inventory.ini playbooks/install.yaml --limit client-01
```

```ini
# inventory.ini
[workstations]
client-01 ansible_host=<client-ip> ansible_user=<ssh-user>
```

---

## Встановити Ansible на керівній машині

> **Ризик: змінює систему.** Встановлення додає пакети на машину, де запускають playbook — **не на клієнтів**.

```bash
sudo apt update
sudo apt install ansible
ansible --version
```

**Параметри:** дивіться деталі вище у блоці команд.

**Перевірка:** `ansible --version` показує версію й шлях до конфігурації.

## Записати адресу в inventory

> **Ризик: змінює систему.** Помилкова адреса може спрямувати playbook на інший комп'ютер.

```ini
[workstations]
client-01 ansible_host=<client-ip> ansible_user=<ssh-user>
```

Перевірте inventory перед запуском:

```bash
ansible-inventory -i inventory.ini --list
```

**Параметри:** дивіться деталі вище.

**Перевірка:** перевірте результат виконаної команди.
## Передати SSH-ключ

> **Ризик: змінює систему.** Ключ отримує доступ до цільової машини.

```bash
ssh-copy-id <user>@<client-ip>
ssh <user>@<client-ip> hostname
```

Приватний ключ ніколи не копіюйте на клієнт.

**Параметри:** дивіться деталі вище у блоці команд.

**Перевірка:** SSH входить за ключем і повертає ім'я машини.

## Перевірити перед запуском

> **Ризик: безпечно.** `ping` і `--list-hosts` нічого не встановлюють.

```bash
cd /path/to/ansible-local
ansible -i inventory.ini workstations -m ping
ansible-playbook -i inventory.ini playbooks/install.yaml --list-hosts
```

**Параметри:** дивіться деталі вище у блоці команд.

**Перевірка:** `pong` від потрібного клієнта; `--list-hosts` показує лише заплановані машини.

## Запустити playbook

> **Ризик: змінює систему.** Playbook може встановлювати пакети й перезапускати служби.

```bash
cd /path/to/ansible-local
ansible-playbook -i inventory.ini playbooks/install.yaml --limit client-01
```

`--limit` обмежує запуск одним хостом. Для sudo використовуйте `become: true` у playbook, а не пароль у команді.

**Параметри:** дивіться деталі вище у блоці команд.

**Перевірка:** `PLAY RECAP` без `failed` і `unreachable`.
