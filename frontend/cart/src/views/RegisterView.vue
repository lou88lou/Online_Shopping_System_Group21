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

const router = useRouter()
const authStore = useAuthStore()

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
    alert('Passwords do not match')
    return
  }

  isLoading.value = true

  try {
    const result = await authStore.register(formData.value)
    
    if (result.success) {
      alert(result.message)
      router.push('/login')
    } else {
      alert(result.message)
    }
  } catch (error) {
    alert('Registration failed, please try again')
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
}

.register-container {
  background: white;
  border-radius: 12px;
  padding: 2.5rem;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.2);
}

h1 {
  text-align: center;
  color: #333;
  margin-bottom: 0.5rem;
}

.subtitle {
  text-align: center;
  color: #666;
  margin-bottom: 2rem;
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
  color: #333;
  margin-bottom: 0.5rem;
}

.form-group input,
.form-group textarea {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.3s;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #667eea;
}

.form-group textarea {
  resize: vertical;
  font-family: inherit;
}

.btn-register {
  padding: 1rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.3s;
  margin-top: 0.5rem;
}

.btn-register:hover:not(:disabled) {
  background: #5568d3;
}

.btn-register:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.login-link {
  text-align: center;
  margin-top: 1.5rem;
  color: #666;
}

.login-link a {
  color: #667eea;
  text-decoration: none;
  font-weight: 600;
  margin-left: 0.5rem;
}

.login-link a:hover {
  text-decoration: underline;
}
</style>
