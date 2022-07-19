module.exports = {
  root: true,
  extends: ['eslint:recommended', 'plugin:node/recommended', 'prettier'],
  plugins: ['prettier', 'node'],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  env: {
    node: true,
  },
  rules: {
    // See https://github.com/mysticatea/eslint-plugin-node/issues/255 for more info.
    'node/no-missing-import': [
      'error',
      {
        allowModules: ['release-it'],
      },
    ],
    'prettier/prettier': 'error',
  },
  overrides: [
    {
      files: ['**/*.cjs'],
      parserOptions: {
        sourceType: 'script',
      },
    },
    {
      files: ['jest.setup.js', '__tests__/**/*.js'],
      env: {
        jest: true,
      },
    },
  ],
};
