const path = require('path');

module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
    project: path.resolve(__dirname, 'apps/web/tsconfig.app.json'),
  },
  settings: {
    react: { version: 'detect' },
    'import/resolver': {
      typescript: {
        project: path.resolve(__dirname, 'apps/web/tsconfig.app.json'),
      },
    },
  },
  env: {
    browser: true,
    node: true,
    es6: true,
  },
  extends: [
    'airbnb',
    'airbnb/hooks',
    'airbnb-typescript',
    'plugin:react/recommended',
    'plugin:prettier/recommended',
  ],
  plugins: ['react', '@typescript-eslint', 'prettier'],
  rules: {
    'prettier/prettier': 'warn',
    'react/react-in-jsx-scope': 'off',
    'react/jsx-filename-extension': ['warn', { extensions: ['.tsx'] }],
    'react/prop-types': 'off',
    'import/extensions': [
      'error',
      'ignorePackages',
      {
        ts: 'never',
        tsx: 'never',
        js: 'never',
        jsx: 'never',
      },
    ],
    'import/no-extraneous-dependencies': [
      'error',
      {
        devDependencies: true,
        optionalDependencies: false,
        peerDependencies: false,
        packageDir: [
          path.resolve(__dirname, 'apps/web'),
          path.resolve(__dirname), // raiz do monorepo
        ],
      },
    ],
    '@typescript-eslint/no-unused-vars': ['warn'],
    'react/require-default-props': 'off',
    'react/jsx-props-no-spreading': 'off',
  },
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'build/',
    'coverage/',
    '.eslintrc.cjs',
    'prettier.config.cjs',
    '**/*.tsbuildinfo',
    'tailwind.config.js',
    'postcss.config.cjs',
  ],
  overrides: [
    {
      files: ['*.json'],
      parser: 'jsonc-eslint-parser',
    },
    {
      files: ['*.cjs'],
      parserOptions: {
        project: path.resolve(__dirname, 'apps/web/tsconfig.node.json'),
      },
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
      },
    },
    {
      files: ['*.ts', '*.tsx'],
      rules: {
        'no-undef': 'off',
      },
    },
    {
      files: ['vite.config.ts'],
      parserOptions: {
        project: path.resolve(__dirname, 'apps/web/tsconfig.node.json'),
      },
      rules: {
        'import/no-extraneous-dependencies': 'off',
      },
    },
  ],
};
