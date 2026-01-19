# ЗАДАЧА: Заменить скроллбары на градиентный туман

## ОПИСАНИЕ

Убрать видимые скроллбары и заменить их на градиентный "туман" сверху/снизу контейнера, который появляется только когда есть куда скроллить. Это создаёт более чистый интерфейс и интуитивно подсказывает пользователю что есть ещё контент.

---

## ЧАСТЬ 1: CSS — Скрыть скроллбары

### Убрать текущие стили скроллбаров

Найти и удалить в `css/styles.css` все стили `::-webkit-scrollbar`:

```css
/* УДАЛИТЬ ЭТО: */
::-webkit-scrollbar {
    width: 6px;
}
::-webkit-scrollbar-track {
    background: transparent;
}
::-webkit-scrollbar-thumb {
    background-color: var(--border-color);
    border-radius: var(--radius-full);
}
::-webkit-scrollbar-thumb:hover {
    background-color: var(--text-muted);
}
```

### Добавить скрытие скроллбаров глобально

```css
/* ----------------------------------------
   Hidden Scrollbars (scroll still works)
   ---------------------------------------- */

/* Hide scrollbar for Chrome, Safari, Edge */
.scroll-container::-webkit-scrollbar,
.sidebar-content::-webkit-scrollbar,
.panel-content::-webkit-scrollbar,
.modal-list::-webkit-scrollbar,
.person-list::-webkit-scrollbar {
    display: none;
}

/* Hide scrollbar for Firefox */
.scroll-container,
.sidebar-content,
.panel-content,
.modal-list,
.person-list {
    scrollbar-width: none;
}

/* Hide scrollbar for IE/Edge Legacy */
.scroll-container,
.sidebar-content,
.panel-content,
.modal-list,
.person-list {
    -ms-overflow-style: none;
}
```

---

## ЧАСТЬ 2: CSS — Градиентный туман

### Создать контейнер-обёртку для тумана

Контейнеры со скроллом должны быть обёрнуты в элемент с `position: relative` для позиционирования градиентов.

```css
/* ----------------------------------------
   Scroll Fade (Fog Effect)
   ---------------------------------------- */

/* Wrapper for scroll containers */
.scroll-fade-wrapper {
    position: relative;
    overflow: hidden;
}

/* Top fade gradient */
.scroll-fade-wrapper::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 48px;
    background: linear-gradient(
        to bottom,
        var(--bg-secondary) 0%,
        rgba(36, 36, 36, 0.8) 30%,
        rgba(36, 36, 36, 0) 100%
    );
    pointer-events: none;
    z-index: 10;
    opacity: 0;
    transition: opacity var(--transition-normal);
}

/* Bottom fade gradient */
.scroll-fade-wrapper::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 48px;
    background: linear-gradient(
        to top,
        var(--bg-secondary) 0%,
        rgba(36, 36, 36, 0.8) 30%,
        rgba(36, 36, 36, 0) 100%
    );
    pointer-events: none;
    z-index: 10;
    opacity: 0;
    transition: opacity var(--transition-normal);
}

/* Show top fade when scrolled down */
.scroll-fade-wrapper.has-scroll-top::before {
    opacity: 1;
}

/* Show bottom fade when can scroll down */
.scroll-fade-wrapper.has-scroll-bottom::after {
    opacity: 1;
}
```

### Варианты для разных фонов

```css
/* For primary background (--bg-primary: #1a1a1a) */
.scroll-fade-wrapper--primary::before {
    background: linear-gradient(
        to bottom,
        var(--bg-primary) 0%,
        rgba(26, 26, 26, 0.8) 30%,
        rgba(26, 26, 26, 0) 100%
    );
}

.scroll-fade-wrapper--primary::after {
    background: linear-gradient(
        to top,
        var(--bg-primary) 0%,
        rgba(26, 26, 26, 0.8) 30%,
        rgba(26, 26, 26, 0) 100%
    );
}

/* For tertiary background (--bg-tertiary: #2d2d2d) */
.scroll-fade-wrapper--tertiary::before {
    background: linear-gradient(
        to bottom,
        var(--bg-tertiary) 0%,
        rgba(45, 45, 45, 0.8) 30%,
        rgba(45, 45, 45, 0) 100%
    );
}

.scroll-fade-wrapper--tertiary::after {
    background: linear-gradient(
        to top,
        var(--bg-tertiary) 0%,
        rgba(45, 45, 45, 0.8) 30%,
        rgba(45, 45, 45, 0) 100%
    );
}
```

---

## ЧАСТЬ 3: HTML — Структура

### Sidebar (person-list)

```html
<!-- Было: -->
<div class="person-list">
    <!-- items -->
</div>

<!-- Стало: -->
<div class="scroll-fade-wrapper" data-scroll-fade>
    <div class="person-list">
        <!-- items -->
    </div>
</div>
```

### Panel

```html
<!-- Было: -->
<div class="panel">
    <div class="panel-section">...</div>
    <div class="panel-section">...</div>
</div>

<!-- Стало: -->
<div class="panel">
    <div class="scroll-fade-wrapper" data-scroll-fade>
        <div class="panel-content">
            <div class="panel-section">...</div>
            <div class="panel-section">...</div>
        </div>
    </div>
    <div class="panel-actions">...</div> <!-- Actions остаются вне скролла -->
</div>
```

### Modal lists

```html
<!-- Было: -->
<div class="modal-list">
    <!-- items -->
</div>

<!-- Стало: -->
<div class="scroll-fade-wrapper scroll-fade-wrapper--tertiary" data-scroll-fade>
    <div class="modal-list">
        <!-- items -->
    </div>
</div>
```

---

## ЧАСТЬ 4: JavaScript — Динамическое управление

### Добавить в `js/app.js`:

```javascript
/* ----------------------------------------
   Scroll Fade Manager
   ---------------------------------------- */

function initScrollFade() {
    const wrappers = document.querySelectorAll('[data-scroll-fade]');

    wrappers.forEach(wrapper => {
        const scrollContainer = wrapper.firstElementChild;
        if (!scrollContainer) return;

        // Initial check
        updateScrollFade(wrapper, scrollContainer);

        // Listen to scroll
        scrollContainer.addEventListener('scroll', () => {
            updateScrollFade(wrapper, scrollContainer);
        }, { passive: true });
    });

    // Re-check on window resize
    window.addEventListener('resize', () => {
        wrappers.forEach(wrapper => {
            const scrollContainer = wrapper.firstElementChild;
            if (scrollContainer) {
                updateScrollFade(wrapper, scrollContainer);
            }
        });
    }, { passive: true });
}

function updateScrollFade(wrapper, scrollContainer) {
    const { scrollTop, scrollHeight, clientHeight } = scrollContainer;

    // Check if can scroll at all
    const canScroll = scrollHeight > clientHeight;

    // Check scroll position
    const isScrolledFromTop = scrollTop > 5; // Small threshold
    const isScrolledToBottom = scrollTop + clientHeight >= scrollHeight - 5;

    // Toggle classes
    if (canScroll && isScrolledFromTop) {
        wrapper.classList.add('has-scroll-top');
    } else {
        wrapper.classList.remove('has-scroll-top');
    }

    if (canScroll && !isScrolledToBottom) {
        wrapper.classList.add('has-scroll-bottom');
    } else {
        wrapper.classList.remove('has-scroll-bottom');
    }
}

// Call after DOM content changes (e.g., after rendering list)
function refreshScrollFade(wrapper) {
    const scrollContainer = wrapper?.firstElementChild;
    if (wrapper && scrollContainer) {
        updateScrollFade(wrapper, scrollContainer);
    }
}

// Refresh all scroll fades
function refreshAllScrollFades() {
    document.querySelectorAll('[data-scroll-fade]').forEach(wrapper => {
        const scrollContainer = wrapper.firstElementChild;
        if (scrollContainer) {
            updateScrollFade(wrapper, scrollContainer);
        }
    });
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', initScrollFade);
```

### Вызывать `refreshAllScrollFades()` после:

1. Загрузки данных с API и рендеринга списка персон
2. Открытия модального окна со списком
3. Добавления/удаления элементов из списка
4. Любого изменения контента в скроллируемых контейнерах

```javascript
// Пример: после рендеринга sidebar
function renderSidebar() {
    // ... рендеринг списка персон ...

    // Обновить состояние тумана
    refreshAllScrollFades();
}

// Пример: после открытия модалки со списком
function openPersonSelectModal() {
    // ... показ модалки и рендеринг списка ...

    // Подождать следующий кадр и обновить
    requestAnimationFrame(() => {
        refreshAllScrollFades();
    });
}
```

---

## ЧАСТЬ 5: Дополнительные стили

### Убедиться что скроллируемые контейнеры имеют правильные стили

```css
/* Scrollable containers */
.person-list,
.panel-content,
.modal-list {
    overflow-y: auto;
    overflow-x: hidden;
}

/* Wrapper fills available space */
.scroll-fade-wrapper {
    flex: 1;
    min-height: 0; /* Important for flex containers */
    display: flex;
    flex-direction: column;
}

.scroll-fade-wrapper > * {
    flex: 1;
    min-height: 0;
}
```

---

## ВИЗУАЛЬНЫЙ РЕЗУЛЬТАТ

```
Начальное состояние (не проскроллено):
┌─────────────────┐
│ Item 1          │
│ Item 2          │
│ Item 3          │
│ Item 4          │
│▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒│ ← туман снизу (есть ещё контент)
└─────────────────┘

Проскроллено в середину:
┌─────────────────┐
│░░░░░░░░░░░░░░░░░│ ← туман сверху (есть контент выше)
│ Item 3          │
│ Item 4          │
│ Item 5          │
│▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒│ ← туман снизу (есть ещё контент)
└─────────────────┘

Проскроллено до конца:
┌─────────────────┐
│░░░░░░░░░░░░░░░░░│ ← туман сверху (есть контент выше)
│ Item 5          │
│ Item 6          │
│ Item 7          │
│ Item 8          │ ← нет тумана снизу (конец списка)
└─────────────────┘

Короткий список (всё помещается):
┌─────────────────┐
│ Item 1          │
│ Item 2          │ ← нет тумана (скролл не нужен)
│                 │
│                 │
└─────────────────┘
```

---

## КРИТЕРИИ УСПЕХА

✅ Скроллбары не видны, но скролл работает (колёсико мыши, тач)
✅ Туман снизу появляется когда есть контент ниже viewport
✅ Туман сверху появляется когда проскроллено вниз
✅ Туман исчезает когда достигнут край (верх или низ)
✅ Туман не появляется если весь контент помещается
✅ Туман плавно появляется/исчезает (transition)
✅ Работает в sidebar (список персон)
✅ Работает в right panel
✅ Работает в модальных окнах со списками
✅ Цвет тумана соответствует фону контейнера
✅ Туман не блокирует клики (pointer-events: none)
