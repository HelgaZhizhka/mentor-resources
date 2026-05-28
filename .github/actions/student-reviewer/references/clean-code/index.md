# Код-ревью и практики чистого кода

Полное практическое руководство по написанию качественного кода с примерами "плохо/хорошо". Все материалы основаны на реальном опыте проведения код-ревью.

## Быстрая навигация

| Для кого                      | Что читать                                                                                                                                                                                                                                                     |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Начинающий разработчик**    | [Часть 1: Основы](#часть-1-основы-чистого-кода) → [Часть 2: Рефакторинг](#часть-2-рефакторинг-и-организация-кода)                                                                                                                                              |
| **React разработчик**         | [React Best Practices](#react-best-practices) + [TypeScript](#typescript-best-practices)                                                                                                                                                                       |
| **Junior/Middle разработчик** | [Часть 3: Продвинутые практики чистого кода](#часть-3-продвинутые-практики-чистого-кода) → [Часть 4: Производительность и тестируемость кода](#часть-4-производительность-и-тестируемость-кода) → [Часть 5: SOLID](#часть-5-архитектурные-паттерны-и-принципы) |
| **Ментор (код-ревью)**        | [Clean Code Checklist](#чеклист-code-review-clean-code) + [Все части](#📚-материалы)                                                                                                                                                                           |

## Материалы

### [Чеклист Code Review: Clean Code](Check-List.md)

**Быстрый чеклист для проведения код-ревью.**

Используйте при проверке PR студентов или своего кода:

- ✅ Именование (переменные, функции, классы)
- ✅ Функции (размер, параметры, ответственность)
- ✅ Код (DRY, KISS, YAGNI, магические числа)
- ✅ Принципы SOLID
- ✅ Обработка ошибок
- ✅ Асинхронный код
- ✅ Тестируемость

**[→ Открыть чеклист](Check-List.md)**

### [Часть 1: Основы чистого кода](Clean-Code-Fundamental-Part1.md)

Основные принципы написания чистого, читаемого и поддерживаемого кода.

#### Разделы:

- [**Зачем нужен чистый код?**](Clean-Code-Fundamental-Part1.md#зачем-нужен-чистый-код)
- [**1. Именование (Naming Conventions)**](Clean-Code-Fundamental-Part1.md#1-именование-naming-conventions)
  - [1.1 Общие принципы](Clean-Code-Fundamental-Part1.md#11-общие-принципы)
  - [1.2 Переменные](Clean-Code-Fundamental-Part1.md#12-переменные)
  - [1.3 Функции](Clean-Code-Fundamental-Part1.md#13-функции)
  - [1.4 Классы и компоненты](Clean-Code-Fundamental-Part1.md#14-классы-и-компоненты)
  - [1.5 Boolean переменные](Clean-Code-Fundamental-Part1.md#15-boolean-переменные)
  - [1.6 Анти-паттерны именования](Clean-Code-Fundamental-Part1.md#16-анти-паттерны-именования)
- [**2. Функции и методы**](Clean-Code-Fundamental-Part1.md#2-функции-и-методы)
  - [2.1 Размер функции](Clean-Code-Fundamental-Part1.md#21-размер-функции)
  - [2.2 Параметры функции](Clean-Code-Fundamental-Part1.md#22-параметры-функции)
  - [2.3 Побочные эффекты (Side Effects)](Clean-Code-Fundamental-Part1.md#23-побочные-эффекты-side-effects)
  - [2.4 Single Responsibility для функций](Clean-Code-Fundamental-Part1.md#24-single-responsibility-для-функций)
  - [2.5 Возврат значений](Clean-Code-Fundamental-Part1.md#25-возврат-значений)
  - [2.6 Стрелочные функции vs обычные](Clean-Code-Fundamental-Part1.md#26-стрелочные-функции-vs-обычные)
- [**3. Комментарии и документация**](Clean-Code-Fundamental-Part1.md#3-комментарии-и-документация)
  - [3.1 Когда НЕ нужны комментарии](Clean-Code-Fundamental-Part1.md#31-когда-не-нужны-комментарии)
  - [3.2 Когда комментарии полезны](Clean-Code-Fundamental-Part1.md#32-когда-комментарии-полезны)
  - [3.3 JSDoc](Clean-Code-Fundamental-Part1.md#33-jsdoc)
  - [3.4 TODO/FIXME](Clean-Code-Fundamental-Part1.md#34-todofixme)
  - [3.5 Комментарии "почему", а не "что"](Clean-Code-Fundamental-Part1.md#35-комментарии-почему-а-не-что)
- [**4. Обработка ошибок**](Clean-Code-Fundamental-Part1.md#4-обработка-ошибок)
  - [4.1 Try-Catch правила](Clean-Code-Fundamental-Part1.md#41-try-catch-правила)
  - [4.2 Fail Fast принцип](Clean-Code-Fundamental-Part1.md#42-fail-fast-принцип)
  - [4.3 Defensive Programming](Clean-Code-Fundamental-Part1.md#43-defensive-programming)
- [**5. Code Smells и рефакторинг**](Clean-Code-Fundamental-Part1.md#5-code-smells-и-рефакторинг)
  - [5.1 Duplicated Code (Дублирование)](Clean-Code-Fundamental-Part1.md#51-duplicated-code-дублирование)
  - [5.2 Long Method (Длинная функция)](Clean-Code-Fundamental-Part1.md#52-long-method-длинная-функция)
  - [5.3 Large Class (Большой класс)](Clean-Code-Fundamental-Part1.md#53-large-class-большой-класс)
  - [5.4 Long Parameter List](Clean-Code-Fundamental-Part1.md#54-long-parameter-list)
  - [5.5 Magic Numbers и Magic Strings](Clean-Code-Fundamental-Part1.md#55-magic-numbers-и-magic-strings)
  - [5.6 Dead Code (Мёртвый код)](Clean-Code-Fundamental-Part1.md#56-dead-code-мёртвый-код)
  - [5.7 Deep Nesting (Глубокая вложенность)](Clean-Code-Fundamental-Part1.md#57-deep-nesting-глубокая-вложенность)
  - [5.8 Primitive Obsession](Clean-Code-Fundamental-Part1.md#58-primitive-obsession)
  - [5.9 Switch Statements](Clean-Code-Fundamental-Part1.md#59-switch-statements)
  - [5.10 Shotgun Surgery](Clean-Code-Fundamental-Part1.md#510-shotgun-surgery)
- [**6. Организация кода**](Clean-Code-Fundamental-Part1.md#6-организация-кода)
  - [6.1 Форматирование](Clean-Code-Fundamental-Part1.md#61-форматирование)
  - [6.2 Порядок кода](Clean-Code-Fundamental-Part1.md#62-порядок-кода)
  - [6.3 Порядок импортов](Clean-Code-Fundamental-Part1.md#63-порядок-импортов)
- [**7. Работа с данными**](Clean-Code-Fundamental-Part1.md#7-работа-с-данными)
  - [7.1 Immutability (Неизменяемость)](Clean-Code-Fundamental-Part1.md#71-immutability-неизменяемость)
  - [7.2 Работа с массивами](Clean-Code-Fundamental-Part1.md#72-работа-с-массивами)
  - [7.3 Работа с объектами](Clean-Code-Fundamental-Part1.md#73-работа-с-объектами)
  - [7.4 Null и Undefined](Clean-Code-Fundamental-Part1.md#74-null-и-undefined)
- [**8. Асинхронный код**](Clean-Code-Fundamental-Part1.md#8-асинхронный-код)
  - [8.1 Promises](Clean-Code-Fundamental-Part1.md#81-promises)
  - [8.2 Async/Await](Clean-Code-Fundamental-Part1.md#82-async-await)
  - [8.3 Анти-паттерны](Clean-Code-Fundamental-Part1.md#83-анти-паттерны)
- [**9. Производительность**](Clean-Code-Fundamental-Part1.md#9-производительность)
  - [9.1 Преждевременная оптимизация](Clean-Code-Fundamental-Part1.md#91-преждевременная-оптимизация)
  - [9.2 Когда оптимизировать](Clean-Code-Fundamental-Part1.md#92-когда-оптимизировать)
  - [9.3 Простые оптимизации](Clean-Code-Fundamental-Part1.md#93-простые-оптимизации)
- [**10. Тестируемость кода**](Clean-Code-Fundamental-Part1.md#10-тестируемость-кода)
  - [10.1 Что делает код тестируемым](Clean-Code-Fundamental-Part1.md#101-что-делает-код-тестируемым)
  - [10.2 Признаки нетестируемого кода](Clean-Code-Fundamental-Part1.md#102-признаки-нетестируемого-кода)
  - [10.3 Рефакторинг для тестов](Clean-Code-Fundamental-Part1.md#103-рефакторинг-для-тестов)
- [**11. Дополнительные практики**](Clean-Code-Fundamental-Part1.md#11-дополнительные-практики)
  - [11.1 Избегать глобальных переменных](Clean-Code-Fundamental-Part1.md#111-избегать-глобальных-переменных)
  - [11.2 Избегать мутации параметров](Clean-Code-Fundamental-Part1.md#112-избегать-мутации-параметров)
  - [11.3 Стрелочные функции для методов](Clean-Code-Fundamental-Part1.md#113-стрелочные-функции-для-методов)
  - [11.4 Предпочитать объекты switch-case](Clean-Code-Fundamental-Part1.md#114-предпочитать-объекты-switch-case)
  - [11.5 Использовать const по умолчанию](Clean-Code-Fundamental-Part1.md#115-использовать-const-по-умолчанию)
  - [11.6 Осторожно с setTimeout и setInterval](Clean-Code-Fundamental-Part1.md#116-осторожно-с-settimeout-и-setinterval)

### [Часть 2: Рефакторинг и организация кода](Clean-Code-Fundamental-Part2.md)

Техники рефакторинга, code smells и лучшая организация кода.

#### Разделы:

- [**1. Code Smells**](Clean-Code-Fundamental-Part2.md#1-code-smells)
  - [1.1 Duplicated Code (Дублирование)](Clean-Code-Fundamental-Part2.md#11-duplicated-code-дублирование)
  - [1.2 Long Method (Длинная функция)](Clean-Code-Fundamental-Part2.md#12-long-method-длинная-функция)
  - [1.3 Large Class (Большой класс)](Clean-Code-Fundamental-Part2.md#13-large-class-большой-класс)
  - [1.4 Long Parameter List](Clean-Code-Fundamental-Part2.md#14-long-parameter-list)
  - [1.5 Magic Numbers и Magic Strings](Clean-Code-Fundamental-Part2.md#15-magic-numbers-и-magic-strings)
  - [1.6 Dead Code (Мёртвый код)](Clean-Code-Fundamental-Part2.md#16-dead-code-мёртвый-код)
  - [1.7 Primitive Obsession](Clean-Code-Fundamental-Part2.md#17-primitive-obsession)
  - [1.8 Switch Statements](Clean-Code-Fundamental-Part2.md#18-switch-statements)
  - [1.9 Shotgun Surgery](Clean-Code-Fundamental-Part2.md#19-shotgun-surgery)
- [**2. Организация кода**](Clean-Code-Fundamental-Part2.md#2-организация-кода)
  - [2.1 Форматирование](Clean-Code-Fundamental-Part2.md#21-форматирование)
  - [2.2 Порядок кода](Clean-Code-Fundamental-Part2.md#22-порядок-кода)
  - [2.3 Порядок импортов](Clean-Code-Fundamental-Part2.md#23-порядок-импортов)

### [Часть 3: Продвинутые практики чистого кода](Clean-Code-Fundamental-Part3.md)

Углубление в концепции чистого кода: работа с данными, асинхронностью и производительностью.

#### Разделы:

- [**1. Работа с данными**](Clean-Code-Fundamental-Part3.md#1-работа-с-данными)
  - [1.1 Избегать глобальных переменных](Clean-Code-Fundamental-Part3.md#11-избегать-глобальных-переменных)
  - [1.2 Использовать const по умолчанию](Clean-Code-Fundamental-Part3.md#12-использовать-const-по-умолчанию)
  - [1.3 Избегать мутации параметров](Clean-Code-Fundamental-Part3.md#13-избегать-мутации-параметров)
  - [1.4 Immutability (Неизменяемость)](Clean-Code-Fundamental-Part3.md#14-immutability-неизменяемость)
  - [1.5 Работа с массивами](Clean-Code-Fundamental-Part3.md#15-работа-с-массивами)
  - [1.6 Работа с объектами](Clean-Code-Fundamental-Part3.md#16-работа-с-объектами)
  - [1.7 Null и Undefined](Clean-Code-Fundamental-Part3.md#17-null-и-undefined)
- [**2. Асинхронный код**](Clean-Code-Fundamental-Part3.md#2-асинхронный-код)
  - [2.1 Promises](Clean-Code-Fundamental-Part3.md#21-promises)
  - [2.2 Async/Await](Clean-Code-Fundamental-Part3.md#22-async-await)
  - [2.3 Анти-паттерны](Clean-Code-Fundamental-Part3.md#23-анти-паттерны)

### [Часть 4: Производительность и тестируемость кода](Clean-Code-Fundamental-Part4.md)

Производительность, тестируемость кода и персональные практики.

#### Разделы:

- [**Производительность и тестирование**](Clean-Code-Fundamental-Part4.md#производительность-и-тестирование)
  - [**1 Преждевременная оптимизация**](Clean-Code-Fundamental-Part4.md#1-преждевременная-оптимизация)
  - [**1.1 Когда оптимизировать**](Clean-Code-Fundamental-Part4.md#11-когда-оптимизировать)
  - [**1.2 Простые оптимизации**](Clean-Code-Fundamental-Part4.md#12-простые-оптимизации)
  - [**2. Тестируемость кода**](Clean-Code-Fundamental-Part4.md#2-тестируемость-кода)
    - [2.1 Что делает код тестируемым](Clean-Code-Fundamental-Part4.md#21-что-делает-код-тестируемым)
    - [2.2 Признаки нетестируемого кода](Clean-Code-Fundamental-Part4.md#22-признаки-нетестируемого-кода)
    - [2.3 Рефакторинг для тестов](Clean-Code-Fundamental-Part4.md#23-рефакторинг-для-тестов)

### [Часть 5: Архитектурные паттерны и принципы](Clean-Code-Fundamental-Part5.md)

Принципы SOLID - фундамент архитектуры приложений.

#### Разделы:

- [**1. SOLID Principles**](Clean-Code-Fundamental-Part5.md#1-solid-principles)
  - [1. SOLID Principles](Clean-Code-Fundamental-Part5.md#1-solid-principles)
  - [1.1 S - Single Responsibility Principle](Clean-Code-Fundamental-Part5.md#11-s---single-responsibility-principle-принцип-единственной-ответственности)
  - [1.2 O - Open/Closed Principle](Clean-Code-Fundamental-Part5.md#12-o---open-closed-principle-принцип-открытостизакрытости)
  - [1.3 L - Liskov Substitution Principle](Clean-Code-Fundamental-Part5.md#13-l---liskov-substitution-principle-принцип-подстановки-барбары-лисков)
  - [1.4 I - Interface Segregation Principle](Clean-Code-Fundamental-Part5.md#14-i---interface-segregation-principle-принцип-разделения-интерфейса)
  - [1.5 D - Dependency Inversion Principle](Clean-Code-Fundamental-Part5.md#15-d---dependency-inversion-principle-принцип-инверсии-зависимостей)
- [**2. KISS (Keep It Simple, Stupid)**](Clean-Code-Fundamental-Part5.md#2-kiss-keep-it-simple-stupid)
- [**3. DRY (Don't Repeat Yourself)**](Clean-Code-Fundamental-Part5.md#3-dry-dont-repeat-yourself)
- [**4. YAGNI (You Aren't Gonna Need It)**](Clean-Code-Fundamental-Part5.md#4-yagni-you-arent-gonna-need-it)
- [**5. Separation of Concerns**](Clean-Code-Fundamental-Part5.md#5-separation-of-concerns-разделение-ответственности)
- [**6. Composition over Inheritance**](Clean-Code-Fundamental-Part5.md#6-composition-over-inheritance-композиция-вместо-наследования)
- [**7. Fail Fast**](Clean-Code-Fundamental-Part5.md#7-fail-fast-быстрый-отказ)

### [Часть 6: Дополнительные практики](Clean-Code-Fundamental-Part6.md)

Остальные рекомендации и антипаттерны для JavaScript разработки.

#### Разделы:

- [**1. Стрелочные функции для методов**](Clean-Code-Fundamental-Part6.md#1-стрелочные-функции-для-методов)
- [**2. Осторожно с setTimeout и setInterval**](Clean-Code-Fundamental-Part6.md#2-осторожно-с-settimeout-и-setinterval)
- [**3. Event Delegation**](Clean-Code-Fundamental-Part6.md#3-event-delegation)
- [**4. Обязательные скобки для if/else/for**](Clean-Code-Fundamental-Part6.md#4-обязательные-скобки-для-ifelsefor)
- [**5. Размер файлов (200-400 строк)**](Clean-Code-Fundamental-Part6.md#5-размер-файлов-200-400-строк)

### [React Best Practices](React.md)

Лучшие практики разработки на React.

#### Разделы:

- [**1. Структура проекта и импорты**](React.md#1-структура-проекта-и-импорты)
  - [1.1 Использование alias для импортов](React.md#11-использование-alias-для-импортов)
  - [1.2 Порядок импортов](React.md#12-порядок-импортов)
  - [1.3 Структура компонента и импорты: как лучше делать](React.md#13-структура-компонента-и-импорты-как-лучше-делать)
  - [1.4 Именование файлов и папок](React.md#14-именование-файлов-и-папок)
- [**2. Компоненты React**](React.md#2-компоненты-react)
  - [2.1 Стрелочные функции для компонентов](React.md#21-стрелочные-функции-для-компонентов)
  - [2.2 Типизация компонентов](React.md#22-типизация-компонентов)
  - [2.3 Использование `React.memo()`](React.md#23-использование-reactmemo)
  - [2.4 Разбиение больших компонентов](React.md#24-разбиение-больших-компонентов)
  - [2.5 Обработчики событий](React.md#25-обработчики-событий)
  - [2.6 Сокращение кода через destructuring](React.md#26-сокращение-кода-через-destructuring)
- [**3. Хуки React**](React.md#3-хуки-react)
  - [3.1 `useCallback`](React.md#31-usecallback)
  - [3.2 Вынесение логики в кастомные хуки](React.md#32-вынесение-логики-в-кастомные-хуки)
  - [3.3 `AbortController` в `useEffect`](React.md#33-abortcontroller-в-useeffect)
  - [3.4 React 18 StrictMode и двойной запуск эффектов](React.md#34-react-18-strictmode-и-двойной-запуск-эффектов)
  - [3.5 Stale closures](React.md#35-stale-closures)
  - [3.6 Когда `useEffect` не нужен](React.md#36-когда-useeffect-не-нужен)
  - [3.7 `useMemo` без cargo cult](React.md#37-usememo-без-cargo-cult)
  - [3.8 Dependency array и `eslint-plugin-react-hooks`](React.md#38-dependency-array-и-eslint-plugin-react-hooks)
- [**4. Оптимизация и производительность**](React.md#4-оптимизация-и-производительность)
  - [4.1 Условный рендеринг](React.md#41-условный-рендеринг)
  - [4.2 Оптимизация импортов из библиотек](React.md#42-оптимизация-импортов-из-библиотек)
  - [4.3 Вынос сложных вычислений в переменные](React.md#43-вынос-сложных-вычислений-в-переменные)
- [**5. Работа с формами**](React.md#5-работа-с-формами)
  - [5.1 Атрибут `autoComplete`](React.md#51-атрибут-autocomplete)
  - [5.2 Валидация и обработка ошибок](React.md#52-валидация-и-обработка-ошибок)
- [**6. Работа с темами**](React.md#6-работа-с-темами)
- [**7. Next.js Best Practices**](React.md#7-nextjs-best-practices)
  - [7.1 Использование `Link` вместо кастомной навигации](React.md#71-использование-link-вместо-кастомной-навигации)
- [**8. Антипаттерны React**](React.md#8-антипаттерны-react)
  - [8.1 НЕ использовать `dangerouslySetInnerHTML`](React.md#81-не-использовать-dangerouslysetinnerHTML)
  - [8.2 Всегда добавлять `key` в `map()`](React.md#82-всегда-добавлять-key-в-map)
  - [8.3 Удалять `console.log()` перед продакшеном](React.md#83-удалять-consolelog-перед-продакшеном)
  - [8.4 Удалять комментарии перед финальным PR](React.md#84-удалять-комментарии-перед-финальным-pr)

### [HTML Best Practices](HTML.md)

Семантическая разметка и доступность.

#### Разделы:

- [**1. Семантические теги**](HTML.md#1-семантические-теги)
  - [1.1 Почему семантика важна?](HTML.md#11-почему-семантика-важна)
  - [1.2 Основные семантические теги](HTML.md#12-основные-семантические-теги)
  - [1.3 Когда использовать какой тег](HTML.md#13-когда-использовать-какой-тег)
- [**2. Атрибут `alt` для изображений**](HTML.md#2-атрибут-alt-для-изображений)
  - [2.1 Почему `alt` нужен?](HTML.md#21-почему-alt-нужен)
  - [2.2 Правила написания `alt`](HTML.md#22-правила-написания-alt)
  - [2.3 Размеры изображений (width и height)](HTML.md#23-размеры-изображений-width-и-height)
  - [2.4 Lazy loading и LCP](HTML.md#24-lazy-loading-и-lcp)
- [**3. Именование классов (kebab-case)**](HTML.md#3-именование-классов-kebab-case)
  - [3.1 Почему kebab-case?](HTML.md#31-почему-kebab-case)
  - [3.2 BEM (рекомендуется)](HTML.md#32-bem-рекомендуется)
  - [3.3 Uppercase текст через CSS, не HTML](HTML.md#33-uppercase-текст-через-css-не-html)
- [**4. Формы и доступность**](HTML.md#4-формы-и-доступность)
- [**5. Доступность (a11y)**](HTML.md#5-доступность-a11y)
- [**6. Практические советы**](HTML.md#6-практические-советы)
  - [6.1 Checklist для HTML review](HTML.md#61-checklist-для-html-review)

### [CSS Best Practices](CSS.md)

Организация стилей и производительность.

#### Разделы:

- [**1. Динамические стили через классы**](CSS.md#1-динамические-стили-через-классы)
  - [1.1 Почему не через JavaScript?](CSS.md#11-почему-не-через-javascript)
  - [1.2 Когда JS стили допустимы?](CSS.md#12-когда-js-стили-допустимы)
- [**2. Вложенность селекторов**](CSS.md#2-вложенность-селекторов)
  - [2.1 Почему вложенность ≤2 уровня?](CSS.md#21-почему-вложенность-2-уровня)
  - [2.2 BEM методология](CSS.md#22-bem-методология-рекомендуется)
- [**3. Единообразие единиц измерения**](CSS.md#3-единообразие-единиц-измерения)
  - [3.1 Когда использовать px, rem, em, %](CSS.md#31-когда-использовать-px-rem-em-)
- [**4. CSS переменные (Custom Properties)**](CSS.md#4-css-переменные-custom-properties)
  - [4.1 Когда CSS переменные особенно полезны?](CSS.md#41-когда-css-переменные-особенно-полезны)
  - [4.2 Динамическое изменение через JS](CSS.md#42-динамическое-изменение-через-js)
- [**5. Responsive дизайн**](CSS.md#5-responsive-дизайн)
  - [5.1 Mobile-first подход](CSS.md#51-mobile-first-подход)
  - [5.2 Breakpoints (рекомендуемые)](CSS.md#52-breakpoints-рекомендуемые)
  - [5.3 Современный responsive: `clamp()` и container queries](CSS.md#53-современный-responsive-clamp-и-container-queries)
  - [5.4 Flex/Grid overflow: `min-width: 0`](CSS.md#54-flexgrid-overflow-min-width-0)
- [**6. Производительность**](CSS.md#6-производительность)
  - [6.1 Избегай дорогих свойств](CSS.md#61-избегай-дорогих-свойств)
  - [6.2 Оптимизация селекторов](CSS.md#62-оптимизация-селекторов)
  - [6.3 Доступность анимаций](CSS.md#63-доступность-анимаций)
  - [6.4 Фокус через `:focus-visible`](CSS.md#64-фокус-через-focus-visible)

### [UI/UX Checklist](UI-UX.md)

Проверка пользовательского интерфейса и опыта.

#### Разделы:

- [**1. Интерактивные элементы**](UI-UX.md#1-интерактивные-элементы)
  - [1.1 Кликабельные элементы должны быть очевидны](UI-UX.md#11-кликабельные-элементы-должны-быть-очевидны)
  - [1.2 Размер кликабельных областей](UI-UX.md#12-размер-кликабельных-областей)
- [**2. Перекрытие элементов**](UI-UX.md#2-перекрытие-элементов)
  - [2.1 Нет перекрытия текста](UI-UX.md#21-нет-перекрытия-текста)
  - [2.2 Overflow handling](UI-UX.md#22-overflow-handling)
  - [2.3 Z-index конфликты](UI-UX.md#23-z-index-конфликты)
- [**3. Responsive дизайн**](UI-UX.md#3-responsive-дизайн)
  - [3.1 Тестирование на разных размерах](UI-UX.md#31-тестирование-на-разных-размерах)
  - [3.2 Mobile-first проверки](UI-UX.md#32-mobile-first-проверки)
- [**4. Соответствие дизайну**](UI-UX.md#4-соответствие-дизайну)
- [**5. Визуальная обратная связь**](UI-UX.md#5-визуальная-обратная-связь)
- [**6. Доступность (a11y)**](UI-UX.md#6-доступность-a11y)
- [**7. Производительность UI**](UI-UX.md#7-производительность-ui)
- [**8. Практический чеклист для ревью**](UI-UX.md#8-практический-чеклист-для-ревью)

### [TypeScript Best Practices](TypeScript.md)

Лучшие практики разработки на TypeScript.

#### Разделы:

- [**1. Основы типизации**](TypeScript.md#1-основы-типизации)
  - [1.1 Запрет `any`](TypeScript.md#11-запрет-any)
  - [1.1.1 Опасность неявного `any`](TypeScript.md#111-опасность-неявного-any)
  - [1.2 Использование `unknown` вместо `any`](TypeScript.md#12-использование-unknown-вместо-any)
  - [1.3 Запрет `{}` и `object`](TypeScript.md#13-запрет--и-object)
  - [1.4 Явные типы возврата функций](TypeScript.md#14-явные-типы-возврата-функций)
- [**2. `type` vs `interface`**](TypeScript.md#2-type-vs-interface)
  - [2.1 Когда использовать `type`](TypeScript.md#21-когда-использовать-type)
  - [2.2 Когда использовать `interface`](TypeScript.md#22-когда-использовать-interface)
- [**3. Enum vs const объекты**](TypeScript.md#3-enum-vs-const-объекты)
  - [3.1 Почему в frontend чаще избегают `enum`](TypeScript.md#31-почему-в-frontend-чаще-избегают-enum)
  - [3.2 Использование `as const`](TypeScript.md#32-использование-as-const)
- [**4. Type Guards и Type Assertions**](TypeScript.md#4-type-guards-и-type-assertions)
  - [4.1 Type Assertion (`as`)](TypeScript.md#41-type-assertion-as)
  - [4.2 Type Guards (`typeof`, `instanceof`, `is`)](TypeScript.md#42-type-guards-typeof-instanceof-is)
  - [4.3 Современные практики TypeScript](TypeScript.md#43-современные-практики-typescript)
- [**5. Константы и Magic Values**](TypeScript.md#5-константы-и-magic-values)
  - [5.1 Вынос числовых значений](TypeScript.md#51-вынос-числовых-значений)
  - [5.2 Вынос строк в константы](TypeScript.md#52-вынос-строк-в-константы)
  - [5.3 Использование `as const` для объектов](TypeScript.md#53-использование-as-const-для-объектов)
- [**6. Настройка TypeScript**](TypeScript.md#6-настройка-typescript)
  - [6.1 Строгие правила в `tsconfig.json`](TypeScript.md#61-строгие-правила-в-tsconfigjson)
  - [6.2 ESLint правила](TypeScript.md#62-eslint-правила)

### [Чеклист Code Review: Clean Code](Check-List.md)

Практический чеклист для проведения код-ревью согласно принципам чистого кода.

## Как использовать материалы

1. **Изучайте по темам** — каждая глава посвящена конкретной практике
2. **Смотрите примеры** — в каждом разделе есть примеры "плохо-хорошо"
3. **Применяйте на практике** — пробуйте рефакторить свой код
4. **Используйте при код-ревью** — проверяйте эти правила при проверке PR

## Поддержка материалов

Материалы регулярно обновляются. Предложения по улучшению приветствуются!
