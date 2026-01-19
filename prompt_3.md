# ЗАДАЧА: Исправить центрирование дерева и навигацию

## 1. ПРОБЛЕМА ЦЕНТРИРОВАНИЯ

При открытии приложения и при клике на человека - он отображается в верхнем левом углу вместо центра viewport.

### Найти в js/app.js:

1. Функцию которая центрирует на человеке (вероятно `centerOnPerson` или похожая)
2. Функцию инициализации viewport при загрузке
3. Обработчик клика по человеку в sidebar

### Исправить логику центрирования:

Правильная формула для центрирования человека в viewport:
```javascript
// Получить размеры viewport
const viewportRect = viewportEl.getBoundingClientRect();
const viewportCenterX = viewportRect.width / 2;
const viewportCenterY = viewportRect.height / 2;

// Позиция человека (центр карточки)
const personCenterX = position.x + CARD_W / 2;
const personCenterY = position.y + CARD_H / 2;

// Вычислить pan для центрирования с учётом zoom
state.panX = viewportCenterX - personCenterX * state.zoom;
state.panY = viewportCenterY - personCenterY * state.zoom;

// Применить transform
updateTransform();
Проверить что центрирование вызывается:
При первой загрузке дерева - центрировать на root person (is_root: true)
При клике на человека в sidebar - центрировать на выбранном
При клике на tree-node - центрировать на нём
2. ИЗМЕНИТЬ НАЧАЛЬНЫЙ МАСШТАБ НА 100%
Найти в js/app.js:
Переменную начального zoom (вероятно в state или константах):


zoom: 0.7  // или подобное
Изменить на:

zoom: 1.0  // 100%
Также найти инициализацию слайдера zoom и установить начальное значение 100.

3. ЗАМЕНИТЬ КНОПКУ "ВМЕСТИТЬ" НА "К КОРНЮ"
В index.html:
Найти кнопку "Вместить" (Fit to screen) в toolbar. Вероятно выглядит так:


<button class="toolbar-btn" id="fit-btn" title="Вместить">
    <i data-lucide="maximize"></i>
</button>
Заменить на:

<button class="toolbar-btn" id="go-root-btn" title="К корню дерева">
    <i data-lucide="home"></i>
</button>
В js/app.js:
Удалить обработчик для fit-btn и функцию fitToScreen (если есть)

Добавить обработчик для go-root-btn:


document.getElementById('go-root-btn')?.addEventListener('click', () => {
    goToRootPerson();
});

function goToRootPerson() {
    // Найти корневого человека
    const rootPerson = state.personsData.find(p => p.is_root);
    
    if (rootPerson && state.positions[rootPerson.id]) {
        // Выбрать его
        state.selectedPerson = rootPerson.id;
        
        // Центрировать на нём
        centerOnPerson(rootPerson.id);
        
        // Обновить UI (подсветка в sidebar и panel)
        updateSelection();
    }
}
4. УБЕДИТЬСЯ ЧТО ВСЁ РАБОТАЕТ ВМЕСТЕ
При загрузке приложения:
Загрузить данные дерева
Установить zoom = 1.0 (100%)
Найти root person
Выбрать его (selectedPerson)
Отрендерить дерево
Центрировать viewport на root person
При клике на человека (sidebar или tree-node):
Выбрать человека
Центрировать на нём с анимацией (опционально)
Обновить panel
При клике "К корню":
Найти root person
Выбрать его
Центрировать на нём
Обновить panel
КРИТЕРИИ УСПЕХА
✅ При загрузке страницы root person находится в центре viewport
✅ При загрузке zoom = 100% (не 70%)
✅ При клике на человека он центрируется в viewport
✅ Кнопка "Вместить" удалена
✅ Новая кнопка "К корню" (иконка home) возвращает к root person
✅ Кнопка "К корню" выбирает root person и центрирует на нём