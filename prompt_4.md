# ЗАДАЧА: Удалить демо-данные из приложения

## ПРОБЛЕМА

При загрузке страницы на секунду появляются демо-данные (тестовые персоны), а потом исчезают когда загружаются реальные данные с API. Это создаёт неприятный визуальный эффект.

## ЧТО НУЖНО СДЕЛАТЬ

### 1. Найти демо-данные в js/app.js

Искать массивы с тестовыми данными:
- `demoPersons`, `samplePersons`, `testPersons`, `mockPersons`
- `demoMarriages`, `sampleMarriages`, `testMarriages`, `mockMarriages`
- Или просто массивы с захардкоженными объектами персон/браков

Примерно выглядит так:
```javascript
const demoPersons = [
    { id: 'p1', given_name: 'Иван', surname: 'Петров', ... },
    { id: 'p2', given_name: 'Мария', surname: 'Петрова', ... },
    // ...
];

const demoMarriages = [
    { id: 'm1', husband: 'p1', wife: 'p2', children: [...] },
    // ...
];
```

### 2. Удалить демо-данные полностью

Удалить:
- Объявления массивов с демо-данными
- Любые функции типа `loadDemoData()`, `initDemoData()`
- Присваивания демо-данных в state: `state.personsData = demoPersons`

### 3. Исправить инициализацию

Вместо загрузки демо-данных при старте, инициализировать пустые массивы:
```javascript
state.personsData = [];
state.marriages = [];
```

### 4. Проверить порядок инициализации

Убедиться что рендеринг дерева происходит ТОЛЬКО после загрузки данных с API:

```javascript
// ПРАВИЛЬНО:
async function init() {
    // Показать loading состояние
    showLoading();

    // Загрузить данные с API
    const data = await loadTreeData();

    // Установить данные в state
    state.personsData = data.persons || [];
    state.marriages = data.marriages || [];

    // Только теперь рендерить
    renderTree();
    renderSidebar();

    // Скрыть loading
    hideLoading();
}

// НЕПРАВИЛЬНО:
function init() {
    state.personsData = demoPersons;  // ❌ Удалить
    renderTree();  // ❌ Не рендерить до загрузки API
    loadTreeData().then(...);
}
```

### 5. Проверить HTML на статичные демо-элементы

В index.html могут быть захардкоженные элементы в sidebar (.person-list) или других местах. Убедиться что списки пустые:

```html
<!-- ПРАВИЛЬНО: пустой список -->
<div class="person-list"></div>

<!-- НЕПРАВИЛЬНО: захардкоженные элементы -->
<div class="person-list">
    <div class="person-item">...</div>  <!-- ❌ Удалить -->
</div>
```

---

## КРИТЕРИИ УСПЕХА

✅ При загрузке страницы НЕТ мелькания демо-данных
✅ Дерево пустое до загрузки реальных данных с API
✅ Sidebar пустой до загрузки реальных данных
✅ После загрузки с API отображаются только реальные данные
✅ Нет захардкоженных тестовых персон в коде
