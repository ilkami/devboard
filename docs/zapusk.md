# Запуск DevBoard на другом компьютере

Документ описывает четыре сценария запуска и то, что должно быть установлено заранее.

## Что должно быть на компьютере

| Компонент | Зачем | Как проверить |
|---|---|---|
| Node.js 18+ | сборка и запуск интерфейса | `node -v` |
| Python 3.11+ | backend FastAPI | `python --version` |
| PostgreSQL 14+ **(сервер)** | основная база данных | `services.msc` → служба `postgresql-x64-*` |
| pgAdmin 4 | только графический клиент к PostgreSQL, сервер не заменяет | — |
| Docker Desktop | альтернатива локальному PostgreSQL | `docker --version` |

Если установлен только pgAdmin без службы PostgreSQL, базы данных на машине нет: pgAdmin — это клиент, а не сервер.

## Сценарий 1. PostgreSQL уже установлен (в том числе вместе с pgAdmin)

### 1. Создать роль и базу

В pgAdmin подключиться к серверу, открыть **Query Tool** на базе `postgres` и выполнить:

```sql
CREATE ROLE devboard WITH LOGIN PASSWORD 'devboard';
CREATE DATABASE devboard OWNER devboard;
```

Если роль уже существует, достаточно обновить пароль:

```sql
ALTER ROLE devboard WITH LOGIN PASSWORD 'devboard';
```

### 2. Указать строку подключения

В файле `backend/.env`:

```text
DATABASE_URL=postgresql+psycopg://devboard:devboard@localhost:5432/devboard
```

### 3. Запустить

```bash
pip install -r backend/requirements.txt
npm install
npm run api      # терминал 1
npm start        # терминал 2
```

При первом старте backend сам создаёт таблицы и загружает демонстрационные данные.

## Сценарий 2. Есть Docker, PostgreSQL не установлен

```bash
docker compose up -d postgres
npm run api
npm start
```

`docker-compose.yml` поднимает `postgres:16-alpine` с базой `devboard`, пользователем `devboard` и паролем `devboard` — строка подключения из `backend/.env.example` подходит без изменений.

## Сценарий 3. Нет ни PostgreSQL, ни Docker

Работает на файле SQLite, устанавливать ничего не нужно. В `backend/.env`:

```text
DATABASE_URL=sqlite+pysqlite:///C:/путь/до/проекта/backend/devboard.db
```

Дальше как обычно: `npm run api` и `npm start`. Данные хранятся в `backend/devboard.db`.
Этот вариант годится для показа функциональности, но в пояснительной записке основной СУБД остаётся PostgreSQL.

## Сценарий 4. Совсем без установки

Открыть файл `devboard-standalone.html` двойным щелчком: интерфейс работает целиком в браузере, данные — в localStorage. Backend и база не нужны, но и общих данных между устройствами нет.

## Порядок проверки перед защитой

1. `git clone https://github.com/ilkami/devboard.git`
2. `cd devboard`
3. `npm install` — должна появиться папка `node_modules`
4. `pip install -r backend/requirements.txt`
5. `copy backend\.env.example backend\.env` и выбрать сценарий подключения к базе
6. `npm run api` — в логе `Uvicorn running on http://127.0.0.1:8000`
7. `npm start` — в логе `Local: http://localhost:5173/`
8. Открыть сайт, войти как `demo@example.com` / `devboard123`
9. Проверить: главная с данными, раздел «Проекты», Kanban на странице проекта, создание задачи, «Отчёты»

## Типичные ошибки

| Сообщение | Причина | Решение |
|---|---|---|
| `ENOENT ... package.json` | команда запущена не в папке проекта | `cd` в папку, где лежит `package.json` |
| `'python' не является внутренней командой` | Python не в PATH | установить Python с галочкой «Add python.exe to PATH» |
| Внутренняя ошибка сервера при входе | backend не может подключиться к базе | проверить службу PostgreSQL или перейти на SQLite (сценарий 3) |
| `InvalidPasswordError` при работе с PostgreSQL | пароль роли не совпадает со строкой в `.env` | `ALTER ROLE devboard WITH LOGIN PASSWORD 'devboard';` |
| Порт 8000 или 5173 занят | приложение уже запущено | закрыть прежнее окно терминала |
| Страница пустая, в консоли 500 на `/api/...` | backend не запущен | запустить `npm run api` в отдельном терминале |
