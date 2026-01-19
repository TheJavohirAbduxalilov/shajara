# ЗАДАЧА: Заменить стандартные курсоры на кастомные

## РЕСУРСЫ

В папке `/cursors/` есть 4 PNG файла:
- `default.png` — стандартная стрелка (для обычного состояния)
- `pointer.png` — рука с указательным пальцем (для кликабельных элементов)
- `drag.png` — открытая ладонь (для перетаскивания)
- `type.png` — текстовый курсор I-beam (для полей ввода)

---

## CSS РЕАЛИЗАЦИЯ

### Добавить в `css/styles.css`:

```css
/* ----------------------------------------
   Custom Cursors
   ---------------------------------------- */

/* Default cursor - стрелка */
*,
body {
    cursor: url('/cursors/default.png'), auto;
}

/* Pointer cursor - для кликабельных элементов */
a,
button,
[role="button"],
input[type="button"],
input[type="submit"],
input[type="reset"],
input[type="checkbox"],
input[type="radio"],
select,
label[for],
.person-item,
.modal-person-item,
.relation-item,
.tree-node,
.toolbar-btn,
.header-icon-btn,
.section-icon-btn,
.section-header,
.add-btn,
.modal-btn,
.modal-close,
.choice-btn,
.gender-btn,
.sidebar-profile-logout,
.family-card-header,
.drag-handle {
    cursor: url('/cursors/pointer.png'), pointer;
}

/* Text cursor - для полей ввода текста */
input[type="text"],
input[type="email"],
input[type="password"],
input[type="search"],
input[type="url"],
input[type="tel"],
input[type="number"],
textarea,
[contenteditable="true"],
.info-input,
.info-textarea,
.search-input {
    cursor: url('/cursors/type.png') 12 12, text;
}

/* Drag cursor - для области дерева (pan/drag) */
.canvas,
.canvas-content,
.workspace {
    cursor: url('/cursors/drag.png') 16 16, grab;
}

/* Drag cursor при активном перетаскивании */
.canvas:active,
.canvas-content:active,
.workspace:active,
.canvas.dragging,
.workspace.dragging {
    cursor: url('/cursors/drag.png') 16 16, grabbing;
}

/* Drag handle в списках */
.drag-handle:active {
    cursor: url('/cursors/drag.png') 16 16, grabbing;
}
```

---

## HOTSPOT (ТОЧКА КЛИКА)

Критически важно указать правильную точку клика для каждого курсора!

Формат: `cursor: url('path.png') X Y, fallback;`
- X, Y — координаты точки клика относительно левого верхнего угла изображения

### Рекомендуемые hotspot значения:

```css
/* Default (стрелка) - точка в верхнем левом углу */
cursor: url('/cursors/default.png') 0 0, auto;

/* Pointer (указательный палец) - кончик пальца */
cursor: url('/cursors/pointer.png') 6 0, pointer;

/* Drag (ладонь) - центр ладони */
cursor: url('/cursors/drag.png') 16 16, grab;

/* Type (I-beam) - центр по горизонтали, верх */
cursor: url('/cursors/type.png') 12 12, text;
```

**ВАЖНО:** Эти значения приблизительные! Нужно проверить реальные размеры изображений и подобрать точные координаты чтобы курсор был удобным.

---

## ПРОВЕРКА РАЗМЕРОВ КУРСОРОВ

Рекомендуемый размер курсоров: 32x32px или меньше.

Если курсоры больше, браузер может их не отображать! В таком случае:
1. Уменьшить изображения до 32x32px
2. Или использовать `.cur` / `.svg` формат

---

## ПОЛНЫЙ БЛОК CSS С HOTSPOTS

```css
/* ----------------------------------------
   Custom Cursors
   ---------------------------------------- */

/* CSS переменные для путей (удобно менять) */
:root {
    --cursor-default: url('/cursors/default.png');
    --cursor-pointer: url('/cursors/pointer.png');
    --cursor-drag: url('/cursors/drag.png');
    --cursor-type: url('/cursors/type.png');
}

/* Default - стрелка (hotspot: верхний левый угол) */
*,
body,
html {
    cursor: var(--cursor-default) 0 0, auto;
}

/* Pointer - палец (hotspot: кончик пальца ~6px от левого края) */
a,
button,
[role="button"],
input[type="button"],
input[type="submit"],
input[type="reset"],
input[type="checkbox"],
input[type="radio"],
select,
option,
label,
.person-item,
.modal-person-item,
.relation-item,
.relation-item--empty,
.tree-node,
.toolbar-btn,
.header-icon-btn,
.section-icon-btn,
.section-header,
.section-toggle,
.add-btn,
.modal-btn,
.modal-close,
.choice-btn,
.gender-btn,
.gender-option,
.sidebar-profile,
.sidebar-profile-logout,
.family-card-header,
.drag-handle,
.zoom-slider,
[onclick],
[data-action] {
    cursor: var(--cursor-pointer) 6 0, pointer;
}

/* Type - текстовый (hotspot: центр I-beam) */
input:not([type="button"]):not([type="submit"]):not([type="reset"]):not([type="checkbox"]):not([type="radio"]),
textarea,
[contenteditable="true"],
.info-input,
.info-textarea,
.search-input,
.modal-search-input {
    cursor: var(--cursor-type) 12 12, text;
}

/* Drag - ладонь для canvas (hotspot: центр ладони) */
.canvas,
.canvas-content,
.workspace {
    cursor: var(--cursor-drag) 16 16, grab;
}

/* Dragging state */
.canvas:active,
.canvas-content:active,
.workspace:active {
    cursor: var(--cursor-drag) 16 16, grabbing;
}
```

---

## ДОПОЛНИТЕЛЬНО: JS ДЛЯ DRAGGING STATE (если нужно)

Если `:active` не работает корректно для drag, добавить класс через JS:

```javascript
// В секции viewport/pan
const canvas = document.querySelector('.canvas');

canvas.addEventListener('mousedown', () => {
    canvas.classList.add('dragging');
});

document.addEventListener('mouseup', () => {
    canvas.classList.remove('dragging');
});
```

---

## FALLBACK

Всегда указывать fallback курсор после кастомного:
- `auto` — для default
- `pointer` — для кликабельных
- `text` — для текстовых полей
- `grab` / `grabbing` — для drag

Это гарантирует что если кастомный курсор не загрузится, будет стандартный.

---

## КРИТЕРИИ УСПЕХА

✅ Стандартный курсор (стрелка) заменён на `default.png`
✅ На кликабельных элементах курсор `pointer.png`
✅ В текстовых полях курсор `type.png`
✅ На canvas дерева курсор `drag.png`
✅ Hotspot точки настроены правильно — клик происходит в ожидаемом месте
✅ Все курсоры имеют fallback значения
✅ Курсоры работают во всех основных браузерах (Chrome, Firefox, Edge)
