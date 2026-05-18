# Pocket Mentor v0.9 — Sharpened Proposition

> **Дата:** 2026-05-18
> **Статус:** кандидат на обсуждение
> **Ветка:** `feature/pocket-mentor-v0.9-redesign`

---

## 1. Одно предложение

**Pocket Mentor v0.9 — это Claude Code skill, который ментор запускает изнутри склонированного репо студента; skill прогоняет bash-чекеры (lint/build/TS/console/git) поверх кода, читает curated-материалы `clean-code/*` и опциональный markdown-контекст задания, переданный ментором, и записывает `CODE_REVIEW_REPORT.md` для последующей менторской правки.**

---

## 2. End-to-end сценарий

```
┌──────────────────────────────────────────────────────────────────────────┐
│  ONE-TIME INSTALL (~1 минута, единожды на машину)                        │
│                                                                          │
│  $ claude                            # в любой директории                │
│  > /plugin install pocket-mentor     # или эквивалентная skill-команда   │
│                                      # (точная форма — Claude Code       │
│                                      # native install mechanism)         │
│    [skill устанавливается в ~/.claude/skills/pocket-mentor/]             │
│    [bundle включает SKILL.md, references/, scripts/ — см. §3.2]          │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│  PER REVIEW                                                              │
│                                                                          │
│  $ git clone <student-pr-repo>                                           │
│  $ cd <student-repo>                                                     │
│  $ claude                                                                │
│                                                                          │
│  > /pocket-mentor review --context ./task-readme.md                      │
│         │                                                                │
│         ▼                                                                │
│   ┌──────────────────────────────────────────────────────────────┐       │
│   │  SKILL: pocket-mentor                                        │       │
│   │                                                              │       │
│   │  1. init.sh         → определить $PROJECT_DIR (pwd / флаг),  │       │
│   │                       поставить deps (--yes / --no-install), │       │
│   │                       прогнать lint + build, сохранить       │       │
│   │                       артефакты как JSON                     │       │
│   │                                                              │       │
│   │  2. checkers/*.sh   → фокусные mech-проверки                 │       │
│   │     • ts-usage      → any, as Type, ! non-null assertions    │       │
│   │     • no-console    → console.log в src/                     │       │
│   │     • commented-code                                         │       │
│   │     • todo          → TODO / FIXME                           │       │
│   │     • git-quality   → conventional commits, лишние файлы     │       │
│   │                                                              │       │
│   │  3. LLM analysis                                             │       │
│   │     читает:  clean-code/*, init+checkers JSON,               │       │
│   │              --context md, код студента                      │       │
│   │     применяет: инструкции SKILL.md (включая inline           │       │
│   │              PR-требования, commit-conventions, manual-      │       │
│   │              reminders из §3.8)                              │       │
│   │     не дублирует: то, что ESLint уже проверил                │       │
│   │                                                              │       │
│   │  4. Output: ./CODE_REVIEW_REPORT.md                          │       │
│   │     • mech findings (шаги 1-2)                               │       │
│   │     • LLM-анализ (шаг 3)                                     │       │
│   │     • manual-check reminders (из SKILL.md inline)            │       │
│   │     • ссылки на clean-code/* как абсолютные GitHub URLs      │       │
│   └──────────────────────────────────────────────────────────────┘       │
│                                                                          │
│  Ментор читает отчёт → правит → решает что передать студенту            │
│  (вставить фрагмент в PR-comment, обсудить, и т.д.)        │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Что эта proposition решает (зафиксированные точки)

### 3.1 Primary value driver

Ментор — единственный пользователь. «Консистентность» означает «*я-ментор* получаю предсказуемый output между PR» (per-mentor repeatability), а не «школа форсит единую рубрику между менторами» (cross-mentor standardisation — отвергнута).

### 3.2 Surface

**Claude Code skill.** Запуск изнутри склонированного репо студента: `/pocket-mentor review [--context <path-to-md>]`.

**Skill — self-contained installable bundle**

Структура skill-bundle (то, что ментор получает при установке):

```
~/.claude/skills/pocket-mentor/
├── SKILL.md                          # промпт + inline PR-требования,
│                                       commit-conventions, manual-reminders
├── references/
│   └── clean-code/                   # frozen copy на момент установки
│       ├── TypeScript.md
│       ├── HTML.md
│       ├── CSS.md
│       ├── React.md
│       ├── UI-UX.md
│       └── Clean-Code-Fundamental-Part1-6.md
└── scripts/
    ├── init.sh
    └── checkers/
        ├── check-ts-usage.sh
        ├── check-no-console.sh
        ├── check-commented-code.sh
        ├── check-todo.sh
        └── check-git-quality.sh
```

**Источники правды:**
- `mentor-resources/clean-code/*` — канонический curriculum (правится автором, ссылается из RS School docs)
- `mentor-resources/.claude/skills/pocket-mentor/` — dev-исходник skill-а (что коммитится в репо)
- `~/.claude/skills/pocket-mentor/` — installed snapshot на машине ментора

Когда `mentor-resources/clean-code/*` обновляется, skill-bundle пересобирается (copy/sync шагом перед публикацией), и менторы получают обновление через re-install.

**Что у ментора:**
1. **Установленный skill** в `~/.claude/skills/pocket-mentor/` — поставил один раз **через Claude Code-нативный install-механизм** 
2. **Склонированная репа студента** — на каждое ревью

### 3.3 Delivery

**Локальный `CODE_REVIEW_REPORT.md` в корне склонированного репо** (override через `--output-path`). 
GitHub draft posting (`event: PENDING`) — defer до v1.0 / по запросу.

### 3.4 Pre-flight механика

Текущий монолит `templates/scripts/auto-check.sh` deprecates и заменяется на:

- **`.claude/skills/pocket-mentor/scripts/init.sh`** — bootstrap: определяет `$PROJECT_DIR`, ставит deps (с `--yes` / `--no-install` для batch-режима), прогоняет lint + build, сохраняет вывод в JSON. Принимает `--output-path` для отчёта.
- **`.claude/skills/pocket-mentor/scripts/checkers/*.sh`** — фокусные bash-чекеры, каждый делает одну вещь, эмитит JSON. v0.9 minimum:
  - `check-ts-usage.sh` — `any`, `as Type`, `!` non-null assertions, типизация input/output параметров
  - `check-no-console.sh` — `console.log` в `src/`
  - `check-commented-code.sh` — закомментированный код
  - `check-todo.sh` — TODO / FIXME
  - `check-git-quality.sh` — conventional commits, лишние файлы в git

Все не интерактивные, на английском, JSON-output для skill-агрегации.

### 3.5 Mental model рубрик (концепция сохранена, имплементация упрощена)

```
L1 (common)       → clean-code/* + SKILL.md inline (PR-требования,
                    commit-conventions, manual-checks reminders)
L2 (stack)        → DEFERRED — не bundle-им в v0.9, решение «где живут»
                    откладываем до накопления реального набора
L3 (task)         → --context <path-to-md> на каждом запуске
                    (HARD REQUIREMENT, не опциональная фича)
L4 (overrides)    → DEFERRED — если нужно, ментор правит SKILL.md локально
```

Skill компонует слои **инструкцией в промпте**, не runtime-кодом. Никакого `RubricLoader` / `RubricComposer` / Zod / YAML.

### 3.6 «Не дублируй линтер» — сохраняется

Принцип переезжает из `reviewer.md` (строки 22-37 «ЧТО ПРОВЕРЯЕТ ESLINT (не дублировать)») в SKILL.md без потерь. На шаге 1 (`init.sh`) ESLint-факт зафиксирован; на шаге 3 (LLM analysis) skill инструктирован «LLM не повторяет то, что уже проверил линтер».

### 3.7 Интернационализация

Все bash-скрипты (`init.sh`, `checkers/*.sh`) и SKILL.md — **на английском**. В шапке SKILL.md инструкция «respond in the language the user communicates in». Это снимает `--language ru|en` флаг как продуктовый параметр; язык output-а определяется языком общения ментора с агентом в сессии.

**Стиль перевода:** адаптивный (сохранение структуры и педагогического тона), не дословный. Существующие RU-формулировки `reviewer.md` сжимаются + переводятся, не калькируются.

### 3.8 PR-требования, commit-conventions, manual-reminders — inline в SKILL.md

Раньше эта группа жила в `templates/checklists/checklist.md` (отдельный файл с маркерами `[🤖]` / `[👁]`). Теперь — **inline-секции SKILL.md** (отдельного checklist-файла больше нет).

Что мигрирует в SKILL.md:

**(а) PR-требования** (часть процессуальная — AI помогает, ментор проверяет):
- PR из ветки `task-name` в `main`, **не** merged
- Title ясный и информативный
- Description: ссылка на задание, скриншот, deploy URL, даты (done/deadline), self-check студента
- Нет лишних файлов в git (`node_modules`, `.env`, `dist`) — *проверяется* `check-git-quality.sh`

**(б) Commit-conventions** (что AI должен знать при объяснении findings):
- Conventional Commits (`init`, `feat`, `fix`, `refactor`, `docs`, `style`, `test`, `chore` — lowercase)
- Imperative mood, present tense
- Ссылка на canonical reference: https://www.conventionalcommits.org/
- *Проверяется автоматически:* `check-git-quality.sh`

**(в) Manual checks (always include in output as reminder)** — AI выводит эту секцию в конце `CODE_REVIEW_REPORT.md` *без_findings*, как чек-лист для ментора:
- **Functional:** app runs, no console errors, API works, features match spec
- **Design:** matches mockup, responsive, hover/active states, no overlapping elements

В SKILL.md явная инструкция агенту: «In the output report, always include a 'Manual checks (mentor reminder)' section with the items above — do NOT attempt to evaluate them yourself.»

**Цена решения:** контент, который раньше существовал как самостоятельный shareable документ (checklist.md), теперь только внутри SKILL.md. Если в практике возникнет нужда в standalone-варианте (для печати, для onboarding-слайдов) — отделим обратно за 10 минут.

### 3.9 Ссылки на `clean-code/*` — двойная форма

В SKILL.md две разные формы по двум разным функциям:

- **Local paths** (для агента: чтение как контекст) — `./references/clean-code/TypeScript.md` относительно SKILL.md, внутри installed bundle
- **Canonical URLs** (для output: ссылки в отчёте, которые ментор может переслать студенту) — `https://github.com/HelgaZhizhka/mentor-resources/blob/master/clean-code/TypeScript.md`

### 3.10 Клон обязателен

Ментор сам клонирует **репо студента** и запускает skill изнутри (`pwd` = `$PROJECT_DIR`). 

---

## 4. Keep / Build new / Drop / Defer

| Категория | Артефакт |
|---|---|
| **Keep** as-is | `clean-code/*` в `mentor-resources` (canonical curriculum, источник правды) |
| **Build new** | `.claude/skills/pocket-mentor/SKILL.md` (dev-исходник, на базе reviewer.md, English, две формы ссылок, **inline-секции:** PR-требования + commit-conventions + manual-reminders — см. §3.8) |
| **Build new** | `.claude/skills/pocket-mentor/references/clean-code/*.md` — bundled copies (sync из `mentor-resources/clean-code/` перед публикацией skill-а) |
| **Build new** | `.claude/skills/pocket-mentor/scripts/init.sh` (bootstrap, lint+build, JSON output, --output-path, non-interactive) |
| **Build new** | `.claude/skills/pocket-mentor/scripts/checkers/check-ts-usage.sh` |
| **Build new** | `.claude/skills/pocket-mentor/scripts/checkers/check-no-console.sh` |
| **Build new** | `.claude/skills/pocket-mentor/scripts/checkers/check-commented-code.sh` |
| **Build new** | `.claude/skills/pocket-mentor/scripts/checkers/check-todo.sh` |
| **Build new** | `.claude/skills/pocket-mentor/scripts/checkers/check-git-quality.sh` |
| **Build new** | **Distribution mechanism** — skill упаковывается под Claude Code-нативный install-механизм (`/plugin install`, `skill create` или эквивалент). Точная команда определяется при build-е Tue/Wed (зависит от текущего состояния CC skill/plugin API). На демо ментор ставит skill **одной CC-нативной командой**, без ручного `cp` / `git clone`. README skill-а документирует команду. |
| **Build new** | **Sync script** — `scripts/sync-references.sh` копирует `mentor-resources/clean-code/*` в `.claude/skills/pocket-mentor/references/clean-code/`. Запускается вручную перед commit-ом skill-обновления. |
| **Drop** | `templates/checklists/checklist.md` (контент мигрирует в SKILL.md как inline-секции PR-требований, commit-conventions и manual-reminders — см. §3.8) |
| **Drop** | `packages/engine/` целиком (RubricLoader, RubricComposer, EnrichmentLoader, Aggregator, 8 TS-чекеров, Zod-схемы, types) |
| **Drop** | `packages/cli/` (если есть) и весь `packages/` workspace, если он только под engine |
| **Drop** | `templates/agents/reviewer.md` (контент переезжает в SKILL.md; стаб не оставляем — RS School docs обновляются разово) |
| **Drop** | `templates/scripts/auto-check.sh` (функциональность распределяется по `init.sh` + чекерам) |
| **Drop** | План публичного `pocket-mentor-rubrics` repo |
| **Drop** | YAML-формат рубрик, `_template.yaml`, `CONTRIBUTING.md` для rubrics-repo |
| **Drop** | CLI флаги: `--stack`, `--task`, `--rubrics-source`, `--as-draft`, `--language`, `--level` |
| **Drop** | Auth cascade (`gh auth token` / `GITHUB_TOKEN` / `~/.pocket-mentor/token`) — не нужно без GH-API-delivery |
| **Defer** | AST-уровень чекеры (forbidden-imports, magic-numbers-scan, html-body-allowed-tags) — добавим в bash-форме когда пилот покажет нужду |
| **Defer** | `templates/rubrics/` директория — когда повторяющийся набор сложится из практики (минимум 2-3 ментора с разными курсами) |
| **Defer** | GitHub draft delivery (α-режим) — когда (γ)-output отлажен; одна функция в SKILL.md, ~20 строк bash с `gh api` |
| **Defer** | L2 (stack) / L4 (overrides) механика — если станет нужно после пилота |
| **Defer** | Калибровка уровня студента (`--level junior\|standard\|senior` или эквивалент) — заменяется на «ментор говорит агенту в сессии: для джуна, помягче» |
| **Defer** | Standalone-prompt экспорт для не-Claude-Code менторов (если такая аудитория обнаружится) |

---

## 5. Что эта proposition означает относительно текущего SPEC.md

Сводка изменений vs `feature/pocket-mentor-v0.9-spec` branch:

- **§1 Goal (REVISED)** — переписывается полностью: вместо CLI с четырёхслойной YAML-композицией → skill с MD-контекстом и pre-flight bash
- **§2 Out of scope** — расширяется: теперь out of scope также и CLI-бинарник, YAML-рубрики, public rubrics repo, GH draft delivery, всё калибровка-семейство (`--level`, `--language`, `review_limits`, severity-based filtering)
- **§3 Architecture (REVISED)** — переписывается: `mentor-resources` остаётся, но без `packages/`; новая директория `templates/scripts/checkers/`; новая директория `.claude/skills/pocket-mentor/`
- **§4 Modules** — выкидывается практически целиком; компонент-список превращается в файловый список из §4 текущего документа
- **§5 Data Flow** — переписывается под skill-флоу
- **§6 Error Handling** — drastically упрощается (нет GH API ошибок, нет LLM retry-логики за пределами обычного skill-поведения)
- **§7 Verification** — упрощается: `pnpm exec tsc --noEmit` уходит (нет TS-кода); остаётся ESLint на bash-скриптах + smoke на 1-2 PR
- **§8 Harness Layer** — сохраняется (AGENTS.md, feature_list.json, progress.md, init.sh для разработки skill-а), но scope сужается до skill-разработки
- **§10 Per-milestone scope** — M4/M5/M6 переписываются под новый план; M0-M3 помечаются как «выполнены под старую архитектуру, дельта сохранена в branch `feature/pocket-mentor-v0.9-spec`»
- **§11 Decisions log** — добавляется блок «2026-05-18 redesign» со ссылкой на этот документ

CONTEXT.md тоже подлежит переписыванию (особенно блоки «Rubric architecture — four-layer composition» и «Output format & delivery» и «Distribution model — open-core»)

---

## 6. Решения, зафиксированные в grilling-сессии 2026-05-18

| # | Решение | Источник |
|---|---|---|
| 1 | Primary value = per-mentor repeatability (не cross-mentor standardisation) | Helga: «менторы работают совершенно независимо» |
| 2 | Ad-hoc MD-контекст через параметр — hard requirement | Helga: «должен сохраниться вариант передать дополнительный контекст агенту через md файл» |
| 3 | Surface = Claude Code skill, без CLI-бинарника | Q2 → (a) |
| 4 | M0-M3 фейт = удалить `packages/engine/` целиком | Q3 → revised на (c) после обсуждения clone-сценария |
| 5 | Delivery = локальный `CODE_REVIEW_REPORT.md`, GH-draft в roadmap | Q4 → (γ) для v0.9, (α) defer |
| 6 | Стартовые рубрики — не bundle-им; контекст только через `--context` | Q5 → defer locations decision |
| 7 | Skill input = `<repo-path> [--context <path>]`; калибровка голосом | Q6 → (a) минимум |
| 8 | Pre-flight = новые `init.sh` + `checkers/*.sh`, `auto-check.sh` deprecated | Helga: «лучше убрать [auto-check.sh] и сделать отдельные чекеры + init» |
| 9 | i18n: все bash + SKILL.md на английском, «respond in user's language» | Helga: «нужно также перевести в скрипте и промпте на английский» |
| 10 | Clone обязателен; `pwd` определяет `$PROJECT_DIR` | Q7 → (III) — Helga: «ментор все таки должен склонировать репо студента, и там запускать» |
| 11 | `reviewer.md` дропается, контент переезжает в SKILL.md | Helga: «возможно как вариант нам убрать reviewer.md? и пусть будет только инструкции в скиле» |
| 12 | `templates/checklists/checklist.md` дропается; PR-требования + commit-conventions + manual-reminders мигрируют как inline-секции в SKILL.md | Helga: «он нам точно нужен как отдельный файл?» + «нужно сохранить те требования которые там» |
| 13 | Skill устанавливается через Claude Code-нативный install-механизм (`/plugin install`, `skill create` или эквивалент); никаких ручных `cp` / `git clone` в `~/.claude/skills/` | Helga: «нам нужно сделать отдельно скил, который он может установить, чтобы не копировать этот репо» |

---

## 7. Что строим к четвергу (2026-05-21)

Минимально-достаточный набор артефактов, чтобы было рабочее демо:

| # | Артефакт | Тип |
|---|---|---|
| 1 | `.claude/skills/pocket-mentor/SKILL.md` | Build new — на базе reviewer.md, English, две формы ссылок, **inline:** PR-требования + commit-conventions + manual-reminders из §3.8 |
| 2 | `.claude/skills/pocket-mentor/references/clean-code/` | Build new — copy `mentor-resources/clean-code/*` в bundle |
| 3 | `.claude/skills/pocket-mentor/scripts/init.sh` | Build new — bootstrap: pwd, deps, lint+build, JSON output |
| 4 | `.claude/skills/pocket-mentor/scripts/checkers/check-ts-usage.sh` | Build new |
| 5 | `.claude/skills/pocket-mentor/scripts/checkers/check-no-console.sh` | Build new |
| 6 | Install-команда в README skill-а | Doc — CC-нативный install |
| 7 | Смоук-прогон на 1 историческом PR | Action — проверка end-to-end |

**Откладываем (не блокируют демо):** 3 остальных чекера (`commented-code`, `todo`, `git-quality`); удаление `packages/engine/`, `templates/agents/reviewer.md`, `templates/scripts/auto-check.sh`; rewrite `SPEC.md` / `CONTEXT.md`; AST-чекеры; GH draft delivery; L2/L4 механика.
