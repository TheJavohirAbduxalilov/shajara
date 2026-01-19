# ЗАДАЧА: Исправления дизайна tree-node и миграция БД

## 1. ИСПРАВИТЬ СТИЛЬ ВЫДЕЛЕНИЯ tree-node

### Проблема:
Сейчас `.tree-node--selected` использует `--accent-muted` (прозрачный голубой фон), что выглядит не так хорошо.

### Решение:
Сделать выделение через `outline` как у input полей при focus, без изменения фона.

### Текущий код (css/styles.css, строки ~1883-1891):
```css
.tree-node--selected {
    background-color: var(--accent-muted);
    border-color: var(--accent);
}

.tree-node--selected:hover {
    background-color: var(--accent-muted);
    border-color: var(--accent);
}
```

### Заменить на:
```css
.tree-node--selected {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
}

.tree-node--selected:hover {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
}
```

---

## 2. ПЕРЕДЕЛАТЬ ДИЗАЙН tree-node КАК person-item

### Проблема:
Сейчас gender в tree-node - это маленькая точка 8x8px. Нужно сделать как в sidebar (person-item): аватарка с иконкой gender.

### Текущий дизайн tree-node (плохо):
```
┌─────────────────────┐
│ ● Имя Фамилия       │  ← точка 8px для gender
└─────────────────────┘
```

### Нужный дизайн (как person-item):
```
┌──────────────────────────┐
│  ┌────┐                  │
│  │ ♂  │  Имя Фамилия     │  ← аватарка 28x28 с иконкой
│  └────┘                  │
└──────────────────────────┘
```

### Референс - стиль person-avatar из sidebar (css/styles.css ~535-561):
```css
.person-avatar {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-full);
}

.person-avatar svg {
    width: 16px;
    height: 16px;
}

.person-avatar--male {
    background-color: rgba(59, 130, 246, 0.15);
    color: var(--gender-male);
}

.person-avatar--female {
    background-color: rgba(236, 72, 153, 0.15);
    color: var(--gender-female);
}
```

### Изменения в CSS (css/styles.css):

Удалить старые стили `.tree-node-gender` (строки ~1900-1913).

Обновить `.tree-node-content` для вертикального центрирования:
```css
.tree-node-content {
    display: flex;
    align-items: center;  /* вертикальное центрирование */
    gap: var(--spacing-sm);
    padding: var(--spacing-sm) var(--spacing-md);
    height: 100%;
}
```

Добавить стили для аватарки в tree-node:
```css
.tree-node-avatar {
    width: 28px;
    height: 28px;
    min-width: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-full);
}

.tree-node-avatar svg {
    width: 14px;
    height: 14px;
}

.tree-node-avatar--male {
    background-color: rgba(59, 130, 246, 0.15);
    color: var(--gender-male);
}

.tree-node-avatar--female {
    background-color: rgba(236, 72, 153, 0.15);
    color: var(--gender-female);
}

.tree-node-avatar--unknown {
    background-color: var(--bg-hover);
    color: var(--text-muted);
}
```

### Изменения в JS (js/app.js):

Найти функцию рендеринга tree-node и заменить генерацию gender-точки на аватарку.

Было (примерно):
```html
<div class="tree-node-gender tree-node-gender--male"></div>
```

Стало:
```html
<div class="tree-node-avatar tree-node-avatar--male">
    <i data-lucide="mars"></i>
</div>
```

Для female:
```html
<div class="tree-node-avatar tree-node-avatar--female">
    <i data-lucide="venus"></i>
</div>
```

Для unknown gender:
```html
<div class="tree-node-avatar tree-node-avatar--unknown">
    <i data-lucide="user"></i>
</div>
```

После добавления узлов вызвать `lucide.createIcons()` для рендеринга иконок.

---

## 3. МИГРАЦИЯ БАЗЫ ДАННЫХ

### Анализ текущего состояния:

#### PERSONS таблица - ВСЕ ПОЛЯ ИСПОЛЬЗУЮТСЯ:
- id, tree_id, given_name, patronymic, surname, surname_at_birth
- gender (enum: male, female)
- birth_day, birth_day_approx, birth_month, birth_month_approx, birth_year, birth_year_approx
- birth_place, occupation, residence, nationality, biography
- is_root, created_at, updated_at

#### MARRIAGES таблица - ЕСТЬ НЕИСПОЛЬЗУЕМЫЕ ПОЛЯ:
Используются:
- id, tree_id, husband_id, wife_id
- marriage_day, marriage_month, marriage_year (+ approx флаги)
- divorce_day, divorce_month, divorce_year (+ approx флаги)
- is_divorced, created_at

**НЕ ИСПОЛЬЗУЮТСЯ (legacy):**
- `marriage_date` (DATE) - старое поле, заменено на day/month/year
- `divorce_date` (DATE) - старое поле, заменено на day/month/year

### Создать миграцию: database/migrations/2025_01_08_cleanup_legacy_date_fields.sql

```sql
-- Migration: Remove legacy DATE fields from marriages table
-- These were replaced by separate day/month/year fields in migration 2025_01_07

-- Remove legacy marriage_date field (replaced by marriage_day, marriage_month, marriage_year)
ALTER TABLE marriages DROP COLUMN IF EXISTS marriage_date;

-- Remove legacy divorce_date field (replaced by divorce_day, divorce_month, divorce_year)
ALTER TABLE marriages DROP COLUMN IF EXISTS divorce_date;
```

### Обновить schema.sql

Убедиться что в schema.sql НЕТ полей marriage_date и divorce_date.

Актуальная структура marriages:
```sql
CREATE TABLE marriages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tree_id INT NOT NULL,
    husband_id INT NOT NULL,
    wife_id INT NOT NULL,
    marriage_day TINYINT NULL,
    marriage_month TINYINT NULL,
    marriage_year SMALLINT NULL,
    marriage_day_approx BOOLEAN DEFAULT FALSE,
    marriage_month_approx BOOLEAN DEFAULT FALSE,
    marriage_year_approx BOOLEAN DEFAULT FALSE,
    divorce_day TINYINT NULL,
    divorce_month TINYINT NULL,
    divorce_year SMALLINT NULL,
    divorce_day_approx BOOLEAN DEFAULT FALSE,
    divorce_month_approx BOOLEAN DEFAULT FALSE,
    divorce_year_approx BOOLEAN DEFAULT FALSE,
    is_divorced BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tree_id) REFERENCES trees(id) ON DELETE CASCADE,
    FOREIGN KEY (husband_id) REFERENCES persons(id) ON DELETE CASCADE,
    FOREIGN KEY (wife_id) REFERENCES persons(id) ON DELETE CASCADE
);
```

---

## 4. ПРОВЕРКА API

Проверить файлы API что они не используют старые поля:
- `api/marriages/index.php` - убедиться нет SELECT/INSERT/UPDATE для marriage_date, divorce_date
- `api/tree/get.php` - убедиться нет запросов к этим полям

Если есть - удалить эти поля из запросов.

---

## ПОРЯДОК ВЫПОЛНЕНИЯ

1. **CSS**: Исправить `.tree-node--selected` на outline
2. **CSS**: Добавить стили `.tree-node-avatar`
3. **CSS**: Удалить старые стили `.tree-node-gender`
4. **JS**: Обновить рендеринг tree-node с аватаркой
5. **DB**: Создать миграцию для удаления legacy полей
6. **DB**: Обновить schema.sql
7. **API**: Проверить и очистить запросы от legacy полей

---

## КРИТЕРИИ УСПЕХА

✅ Выделенный tree-node имеет outline вместо прозрачного фона
✅ tree-node имеет аватарку с gender иконкой (как person-item в sidebar)
✅ Контент tree-node центрирован вертикально
✅ Аватарка: 28x28px, круглая, с иконкой mars/venus/user
✅ Цвета аватарки: синий для male, розовый для female, серый для unknown
✅ База данных не содержит неиспользуемых полей
✅ API не запрашивает несуществующие поля