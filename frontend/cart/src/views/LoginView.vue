<template>
  <div class="login-page">
    <div class="login-container">
      <h1>User Login</h1>
          <p class="subtitle">Login to manage your cart and orders</p>

          <div class="role-switch">
            <label>
              <input type="radio" value="customer" v-model="role" /> Customer
            </label>
            <label>
              <input type="radio" value="vendor" v-model="role" /> Vendor
            </label>
            <label>
              <input type="radio" value="admin" v-model="role" /> Admin
            </label>
          </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <!-- A2: 邮箱 -->
        <div class="form-group">
          <label for="email">Email Address</label>
          <input
            id="email"
            v-model="formData.email"
            type="email"
            :placeholder="role === 'vendor' ? 'vendor@example.com' : 'your@email.com'"
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
            :placeholder="role === 'vendor' ? 'vendor123' : 'Please enter your password'"
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
        <div class="quick-buttons">
          <button @click="useVendorAccount" class="btn btn-vendor">Use Vendor Account</button>
          <button @click="useAdminAccount" class="btn btn-admin">Use Admin Account</button>
        </div>
      </div>
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
const role = ref('customer')
const formData = ref({
  email: '',
  password: ''
})

// 测试账户需在后端数据库中存在（见后端说明：test@example.com / test123）
const handleLogin = async () => {
  isLoading.value = true
  try {
    // Vendor role limited to a single specific credential
    if (role.value === 'vendor') {
      const allowedEmail = 'vendor@example.com'
      const allowedPassword = 'vendor123'
      if (formData.value.email !== allowedEmail || formData.value.password !== allowedPassword) {
        toast.error(MESSAGES.auth.vendorCredentialsRequired)
        isLoading.value = false
        return
      }
    }

    const result = await authStore.login(formData.value.email, formData.value.password)

    if (result.success) {
      toast.success(result.message)
      // persist role for navbar/permissions
      try { localStorage.setItem('role', role.value) } catch (e) {
        // ignore storage errors in restricted environments
      }
      if (role.value === 'vendor') {
        router.push('/vendor/products')
      } else if (role.value === 'admin') {
        router.push('/admin/products')
      } else {
        router.push('/products')
      }
    } else {
      toast.error(result.message)
    }
  } catch (error) {
    toast.error(MESSAGES.auth.loginFailed)
  } finally {
    isLoading.value = false
  }
}

const useTestAccount = () => {
  role.value = 'customer'
  formData.value.email = 'test@example.com'
  formData.value.password = 'test123'
}

const useVendorAccount = () => {
  role.value = 'vendor'
  formData.value.email = 'vendor@example.com'
  formData.value.password = 'vendor123'
}

const useAdminAccount = () => {
  role.value = 'admin'
  formData.value.email = 'admin@example.com'
  formData.value.password = 'admin123'
}
</script>

<style scoped>
.login-page {
  min-height: calc(100vh - 80px);
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(145deg, #d9e1ea 0%, #e9edf2 50%, #f5f5f7 100%);
  padding: var(--space-7);
}

.login-container {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  padding: var(--space-8);
  width: 100%;
  max-width: 450px;
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
  color: var(--color-text);
  margin-bottom: var(--space-2);
}

.form-group input {
  padding: var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: var(--text-md);
  background: var(--color-surface-soft);
  transition: border-color 0.3s;
}

.form-group input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.btn-login {
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

.btn-login:hover:not(:disabled) {
  background: var(--color-primary-hover);
}

.btn-login:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.register-link {
  text-align: center;
  margin-top: var(--space-6);
  color: var(--color-text-muted);
}

.register-link a {
  color: var(--color-primary);
  text-decoration: none;
  font-weight: 600;
  margin-left: var(--space-2);
}

.register-link a:hover {
  text-decoration: underline;
}

.test-account {
  margin-top: var(--space-7);
  padding: var(--space-4);
  background: var(--color-surface-soft);
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  border: 1px solid var(--color-border);
}

.test-account p {
  margin: 0.25rem 0;
}

.btn-test {
  margin-top: var(--space-2);
  padding: var(--space-2) var(--space-4);
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: var(--text-sm);
  font-weight: 600;
}

.btn-test:hover {
  background: var(--color-primary-hover);
}

/* Unified quick buttons */
.quick-buttons { margin-top: 0.5rem; display:flex; gap:0.5rem }
.quick-buttons .btn { padding: 0.5rem 0.9rem; border-radius:6px; border:none; cursor:pointer; font-weight:600 }
.btn-vendor { background:#5f7083; color:#fff }
.btn-vendor:hover { background:#526274 }
.btn-admin { background:#6a88a8; color:#fff }
.btn-admin:hover { background:#5d7997 }
.btn { font-size:0.9rem }
</style>
