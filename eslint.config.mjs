import { defineConfig } from 'eslint/config';
import globals from 'globals';
import tsparser from '@typescript-eslint/parser';
import obsidianmd from 'eslint-plugin-obsidianmd';

export default defineConfig([
  // Lint TypeScript source only; skip the bundled output and root build/config scripts
  { ignores: ['main.js', '*.mjs'] },

  ...obsidianmd.configs.recommended,

  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsparser,
      globals: {
        ...globals.browser,
        ...globals.node,
        createDiv: 'readonly',
      },
      parserOptions: { project: './tsconfig.json' },
    },
  },
]);
