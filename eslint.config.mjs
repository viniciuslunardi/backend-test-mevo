import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import { defineConfig } from 'eslint/config';

export default defineConfig([
    {
        ignores: [
            'dist/**',
            'node_modules/**',
            'transactionGenerator.js',
            'jest.config.js',
            '**/*spec.ts',
        ],
    },

    eslint.configs.recommended,
    tseslint.configs.recommended,

    {
        files: ['**/*.ts', '**/*.tsx'],
        languageOptions: {
            parser: tseslint.parser,
            parserOptions: {
                project: './tsconfig.json',
                sourceType: 'module',
            },
        },
        plugins: {
            '@typescript-eslint': tseslint.plugin,
        },
        rules: {
            '@typescript-eslint/no-unused-vars': 'warn',
            '@typescript-eslint/explicit-function-return-type': 'off',
        },
        linterOptions: {
            reportUnusedDisableDirectives: true,
        },
    },
]);
