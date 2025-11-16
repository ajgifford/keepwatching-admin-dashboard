import react from 'eslint-plugin-react';

import pluginJs from '@eslint/js';
import pluginJest from 'eslint-plugin-jest';
import tseslint from 'typescript-eslint';

const ignores = [
  'node_modules/**',
  'dist/**',
  'coverage/**',
  'scripts/**',
  'web/**',
  'staged-themes/**',
  'prettier.config.js',
  'prettier.config.cjs',
  'eslint.config.js',
  'eslint.config.mjs',
  'vite.config.ts',
  '**/__snapshots__/**',
  'test-config/jest.config.js',
  'test-config/testSetup.ts',
  'test-config/FixJSDOMEnvironment.ts',
];

export default [
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  react.configs.flat.recommended,
  react.configs.flat['jsx-runtime'],

  { files: ['**/*.{js,mjs,cjs,ts,jsx,tsx}'] },
  {
    languageOptions: {
      ...react.configs.flat.recommended.languageOptions,
      parser: tseslint.parser,
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      'react/no-unknown-property': 'off',
      'react/jsx-no-target-blank': 'off',
    },
  },
  { ignores },
  {
    files: ['**/*.spec.ts', '**/*.spec.tsx'],
    plugins: { jest: pluginJest },
    languageOptions: { globals: pluginJest.environments.globals.globals },
    ...pluginJest.configs['flat/recommended'],
  },
  {
    files: ['**/*.spec.ts', '**/*.spec.tsx'],
    rules: { '@typescript-eslint/no-floating-promises': 'error' },
  },
];
