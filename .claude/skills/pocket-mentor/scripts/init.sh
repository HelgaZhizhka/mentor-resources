#!/usr/bin/env bash
# Pocket Mentor — init.sh
# Bootstrap: detect $PROJECT_DIR, check deps, run lint+build, emit JSON to stdout.
# Non-interactive. All diagnostic output to stderr.

set -uo pipefail

if [[ ! -t 2 || -n "${NO_COLOR:-}" ]]; then
  RED="" GREEN="" YELLOW="" RESET=""
else
  RED=$'\e[31m'; GREEN=$'\e[32m'; YELLOW=$'\e[33m'; RESET=$'\e[0m'
fi

info() { echo "${RESET}[init] $*"              >&2; }
ok()   { echo "${GREEN}[init] ✓ $*${RESET}"   >&2; }
fail() { echo "${RED}[init] ✗ $*${RESET}"     >&2; }
skip() { echo "${YELLOW}[init] ⊘ $*${RESET}"  >&2; }

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
Emits a single JSON object describing config / lint / build outcomes.
EOF
      exit 0
      ;;
    *) fail "unknown arg: $1"; exit 2 ;;
  esac
done

[[ -z "$PROJECT_DIR" ]] && PROJECT_DIR="$(pwd)"

if [[ ! -d "$PROJECT_DIR" ]]; then
  fail "not a directory: $PROJECT_DIR"; exit 1
fi

cd "$PROJECT_DIR" || { fail "cannot cd $PROJECT_DIR"; exit 1; }

# --- locate package.json (may be in a subdirectory) ---
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

# --- detect package manager (after possible descent) ---
PM="npm"
if [[ -f "pnpm-lock.yaml" ]]; then PM="pnpm"
elif [[ -f "yarn.lock" ]];   then PM="yarn"
elif [[ -f "package-lock.json" ]]; then PM="npm"
fi

HAS_SRC=false
[[ -d "src" ]] && HAS_SRC=true

HAS_README=false
for f in README.md README.MD Readme.md readme.md README README.markdown; do
  if [[ -f "$f" ]]; then HAS_README=true; break; fi
done

PROJECT_NAME=""
if $HAS_PACKAGE_JSON; then
  PROJECT_NAME="$(grep '"name"' package.json | head -1 | sed 's/.*"name": *"\([^"]*\)".*/\1/' | tr -d ',')"
fi
[[ -z "$PROJECT_NAME" ]] && PROJECT_NAME="$(basename "$PROJECT_DIR")"

# --- detect TS config ---
HAS_TSCONFIG=false
TS_STRICT=false
TS_NO_IMPLICIT_ANY=false
if [[ -f "tsconfig.json" ]]; then
  HAS_TSCONFIG=true
  grep -q '"strict"[[:space:]]*:[[:space:]]*true' tsconfig.json && TS_STRICT=true
  grep -q '"noImplicitAny"[[:space:]]*:[[:space:]]*true' tsconfig.json && TS_NO_IMPLICIT_ANY=true
fi

# --- detect ESLint ---
HAS_ESLINT=false
for f in eslint.config.js eslint.config.mjs eslint.config.cjs .eslintrc .eslintrc.js .eslintrc.json .eslintrc.cjs .eslintrc.yml; do
  if [[ -f "$f" ]]; then HAS_ESLINT=true; break; fi
done

# --- install deps if needed ---
DEPS_INSTALLED=true
if $HAS_PACKAGE_JSON && [[ ! -d "node_modules" ]]; then
  case "$INSTALL_MODE" in
    no)
      skip "node_modules missing, --no-install set"
      DEPS_INSTALLED=false
      ;;
    yes|auto)
      info "installing deps via ${PM}..."
      if $PM install >/tmp/pocket-mentor-install.log 2>&1; then
        ok "deps installed"
      else
        fail "deps install FAILED (see /tmp/pocket-mentor-install.log)"
        DEPS_INSTALLED=false
      fi
      ;;
  esac
fi

# --- lint ---
LINT_RAN=false
LINT_OK=false
LINT_TAIL=""
if $HAS_PACKAGE_JSON && $DEPS_INSTALLED && grep -q '"lint"' package.json; then
  LINT_RAN=true
  if $PM run lint >/tmp/pocket-mentor-lint.log 2>&1; then
    LINT_OK=true
    ok "lint passed"
  else
    LINT_TAIL="$(tail -40 /tmp/pocket-mentor-lint.log | sed 's/"/\\"/g; s/\\/\\\\/g' | awk 'BEGIN{ORS="\\n"} {print}')"
    fail "lint check failed"
  fi
fi

# --- build ---
BUILD_RAN=false
BUILD_OK=false
BUILD_TAIL=""
if $HAS_PACKAGE_JSON && $DEPS_INSTALLED && grep -q '"build"' package.json; then
  BUILD_RAN=true
  if $PM run build >/tmp/pocket-mentor-build.log 2>&1; then
    BUILD_OK=true
    ok "build passed"
  else
    BUILD_TAIL="$(tail -40 /tmp/pocket-mentor-build.log | sed 's/"/\\"/g; s/\\/\\\\/g' | awk 'BEGIN{ORS="\\n"} {print}')"
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

# ready_to_review: true only if bootstrap completed AND lint/build either passed or were not applicable
READY_TO_REVIEW=true
$HAS_PACKAGE_JSON || READY_TO_REVIEW=false
$LINT_RAN  && ! $LINT_OK  && READY_TO_REVIEW=false
$BUILD_RAN && ! $BUILD_OK && READY_TO_REVIEW=false

SUMMARY="init: pm=${PM} lint=${LINT_STATUS} build=${BUILD_STATUS}"
if ! $HAS_PACKAGE_JSON; then
  SUMMARY="init: no package.json found in ${PROJECT_DIR} or its subdirectories"
fi

# --- emit JSON ---
cat <<EOF
{
  "checker": "init",
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
    "has_tsconfig": $HAS_TSCONFIG,
    "ts_strict": $TS_STRICT,
    "ts_no_implicit_any": $TS_NO_IMPLICIT_ANY,
    "has_eslint_config": $HAS_ESLINT,
    "deps_installed": $DEPS_INSTALLED
  },
  "lint": { "ran": $LINT_RAN, "ok": $LINT_OK, "tail": "$LINT_TAIL" },
  "build": { "ran": $BUILD_RAN, "ok": $BUILD_OK, "tail": "$BUILD_TAIL" }
}
EOF
