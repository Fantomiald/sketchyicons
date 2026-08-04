import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      // Generated, so there is nobody to tell. One of Lucide's icons is called
      // infinity, and the export it produces shadows the global the way
      // lucide-react's does.
      'packages/*/src/icons/**',
      'packages/svelte/.svelte-kit/**',
      'packages/svelte/src/lib/icons/**',
      'packages/svelte/src/lib/index.ts',
      'packages/data/src/icons.ts',
      'packages/data/src/index.ts',
      'packages/data/src/names.ts',
      'packages/data/icons/**',
      'packages/static/icons/**',
      'packages/figma-plugin/src/generated/**',
      'packages/figma-plugin/build/**',
      'preview/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  {
    files: ['tools/**/*.mjs', 'tools/**/*.js', 'tests/**/*.mjs', '*.js'],
    languageOptions: {
      globals: {
        process: 'readonly',
        console: 'readonly',
        URL: 'readonly',
        setTimeout: 'readonly',
      },
    },
  },
  {
    // The figma-plugin UI compiles JSX through Preact's h() pragma (see
    // packages/figma-plugin/tsconfig.json), not React's, so the parser needs
    // telling or it marks the h import as unused.
    files: ['packages/figma-plugin/**/*.tsx'],
    languageOptions: {
      parserOptions: {
        jsxPragma: 'h',
      },
    },
  },
);
