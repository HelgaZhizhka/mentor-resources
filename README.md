# Mentor Resources

![GitHub stars](https://img.shields.io/github/stars/HelgaZhizhka/mentor-resources?style=social)
![License](https://img.shields.io/github/license/HelgaZhizhka/mentor-resources)
![Last Commit](https://img.shields.io/github/last-commit/HelgaZhizhka/mentor-resources)
![GitHub issues](https://img.shields.io/github/issues/HelgaZhizhka/mentor-resources)

**Материалов для студентов и менторов [RS School](https://rs.school/):** практики чистого кода и подготовка к собеседованиям.

Материалы собраны на основе личного опыта: обучения, прохождения собеседований, консультаций с менторами, опыта менторства в **RS School** — проведения код-ревью и технических интервью.

## Быстрый старт

### Для студентов

| Задача                                     | Материалы                                                 |
| ------------------------------------------ | --------------------------------------------------------- |
| **Готовишься к код-ревью?**                | → [Практики чистого кода](./clean-code/index.md)          |
| **Нужен чеклист для проверки кода?**       | → [Clean Code Checklist](./clean-code/Check-List.md)      |
| **Изучаешь React?**                        | → [React Best Practices](./clean-code/React.md)           |
| **Работаешь с TypeScript?**                | → [TypeScript Best Practices](./clean-code/TypeScript.md) |
| **Хочешь автоматизировать проверку кода?** | → [ESLint конфигурация](./templates/configs/LINTER-README.md)               |

### Для менторов

| Задача                                        | Материалы                                                                              |
| --------------------------------------------- | -------------------------------------------------------------------------------------- |
| **Проводишь код-ревью?**                      | → [Критерии и примеры](./clean-code/index.md)                                          |
| **Хочешь автоматизировать ревью студенческого PR?** | → [Pocket Mentor — Claude Code skill](./.claude/skills/pocket-mentor/README.md)  |
| **Проверяешь React-курс?**                     | → [React Course Review — Claude Code skill](./.claude/skills/react-course-review/README.md) |
| **Нужен линтер для автоматической проверки?** | → [ESLint конфигурация](./templates/configs/LINTER-README.md)                          |

## Содержание репозитория

### Чистый код и код-ревью

**Полное руководство по написанию качественного кода с примерами "плохо/хорошо"**

#### Основы чистого кода

- [Часть 1: Основы](./clean-code/Clean-Code-Fundamental-Part1.md) — именование, функции, комментарии, обработка ошибок
- [Часть 2: Рефакторинг](./clean-code/Clean-Code-Fundamental-Part2.md) — code smells, организация кода
- [Часть 3: Продвинутые практики](./clean-code/Clean-Code-Fundamental-Part3.md) — работа с данными, асинхронность
- [Часть 4: Производительность](./clean-code/Clean-Code-Fundamental-Part4.md) — оптимизация, тестируемость, примеры тестов
- [Часть 5: SOLID](./clean-code/Clean-Code-Fundamental-Part5.md) — архитектурные принципы с примерами
- [Часть 6: Дополнительно](./clean-code/Clean-Code-Fundamental-Part6.md)

#### Технологии

- [HTML Best Practices](./clean-code/HTML.md) — семантика, доступность, alt текст, kebab-case
- [CSS Best Practices](./clean-code/CSS.md) — вложенность селекторов, единицы измерения, CSS переменные
- [React Best Practices](./clean-code/React.md) — структура проекта, хуки, оптимизация
- [TypeScript Best Practices](./clean-code/TypeScript.md) — типизация, type guards, константы

#### Для код-ревью

- [Clean Code Checklist](./clean-code/Check-List.md) — быстрый чеклист для проверки кода
- [UI/UX Checklist](./clean-code/UI-UX.md) — интерактивность, responsive, доступность

**[→ Перейти к полному содержанию](./clean-code/index.md)**

### Автоматизация проверки кода для менторов

Автоматизация — это инструмент, а не замена ментора. Цель — сократить время на рутинные проверки, чтобы у ментора было больше времени на качественный и глубокий фидбек по архитектуре, подходу к задаче и soft skills студента.

#### Pocket Mentor, React Course Review или Student Reviewer — что выбрать?

Это **разные инструменты с разными задачами**. Они не заменяют друг друга — они дополняют разные этапы работы со студенческим кодом.

|                          | **Pocket Mentor** (skill)                                | **React Course Review** (skill)                                | **Student Reviewer** (GitHub Action)                           |
| ------------------------ | -------------------------------------------------------- | -------------------------------------------------------------- | -------------------------------------------------------------- |
| **Когда запускается**    | Ментор вручную перед оценкой                             | Ментор вручную для React-заданий                               | Автоматически на каждый push в PR                              |
| **Кто читает результат** | Ментор → курирует → решает что отправить студенту        | Ментор → курирует → решает что отправить студенту              | Студент напрямую                                               |
| **Что анализирует**      | Весь проект целиком (структура, фичи, баллы по ТЗ)       | Весь React-проект + цели курса + task context                  | Только diff текущего PR (качество написанного кода)            |
| **Роль**                 | Помощник ментора для финальной оценки                    | Педагогическое ревью React-course работ                        | Образовательный feedback студенту во время разработки          |
| **Вывод**                | `CODE_REVIEW_REPORT.md` со Score + опционально PR/Issues | `REACT_COURSE_REVIEW.md` + опционально PR/Issues              | Inline-комментарии в PR с объяснением концепций                |
| **Стек**                 | HTML/CSS, Vanilla JS, TypeScript, React+TS               | React/React+TypeScript                                         | HTML/CSS, Vanilla JS, TypeScript, React+TS (Angular — не подд.) |

**Главное отличие:**
- **Pocket Mentor видит проект целиком** — поймает отсутствующий роутинг, missing README, недостающие фичи из ТЗ. Считает score.
- **React Course Review видит проект целиком**, но проверяет именно учебные цели React-курса: state/props, хуки, формы, data flow, TypeScript, UI/UX минимум и соответствие заданию.
- **Student Reviewer видит только diff** — реагирует на качество кода (типы, паттерны, утечки), но **не ловит структурно отсутствующие фичи** (в diff их просто нет).

**Кому что нужно:**
- **Ментору** для финальной оценки PR → Pocket Mentor (полная картина + баллы).
- **Ментору React-курса** → React Course Review (педагогический React-фокус без production-overkill).
- **Студенту** для self-review во время работы над заданием → Student Reviewer (быстрый фидбек на каждый push).
- **Идеальный сценарий** — студент во время разработки исправляет проблемы качества кода через action, а ментор перед финальной оценкой запускает подходящий skill: `pocket-mentor` для общего ревью или `react-course-review` для React-курса.

#### Инструменты автоматизации

**1. Pocket Mentor — Claude Code skill** → [`.claude/skills/pocket-mentor/README.md`](./.claude/skills/pocket-mentor/README.md)

Ментор склонировал PR студента и из этой директории запускает `/pocket-mentor` в Claude Code. Skill:

- определяет стек проекта (HTML/CSS, Vanilla JS, TypeScript, React+TS) и подтягивает только релевантные материалы из [`clean-code/`](./clean-code/)
- запускает `init.sh` (lint + build + tsc) и четыре фокусных bash-чекера: `check-ts-usage` (`any`, `as`, `!`), `check-no-console`, `check-git-quality` (ветка, запрещённые файлы, Conventional Commits), `check-commented-code`
- читает исходники студента и опционально подтягивает rubric задания через `--context <path-or-url>` (локальный файл или GitHub URL)
- пишет `CODE_REVIEW_REPORT.md` с секциями Stack / Strengths / 🔴 Critical issues / 🟡 Recommendations / 🔵 Notes / Score (только при `--context` с rubric) / Summary / Manual checks. Каждая находка в формате What / Why / How to fix / Reference со ссылкой на конкретный раздел `clean-code/*`
- поддерживает режимы публикации: отчёт в файл (по умолчанию), inline-комментарии в PR (`--output inline`), GitHub Issues для критических находок (`--output issues`)

**Установка (одной командой):**

```bash
npx skills@latest add HelgaZhizhka/mentor-resources -g -a claude-code --skill pocket-mentor
```

Ментор редактирует отчёт и решает, что отправлять студенту.

**2. React Course Review — Claude Code skill** → [`.claude/skills/react-course-review/README.md`](./.claude/skills/react-course-review/README.md)

Отдельный skill для React-курса. Он проверяет не “идеальный React в продакшене”, а соответствие учебным целям: компоненты, props/state, хуки, формы, работу с данными, TypeScript, базовый UI/UX и требования задания.

```bash
npx skills@latest add HelgaZhizhka/mentor-resources -g -a claude-code --skill react-course-review
```

Используй его для React/React+TS работ, где студенту нужен педагогический фидбек: что сломано, почему это важно в React, как исправить, какой принцип курса нарушен и что можно отложить. Skill также делает мягкий maintainability-проход по ownership, type boundaries и test seams, но не превращает студенческое ревью в production approval gate. Вывод: локальный `REACT_COURSE_REVIEW.md`, отфильтрованные inline-комментарии в PR (`--output inline`), GitHub Issues по 🔴 блокерам (`--output issues`) или оба режима вместе. Язык отчёта можно задать явно: `--language ru|en`.

**3. Student Reviewer — GitHub Actions** → [`.github/actions/student-reviewer/README.md`](./.github/actions/student-reviewer/README.md)

Студент добавляет один файл в свой репозиторий — action запускается автоматически на каждый PR и постит inline-комментарии с обучающим фидбеком прямо в код.

- определяет стек (HTML/CSS, Vanilla JS, TypeScript, React+TS) и применяет только релевантные правила из [`clean-code/`](./clean-code/)
- работает без API-ключа через GitHub Models (бесплатно); поддерживает любой OpenAI-совместимый провайдер через секреты
- комментарии в формате ментора: объясняет концепцию, а не просто называет нарушение

> ⚠️ **Angular проекты не поддерживаются** — action обнаруживает `@angular/core` и завершается без комментариев. Для Angular-проектов используй Pocket Mentor.

**Установка (одной командой):**

```bash
mkdir -p .github/workflows
curl -o .github/workflows/student-review.yml \
  https://raw.githubusercontent.com/HelgaZhizhka/mentor-resources/master/templates/workflows/student-review.yml
```

**4. ESLint конфигурация для студенческих проектов** → [Подробнее](./templates/configs/LINTER-README.md)

Покрывает базовые правила автоматически:

- ✅ TypeScript строгость (no any, явные типы)
- ✅ Чистые функции (длина ≤30 строк, ≤3 параметра)
- ✅ React best practices (hooks, keys, exports)
- ✅ Async/await правила
- ✅ Мёртвый код и console.log

## Для кого этот репозиторий

- **Студенты курсов Front-End и React в RS School** — для обучения и подготовки к код-ревью
- **Менторы** — для проведения код-ревью и технических собеседований
- **Junior/Middle разработчики** — для систематизации знаний и подготовки к собеседованиям
- **Все, кто изучает frontend**

## О проекте

Этот репозиторий создан для студентов и менторов [RS School](https://rs.school/).

**Особенности:**

- Примеры кода в формате "плохо/хорошо"
- Практические чеклисты для использования в работе
- Реальные задачи с собеседований
- Актуальные практики

**Источники материалов:**

- Личный опыт обучения в RS School
- Опыт прохождения собеседований
- Фидбек от менторов RS School
- Практика проведения код-ревью и технических интервью
- Лучшие практики

## Как внести вклад

- Можно отправить **pull request** с добавлением нового файла или правкой существующего.
- Предложения по структуре и контенту приветствуются!
- Поставить звездочку репозиторию! ⭐

Подробнее о том, как внести изменения: [`CONTRIBUTING.md`](./CONTRIBUTING.md)

Сделано с любовью 🧡 и благодарностью к сообществу [RS School](https://rs.school/)

## Лицензия

[MIT](LICENSE)
