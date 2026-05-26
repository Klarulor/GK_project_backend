// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['eslint.config.mjs'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      // --- Существующие правила ---
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      
      // --- Пакет отключения параноидальных проверок (The "Shut Up" Pack) ---
      
      // Разрешаем присваивать any в переменные
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      
      // Разрешаем обращаться к свойствам any (например, req.body.token)
      '@typescript-eslint/no-unsafe-member-access': 'off',
      
      // Разрешаем передавать any в функции
      '@typescript-eslint/no-unsafe-argument': 'off',
      
      // Разрешаем возвращать any из функций
      '@typescript-eslint/no-unsafe-return': 'warn',
      
      // Разрешаем вызывать any как функцию
      '@typescript-eslint/no-unsafe-call': 'off',

      // Убираем ошибку "ненужное утверждение типа" (когда вы пишете 'as string', а TS думает, что и так знает тип)
      '@typescript-eslint/no-unnecessary-type-assertion': 'off',
    },
  },
);