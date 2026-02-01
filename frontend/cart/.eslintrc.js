module.exports = {
  root: true,
  env: {
    node: true
  },
  extends: [
    'plugin:vue/vue3-essential',
    'eslint:recommended'
  ],
  parserOptions: {
    ecmaVersion: 2020
  },
  rules: {
    // 关闭单词组件名规则
    'vue/multi-word-component-names': 'off',
    // 关闭未使用变量警告
    'no-unused-vars': 'warn',
    // Vue 3 setup 语法支持
    'no-undef': 'off'
  },
  globals: {
    defineProps: 'readonly',
    defineEmits: 'readonly',
    defineExpose: 'readonly',
    withDefaults: 'readonly'
  }
}
