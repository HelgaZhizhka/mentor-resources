#!/usr/bin/env bash
# React Course Review — init.sh
# Bootstrap: detect React course project traits, run lint/build, emit JSON to stdout.
# Non-interactive. All diagnostic output goes to stderr.

set -uo pipefail

if [[ ! -t 2 || -n "${NO_COLOR:-}" ]]; then
  RED="" GREEN="" YELLOW="" RESET=""
else
  RED=$'\e[31m'; GREEN=$'\e[32m'; YELLOW=$'\e[33m'; RESET=$'\e[0m'
fi

info() { echo "${RESET}[react-course-init] $*"              >&2; }
ok()   { echo "${GREEN}[react-course-init] ✓ $*${RESET}"   >&2; }
fail() { echo "${RED}[react-course-init] ✗ $*${RESET}"     >&2; }
skip() { echo "${YELLOW}[react-course-init] ⊘ $*${RESET}"  >&2; }

PROJECT_DIR=""
INSTALL_MODE="auto"  # auto | yes | no

while [[ $# -gt 0 ]]; do
  case "$1" in
    --project-dir) PROJECT_DIR="$2"; shift 2 ;;
    --yes)         INSTALL_MODE="yes"; shift ;;
    --no-install)  INSTALL_MODE="no"; shift ;;
    -h|--help)
      cat >&2 <<EOF
Usage: $0 [--project-dir <path>] [--yes | --no-install]
Emits a single JSON object describing React/tooling/lint/build outcomes.
EOF
      exit 0
      ;;
    *) fail "unknown arg: $1"; exit 2 ;;
  esac
done

[[ -z "$PROJECT_DIR" ]] && PROJECT_DIR="$(pwd)"

if [[ ! -d "$PROJECT_DIR" ]]; then
  fail "not a directory: $PROJECT_DIR"
  exit 1
fi

cd "$PROJECT_DIR" || { fail "cannot cd $PROJECT_DIR"; exit 1; }

DIR_CHANGED=false
HAS_PACKAGE_JSON=false
[[ -f "package.json" ]] && HAS_PACKAGE_JSON=true

if ! $HAS_PACKAGE_JSON; then
  CANDIDATE="$(find . -maxdepth 2 -name "package.json" -not -path "*/node_modules/*" | head -1)"
  if [[ -n "$CANDIDATE" ]]; then
    SUBDIR="$(dirname "$CANDIDATE")"
    info "no package.json at root; descending into ${SUBDIR}"
    cd "$SUBDIR" || { fail "cannot cd $SUBDIR"; exit 1; }
    PROJECT_DIR="$(pwd)"
    HAS_PACKAGE_JSON=true
    DIR_CHANGED=true
  fi
fi

PM="npm"
if [[ -f "pnpm-lock.yaml" ]]; then PM="pnpm"
elif [[ -f "yarn.lock" ]]; then PM="yarn"
elif [[ -f "package-lock.json" ]]; then PM="npm"
fi

HAS_SRC=false
[[ -d "src" ]] && HAS_SRC=true

HAS_README=false
for f in README.md README.MD Readme.md readme.md README README.markdown; do
  if [[ -f "$f" ]]; then HAS_README=true; break; fi
done

PROJECT_NAME=""
PACKAGE_TEXT=""
if $HAS_PACKAGE_JSON; then
  PACKAGE_TEXT="$(tr '\n' ' ' < package.json)"
  PROJECT_NAME="$(grep '"name"' package.json | head -1 | sed 's/.*"name": *"\([^"]*\)".*/\1/' | tr -d ',')"
fi
[[ -z "$PROJECT_NAME" ]] && PROJECT_NAME="$(basename "$PROJECT_DIR")"

has_pkg_token() {
  local token="$1"
  [[ "$PACKAGE_TEXT" == *"\"$token\""* ]]
}

has_script() {
  local script_name="$1"
  $HAS_PACKAGE_JSON && grep -q "\"$script_name\"[[:space:]]*:" package.json
}

HAS_REACT=false
HAS_TYPESCRIPT=false
HAS_ROUTER=false
HAS_TESTS=false
HAS_VITE=false
HAS_NEXT=false
HAS_CRA=false

if $HAS_PACKAGE_JSON; then
  has_pkg_token "react" && HAS_REACT=true
  has_pkg_token "typescript" && HAS_TYPESCRIPT=true
  has_pkg_token "react-router" && HAS_ROUTER=true
  has_pkg_token "react-router-dom" && HAS_ROUTER=true
  has_pkg_token "vitest" && HAS_TESTS=true
  has_pkg_token "jest" && HAS_TESTS=true
  has_pkg_token "@testing-library/react" && HAS_TESTS=true
  has_pkg_token "vite" && HAS_VITE=true
  has_pkg_token "next" && HAS_NEXT=true
  has_pkg_token "react-scripts" && HAS_CRA=true
fi

HAS_TSCONFIG=false
TS_STRICT=false
TS_NO_IMPLICIT_ANY=false
if [[ -f "tsconfig.json" ]]; then
  HAS_TSCONFIG=true
  grep -q '"strict"[[:space:]]*:[[:space:]]*true' tsconfig.json && TS_STRICT=true
  grep -q '"noImplicitAny"[[:space:]]*:[[:space:]]*true' tsconfig.json && TS_NO_IMPLICIT_ANY=true
fi

HAS_ESLINT=false
for f in eslint.config.js eslint.config.mjs eslint.config.cjs .eslintrc .eslintrc.js .eslintrc.json .eslintrc.cjs .eslintrc.yml; do
  if [[ -f "$f" ]]; then HAS_ESLINT=true; break; fi
done

HAS_DEV_SCRIPT=false
HAS_LINT_SCRIPT=false
HAS_BUILD_SCRIPT=false
HAS_TEST_SCRIPT=false
has_script "dev" && HAS_DEV_SCRIPT=true
has_script "lint" && HAS_LINT_SCRIPT=true
has_script "build" && HAS_BUILD_SCRIPT=true
has_script "test" && HAS_TEST_SCRIPT=true

DEPS_INSTALLED=true
if $HAS_PACKAGE_JSON && [[ ! -d "node_modules" ]]; then
  case "$INSTALL_MODE" in
    no)
      skip "node_modules missing, --no-install set"
      DEPS_INSTALLED=false
      ;;
    yes|auto)
      info "installing deps via ${PM}..."
      if $PM install >/tmp/react-course-review-install.log 2>&1; then
        ok "deps installed"
      else
        fail "deps install FAILED (see /tmp/react-course-review-install.log)"
        DEPS_INSTALLED=false
      fi
      ;;
  esac
fi

LINT_RAN=false
LINT_OK=false
LINT_TAIL=""
if $HAS_PACKAGE_JSON && $DEPS_INSTALLED && $HAS_LINT_SCRIPT; then
  LINT_RAN=true
  if $PM run lint >/tmp/react-course-review-lint.log 2>&1; then
    LINT_OK=true
    ok "lint passed"
  else
    LINT_TAIL="$(tail -40 /tmp/react-course-review-lint.log | sed 's/\\/\\\\/g; s/"/\\"/g' | awk 'BEGIN{ORS="\\n"} {print}')"
    fail "lint check failed"
  fi
fi

BUILD_RAN=false
BUILD_OK=false
BUILD_TAIL=""
if $HAS_PACKAGE_JSON && $DEPS_INSTALLED && $HAS_BUILD_SCRIPT; then
  BUILD_RAN=true
  if $PM run build >/tmp/react-course-review-build.log 2>&1; then
    BUILD_OK=true
    ok "build passed"
  else
    BUILD_TAIL="$(tail -40 /tmp/react-course-review-build.log | sed 's/\\/\\\\/g; s/"/\\"/g' | awk 'BEGIN{ORS="\\n"} {print}')"
    fail "build check failed"
  fi
fi

status() {
  local ran="$1" ok="$2"
  if $ok; then echo pass
  elif $ran; then echo fail
  else echo skip
  fi
}

LINT_STATUS="$(status "$LINT_RAN" "$LINT_OK")"
BUILD_STATUS="$(status "$BUILD_RAN" "$BUILD_OK")"

INIT_OK=true
$HAS_PACKAGE_JSON || INIT_OK=false

READY_TO_REVIEW=true
$HAS_PACKAGE_JSON || READY_TO_REVIEW=false
$HAS_REACT || READY_TO_REVIEW=false
$LINT_RAN && ! $LINT_OK && READY_TO_REVIEW=false
$BUILD_RAN && ! $BUILD_OK && READY_TO_REVIEW=false

SUMMARY="react-course-init: react=${HAS_REACT} ts=${HAS_TYPESCRIPT} lint=${LINT_STATUS} build=${BUILD_STATUS}"
if ! $HAS_PACKAGE_JSON; then
  SUMMARY="react-course-init: no package.json found in ${PROJECT_DIR} or its subdirectories"
fi

cat <<EOF
{
  "checker": "react-course-init",
  "ok": $INIT_OK,
  "ready_to_review": $READY_TO_REVIEW,
  "summary": "$SUMMARY",
  "project": {
    "name": "$PROJECT_NAME",
    "dir": "$PROJECT_DIR",
    "dir_changed": $DIR_CHANGED,
    "package_manager": "$PM",
    "has_package_json": $HAS_PACKAGE_JSON,
    "has_src": $HAS_SRC,
    "has_readme": $HAS_README,
    "is_react_project": $HAS_REACT,
    "has_typescript_dependency": $HAS_TYPESCRIPT,
    "has_tsconfig": $HAS_TSCONFIG,
    "ts_strict": $TS_STRICT,
    "ts_no_implicit_any": $TS_NO_IMPLICIT_ANY,
    "has_eslint_config": $HAS_ESLINT,
    "deps_installed": $DEPS_INSTALLED
  },
  "tooling": {
    "vite": $HAS_VITE,
    "next": $HAS_NEXT,
    "cra": $HAS_CRA,
    "router": $HAS_ROUTER,
    "tests": $HAS_TESTS
  },
  "scripts": {
    "dev": $HAS_DEV_SCRIPT,
    "lint": $HAS_LINT_SCRIPT,
    "build": $HAS_BUILD_SCRIPT,
    "test": $HAS_TEST_SCRIPT
  },
  "lint": { "ran": $LINT_RAN, "ok": $LINT_OK, "tail": "$LINT_TAIL" },
  "build": { "ran": $BUILD_RAN, "ok": $BUILD_OK, "tail": "$BUILD_TAIL" }
}
EOF
