# RS School student configs

Reference TypeScript + ESLint configs aligned with the RS School clean-code
checklist. Students copy these into their own project repos as a starting
point.

These are **not** the configs used by `mentor-resources` itself. The repo
root has its own minimal Node-only `eslint.config.js` and `tsconfig.base.json`
for the Pocket Mentor `packages/engine` and `packages/cli`.

## Available profiles

### TypeScript

Use this profile for TypeScript projects without React, including projects with
classes, services, utilities, and browser TypeScript code.

- `eslint.config.js`
- `tsconfig.json`

### React + TypeScript

Use this profile for React projects. It extends the base TypeScript rules with
React, React Hooks, React Refresh, and accessibility checks.

- `eslint.react.config.js`
- `tsconfig.react.json`

## Usage: TypeScript project

From your student project root:

```bash
cp path/to/mentor-resources/templates/configs/tsconfig.json ./tsconfig.json
cp path/to/mentor-resources/templates/configs/eslint.config.js ./eslint.config.js
pnpm add -D typescript eslint typescript-eslint \
  @eslint/js globals \
  eslint-plugin-import eslint-import-resolver-typescript \
  eslint-plugin-unicorn eslint-plugin-prettier eslint-config-prettier prettier
```

## Usage: React + TypeScript project

From your student project root:

```bash
cp path/to/mentor-resources/templates/configs/tsconfig.react.json ./tsconfig.json
cp path/to/mentor-resources/templates/configs/eslint.config.js ./eslint.config.js
cp path/to/mentor-resources/templates/configs/eslint.react.config.js ./eslint.react.config.js
pnpm add -D typescript eslint typescript-eslint \
  @eslint/js globals \
  eslint-plugin-import eslint-import-resolver-typescript \
  eslint-plugin-unicorn eslint-plugin-prettier eslint-config-prettier prettier \
  eslint-plugin-react eslint-plugin-react-hooks eslint-plugin-react-refresh \
  eslint-plugin-jsx-a11y
```

For ESLint, use the React config explicitly, for example:

```bash
eslint -c eslint.react.config.js .
```

If you use the `@/*` path alias from `tsconfig.json`, configure the same alias in
your bundler, for example in `vite.config.ts`.

See [`LINTER-README.md`](./LINTER-README.md) for the full rule rationale.
