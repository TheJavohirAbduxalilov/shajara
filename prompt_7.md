# ЗАДАЧА: Добавить :active стейты для эффекта нажатия

## ОПИСАНИЕ

Добавить плавный эффект уменьшения (scale down) при нажатии/удержании на все интерактивные элементы. Это создаёт тактильную обратную связь и делает интерфейс более отзывчивым.

---

## ЭФФЕКТ

При нажатии (mousedown/touch) элемент немного уменьшается, при отпускании — возвращается к исходному размеру.

```css
element:active {
    transform: scale(0.97);
}
```

Для маленьких элементов (иконки, чекбоксы):
```css
element:active {
    transform: scale(0.92);
}
```

---

## ЭЛЕМЕНТЫ ДЛЯ ДОБАВЛЕНИЯ :active

### 1. Кнопки (buttons)

```css
/* Основные кнопки */
.action-btn:active {
    transform: scale(0.97);
}

/* Кнопки в тулбаре */
.toolbar-btn:active {
    transform: scale(0.92);
}

/* Кнопки в хедере */
.header-icon-btn:active {
    transform: scale(0.92);
}

/* Кнопки секций (chevron) */
.section-icon-btn:active {
    transform: scale(0.88);
}

/* Кнопки добавления (+ Добавить...) */
.add-btn:active {
    transform: scale(0.98);
}

/* Кнопки в модалках */
.modal-btn:active {
    transform: scale(0.97);
}

/* Кнопка закрытия модалки */
.modal-close:active {
    transform: scale(0.88);
}

/* Кнопки выбора (choice buttons в модалках) */
.choice-btn:active {
    transform: scale(0.97);
}
```

### 2. Интерактивные элементы списков

```css
/* Элемент персоны в sidebar */
.person-item:active {
    transform: scale(0.98);
}

/* Элемент персоны в модальном списке */
.modal-person-item:active {
    transform: scale(0.98);
}

/* Элементы связей (родители, дети) */
.relation-item:active {
    transform: scale(0.98);
}

/* Drag handle */
.drag-handle:active {
    transform: scale(0.85);
}
```

### 3. Tree node (карточки на дереве)

```css
/* Карточка человека на дереве */
.tree-node:active {
    transform: scale(0.96);
}
```

### 4. Формы (inputs, selects)

```css
/* Поля ввода - лёгкий эффект */
.info-input:active,
.info-textarea:active,
.info-select:active,
.search-input:active {
    transform: scale(0.995);
}

/* Date picker selects */
.date-picker select:active {
    transform: scale(0.97);
}
```

### 5. Gender selector (radio buttons)

```css
/* Кнопки выбора пола */
.gender-btn:active {
    transform: scale(0.95);
}
```

### 6. Sidebar profile

```css
/* Кнопка выхода */
.sidebar-profile-logout:active {
    transform: scale(0.92);
}

/* Профиль (если кликабельный) */
.sidebar-profile:active {
    transform: scale(0.98);
}
```

### 7. Family cards

```css
/* Карточка семьи */
.family-card:active {
    transform: scale(0.99);
}
```

---

## ВАЖНО: Добавить transition для плавности

Убедиться что у ВСЕХ этих элементов есть transition для transform:

```css
/* Добавить transform в transition если его нет */
.element {
    transition: background-color var(--transition-fast),
                border-color var(--transition-fast),
                transform var(--transition-fast);  /* <- добавить */
}
```

Или проще — добавить глобальное правило:

```css
/* Глобальный transition для интерактивных элементов */
button,
.person-item,
.modal-person-item,
.relation-item,
.tree-node,
.gender-btn,
.choice-btn,
.family-card,
.drag-handle {
    transition: background-color var(--transition-fast),
                border-color var(--transition-fast),
                color var(--transition-fast),
                transform var(--transition-fast);
}
```

---

## ПОЛНЫЙ БЛОК CSS ДЛЯ ДОБАВЛЕНИЯ

Добавить в конец `css/styles.css` (или в секцию с интерактивными стилями):

```css
/* ----------------------------------------
   Active States (Press Effect)
   ---------------------------------------- */

/* Buttons */
.action-btn:active,
.modal-btn:active,
.choice-btn:active {
    transform: scale(0.97);
}

.toolbar-btn:active,
.header-icon-btn:active,
.sidebar-profile-logout:active {
    transform: scale(0.92);
}

.section-icon-btn:active,
.modal-close:active {
    transform: scale(0.88);
}

.add-btn:active {
    transform: scale(0.98);
}

/* List items */
.person-item:active,
.modal-person-item:active,
.relation-item:active {
    transform: scale(0.98);
}

/* Tree node */
.tree-node:active {
    transform: scale(0.96);
}

/* Gender selector */
.gender-btn:active {
    transform: scale(0.95);
}

/* Form elements (subtle) */
.info-input:active,
.info-textarea:active,
.info-select:active,
.search-input:active {
    transform: scale(0.998);
}

.date-picker select:active {
    transform: scale(0.97);
}

/* Drag handle */
.drag-handle:active {
    transform: scale(0.85);
}

/* Family card */
.family-card:active {
    transform: scale(0.99);
}

/* Ensure smooth transitions */
button,
[role="button"],
.person-item,
.modal-person-item,
.relation-item,
.tree-node,
.gender-btn,
.choice-btn,
.family-card,
.drag-handle,
.add-btn {
    transition: background-color var(--transition-fast),
                border-color var(--transition-fast),
                color var(--transition-fast),
                box-shadow var(--transition-fast),
                transform var(--transition-fast);
}
```

---

## КРИТЕРИИ УСПЕХА

✅ Все кнопки имеют эффект нажатия (scale down)
✅ Person-item в sidebar имеет эффект нажатия
✅ Tree-node имеет эффект нажатия
✅ Элементы форм имеют лёгкий эффект нажатия
✅ Все эффекты плавные (с transition)
✅ Эффект не слишком сильный (0.92-0.98 в зависимости от размера элемента)
✅ Маленькие элементы (иконки) имеют более заметный эффект (0.85-0.92)
✅ Большие элементы имеют менее заметный эффект (0.97-0.99)
