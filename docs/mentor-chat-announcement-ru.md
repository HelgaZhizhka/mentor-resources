# Краткий пост в чат менторов

Готовый текст для публикации в чате менторов RS School. Скопировать и отправить (или адаптировать под себя).

---

Привет, коллеги! 👋

Хочу поделиться двумя AI-инструментами для код-ревью студенческих проектов на TypeScript / React / Vanilla JS / HTML+CSS. Может пригодится для следующего потока.

**🧑‍🏫 Pocket Mentor — для нас, менторов**

Claude Code skill. Запускаешь в клонированном репо студента, на выходе получаешь структурированный отчёт: технические проверки (lint/build/типы/коммиты) + анализ кода с привязкой к материалам из `clean-code/*` + Score по ТЗ (если передать ссылку на задание). Каждая находка в формате `What / Why / How to fix / Reference`.

По умолчанию пишет в локальный файл — ты курируешь и решаешь что отправить студенту. Опционально может публиковать комментарии в PR от твоего имени, но **только с твоим подтверждением** перед отправкой.

Установка одной командой:
```
npx skills@latest add HelgaZhizhka/mentor-resources -g -a claude-code --skill pocket-mentor
```

**🤖 Student Reviewer — для наших студентов**

GitHub Action. Студент добавляет один файл в свой репо — на каждый push в PR автоматически приходят inline-комментарии с обучающим feedback. Объясняет концепции (не сухие правила), ссылается на материалы курикулума, проверяет требования из README задания.

Это **тренажёр перед менторским ревью**. Студент учится сам ловить типичные ошибки до того как их найдёт ментор. Работает бесплатно через GitHub Models — никаких API-ключей не нужно.

**Что важно:**

- Оба инструмента — **дополнение, а не замена** менторского ревью. Финальное слово всегда за ментором.
- **Opt-in для всех** — никто никого не обязывает. Студент может не подключать action, ментор может не использовать skill.
- **Angular не поддерживается** (есть отдельные подходы у других менторов).
- **Не ловит "отсутствующие фичи"** в Student Reviewer (например, отсутствие роутинга) — это видит только pocket-mentor.

**Тестировала** на проекте fun-chat (stage 2 TS+React). Сейчас собираю обратную связь от менторов и студентов — если попробуете и поделитесь впечатлением, буду очень благодарна 🙏

**Подробнее:**
- 📂 Репо: github.com/HelgaZhizhka/mentor-resources
- 📖 Презентация: [`docs/automation-overview-ru.md`](https://github.com/HelgaZhizhka/mentor-resources/blob/master/docs/automation-overview-ru.md)
- 🧑‍🏫 Pocket Mentor README: [`.claude/skills/pocket-mentor`](https://github.com/HelgaZhizhka/mentor-resources/tree/master/.claude/skills/pocket-mentor)
- 🤖 Student Reviewer README: [`.github/actions/student-reviewer`](https://github.com/HelgaZhizhka/mentor-resources/tree/master/.github/actions/student-reviewer)

Вопросы / баги / предложения — пишите!
