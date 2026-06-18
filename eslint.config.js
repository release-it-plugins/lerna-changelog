import js from '@eslint/js';
import nodePlugin from 'eslint-plugin-n';
import prettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';

export default [
  { ignores: ['node_modules/'] },
  js.configs.recommended,
  nodePlugin.configs['flat/recommended'],
  prettierRecommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      globals: { ...globals.node },
    },
    rules: {
      // release-it is a peerDependency, not a direct dependency
      'n/no-missing-import': ['error', { allowModules: ['release-it'] }],
    },
  },
];
