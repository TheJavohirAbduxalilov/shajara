# ЗАДАЧА: Убрать градиентные тени и вернуть минималистичный скроллбар

## ЧТО УДАЛИТЬ

### 1. Удалить все стили scroll-fade-wrapper

В `css/styles.css` найти и удалить всю секцию:
- `.scroll-fade-wrapper`
- `.scroll-fade-wrapper::before`
- `.scroll-fade-wrapper::after`
- `.scroll-fade-wrapper.has-scroll-top::before`
- `.scroll-fade-wrapper.has-scroll-bottom::after`
- `.scroll-fade-wrapper--primary::before/::after`
- `.scroll-fade-wrapper--tertiary::before/::after`

### 2. Удалить JS код для scroll fade

В `js/app.js` найти и удалить:
- `initScrollFade()`
- `updateScrollFade()`
- `refreshScrollFade()`
- `refreshAllScrollFades()`
- Все вызовы этих функций
- Event listeners для scroll fade

### 3. Убрать HTML обёртки

В `index.html` убрать все `<div class="scroll-fade-wrapper" data-scroll-fade>` обёртки и вернуть прямую структуру.

---

## ЧТО ДОБАВИТЬ

### Минималистичный скроллбар в `css/styles.css`:

```css
/* ----------------------------------------
   Minimal Scrollbar
   ---------------------------------------- */

/* Scrollbar track - ВСЕГДА занимает место, но прозрачный */
::-webkit-scrollbar {
    width: 6px;
    background: transparent;
}

/* Track всегда видим но прозрачный - резервирует место */
::-webkit-scrollbar-track {
    background: transparent;
}

/* Thumb - по умолчанию прозрачный */
::-webkit-scrollbar-thumb {
    background-color: transparent;
    border-radius: 3px;
    transition: background-color 0.2s ease;
}

/* Thumb появляется при hover на КОНТЕЙНЕР */
.sidebar:hover ::-webkit-scrollbar-thumb,
.panel:hover ::-webkit-scrollbar-thumb,
.modal-content:hover ::-webkit-scrollbar-thumb,
.person-list:hover::-webkit-scrollbar-thumb,
.panel-content:hover::-webkit-scrollbar-thumb,
.modal-list:hover::-webkit-scrollbar-thumb {
    background-color: rgba(255, 255, 255, 0.15);
}

/* Thumb при hover на сам скроллбар - чуть ярче */
::-webkit-scrollbar-thumb:hover {
    background-color: rgba(255, 255, 255, 0.25);
}

/* Firefox - скроллбар тонкий, цвета */
* {
    scrollbar-width: thin;
    scrollbar-color: transparent transparent;
}

.sidebar:hover,
.panel:hover,
.modal-content:hover {
    scrollbar-color: rgba(255, 255, 255, 0.15) transparent;
}
Альтернативный вариант (если первый не работает с hover на контейнер):

/* Scrollbar всегда занимает место */
::-webkit-scrollbar {
    width: 6px;
}

::-webkit-scrollbar-track {
    background: transparent;
}

/* Thumb очень subtle по умолчанию */
::-webkit-scrollbar-thumb {
    background-color: rgba(255, 255, 255, 0.05);
    border-radius: 3px;
}

/* При hover на контейнер - thumb становится видимым */
.sidebar:hover ::-webkit-scrollbar-thumb,
.panel:hover ::-webkit-scrollbar-thumb {
    background-color: rgba(255, 255, 255, 0.15);
}

/* При hover на сам thumb */
::-webkit-scrollbar-thumb:hover {
    background-color: rgba(255, 255, 255, 0.3);
}

/* При активном скролле */
::-webkit-scrollbar-thumb:active {
    background-color: rgba(255, 255, 255, 0.4);
}
КЛЮЧЕВЫЕ ТРЕБОВАНИЯ
Скроллбар ВСЕГДА занимает 6px — чтобы не было скачка ширины контента
Track прозрачный — не видно полосы
Thumb прозрачный по умолчанию — чистый вид
Thumb появляется при hover — на контейнер или при скролле
Плавный transition — появление/исчезновение thumb
КРИТЕРИИ УСПЕХА
✅ Все градиентные тени удалены
✅ Все scroll-fade-wrapper удалены из HTML
✅ Весь JS код для scroll fade удалён
✅ Скроллбар занимает место но невидим по умолчанию
✅ При hover на контейнер появляется тонкий thumb
✅ Нет скачка ширины контента при появлении/исчезновении скролла
✅ Скроллбар выглядит минималистично (6px, скруглённый, полупрозрачный белый)