<template>
  <nav class="navbar">
    <div class="nav-container">
      <router-link to="/" class="logo">
        Online Store
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
        <router-link v-if="isAdmin" to="/admin/products" class="nav-link">
          Admin Products
        </router-link>
        <router-link v-if="isAdmin" to="/admin/orders" class="nav-link">
          Admin Orders
        </router-link>

        <button v-if="!isVendor && !isAdmin" type="button" class="nav-link cart-link cart-btn" @click="uiStore.openCartDrawer">
          Cart
          <span v-if="cartStore.totalItems > 0" class="badge">
            {{ cartStore.totalItems }}
          </span>
        </button>

        <router-link v-if="authStore.isLoggedIn && !isVendor && !isAdmin" to="/wishlist" class="nav-link cart-link">
          Wishlist
          <span v-if="wishlistStore.count > 0" class="badge">
            {{ wishlistStore.count }}
          </span>
        </router-link>

        <router-link v-if="authStore.isLoggedIn && !isVendor && !isAdmin" to="/orders" class="nav-link orders-link">
          Orders
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
import { useUiStore } from '../stores/ui'
import { useWishlistStore } from '../stores/wishlist'
import { useRouter } from 'vue-router'
import { computed } from 'vue'

const cartStore = useCartStore()
const authStore = useAuthStore()
const uiStore = useUiStore()
const wishlistStore = useWishlistStore()
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
  background: var(--color-surface);
  box-shadow: var(--shadow-sm);
  position: sticky;
  top: 0;
  z-index: 100;
  border-bottom: 1px solid var(--color-border);
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--space-4) var(--space-7);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  font-size: var(--text-lg);
  font-weight: 800;
  text-decoration: none;
  color: var(--color-text);
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.logo::before {
  content: "";
  width: 10px;
  height: 10px;
  border-radius: 2px;
  background: var(--color-accent);
  box-shadow: 0 0 0 2px rgba(122, 86, 56, 0.18);
}

.nav-links {
  display: flex;
  gap: 1.5rem;
  align-items: center;
}

.nav-link {
  text-decoration: none;
  color: var(--color-text-muted);
  font-weight: 600;
  transition: color 0.2s ease;
  position: relative;
  padding-bottom: 0.2rem;
}

.nav-link:hover {
  color: var(--color-primary);
}

.nav-link.router-link-active {
  color: var(--color-primary);
}

.nav-link.router-link-active::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: -0.45rem;
  height: 3px;
  border-radius: 999px;
  background: var(--color-accent);
}

.cart-link {
  position: relative;
}

.cart-btn {
  border: none;
  background: transparent;
  padding: 0;
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
  font-family: inherit;
  font-size: inherit;
  font-weight: 600;
  line-height: inherit;
  color: inherit;
  text-decoration: none;
}

.badge {
  position: absolute;
  top: -8px;
  right: -12px;
  background: var(--color-danger);
  color: white;
  border-radius: var(--radius-pill);
  padding: 2px 6px;
  font-size: var(--text-xs);
  font-weight: 700;
}

.user-menu {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-name {
  color: var(--color-text);
  font-weight: 600;
}

.btn-logout {
  padding: var(--space-2) var(--space-4);
  background: var(--color-surface-soft);
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-weight: 600;
  color: var(--color-text);
  transition: background 0.2s ease;
}

.btn-logout:hover {
  background: var(--color-primary-soft);
}

.auth-links {
  display: flex;
  gap: 1rem;
}

.btn-link {
  padding: var(--space-2) var(--space-4);
  text-decoration: none;
  color: var(--color-primary);
  font-weight: 600;
  border-radius: var(--radius-sm);
  background: var(--color-primary-soft);
}

.btn-primary {
  padding: var(--space-2) var(--space-6);
  background: var(--color-accent);
  color: #1f2937;
  text-decoration: none;
  border-radius: var(--radius-sm);
  font-weight: 700;
  transition: background 0.2s ease, transform 0.2s ease;
}

.btn-primary:hover {
  background: #ffd100;
  transform: translateY(-1px);
}
</style>

