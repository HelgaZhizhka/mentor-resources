// ESLint Configuration for Clean React + TypeScript Code
// Extends the base TypeScript configuration with React, React Hooks, React Refresh,
// and accessibility rules.

import jsxA11y from 'eslint-plugin-jsx-a11y';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

import baseConfig from './eslint.config.js';

export default tseslint.config(...baseConfig, jsxA11y.flatConfigs.recommended, {
  files: ['**/*.{ts,tsx}'],
  plugins: {
    react,
    'react-hooks': reactHooks,
    'react-refresh': reactRefresh,
  },
  rules: {
    ...reactHooks.configs.recommended.rules,
    ...react.configs.recommended.rules,
    ...react.configs['jsx-runtime'].rules,

    // TypeScript handles React prop types.
    'react/prop-types': 'off',

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

    // React Fast Refresh works best when files export only components.
    'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

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
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
});
