# Общий чеклист для проверки студенческих PR

Этот чеклист содержит **базовые требования** для всех заданий.

## 1. НАСТРОЙКА РЕПОЗИТОРИЯ

### 1.1 Требования Pull Request (PR)

**Формат PR:**

- [ ] PR из ветки `task-name` в `main`
- [ ] PR **НЕ СЛИТА** с main
- [ ] Название PR ясное и информативное
- [ ] Не должен содержать закомментированный код
- [ ] Не содержит лишних файлов (node_modules, .env, dist)


**Описание PR содержит:**

- [ ] Ссылка на задание.
- [ ] Скриншот результата выполнения задания
- [ ] Ссылка на задеплоенную версию вашего приложения или сайта
- [ ] Даты (Done / Deadline)
- [ ] Self-check от студента

**Пример оформления**

```md
1. Task: https://github.com/rolling-scopes-school/tasks/blob/master/tasks/fancy-weather.md
2. Screenshot:
   ![](https://docs.rs.school/images/fancy-weather.png)
3. Deploy: https://chakapega-fancy-weather.netlify.com/
4. Done 28.05.2020 / deadline 31.05.2020
5. Score: 220 / 300
- Вёрстка, дизайн, UI (15/30)
  - [x] минимальная ширина страницы, при которой она отображается корректно – 320 рх (10)
  - [±] внешний вид приложения внешне соответствует макету или является его улучшенной версией (5/10)   
  - [ ] приложение корректно отображается для любого выбранного языка (0)
- В блоке "Погода за сегодня" отображаются следующие данные (15/20)
  - [x] данные о погоде и местоположении пользователя (10)
  - [±] часы, обновляющие время каждую секунду (5/10) 
 ...
```
### 1.2 История коммитов

**Conventional Commits:**

The names of the commits should be according to the guideline - https://www.conventionalcommits.org/en/v1.0.0-beta.2/
The commit type MUST BE in lowercase only (init, feat, fix, refactor, docs etc.)
Present tense ("add feature" not "added feature") should be used.
Imperative mood ("move cursor to ..." not "moves cursor to ..." should be used).

**Examples of commit names**

- init: - used to start the project / task. Example:

```bash
init: start youtube-task
init: start mentor-dashboard task
```
- feat: - this is the implemented new functionality from the technical specifications (added zoom support, added footer, added product card). Example:

```bash
feat: add basic page layout
feat: implement search box 
feat: implement request to youtube API
feat: implement swipe for horizontal list
feat: add additional navigation button
feat: add banner
feat: add social links
feat: add physical security section
feat: add real social icons
```
- fix: - fixed a bug in previously implemented functionality. Example:

```bash
fix: implement correct loading data from youtube
fix: change layout for video items to fix bugs
fix: relayout header for firefox
fix: adjust social links for mobile
```

- refactor: - did not add new functionality / behavior did not change. Files in other places put, deleted, added. Changed the code formatting (white-space, formatting, missing semi-colons, etc). Improved the algorithm, without changing the functionality. Example:

```bash
refactor: change structure of the project
refactor: rename vars for better readability
refactor: apply eslint
refactor: apply prettier
```

- docs: - used when working with project documentation / readme. Example:

```bash
docs: update readme with additional information
docs: update description of run() method
```

---

## 2. КАЧЕСТВО КОДА

### 2.1 Базовые требования

- [ ] Линтер настроен согласно требованиям задания, все проверки проходят без ошибок
- [ ] Нет выключенных правил линта, попытаться выяснить для чего это было сделано и можно ли этого избежать.
- [ ] Проект собирается без ошибок
- [ ] Нет console.log в production коде
- [ ] Нет закомментированного кода

### 2.2 Проверка функциональности

- [ ] Все основные функции работают корректно
- [ ] Отсутствуют ошибки в консоли
- [ ] Запросы отрабатывают корректно
- [ ] Реализована функциональность согласно требованиям задания

### 2.3 Clean Code

Ниже ссылки на рекомендации по чистому коду, частично они проверяются линтером. 

- [Общие практики](../../clean-code/Clean-Code-Fundamental-Part1.md)
- [Рефакторинг и организация кода](../../clean-code/Clean-Code-Fundamental-Part2.md)
- [Работа с данными](../../clean-code/Clean-Code-Fundamental-Part3.md)
- [Производительность](../../clean-code/Clean-Code-Fundamental-Part4.md)
- [SOLID принципы](../../clean-code/Clean-Code-Fundamental-Part5.md)
- [Дополнительные практики](../../clean-code/Clean-Code-Fundamental-Part6.md)
- [TypeScript](../../clean-code/TypeScript.md)
- [HTML Best Practices](../../clean-code/HTML.md)
- [CSS Best Practices](../../clean-code/CSS.md)
- [UI/UX Checklist](../../clean-code/UI-UX.md)

**Дополнительные материалы**

- [Полный Clean Code Checklist](../../clean-code/Check-List.md)
- [ESLint config](../../eslint.config.js)
- [TypeScript config](../../tsconfig.json)

---

## 3. ДИЗАЙН И ФУНКЦИОНАЛЬНОСТЬ

- [ ] Соответствие макету (если был)
- [ ] Адаптивность (если требуется)
- [ ] Кликабельные элементы визуально выделены
- [ ] Элементы не перекрываются
- [ ] Обратная связь при взаимодействии (hover, active)
