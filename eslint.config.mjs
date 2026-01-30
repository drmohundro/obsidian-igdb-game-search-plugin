import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import obsidianmd from 'eslint-plugin-obsidianmd';

export default tseslint.config(
  // Ignore patterns
  {
    ignores: ['main.js', 'node_modules/**', '.git/**', '*.config.js', 'package.json']
  },

  // Node.js config files (version-bump.mjs, esbuild.config.mjs)
  {
    files: ['*.mjs', '*.config.mjs'],
    languageOptions: {
      globals: {
        process: 'readonly',
        console: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly'
      }
    }
  },

  // Base ESLint recommended rules
  eslint.configs.recommended,

  // TypeScript ESLint recommended rules
  ...tseslint.configs.recommended,

  // Obsidian plugin recommended rules
  ...obsidianmd.configs.recommended,

  // Custom rules and overrides
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        // Node.js globals
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        // Obsidian globals
        moment: 'readonly',
        createDiv: 'readonly'
      }
    },
    rules: {
      // Disable unused vars for function arguments
      '@typescript-eslint/no-unused-vars': ['error', { args: 'none' }],
      // Allow ts-comment for necessary cases (with descriptions)
      '@typescript-eslint/ban-ts-comment': 'off',
      // Allow prototype builtins
      'no-prototype-builtins': 'off',
      // Allow empty functions
      '@typescript-eslint/no-empty-function': 'off',
      // Disable overly strict type-safety rules for plugin development
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off',
      '@typescript-eslint/no-base-to-string': 'off',
      // Allow builtin-modules for now
      'depend/ban-dependencies': 'off',
      // Configure sentence case rule with regex ignores for technical terms
      'obsidianmd/ui/sentence-case': ['error', {
        ignoreRegex: ['IGDB', 'API', 'ID', 'Twitch']
      }]
    }
  }
);
