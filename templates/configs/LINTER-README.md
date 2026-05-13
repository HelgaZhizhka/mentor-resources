# ESLint конфигурация для чистого кода

## Что проверяет линтер

### Именование

- ✅ Минимум 2 символа для переменных
- ✅ camelCase для переменных и функций
- ✅ PascalCase для классов и типов
- ✅ Boolean переменные с префиксом is/has/should/can

### TypeScript

- ✅ Запрет `any`
- ✅ Явные типы возврата функций
- ✅ Запрет `{}` и `object` (используй `Record`)
- ✅ Consistent type imports (`import type`)

### Чистые функции

- ✅ Максимум 30 строк на функцию
- ✅ Максимум 3 параметра
- ✅ Вложенность ≤ 3 уровня

### Чистый код

- ✅ Нет console.log (только warn/error)
- ✅ Использование const по умолчанию
- ✅ Magic numbers в константы
- ✅ Prefer arrow functions
- ✅ Template strings вместо конкатенации
- ✅ Strict equality (===)
- ✅ No nested ternary
- ✅ Обязательные фигурные скобки

### React

- ✅ Именованные экспорты (не default)
- ✅ Key в map()
- ✅ Нет dangerouslySetInnerHTML
- ✅ Правила React Hooks
- ✅ Порядок импортов

### Async/Await

- ✅ Все промисы обрабатываются
- ✅ Await в async функциях
- ✅ Optional chaining (?.)
- ✅ Nullish coalescing (??)

## Основные команды

```bash
# Проверить код
pnpm run lint

# Исправить автоматически
pnpm run lint:fix

# Найти мёртвый код
pnpm run check:dead-code

# Форматирование
pnpm run format

# Проверка форматирования
pnpm run format:check
```

## Для новых проектов

### Копировать файлы

```bash
# Из этого репозитория в ваш проект
cp eslint.config.js your-project/
cp tsconfig.json your-project/
cp .prettierrc.json your-project/
cp package.json your-project/  # Только devDependencies
```

### Установить зависимости

```bash
cd your-project
pnpm install
```

## Рекомендации по использованию

### Что линтер делает отлично

- TypeScript строгость
- Структура кода (длина функций, параметры)
- React правила
- Обработка промисов
- Именование (naming conventions)
- Unicorn best practices
- Import/export правила
- Accessibility (jsx-a11y)

Конфигурация линтера приведена в соответствии с требованиями RS School

### Где нужен code review

- Семантика именования
- Логическая правильность (SRP)
- Архитектура (SOLID)
- Бизнес-логика

### Что не покрывается

- Качество комментариев ("почему", не "что")
- Понятность кода
- Выбор паттернов
- Производительность

## Работа в команде

### Code Review фокус

**Линтер проверяет:**

- Форматирование
- TypeScript правила
- React best practices
- Синтаксис

**Reviewer проверяет:**

- Логику и алгоритмы
- Архитектуру
- Бизнес-требования
- Безопасность

Линтер учит best practices автоматически:

- Меньше ревью комментариев типа "используй const"
- Единый стандарт кода в команде
- Быстрая адаптация новичков

## Дополнительные инструменты (опционально)

### Поиск мёртвого кода (ts-prune)

Для проектов с TypeScript можно добавить автоматический поиск неиспользуемого кода:

```bash
pnpm add -D ts-prune
```

Добавьте в `package.json`:

```json
{
  "scripts": {
    "check:dead-code": "ts-prune"
  }
}
```

### Поиск неиспользуемых зависимостей (depcheck)

```bash
pnpm add -D depcheck
```

Добавьте в `package.json`:

```json
{
  "scripts": {
    "check:unused-deps": "depcheck"
  }
}
```

## Расширенные проверки качества кода

### Sonar

Для дополнительных проверок (дублирование, когнитивная сложность, code smells):

- **[SonarLint](https://www.sonarsource.com/products/sonarlint/)** - расширение для IDE
- **[SonarCloud](https://sonarcloud.io/)** - автоматический анализ в PR
- **[eslint-plugin-sonarjs](https://github.com/SonarSource/eslint-plugin-sonarjs)** - интеграция с ESLint
