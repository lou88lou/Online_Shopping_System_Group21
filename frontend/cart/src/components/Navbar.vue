<template>
  <nav class="navbar">
    <div class="nav-container">
      <router-link to="/" class="logo">
        🛍️ Online Store
      </router-link>
      <div class="nav-links">
        <router-link v-if="!isVendor && !isAdmin" to="/products" class="nav-link">
          Products
        </router-link>
        <router-link v-if="isVendor" to="/vendor/products" class="nav-link">
          Product Catalog
        </router-link>
        <router-link v-if="isVendor" to="/vendor/products/new" class="nav-link">
          Add New Product
        </router-link>
        <router-link v-if="isVendor" to="/vendor/orders" class="nav-link">
          Customer Orders
        </router-link>
        <router-link v-if="isAdmin" to="/vendor/products" class="nav-link">
          My Store
        </router-link>

        <router-link v-if="!isVendor && !isAdmin" to="/cart" class="nav-link cart-link">
          🛒 Cart
          <span v-if="cartStore.totalItems > 0" class="badge">
            {{ cartStore.totalItems }}
          </span>
        </router-link>

        <router-link v-if="authStore.isLoggedIn && !isVendor && !isAdmin" to="/orders" class="nav-link orders-link">
          📦 Orders
        </router-link>

        <div v-if="authStore.isLoggedIn" class="user-menu">
          <span class="user-name">{{ authStore.user.fullName }}</span>
          <button @click="handleLogout" class="btn-logout">Logout</button>
        </div>

        <div v-else class="auth-links">
          <router-link to="/login" class="btn-link">Login</router-link>
          <router-link to="/register" class="btn-primary">Register</router-link>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { useCartStore } from '../stores/cart'
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'
import { computed } from 'vue'

const cartStore = useCartStore()
const authStore = useAuthStore()
const router = useRouter()

// determine vendor role from current user
const isVendor = computed(() => {
  const email = authStore.user?.email || ''
  const emailLower = String(email).toLowerCase()
  if (emailLower === 'vendor@example.com') return true
  try {
    const role = localStorage.getItem('role')
    return role === 'vendor'
  } catch (e) {
    // ignore storage errors in restricted environments
  }
  return false
})

const isAdmin = computed(() => {
  const email = authStore.user?.email || ''
  const emailLower = String(email).toLowerCase()
  if (emailLower === 'admin@example.com') return true
  try {
    const role = localStorage.getItem('role')
    return role === 'admin'
  } catch (e) {
    // ignore storage errors in restricted environments
  }
  return false
})

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.navbar {
  background: #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  font-size: 1.5rem;
  font-weight: bold;
  text-decoration: none;
  color: #333;
}

.nav-links {
  display: flex;
  gap: 1.5rem;
  align-items: center;
}

.nav-link {
  text-decoration: none;
  color: #666;
  font-weight: 500;
  transition: color 0.3s;
  position: relative;
}

.nav-link:hover {
  color: #667eea;
}

.cart-link {
  position: relative;
}

.badge {
  position: absolute;
  top: -8px;
  right: -12px;
  background: #ff6b6b;
  color: white;
  border-radius: 10px;
  padding: 2px 6px;
  font-size: 0.75rem;
  font-weight: bold;
}

.user-menu {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-name {
  color: #333;
  font-weight: 500;
}

.btn-logout {
  padding: 0.5rem 1rem;
  background: #f5f5f5;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.3s;
}

.btn-logout:hover {
  background: #e0e0e0;
}

.auth-links {
  display: flex;
  gap: 1rem;
}

.btn-link {
  padding: 0.5rem 1rem;
  text-decoration: none;
  color: #667eea;
  font-weight: 500;
}

.btn-primary {
  padding: 0.5rem 1.5rem;
  background: #667eea;
  color: white;
  text-decoration: none;
  border-radius: 4px;
  font-weight: 500;
  transition: background 0.3s;
}

.btn-primary:hover {
  background: #5568d3;
}
</style>
