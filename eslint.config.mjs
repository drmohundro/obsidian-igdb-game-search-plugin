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

  {
    // obsidianmd's recommended set enables type-aware rules globally, but they require TS type
    // information and throw on JSON/Markdown (e.g. package.json). Restrict them to TypeScript.
    files: ['**/*.json', '**/*.md'],
    rules: {
      'obsidianmd/no-plugin-as-component': 'off',
      'obsidianmd/no-unsupported-api': 'off',
      'obsidianmd/no-view-references-in-plugin': 'off',
      'obsidianmd/prefer-file-manager-trash-file': 'off',
      'obsidianmd/prefer-instanceof': 'off',
    },
  },
]);
