<template>
  <div class="vendor-login container">
    <h1>Vendor Login</h1>
    <div class="form">
      <label>Email</label>
      <input v-model="email" type="email" />
      <label>Password</label>
      <input v-model="password" type="password" />
      <button @click="handleLogin" :disabled="loading">{{ loading ? 'Signing in...' : 'Sign in' }}</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useToast } from '../composables/useToast'
import { MESSAGES } from '../constants/messages'

const router = useRouter()
const auth = useAuthStore()
const toast = useToast()
const email = ref('')
const password = ref('')
const loading = ref(false)

const handleLogin = async () => {
  loading.value = true
  const res = await auth.login(email.value, password.value)
  loading.value = false
  if (res.success) {
    // redirect to vendor products
    router.push('/vendor/products')
  } else {
    toast.error(res.message || MESSAGES.auth.loginFailed)
  }
}
</script>

<style scoped>
.container { max-width: 600px; margin: 2rem auto; padding: 1rem }
.form { display:flex; flex-direction:column; gap:0.5rem }
input { padding:0.5rem; border:1px solid var(--color-border); border-radius:4px }
button { padding:0.75rem; background:#4a5568; color:#fff; border:none; border-radius:6px }
</style>

