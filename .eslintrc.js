module.exports = {
  root: true,
  env: {
    node: true
  },
  'extends': [
    'plugin:vue/essential',
    'eslint:recommended',
    '@vue/typescript/recommended'
  ],
  parserOptions: {
    ecmaVersion: 2020
  },
  rules: {
    'no-console': 'off',
    'no-debugger': 'off',
    'no-tabs': 'off',
    'indent': 'off',
    'semi': 'off',
    'no-trailing-spaces': 'off',
    'space-before-function-paren': 'off',
    'keyword-spacing': 'off',
    'space-infix-ops': 'off',
    'spaced-comment': 'off',
    'eol-last': 'off',
    'quotes': 'off',
    'padded-blocks': 'off',
    'no-useless-constructor': 'off',
    'object-curly-spacing': 'off',
    'comma-spacing': 'off',
    'key-spacing': 'off',
    'no-multi-spaces': 'off',
    'brace-style': 'off',
    'space-before-blocks': 'off',
    'block-spacing': 'off',
    'standard/object-curly-even-spacing':'off'
  }
}
