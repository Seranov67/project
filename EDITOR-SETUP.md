# Налаштування редактора OpsCards

Редактор використовує GitHub App, встановлений лише для `Seranov67/project`. Картки залишаються у відкритому репозиторії; збереження запускає автоматичне розгортання Vercel.

1. У GitHub відкрийте **Settings → Developer settings → GitHub Apps → New GitHub App**.
2. Вкажіть назву застосунку, homepage `https://opscards.vercel.app/` та callback `https://opscards.vercel.app/api/editor?action=callback`. Вимкніть webhook. Не ввімкнюйте wildcard callback. Встановіть **Repository permissions → Contents → Read and write**; Metadata залишається Read-only. Залиште App доступним лише власнику.
3. Створіть App, скопіюйте **Client ID**, створіть **Client secret**. Установіть App на обліковий запис `Seranov67`, вибравши лише репозиторій `project`.
4. У Vercel → `opscards` → Settings → Environment Variables додайте для Production: `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` та `EDITOR_SESSION_SECRET`. Останнє значення — випадковий секрет не менше 32 байтів (наприклад, результат `openssl rand -hex 32`). Секрети не потрібно вставляти в репозиторій або чат.
5. Створіть нове production deployment через Vercel: змінні застосовуються до нових розгортань. Відкрийте `https://opscards.vercel.app/admin` і увійдіть через `Seranov67`.

Вхід дозволений лише GitHub user ID `65553795`. Зміни потрапляють у `main`; за наявності незбережених змін у браузері при конфлікті версій потрібно знову відкрити картку. Після збереження Vercel має успішно зібрати сайт, перш ніж зміни з'являться в каталозі.
