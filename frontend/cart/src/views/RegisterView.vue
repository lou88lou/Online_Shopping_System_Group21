<template>
  <div class="register-page">
    <div class="register-container">
      <h1>User Registration</h1>
      <p class="subtitle">Create a new account to start shopping</p>

      <form @submit.prevent="handleRegister" class="register-form">
        <!-- A1: 全名 -->
        <div class="form-group">
          <label for="fullName">Full Name *</label>
          <input
            id="fullName"
            v-model="formData.fullName"
            type="text"
            placeholder="Please enter your full name"
            required
          />
        </div>

        <!-- A1: 邮箱 -->
        <div class="form-group">
          <label for="email">Email Address *</label>
          <input
            id="email"
            v-model="formData.email"
            type="email"
            placeholder="your@email.com"
            required
          />
        </div>

        <!-- A1: 密码 -->
        <div class="form-group">
          <label for="password">Password *</label>
          <input
            id="password"
            v-model="formData.password"
            type="password"
            placeholder="At least 6 characters"
            required
            minlength="6"
          />
        </div>

        <!-- A1: 确认密码 -->
        <div class="form-group">
          <label for="confirmPassword">Confirm Password *</label>
          <input
            id="confirmPassword"
            v-model="formData.confirmPassword"
            type="password"
            placeholder="Re-enter your password"
            required
          />
        </div>

        <!-- A1: 配送地址 -->
        <div class="form-group">
          <label for="shippingAddress">Shipping Address *</label>
          <textarea
            id="shippingAddress"
            v-model="formData.shippingAddress"
            placeholder="Please enter your detailed shipping address"
            rows="3"
            required
          ></textarea>
        </div>

        <button type="submit" class="btn-register" :disabled="isLoading">
          {{ isLoading ? 'Registering...' : 'Register' }}
        </button>
      </form>

      <p class="login-link">
        Already have an account? <router-link to="/login">Login now</router-link>
      </p>
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
const authStore = useAuthStore()
const toast = useToast()

const isLoading = ref(false)
const formData = ref({
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
  shippingAddress: ''
})

const handleRegister = async () => {
  // 验证密码匹配
  if (formData.value.password !== formData.value.confirmPassword) {
    toast.warning(MESSAGES.auth.passwordMismatch)
    return
  }

  isLoading.value = true

  try {
    const result = await authStore.register(formData.value)
    
    if (result.success) {
      toast.success(result.message)
      router.push('/login')
    } else {
      toast.error(result.message || MESSAGES.auth.registerFailed)
    }
  } catch (error) {
    toast.error(MESSAGES.auth.registerFailed)
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.register-page {
  min-height: calc(100vh - 80px);
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(145deg, #d9e1ea 0%, #e9edf2 50%, #f5f5f7 100%);
  padding: var(--space-7);
}

.register-container {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  padding: var(--space-8);
  width: 100%;
  max-width: 500px;
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--color-border);
}

h1 {
  text-align: center;
  color: var(--color-text);
  margin-bottom: var(--space-2);
}

.subtitle {
  text-align: center;
  color: var(--color-text-muted);
  margin-bottom: var(--space-7);
}

.register-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: var(--space-2);
}

.form-group input,
.form-group textarea {
  padding: var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: var(--text-md);
  background: var(--color-surface-soft);
  transition: border-color 0.3s;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--color-primary);
}

.form-group textarea {
  resize: vertical;
  font-family: inherit;
}

.btn-register {
  padding: var(--space-4);
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  font-size: var(--text-md);
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s ease;
  margin-top: var(--space-2);
}

.btn-register:hover:not(:disabled) {
  background: var(--color-primary-hover);
}

.btn-register:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.login-link {
  text-align: center;
  margin-top: var(--space-6);
  color: var(--color-text-muted);
}

.login-link a {
  color: var(--color-primary);
  text-decoration: none;
  font-weight: 600;
  margin-left: var(--space-2);
}

.login-link a:hover {
  text-decoration: underline;
}
</style>
