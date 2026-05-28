# HTML Best Practices

## 1. Семантические теги

### 1.1 Почему семантика важна?

**Семантические HTML теги:**

- Улучшают **доступность** (screen readers понимают структуру)
- Улучшают **SEO** (поисковики лучше индексируют)
- Делают код **читаемым** (структура очевидна без CSS)
- Нативные интерактивные элементы (`button`, `a href`, `input`) поддерживают **keyboard navigation** автоматически

### 1.2 Основные семантические теги

**❌ Плохо (div-soup):**

```html
<div class="header">
  <div class="nav">
    <div class="nav-item">Home</div>
    <div class="nav-item">About</div>
  </div>
</div>

<div class="main">
  <div class="article">
    <div class="article-title">News Title</div>
    <div class="article-content">Content here...</div>
  </div>
</div>

<div class="footer">
  <div class="copyright">© 2024</div>
</div>
```

**✅ Хорошо (семантическая разметка):**

```html
<header>
  <nav>
    <a href="#home">Home</a>
    <a href="#about">About</a>
  </nav>
</header>

<main>
  <article>
    <h1>News Title</h1>
    <p>Content here...</p>
  </article>
</main>

<footer>
  <p>© 2024</p>
</footer>
```

### 1.3 Когда использовать какой тег

| Тег         | Когда использовать         | Пример                              |
| ----------- | -------------------------- | ----------------------------------- |
| `<header>`  | Шапка страницы/секции      | Логотип, навигация                  |
| `<nav>`     | Навигационное меню         | Главное меню, breadcrumbs           |
| `<main>`    | Основной контент страницы  | Только ОДИН на странице!            |
| `<section>` | Логический раздел контента | "About Us", "Services"              |
| `<article>` | Самостоятельный контент    | Новость, блог-пост, карточка товара |
| `<aside>`   | Дополнительный контент     | Сайдбар, виджеты                    |
| `<footer>`  | Подвал страницы/секции     | Копирайт, контакты                  |

**❌ Плохо:**

```html
<!-- Множественные <main> -->
<main>Content 1</main>
<main>Content 2</main>

<!-- <section> без заголовка -->
<section>
  <p>Some text</p>
</section>

<!-- <article> для чего угодно -->
<article class="button">Click me</article>
```

**✅ Хорошо:**

```html
<!-- Только ОДИН <main> -->
<main>
  <section>
    <h2>About Us</h2>
    <p>Description...</p>
  </section>

  <section>
    <h2>Services</h2>
    <p>Our services...</p>
  </section>
</main>

<!-- <article> для самостоятельного контента -->
<article class="news-card">
  <h2>Breaking News</h2>
  <p>News content...</p>
</article>
```

## 2. Атрибут `alt` для изображений

### 2.1 Почему `alt` нужен?

- **Доступность:** screen readers читают alt текст для незрячих пользователей
- **SEO:** поисковики индексируют alt текст
- **Fallback:** показывается если картинка не загрузилась
- Для доступности правило по умолчанию: у каждого `img` должен быть `alt`; для декоративных изображений — пустой `alt=""`

### 2.2 Правила написания `alt`

**❌ Плохо:**

```html
<!-- Отсутствует alt -->
<img src="logo.png" />

<!-- Бесполезный alt -->
<img src="photo.jpg" alt="image" />
<img src="cat.jpg" alt="picture" />
<img src="icon.svg" alt="icon" />

<!-- Слишком длинный alt -->
<img
  src="product.jpg"
  alt="This is a very beautiful red dress with flowers and buttons and zippers that you can buy in our store for a good price"
/>
```

**✅ Хорошо:**

```html
<!-- Описательный и краткий alt -->
<img src="logo.png" alt="Company Logo" />
<img src="cat.jpg" alt="Orange tabby cat sleeping" />
<img src="product.jpg" alt="Red floral dress" />

<!-- Пустой alt для декоративных изображений -->
<img src="decorative-line.svg" alt="" />

<!-- Alt для функциональных элементов -->
<img src="search-icon.svg" alt="Search" />
<img src="close.svg" alt="Close dialog" />
```

### 2.3 Размеры изображений (width и height)

**Почему важно указывать размеры:**

- Предотвращает **layout shift** (CLS) — контент не прыгает при загрузке
- Браузер резервирует место до загрузки изображения
- Улучшает **Core Web Vitals** (метрики производительности)

**❌ Плохо:**

```html
<img src="photo.jpg" alt="Photo" />
```

**✅ Хорошо:**

```html
<img src="photo.jpg" alt="Photo" width="800" height="600" />

<!-- Для адаптивных изображений через CSS -->
<img src="photo.jpg" alt="Photo" width="800" height="600" style="max-width: 100%; height: auto;" />
```

### 2.4 Lazy loading и LCP

`loading="lazy"` полезен для изображений ниже первого экрана, но его не стоит ставить на главное изображение страницы (LCP image), потому что это может замедлить загрузку основного контента.

**✅ Хорошо:**

```html
<!-- Hero/LCP изображение загружается сразу -->
<img src="hero.jpg" alt="Course students working together" width="1200" height="600" />

<!-- Изображения ниже первого экрана можно лениво загружать -->
<img src="gallery-1.jpg" alt="Student project example" width="600" height="400" loading="lazy" />
```

## 3. Именование классов (kebab-case)

### 3.1 Почему kebab-case?

- **Стандарт HTML/CSS** (традиционный подход)
- **Читаемость** (слова разделены дефисом)
- **Совместимость** с методологиями (BEM, SMACSS)

**Плохо:**

```html
<!-- camelCase (для JS, не для HTML!) -->
<div class="newsCard">
  <button class="submitButton">
    <!-- snake_case (для Python/SQL, не для CSS!) -->
    <div class="news_card">
      <button class="submit_button">
        <!-- PascalCase (для React компонентов, не для классов!) -->
        <div class="NewsCard">
          <!-- Без разделителей -->
          <div class="newscard"></div>
        </div>
      </button>
    </div>
  </button>
</div>
```

**Хорошо:**

```html
<!-- kebab-case -->
<div class="news-card">
  <button class="submit-button">
    <section class="user-profile">
      <article class="blog-post"></article>
    </section>
  </button>
</div>
```

### 3.2 BEM (рекомендуется)

**BEM = Block\_\_Element--Modifier**

```html
<!-- Block -->
<div class="news-card">
  <!-- Element -->
  <h2 class="news-card__title">Title</h2>
  <p class="news-card__description">Description</p>

  <!-- Modifier -->
  <button class="button button_primary news-card__button">Read More</button>
</div>
```

### 3.3 Uppercase текст через CSS, не HTML

**Почему важно:**

- **Разделение ответственности** — HTML для структуры, CSS для представления
- **Гибкость** — легко изменить стиль без правки HTML
- **Доступность** — screen readers читают текст правильно
- **Переиспользование** — один CSS класс вместо множества изменений в HTML

**❌ Плохо — uppercase в HTML:**

```html
<!-- Плохо: текст в верхнем регистре прямо в HTML -->
<h1>NEWS API PROJECT</h1>
<button>SUBMIT</button>
<nav>
  <a href="#home">HOME</a>
  <a href="#about">ABOUT</a>
  <a href="#contact">CONTACT</a>
</nav>
```

**Проблемы:**

- Screen readers могут произносить каждую букву отдельно ("N-E-W-S")
- Сложно изменить стиль (нужно править каждый элемент в HTML)
- Нарушение разделения ответственности

**✅ Хорошо — uppercase через CSS:**

```html
<!-- HTML с обычным текстом -->
<h1 class="page-title">News API Project</h1>
<button class="submit-button">Submit</button>
<nav class="main-nav">
  <a href="#home">Home</a>
  <a href="#about">About</a>
  <a href="#contact">Contact</a>
</nav>
```

```css
.page-title {
  text-transform: uppercase;
}

.submit-button {
  text-transform: uppercase;
}

.main-nav a {
  text-transform: uppercase;
}
```

## 4. Формы и доступность

### 4.1 Label для всех input

**Почему `<label>` обязателен:**

- Screen readers читают label
- Клик по label активирует input (увеличивает область клика)
- Семантика (понятно что вводить)

**❌ Плохо:**

```html
<input type="text" placeholder="Email" /> <input type="password" placeholder="Password" />
```

**✅ Хорошо:**

```html
<label for="email">Email:</label>
<input type="text" id="email" name="email" />

<label for="password">Password:</label>
<input type="password" id="password" name="password" />
```

### 4.2 Атрибут `type` для кнопок

**❌ Плохо:**

```html
<!-- По умолчанию type="submit" в форме! -->
<form>
  <button>Cancel</button>
  <!-- Submit form! -->
</form>
```

**✅ Хорошо:**

```html
<form>
  <button type="button">Cancel</button>
  <button type="submit">Submit</button>
</form>
```

---

## 5. Доступность (a11y)

### 5.1 ARIA атрибуты (когда нужны)

**Используй когда семантики HTML недостаточно:**

```html
<!-- Модальное окно -->
<div role="dialog" aria-labelledby="modal-title" aria-modal="true">
  <h2 id="modal-title">Confirm Action</h2>
  <button aria-label="Close dialog">×</button>
</div>

<!-- Меню -->
<button aria-expanded="false" aria-controls="menu">Menu</button>
<ul id="menu" hidden>
  <li><a href="#">Item 1</a></li>
</ul>

<!-- Некритичное уведомление -->
<div role="status" aria-live="polite">File uploaded successfully!</div>

<!-- Критичная ошибка, которую нужно озвучить сразу -->
<div role="alert">Failed to save changes</div>
```

### 5.2 Фокус и keyboard navigation

**❌ Плохо:**

```html
<!-- div не focusable! -->
<div onclick="handleClick()">Click me</div>
```

**✅ Хорошо:**

```html
<!-- button focusable по умолчанию -->
<button onclick="handleClick()">Click me</button>

<!-- Если ОБЯЗАТЕЛЬНО нужен кастомный элемент, обработайте клавиатуру через keydown -->
<div role="button" tabindex="0" onclick="handleClick()" onkeydown="handleKeyDown(event)">
  Click me
</div>

<!-- Но почти всегда лучше использовать настоящий button -->
<button type="button" onclick="handleClick()">Click me</button>
```

## 6. Практические советы

### 6.1 Checklist для HTML review

- [ ] Используются семантические теги (header, nav, main, article, section, footer)
- [ ] Только ОДИН `<main>` на странице
- [ ] Все `<img>` имеют атрибут `alt`
- [ ] Для изображений указаны `width` и `height`
- [ ] Классы именуются в kebab-case
- [ ] Uppercase текст реализован через CSS `text-transform`, не в HTML
- [ ] Нет избыточных `<div>` (можно упростить?)
- [ ] Нет inline стилей и inline JavaScript (onclick)
- [ ] Все `<input>` имеют связанные `<label>`
- [ ] Кнопки имеют корректный `type` (button/submit)
- [ ] Интерактивные элементы focusable (button, a, input)
- [ ] Используется валидный HTML (проверить через validator.w3.org)

### 6.2 Инструменты проверки

**Автоматические:**

- [HTML Validator](https://validator.w3.org/) - проверка валидности HTML
- [axe DevTools](https://www.deque.com/axe/devtools/) - проверка доступности
- Lighthouse (Chrome DevTools) - SEO и a11y аудит

**Ручные:**

- Keyboard navigation (Tab, Enter, Esc)
- Screen reader (NVDA, JAWS, VoiceOver)
- Отключить CSS — структура должна быть понятна
