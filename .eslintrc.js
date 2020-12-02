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
    'no-explicit-any':'off',
    'no-empty-function':'off',
    'no-unused-vars': 'off',
    'no-prototype-builtins':'off',
    'type-annotation-spacing': 'off',
    'for-direction': 'off',
    'no-empty': 'off',
    'standard/object-curly-even-spacing': 'off',
    '@typescript-eslint/no-empty-function': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/prefer-namespace-keyword': 'off',
    '@typescript-eslint/type-annotation-spacing': 'off',
    '@typescript-eslint/member-delimiter-style': 'off',
    '@typescript-eslint/no-inferrable-types': 'off',
    '@typescript-eslint/no-namespace': 'off',
    '@typescript-eslint/no-this-alias': 'off'
  }
}
