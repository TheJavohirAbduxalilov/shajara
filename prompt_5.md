# ЗАДАЧА: Мелкие визуальные правки

## 1. ИСПРАВИТЬ ОТСТУП В СЕКЦИИ "СЕМЬИ"

### Проблема:
Когда семей нету, секция "Семьи" имеет слишком большой отступ снизу по сравнению с секцией "Родители".

### Найти в css/styles.css:

Стили для `.families-container` или секции семей. Возможно есть лишний padding/margin когда контейнер пустой.

### Решение:

Убедиться что `.families-container` не имеет лишних отступов когда пустой:

```css
.families-container {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
}

/* Когда пустой - убрать отступы */
.families-container:empty {
    display: none;
}
```

Или если отступ идёт от родительского элемента, проверить секцию:
```css
.panel-section {
    padding: var(--spacing-lg);
}

/* Убрать нижний padding если families-container пустой */
```

Сравнить со стилями секции "Родители" и сделать одинаково.

---

## 2. ОБРЕЗАТЬ ДЛИННОЕ ИМЯ В TREE-NODE

### Проблема:
Когда ФИО слишком длинное (например "Жавохир Абдухалилов"), текст выходит за границы карточки tree-node.

### Найти в css/styles.css:

Стили для `.tree-node-name` (примерно строка ~1915).

### Добавить text-overflow:

```css
.tree-node-name {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
}
```

### Также проверить родительский элемент:

```css
.tree-node-content {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-sm) var(--spacing-md);
    overflow: hidden;  /* Добавить */
}

.tree-node {
    /* ... существующие стили ... */
    max-width: 200px;  /* Или другое значение, ограничить ширину */
    overflow: hidden;  /* Добавить если нет */
}
```

Результат: "Жавохир Абдухалилов" → "Жавохир Абдухали..."

---

## 3. ПОМЕНЯТЬ МЕСТАМИ ИКОНКИ ИМПОРТА И ЭКСПОРТА

### Проблема:
Иконки для кнопок импорта и экспорта перепутаны местами.

### Найти в index.html:

Кнопки импорта/экспорта в sidebar (вероятно в секции с действиями):

```html
<!-- Сейчас (неправильно): -->
<button id="import-btn" title="Импорт">
    <i data-lucide="download"></i>  <!-- download для импорта - неправильно -->
</button>
<button id="export-btn" title="Экспорт">
    <i data-lucide="upload"></i>  <!-- upload для экспорта - неправильно -->
</button>
```

### Исправить на:

```html
<!-- Правильно: -->
<button id="import-btn" title="Импорт">
    <i data-lucide="upload"></i>  <!-- upload = загрузить В приложение = импорт -->
</button>
<button id="export-btn" title="Экспорт">
    <i data-lucide="download"></i>  <!-- download = скачать ИЗ приложения = экспорт -->
</button>
```

### Логика иконок:
- **Импорт** (загрузить данные В приложение) → `upload` (стрелка вверх)
- **Экспорт** (скачать данные ИЗ приложения) → `download` (стрелка вниз)

---

## КРИТЕРИИ УСПЕХА

✅ Секция "Семьи" имеет такой же отступ как "Родители" когда пустая
✅ Длинные имена в tree-node обрезаются с "..."
✅ Текст не выходит за границы карточки tree-node
✅ Иконка импорта - upload (стрелка вверх)
✅ Иконка экспорта - download (стрелка вниз)
