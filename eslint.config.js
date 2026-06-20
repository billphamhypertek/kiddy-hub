import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  // `scripts/` holds build-time Node tooling (e.g. the style-board generator),
  // not app code — lint the app under `src/` only.
  { ignores: ['dist', 'node_modules', 'scripts'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      // Allow intentionally-unused identifiers prefixed with `_`
      // (e.g. stub params, ignored callback args).
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
);
