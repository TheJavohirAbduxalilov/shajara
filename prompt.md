# ЗАДАЧА: Полная миграция семейного древа Shajara

## КОНТЕКСТ
Проект: Приложение для построения семейного древа
Текущее состояние: Старый дизайн с компонентной системой templates.js
Цель: Миграция на чистый HTML/CSS/JS дизайн из папки /redesign

## ИСТОЧНИК ИСТИНЫ
Папка `/redesign` содержит идеальный дизайн. Каждая деталь должна быть скопирована точно:
- redesign/index.html - главная страница приложения
- redesign/login.html - страница входа
- redesign/register.html - страница регистрации
- redesign/css/styles.css - основные стили (2030 строк)
- redesign/css/auth.css - стили авторизации (892 строки)
- redesign/js/app.js - логика приложения (812 строк)
- redesign/js/auth.js - логика авторизации (306 строк)

## ТРЕБОВАНИЯ К МИГРАЦИИ

### 1. УДАЛИТЬ ПОЛНОСТЬЮ:
- js/templates.js (компонентная система)
- Все вызовы функций из templates.js в других файлах
- Модульную структуру js/modules/* и js/utils/*

### 2. СОХРАНИТЬ БЕЗ ИЗМЕНЕНИЙ:
- Всю папку /api (бэкенд PHP)
- Папку /database (структура БД)
- Логику работы с API (запросы, токены, авторизация)

### 3. ЗАМЕНИТЬ:
Корневые файлы заменяются содержимым из /redesign:
- index.html ← redesign/index.html
- login.html ← redesign/login.html
- register.html ← redesign/register.html
- css/styles.css ← redesign/css/styles.css
- css/auth.css ← redesign/css/auth.css

### 4. ОБЪЕДИНИТЬ В ОДИН ФАЙЛ js/app.js:
Взять за основу redesign/js/app.js и добавить:
- API клиент (из старого api.js): функции fetch с Bearer токенами
- State management (из старого state.js): глобальное состояние
- CRUD операции (из старого crud.js): создание/редактирование персон и браков
- Рендеринг дерева (из старого render.js + layout.js): визуализация на canvas
- Поиск (из старого search.js): фильтрация персон
- GEDCOM import/export (из старого gedcom.js)

### 5. СОЗДАТЬ js/auth.js:
Взять redesign/js/auth.js и добавить:
- Реальные API вызовы для login/register/logout
- Проверку токена при загрузке страницы
- Редирект на index.html после успешного входа

## ДЕТАЛИ НОВОГО ДИЗАЙНА

### Цветовая палитра (CSS переменные):
```css
:root {
    --bg-primary: #1a1a1a;
    --bg-secondary: #242424;
    --bg-tertiary: #2d2d2d;
    --bg-hover: #3a3a3a;
    --text-primary: #ffffff;
    --text-secondary: #b0b0b0;
    --accent: #0D99FF;
    --accent-hover: #0A7FD4;
    --gender-male: #3B82F6;
    --gender-female: #EC4899;
    --border-color: #3a3a3a;
}
Layout структура (index.html):

┌─────────────┬───────────────────┬─────────────┐
│   Sidebar   │      Canvas       │    Panel    │
│   260px     │      (flex)       │    300px    │
│             │                   │             │
│  - Search   │   Family Tree     │  - Info     │
│  - List     │   Visualization   │  - Gender   │
│  - Profile  │                   │  - Birth    │
│             │                   │  - Family   │
├─────────────┴───────────────────┴─────────────┤
│                   Toolbar (48px)               │
│            Zoom controls, Fit button           │
└───────────────────────────────────────────────┘
Компоненты для реализации:
Sidebar

Search input с иконкой лупы
Список персон с гендерными аватарами (32x32px)
Выделение выбранной персоны (--accent-muted фон)
Профиль пользователя внизу с кнопкой выхода
Right Panel

Секция "Информация" (имя, фамилия, отчество)
Gender selector (radio buttons: Муж/Жен)
Date picker (3 селекта: день/месяц/год) + возраст
Collapsible секция "Дополнительно"
Секция "Родственники" с карточками семей
Sticky кнопки внизу: Удалить (danger) + Сохранить (primary)
Canvas

SVG визуализация дерева
Zoom/pan с мышью
Клик по узлу для выбора
Toolbar

Zoom controls: минус, слайдер, плюс
Значение зума (например "70%")
Кнопка "На весь экран"
Modals (все из redesign):

Добавить родителей (2 колонки)
Добавить супруга
Добавить ребенка
Выбор супруга (создать/выбрать)
Выбор из дерева (с поиском)
Подтверждение удаления
Импорт/Экспорт GEDCOM
Toast notifications

4 типа: success, error, warning, info
Авто-скрытие через 4 секунды
Позиция: top center
Стили форм (auth pages):
Split layout: бренд слева (280px) + форма справа
Пошаговая регистрация с индикатором
Индикатор силы пароля (weak/fair/good/strong)
Password toggle (показать/скрыть)
Валидация полей в реальном времени
Иконки:
Lucide Icons через CDN:


<script src="https://unpkg.com/lucide@latest"></script>
<script>lucide.createIcons()</script>
Используемые иконки: search, upload, download, user, mars, venus,
heart, users, plus, trash, save, log-out, minus, maximize,
chevron-down, chevron-right, info, lock, eye, eye-off, shield,
grip-vertical, check, x, alert-triangle, user-plus

Шрифт:

<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
ВАЖНЫЕ ДЕТАЛИ РЕАЛИЗАЦИИ
API интеграция:
Все эндпоинты остаются прежними:

POST /api/auth/login.php
POST /api/auth/register.php
GET /api/auth/check.php
GET /api/tree/get.php
POST/PUT/DELETE /api/persons/
POST/PUT/DELETE /api/marriages/
POST /api/import/gedcom.php
Хранение токена:

localStorage.setItem('auth_token', token);
// В fetch запросах:
headers: { 'Authorization': 'Bearer ' + localStorage.getItem('auth_token') }
Модели данных:
Person:


{
  id, db_id, given_name, patronymic, surname, surname_at_birth,
  gender, birth_day, birth_month, birth (year), birth_place,
  birth_day_approx, birth_month_approx, birth_year_approx,
  death_day, death_month, death_year, death_place,
  occupation, residence, nationality, biography, is_root
}
Marriage:


{
  id, db_id, husband, wife, children[],
  marriage_day, marriage_month, marriage_year,
  divorce_year, is_divorced
}
State:

const state = {
    zoom: 0.7,
    panX: 0, panY: 0,
    selectedPerson: null,
    positions: {},
    personsData: [],
    marriages: []
};

const appState = {
    isAuthenticated: false,
    accessLevel: 'owner', // owner|editor|viewer
    user: null,
    treeId: null
};
ФИНАЛЬНАЯ СТРУКТУРА ФАЙЛОВ

/
├── index.html          (из redesign, с подключением скриптов)
├── login.html          (из redesign)
├── register.html       (из redesign)
├── css/
│   ├── styles.css      (из redesign - 2030 строк)
│   └── auth.css        (из redesign - 892 строки)
├── js/
│   ├── app.js          (redesign/app.js + API + CRUD + render + layout)
│   └── auth.js         (redesign/auth.js + реальные API вызовы)
├── api/                (БЕЗ ИЗМЕНЕНИЙ)
│   ├── config/
│   ├── includes/
│   ├── auth/
│   ├── tree/
│   ├── persons/
│   ├── marriages/
│   └── import/
└── database/           (БЕЗ ИЗМЕНЕНИЙ)
ПОРЯДОК ВЫПОЛНЕНИЯ
Скопировать HTML файлы из redesign в корень
Скопировать CSS файлы из redesign/css в css/
Создать js/app.js:
Скопировать redesign/js/app.js
Добавить API функции
Добавить state management
Добавить CRUD операции
Добавить рендеринг дерева
Добавить search/filter
Добавить GEDCOM import/export
Создать js/auth.js:
Скопировать redesign/js/auth.js
Добавить реальные API вызовы
Добавить проверку авторизации
Удалить старые файлы:
js/templates.js
js/modules/*
js/utils/*
js/api.js, state.js, ui.js, auth-ui.js
Протестировать все функции
КРИТЕРИИ УСПЕХА
✅ Визуально идентичен redesign (каждый пиксель)
✅ Login/Register работают с API
✅ Дерево загружается и отображается
✅ CRUD операции с персонами работают
✅ CRUD операции с браками работают
✅ Zoom/pan работает
✅ Поиск работает
✅ Модальные окна работают
✅ GEDCOM import/export работает
✅ Нет templates.js и модульной структуры
✅ Только 2 JS файла: app.js и auth.js