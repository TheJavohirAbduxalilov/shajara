# ЗАДАЧА: Синхронизация базы данных с интерфейсом

## КОНТЕКСТ

Интерфейс был переделан и многие поля были убраны или добавлены, но база данных не синхронизирована с этими изменениями.

---

## АНАЛИЗ: ЧТО ЕСТЬ В ИНТЕРФЕЙСЕ

### Поля персоны в панели редактирования (index.html + app.js):

**Секция "Информация":**
1. `given_name` - Имя
2. `surname` - Фамилия
3. `patronymic` - Отчество
4. `gender` - Пол (radio: male/female)
5. `birth_day`, `birth_month`, `birth_year` - Дата рождения (date picker)
6. **`data_accuracy`** - Точность данных (select: unknown/assumed/relative/confirmed) — **НОВОЕ ПОЛЕ!**

**Секция "Дополнительно":**
1. `surname_at_birth` - Фамилия при рождении
2. `birth_place` - Место рождения
3. `residence` - Место жительства
4. `nationality` - Национальность
5. `occupation` - Род деятельности
6. `biography` - Биография

**Секция "Связи":**
- Родители (отображение, без редактирования дат)
- Семьи/Браки (только супруг + дети, **БЕЗ дат брака/развода**)

### Что НЕТ в интерфейсе (убрано):
- ❌ Галочки "приблизительно" для дат (`birth_day_approx`, `birth_month_approx`, `birth_year_approx`)
- ❌ Даты брака (`marriage_day`, `marriage_month`, `marriage_year`)
- ❌ Флаги приблизительности брака (`marriage_day_approx`, `marriage_month_approx`, `marriage_year_approx`)
- ❌ Даты развода (`divorce_day`, `divorce_month`, `divorce_year`)
- ❌ Флаги приблизительности развода (`divorce_day_approx`, `divorce_month_approx`, `divorce_year_approx`)
- ❌ Флаг развода (`is_divorced`)

---

## МИГРАЦИЯ БАЗЫ ДАННЫХ

### Создать файл: `database/migrations/2025_01_09_sync_with_interface.sql`

```sql
-- ============================================
-- Migration: Sync database with new interface
-- Date: 2025-01-09
-- ============================================

-- ============================================
-- PERSONS TABLE CHANGES
-- ============================================

-- 1. УДАЛИТЬ неиспользуемые поля приблизительности дат
ALTER TABLE persons DROP COLUMN IF EXISTS birth_day_approx;
ALTER TABLE persons DROP COLUMN IF EXISTS birth_month_approx;
ALTER TABLE persons DROP COLUMN IF EXISTS birth_year_approx;

-- 2. ДОБАВИТЬ новое поле "Точность данных"
ALTER TABLE persons ADD COLUMN IF NOT EXISTS data_accuracy ENUM('unknown', 'assumed', 'relative', 'confirmed') DEFAULT 'unknown' AFTER birth_place;

-- ============================================
-- MARRIAGES TABLE CHANGES
-- ============================================

-- 3. УДАЛИТЬ все поля дат брака (не используются в интерфейсе)
ALTER TABLE marriages DROP COLUMN IF EXISTS marriage_day;
ALTER TABLE marriages DROP COLUMN IF EXISTS marriage_month;
ALTER TABLE marriages DROP COLUMN IF EXISTS marriage_year;
ALTER TABLE marriages DROP COLUMN IF EXISTS marriage_day_approx;
ALTER TABLE marriages DROP COLUMN IF EXISTS marriage_month_approx;
ALTER TABLE marriages DROP COLUMN IF EXISTS marriage_year_approx;

-- 4. УДАЛИТЬ все поля дат развода (не используются в интерфейсе)
ALTER TABLE marriages DROP COLUMN IF EXISTS divorce_day;
ALTER TABLE marriages DROP COLUMN IF EXISTS divorce_month;
ALTER TABLE marriages DROP COLUMN IF EXISTS divorce_year;
ALTER TABLE marriages DROP COLUMN IF EXISTS divorce_day_approx;
ALTER TABLE marriages DROP COLUMN IF EXISTS divorce_month_approx;
ALTER TABLE marriages DROP COLUMN IF EXISTS divorce_year_approx;

-- 5. УДАЛИТЬ флаг развода (не используется в интерфейсе)
ALTER TABLE marriages DROP COLUMN IF EXISTS is_divorced;
```

---

## ОБНОВИТЬ schema.sql

### Таблица `persons` (актуальная структура):

```sql
CREATE TABLE persons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tree_id INT NOT NULL,
    gender ENUM('male', 'female') DEFAULT NULL,
    is_root BOOLEAN DEFAULT FALSE,
    given_name VARCHAR(100) DEFAULT NULL,
    patronymic VARCHAR(100) DEFAULT NULL,
    surname VARCHAR(100) DEFAULT NULL,
    surname_at_birth VARCHAR(100) DEFAULT NULL,
    birth_day TINYINT DEFAULT NULL,
    birth_month TINYINT DEFAULT NULL,
    birth_year INT DEFAULT NULL,
    birth_place VARCHAR(255) DEFAULT NULL,
    data_accuracy ENUM('unknown', 'assumed', 'relative', 'confirmed') DEFAULT 'unknown',
    residence VARCHAR(255) DEFAULT NULL,
    occupation VARCHAR(255) DEFAULT NULL,
    nationality VARCHAR(255) DEFAULT NULL,
    biography TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tree_id) REFERENCES trees(id) ON DELETE CASCADE
);
```

### Таблица `marriages` (актуальная структура):

```sql
CREATE TABLE marriages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tree_id INT NOT NULL,
    husband_id INT NOT NULL,
    wife_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tree_id) REFERENCES trees(id) ON DELETE CASCADE,
    FOREIGN KEY (husband_id) REFERENCES persons(id) ON DELETE CASCADE,
    FOREIGN KEY (wife_id) REFERENCES persons(id) ON DELETE CASCADE,
    UNIQUE KEY unique_marriage (husband_id, wife_id)
);
```

### Таблица `marriage_children` (без изменений):

```sql
CREATE TABLE marriage_children (
    id INT AUTO_INCREMENT PRIMARY KEY,
    marriage_id INT NOT NULL,
    child_id INT NOT NULL,
    child_order INT DEFAULT 0,
    FOREIGN KEY (marriage_id) REFERENCES marriages(id) ON DELETE CASCADE,
    FOREIGN KEY (child_id) REFERENCES persons(id) ON DELETE CASCADE,
    UNIQUE KEY unique_child_in_marriage (marriage_id, child_id)
);
```

---

## ОБНОВИТЬ API

### Файл: `api/persons/index.php`

**В SELECT запросах:**
- Убрать: `birth_day_approx`, `birth_month_approx`, `birth_year_approx`
- Добавить: `data_accuracy`

**В INSERT запросах:**
- Убрать: `birth_day_approx`, `birth_month_approx`, `birth_year_approx`
- Добавить: `data_accuracy`

**В UPDATE запросах:**
- Убрать: `birth_day_approx`, `birth_month_approx`, `birth_year_approx`
- Добавить: `data_accuracy`

### Файл: `api/marriages/index.php`

**В SELECT запросах:**
- Убрать все поля: `marriage_day`, `marriage_month`, `marriage_year`, `marriage_day_approx`, `marriage_month_approx`, `marriage_year_approx`, `divorce_day`, `divorce_month`, `divorce_year`, `divorce_day_approx`, `divorce_month_approx`, `divorce_year_approx`, `is_divorced`

**В INSERT запросах:**
- Оставить только: `tree_id`, `husband_id`, `wife_id`

**В UPDATE запросах:**
- Убрать все поля дат брака/развода

### Файл: `api/tree/get.php`

Аналогично убрать все удалённые поля из SELECT запросов для persons и marriages.

---

## ОБНОВИТЬ FRONTEND (js/app.js)

### 1. Добавить обработку поля `data_accuracy`:

**При загрузке данных персоны в панель:**
```javascript
// Найти select для точности данных
const accuracySelect = panelElements.info.accuracySelect;
if (accuracySelect) {
    accuracySelect.value = person.data_accuracy || 'unknown';
}
```

**При сохранении данных персоны:**
```javascript
// Добавить data_accuracy в объект данных
const personData = {
    given_name: ...,
    surname: ...,
    // ... другие поля ...
    data_accuracy: panelElements.info.accuracySelect?.value || 'unknown'
};
```

### 2. Убрать обработку удалённых полей:

Удалить любые упоминания:
- `birth_day_approx`, `birth_month_approx`, `birth_year_approx`
- `marriage_day`, `marriage_month`, `marriage_year` и их approx версии
- `divorce_day`, `divorce_month`, `divorce_year` и их approx версии
- `is_divorced`

---

## ИТОГОВАЯ СВОДКА ИЗМЕНЕНИЙ

### PERSONS - удалить поля:
| Поле | Причина |
|------|---------|
| birth_day_approx | Заменено на data_accuracy |
| birth_month_approx | Заменено на data_accuracy |
| birth_year_approx | Заменено на data_accuracy |

### PERSONS - добавить поля:
| Поле | Тип | Описание |
|------|-----|----------|
| data_accuracy | ENUM('unknown','assumed','relative','confirmed') | Точность данных |

### MARRIAGES - удалить поля (13 штук):
| Поле | Причина |
|------|---------|
| marriage_day | Не используется в UI |
| marriage_month | Не используется в UI |
| marriage_year | Не используется в UI |
| marriage_day_approx | Не используется в UI |
| marriage_month_approx | Не используется в UI |
| marriage_year_approx | Не используется в UI |
| divorce_day | Не используется в UI |
| divorce_month | Не используется в UI |
| divorce_year | Не используется в UI |
| divorce_day_approx | Не используется в UI |
| divorce_month_approx | Не используется в UI |
| divorce_year_approx | Не используется в UI |
| is_divorced | Не используется в UI |

---

## КРИТЕРИИ УСПЕХА

✅ Миграция выполняется без ошибок
✅ Таблица persons имеет поле data_accuracy
✅ Таблица persons НЕ имеет полей birth_*_approx
✅ Таблица marriages содержит ТОЛЬКО: id, tree_id, husband_id, wife_id, created_at
✅ API persons возвращает и принимает data_accuracy
✅ API marriages НЕ возвращает и НЕ принимает поля дат/развода
✅ Frontend сохраняет и загружает data_accuracy
✅ Приложение работает корректно после миграции
