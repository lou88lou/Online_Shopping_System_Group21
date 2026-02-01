<!-- frontend/src/views/HomeView.vue -->
<template>
  <div class="home-page">
    <div class="hero-section">
      <div class="hero-content">
        <h1>Welcome to Online Store</h1>  <!-- 改 -->
        <p>Discover quality products, enjoy convenient shopping</p>  <!-- 改 -->
        <div class="hero-buttons">
          <router-link to="/products" class="btn-primary">Start Shopping</router-link>  <!-- 改 -->
          <router-link v-if="!authStore.isLoggedIn" to="/register" class="btn-secondary">
            Register Now  <!-- 改 -->
          </router-link>
        </div>
      </div>
    </div>

    <div class="features-section">
      <div class="container">
        <h2>Features</h2>  <!-- 改 -->
        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-icon">🔍</div>
            <h3>Product Search</h3>  <!-- 改 -->
            <p>Find what you want quickly</p>  <!-- 改 -->
          </div>
          <div class="feature-card">
            <div class="feature-icon">🛒</div>
            <h3>Shopping Cart</h3>  <!-- 改 -->
            <p>Manage your shopping list easily</p>  <!-- 改 -->
          </div>
          <div class="feature-card">
            <div class="feature-icon">📦</div>
            <h3>Order Management</h3>  <!-- 改 -->
            <p>Track your order status anytime</p>  <!-- 改 -->
          </div>
          <div class="feature-card">
            <div class="feature-icon">✨</div>
            <h3>Quality Service</h3>  <!-- 改 -->
            <p>Best shopping experience for you</p>  <!-- 改 -->
          </div>
        </div>
      </div>
    </div>

    <div class="stats-section">
      <div class="container">
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-number">8</div>
            <div class="stat-label">Quality Products</div>  <!-- 改 -->
          </div>
          <div class="stat-item">
            <div class="stat-number">{{ cartStore.totalItems }}</div>
            <div class="stat-label">Items in Cart</div>  <!-- 改 -->
          </div>
          <div class="stat-item">
            <div class="stat-number">{{ ordersStore.userOrders.length }}</div>
            <div class="stat-label">My Orders</div>  <!-- 改 -->
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from '../stores/auth'
import { useCartStore } from '../stores/cart'
import { useOrdersStore } from '../stores/orders'

const authStore = useAuthStore()
const cartStore = useCartStore()
const ordersStore = useOrdersStore()
</script>

<style scoped>
.home-page {
  min-height: calc(100vh - 80px);
}

.hero-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 6rem 2rem;
  text-align: center;
}

.hero-content h1 {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.hero-content p {
  font-size: 1.25rem;
  margin-bottom: 2rem;
  opacity: 0.9;
}

.hero-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.btn-primary,
.btn-secondary {
  padding: 1rem 2rem;
  border-radius: 6px;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.3s;
}

.btn-primary {
  background: white;
  color: #667eea;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}

.btn-secondary {
  background: rgba(255,255,255,0.2);
  color: white;
  border: 2px solid white;
}

.btn-secondary:hover {
  background: white;
  color: #667eea;
}

.features-section {
  padding: 4rem 2rem;
  background: white;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}

.features-section h2 {
  text-align: center;
  font-size: 2rem;
  margin-bottom: 3rem;
  color: #333;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
}

.feature-card {
  text-align: center;
  padding: 2rem;
  border-radius: 8px;
  transition: transform 0.3s;
}

.feature-card:hover {
  transform: translateY(-4px);
}

.feature-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.feature-card h3 {
  color: #333;
  margin-bottom: 0.5rem;
}

.feature-card p {
  color: #666;
}

.stats-section {
  padding: 4rem 2rem;
  background: #f8f9fa;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 2rem;
}

.stat-item {
  text-align: center;
  padding: 2rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.stat-number {
  font-size: 3rem;
  font-weight: bold;
  color: #667eea;
  margin-bottom: 0.5rem;
}

.stat-label {
  color: #666;
  font-size: 1rem;
}

@media (max-width: 768px) {
  .hero-content h1 {
    font-size: 2rem;
  }

  .hero-buttons {
    flex-direction: column;
    align-items: center;
  }

  .btn-primary,
  .btn-secondary {
    width: 100%;
    max-width: 300px;
  }
}
</style>
