module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
    ecmaFeatures: { jsx: true },
  },
  settings: {
    react: { version: "detect" },
  },
  env: {
    browser: true,
    node: true,
    es6: true,
  },
  extends: [
    "airbnb",
    "airbnb/hooks",
    "airbnb-typescript",
    "plugin:react/recommended",
    "plugin:prettier/recommended",
  ],
  plugins: ["react", "@typescript-eslint", "prettier"],
  rules: {
    "prettier/prettier": "warn",
    "react/react-in-jsx-scope": "off",
    "react/jsx-filename-extension": ["warn", { extensions: [".tsx"] }],
    "import/extensions": "off",
    "import/no-extraneous-dependencies": ["error", { devDependencies: true }],
    "react/prop-types": "off",
    "@typescript-eslint/no-unused-vars": ["warn"],
  },
  ignorePatterns: ["dist", "node_modules"],
};
