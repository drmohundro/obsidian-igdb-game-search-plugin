import { defineConfig } from 'eslint/config';
import globals from 'globals';
import tsparser from '@typescript-eslint/parser';
import obsidianmd from 'eslint-plugin-obsidianmd';

export default defineConfig([
  { ignores: ['version-bump.mjs'] },

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
