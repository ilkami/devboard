# DevBoard

Веб-приложение для управления личными проектами программиста: задачи, сроки, технологии и прогресс в одном месте.

Стек: **React 18 + TypeScript + Vite** (интерфейс) и **FastAPI + PostgreSQL** (сервер). Стили написаны на CSS-переменных, сторонних UI-библиотек нет.

## Что нужно установить

- **Node.js 18 или новее** — проверить: `node -v`
- **Python 3.11 или новее** — проверить: `python --version`
- **PostgreSQL 14+** — либо локальная установка, либо Docker Desktop (`docker --version`)

## Запуск: два терминала

### 1. База данных и сервер

```bash
npm install
pip install -r backend/requirements.txt
copy backend\.env.example backend\.env      # macOS/Linux: cp backend/.env.example backend/.env
docker compose up -d postgres               # или используйте уже установленный PostgreSQL
npm run api
```

Сервер поднимется на **http://localhost:8000**, документация API — **http://localhost:8000/docs**.
При первом старте таблицы создаются автоматически и загружаются демонстрационные данные.

Если PostgreSQL установлен локально, поправьте строку подключения в `backend/.env`:

```
DATABASE_URL=postgresql+psycopg://postgres:ваш_пароль@localhost:5432/devboard
```

и создайте базу `devboard` (`CREATE DATABASE devboard;`).

### 2. Интерфейс

```bash
npm start
```

Открыть **http://localhost:5173**. Запросы к `/api` проксируются на порт 8000, поэтому браузер видит интерфейс и API как один сайт.

Vite печатает два адреса: `Local` — на этом компьютере, `Network` — адрес в локальной сети для доступа с другого компьютера.

## Вход

- Демо-аккаунт: **demo@example.com** / **devboard123**
- Или нажмите «Регистрация» и создайте свой аккаунт — он сохранится в PostgreSQL.

Пароли хранятся в виде Argon2id-хеша, сессия — в HttpOnly-cookie (access-токен 15 минут, refresh-токен 30 дней с ротацией), изменяющие запросы защищены CSRF-токеном.

## Альтернатива: один адрес без Vite

Если интерфейс уже собран (`npm run build`), FastAPI сам раздаёт сайт:

```bash
npm run build
npm run api
```

Открыть **http://localhost:8000** — тот же интерфейс, только с того же порта, что и API.

## Автономный файл без сервера

**`devboard-standalone.html`** открывается двойным щелчком: вся программа в одном файле, данные — в localStorage браузера. Удобно для быстрого показа, но без общей базы.

## Сборка

```bash
npm run build            # production-сборка в dist/
npm run build:standalone # один автономный файл в dist-standalone/index.html
npm run preview          # предпросмотр production-сборки (прокси на API сохраняется)
```

## Тесты API

```bash
cd backend
python -m pytest tests -q
```

Тесты работают на SQLite во временном файле, PostgreSQL для них не нужен.

## Структура проекта

```
src/
  api/              HTTP-клиент, DTO и преобразование ответов API
  auth/             вход, регистрация, восстановление сессии
  components/       оболочка приложения и компоненты главного экрана
  pages/            экраны: главная, проекты, доска, задачи, календарь, технологии, отчёты
  data/             хранилища (API + локальный режим для автономной сборки)
  styles/           дизайн-токены и стили
backend/
  app/
    main.py         приложение FastAPI, CSRF, раздача собранного интерфейса
    models.py       таблицы SQLAlchemy
    routers/        авторизация, проекты, задачи, технологии, дашборд, отчёты
    security.py     Argon2id, JWT, cookie, CSRF
    seed.py         демонстрационные данные
  tests/            тесты API
docs/
  plan-razrabotki.md  план разработки
  tz-devboard.md      техническое задание
```

## Разделы

Главная (KPI, проекты, задачи, календарь, технологии, прогресс), Проекты (фильтры, сортировка, создание, редактирование, архив, удаление), Доска проекта (Kanban с сохранением статуса), Задачи (сроки, приоритеты, подзадачи), Календарь, Технологии, Отчёты.
