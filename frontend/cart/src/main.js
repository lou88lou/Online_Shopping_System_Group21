// frontend/src/main.js
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(router)

// 先恢复登录态再挂载，保证路由守卫能正确判断
;(async () => {
  const authStore = useAuthStore()
  await authStore.initAuth()
  app.mount('#app')
})()