#!/usr/bin/env bash
set -euo pipefail

echo "==> Installing dependencies (pnpm)"
pnpm install

echo "==> Linting"
pnpm lint

echo "==> Type-checking"
pnpm exec tsc --noEmit

echo "==> init.sh complete: repo is in clean state"
