import js from '@eslint/js';
import react from 'eslint-plugin-react';
import hooks from 'eslint-plugin-react-hooks';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import configPrettier from 'eslint-config-prettier';

export default [
  {
    files: ['**/*.{ts,tsx}'],
    ignores: ['dist', 'coverage'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true }
      }
    },
    plugins: {
      react,
      'react-hooks': hooks,
      '@typescript-eslint': tseslint
    },
    settings: {
      react: {
        version: 'detect'
      }
    },
    rules: {
      ...js.configs.recommended.rules,
      ...tseslint.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...hooks.configs.recommended.rules,
      ...configPrettier.rules,
      'react/react-in-jsx-scope': 'off'
    }
  }
];
