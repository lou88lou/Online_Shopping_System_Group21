<!-- frontend/src/views/LoginView.vue -->
<template>
  <div class="login-page">
    <div class="login-container">
      <h1>User Login</h1>
      <p class="subtitle">Login to manage your cart and orders</p>

      <form @submit.prevent="handleLogin" class="login-form">
        <!-- A2: 邮箱 -->
        <div class="form-group">
          <label for="email">Email Address</label>
          <input
            id="email"
            v-model="formData.email"
            type="email"
            placeholder="your@email.com"
            required
          />
        </div>

        <!-- A2: 密码 -->
        <div class="form-group">
          <label for="password">Password</label>
          <input
            id="password"
            v-model="formData.password"
            type="password"
            placeholder="Please enter your password"
            required
          />
        </div>

        <button type="submit" class="btn-login" :disabled="isLoading">
          {{ isLoading ? 'Logging in...' : 'Login' }}
        </button>
      </form>

      <p class="register-link">
        Don't have an account? <router-link to="/register">Register now</router-link>
      </p>

      <!-- 测试账户提示 -->
      <div class="test-account">
        <p><strong>Test Hint:</strong></p>
        <p>Test Account:</p>
        <p>Email: test@example.com</p>
        <p>Password: test123</p>
        <button @click="useTestAccount" class="btn-test">Use Test Account</button>
      </div>
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
  email: '',
  password: ''
})

// 测试账户需在后端数据库中存在（见后端说明：test@example.com / test123）
const handleLogin = async () => {
  isLoading.value = true

  try {
    const result = await authStore.login(formData.value.email, formData.value.password)
    
    if (result.success) {
      alert(result.message)
      router.push('/products')
    } else {
      alert(result.message)
    }
  } catch (error) {
    alert('登录失败，请重试')
  } finally {
    isLoading.value = false
  }
}

const useTestAccount = () => {
  formData.value.email = 'test@example.com'
  formData.value.password = 'test123'
}
</script>

<style scoped>
.login-page {
  min-height: calc(100vh - 80px);
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
}

.login-container {
  background: white;
  border-radius: 12px;
  padding: 2.5rem;
  width: 100%;
  max-width: 450px;
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

.login-form {
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

.form-group input {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.3s;
}

.form-group input:focus {
  outline: none;
  border-color: #667eea;
}

.btn-login {
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

.btn-login:hover:not(:disabled) {
  background: #5568d3;
}

.btn-login:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.register-link {
  text-align: center;
  margin-top: 1.5rem;
  color: #666;
}

.register-link a {
  color: #667eea;
  text-decoration: none;
  font-weight: 600;
  margin-left: 0.5rem;
}

.register-link a:hover {
  text-decoration: underline;
}

.test-account {
  margin-top: 2rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 6px;
  font-size: 0.875rem;
  color: #666;
}

.test-account p {
  margin: 0.25rem 0;
}

.btn-test {
  margin-top: 0.5rem;
  padding: 0.5rem 1rem;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
}

.btn-test:hover {
  background: #218838;
}
</style>
