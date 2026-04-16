module.exports = {
  root: true,
  env: {
    browser: true,
    es2020: true,
  },
  extends: ['eslint:recommended', 'plugin:react-hooks/recommended'],
  ignorePatterns: ['dist'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  rules: {
    'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
  },
}
