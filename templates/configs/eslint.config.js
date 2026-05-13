// ESLint Configuration for Clean Code
// Covers maximum rules from the clean-code repository

import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintPluginPrettier from 'eslint-plugin-prettier/recommended';
import importPlugin from 'eslint-plugin-import';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import unicorn from 'eslint-plugin-unicorn';
import globals from 'globals';

export default tseslint.config(
  { ignores: ['node_modules', 'dist', 'coverage', 'build'] },
  {
    linterOptions: {
      noInlineConfig: true,
      reportUnusedDisableDirectives: 'error',
    },
  },
  {
    extends: [
      js.configs.recommended,
      ...tseslint.configs.strictTypeChecked,
      ...tseslint.configs.stylisticTypeChecked,
      unicorn.configs.recommended,
      jsxA11y.flatConfigs.recommended,
      eslintPluginPrettier,
    ],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2023,
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      import: importPlugin,
    },
    rules: {
      // ==============================================
      // NAMING CONVENTIONS
      // ==============================================

      // No single-letter variables (except i, j, k in loops)
      'id-length': [
        'error',
        {
          min: 2,
          exceptions: ['i', 'j', 'k', 'x', 'y', 'z', '_', 'e'],
          properties: 'never',
        },
      ],

      // Naming style (camelCase for variables, PascalCase for classes)
      '@typescript-eslint/naming-convention': [
        'error',
        // camelCase for variables and functions
        {
          selector: 'variable',
          format: ['camelCase', 'UPPER_CASE', 'PascalCase'],
          leadingUnderscore: 'allow',
        },
        {
          selector: 'function',
          format: ['camelCase', 'PascalCase'], // PascalCase for React components
        },
        // PascalCase for classes, interfaces, types
        {
          selector: 'typeLike',
          format: ['PascalCase'],
        },
        // Boolean variables must start with is/has/should/can
        {
          selector: 'variable',
          types: ['boolean'],
          format: ['PascalCase'],
          prefix: ['is', 'has', 'should', 'can', 'will', 'did'],
        },
      ],

      // ==============================================
      // TYPESCRIPT STRICTNESS
      // ==============================================

      // No any
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
      '@typescript-eslint/no-unsafe-argument': 'error',

      // Explicit return types for functions
      '@typescript-eslint/explicit-function-return-type': [
        'error',
        {
          allowExpressions: true,
          allowTypedFunctionExpressions: true,
          allowHigherOrderFunctions: true,
          allowDirectConstAssertionInArrowFunctions: true,
          allowConciseArrowFunctionExpressionsStartingWithVoid: true,
        },
      ],

      // Explicit access modifiers
      '@typescript-eslint/explicit-member-accessibility': [
        'error',
        { accessibility: 'explicit', overrides: { constructors: 'off' } },
      ],

      // No empty interfaces
      '@typescript-eslint/no-empty-interface': 'error',

      // Consistent type imports
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],

      // No type assertions (as, <Type>)
      '@typescript-eslint/consistent-type-assertions': [
        'error',
        {
          assertionStyle: 'never', // Forbids 'as' and '<Type>' assertions
        },
      ],

      // Class/interface member ordering
      '@typescript-eslint/member-ordering': 'error',

      // Use Record instead of object/{}
      '@typescript-eslint/consistent-indexed-object-style': ['error', 'record'],

      // Prefer type over interface
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],

      // ==============================================
      // FUNCTIONS
      // ==============================================

      // Maximum 3 parameters
      'max-params': ['error', 3],

      // Maximum function length (30 lines)
      'max-lines-per-function': [
        'error',
        {
          max: 30,
          skipBlankLines: true,
          skipComments: true,
          IIFEs: true,
        },
      ],

      // Maximum file length (400 lines)
      'max-lines': [
        'warn',
        {
          max: 400,
          skipBlankLines: true,
          skipComments: true,
        },
      ],

      // Maximum nesting depth (3 levels)
      'max-depth': ['error', 3],

      // Maximum cyclomatic complexity
      complexity: ['error', 10],

      // No nested ternary operators
      'no-nested-ternary': 'error',

      // Prefer arrow functions
      'prefer-arrow-callback': ['error', { allowNamedFunctions: false }],

      // Arrow function return style
      'arrow-body-style': ['error', 'as-needed'],

      // ==============================================
      // CLEAN CODE PRINCIPLES
      // ==============================================

      // Dead code (no-unused-vars configured below in IMPORTS section)
      'no-unreachable': 'error',
      'no-unreachable-loop': 'error',

      // Class methods should use 'this'
      'class-methods-use-this': 'error',

      // Warning comments (TODO, FIXME, HACK)
      'no-warning-comments': [
        'warn',
        {
          terms: ['fixme', 'todo', 'hack'],
          location: 'start',
        },
      ],

      // Magic numbers
      '@typescript-eslint/no-magic-numbers': [
        'error',
        {
          ignore: [0, 1, -1],
          ignoreArrayIndexes: true,
          ignoreDefaultValues: true,
          ignoreEnums: true,
          ignoreNumericLiteralTypes: true,
          ignoreReadonlyClassProperties: true,
          ignoreTypeIndexes: true,
        },
      ],

      // Immutability
      '@typescript-eslint/prefer-readonly': 'error',
      '@typescript-eslint/prefer-readonly-parameter-types': 'off', // Too strict

      // Use const by default
      'prefer-const': 'error',
      'no-var': 'error',

      // ==============================================
      // ERROR HANDLING
      // ==============================================

      // No empty catch blocks
      'no-empty': ['error', { allowEmptyCatch: false }],

      // Optional chaining
      '@typescript-eslint/prefer-optional-chain': 'error',

      // Nullish coalescing
      '@typescript-eslint/prefer-nullish-coalescing': 'error',

      // Promise handling
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/promise-function-async': 'error',

      // Error handling
      'no-throw-literal': 'off',
      '@typescript-eslint/only-throw-error': 'error',

      // ==============================================
      // ASYNC/AWAIT
      // ==============================================

      // Await in async functions
      '@typescript-eslint/require-await': 'error',

      // Proper await usage
      '@typescript-eslint/await-thenable': 'error',

      // Prefer async/await over then
      'prefer-promise-reject-errors': 'error',
      'no-promise-executor-return': 'error',

      // ==============================================
      // REACT
      // ==============================================

      ...reactHooks.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,

      // No default export (only named exports)
      'import/no-default-export': 'error',
      'import/prefer-default-export': 'off',

      // Key in map()
      'react/jsx-key': ['error', { checkFragmentShorthand: true }],

      // No dangerouslySetInnerHTML
      'react/no-danger': 'error',

      // Hooks rules
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // Props destructuring
      'react/destructuring-assignment': ['error', 'always'],

      // No array index as key
      'react/no-array-index-key': 'error',

      // Self-closing tags
      'react/self-closing-comp': 'error',

      // JSX boolean value
      'react/jsx-boolean-value': ['error', 'never'],

      // Fragment shorthand
      'react/jsx-fragments': ['error', 'syntax'],

      // Props spreading
      'react/jsx-props-no-spreading': 'off', // Allow ...props

      // ==============================================
      // CONSOLE & DEBUGGING
      // ==============================================

      // No console.log
      'no-console': ['error', { allow: ['warn', 'error'] }],

      // No debugger
      'no-debugger': 'error',

      // No alert
      'no-alert': 'error',

      // ==============================================
      // IMPORTS
      // ==============================================

      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'type'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],

      // No circular dependencies
      'import/no-cycle': ['error', { maxDepth: Infinity }],

      // No unused imports (also covers dead code detection)
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],

      // No relative paths for parent imports
      'import/no-relative-packages': 'error',

      // Imports must be at the top
      'import/first': 'error',

      // Newline after imports
      'import/newline-after-import': 'error',

      // ==============================================
      // UNICORN (Best Practices)
      // ==============================================

      'unicorn/filename-case': [
        'error',
        {
          cases: {
            kebabCase: true, // Allow kebab-case (utils, hooks, etc.)
            pascalCase: true, // Allow PascalCase (React components)
          },
        },
      ],

      // Disable rules that conflict with team code style
      // or are too strict for educational purposes
      'unicorn/no-array-callback-reference': 'off', // Allow callback reference for brevity
      'unicorn/no-array-for-each': 'off', // forEach is sometimes appropriate in simple loops
      'unicorn/no-array-reduce': 'off', // reduce is useful for complex transformations
      'unicorn/no-null': 'off', // null is acceptable in TypeScript projects
      'unicorn/number-literal-case': 'off', // Uppercase not always needed for hex/bin literals
      'unicorn/numeric-separators-style': 'off', // Numeric separators are optional
      'unicorn/prevent-abbreviations': [
        'error',
        {
          allowList: {
            acc: true, // accumulator in reduce
            env: true, // environment variables
            i: true, // loop index
            j: true, // nested loop index
            props: true, // React props
            Props: true, // React Props type
          },
        },
      ],
      'unicorn/prefer-top-level-await': 'off', // Not always applicable in components and functions

      // Prefer modern syntax
      'unicorn/prefer-module': 'error',
      'unicorn/prefer-node-protocol': 'error',
      'unicorn/prefer-spread': 'error',

      // ==============================================
      // BEST PRACTICES
      // ==============================================

      // Prefer template strings
      'prefer-template': 'error',

      // Object shorthand
      'object-shorthand': ['error', 'always'],

      // Destructuring
      'prefer-destructuring': [
        'error',
        {
          array: false,
          object: true,
        },
      ],

      // Arrow functions
      'arrow-parens': ['error', 'always'],

      // Spread instead of Object.assign
      'prefer-object-spread': 'error',

      // Rest parameters instead of arguments
      'prefer-rest-params': 'error',

      // Spread instead of apply
      'prefer-spread': 'error',

      // Strict equality
      eqeqeq: ['error', 'always'],

      // No implicit coercion
      'no-implicit-coercion': 'error',

      // No useless return
      'no-useless-return': 'error',

      // No else return
      'no-else-return': ['error', { allowElseIf: false }],

      // Yoda conditions
      yoda: ['error', 'never'],

      // Curly braces
      curly: ['error', 'all'],
    },
    settings: {
      react: {
        version: 'detect',
      },
      'import/resolver': {
        typescript: true,
        node: true,
      },
    },
  }
);
