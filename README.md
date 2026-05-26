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

**2. ESLint конфигурация для студенческих проектов** → [Подробнее](./templates/configs/LINTER-README.md)

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
