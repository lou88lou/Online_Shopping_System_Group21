<!-- frontend/src/views/CheckoutView.vue -->
<template>
  <div class="checkout-page">
    <div class="container">
      <h1>Confirm Order</h1>

      <!-- Check login status -->
      <div v-if="!authStore.isLoggedIn" class="login-required">
        <p>Please log in to checkout</p>
        <router-link to="/login" class="btn-login">Go to Login</router-link>
      </div>

      <!-- Check cart -->
      <div v-else-if="cartStore.isEmpty" class="empty-cart">
        <p>Your cart is empty</p>
        <router-link to="/products" class="btn-shop">Go Shopping</router-link>
      </div>

      <!-- A11: Checkout form -->
      <div v-else class="checkout-content">
        <div class="checkout-main">
          <!-- Shipping Information -->
          <div class="section">
            <h2>Shipping Information</h2>
            <div class="form-group">
              <label>Recipient:</label>
              <p class="info-text">{{ authStore.user.fullName }}</p>
            </div>
            <div class="form-group">
              <label>Shipping Address:</label>
              <textarea
                v-model="shippingAddress"
                rows="3"
                placeholder="Please enter the shipping address"
                class="address-input"
              ></textarea>
            </div>
          </div>

          <!-- Order Items -->
          <div class="section">
            <h2>Order Items</h2>
            <div class="order-items">
              <div
                v-for="item in cartStore.cartItems"
                :key="item.id"
                class="order-item"
              >
                <img :src="item.image" :alt="item.name" class="item-image" />
                <div class="item-details">
                  <p class="item-name">{{ item.name }}</p>
                  <p class="item-meta">
                    ¥{{ item.price.toFixed(2) }} × {{ item.quantity }}
                  </p>
                </div>
                <div class="item-total">
                  ¥{{ (item.price * item.quantity).toFixed(2) }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Order Summary -->
        <div class="checkout-sidebar">
          <div class="order-summary">
            <h2>Order Summary</h2>

            <div class="summary-row">
              <span>Total Items:</span>
              <span>{{ cartStore.totalItems }} items</span>
            </div>

            <div class="summary-row">
              <span>Subtotal:</span>
              <span>¥{{ cartStore.subtotal.toFixed(2) }}</span>
            </div>

            <div class="summary-row total">
              <span>Total Amount:</span>
              <span class="total-amount">¥{{ cartStore.subtotal.toFixed(2) }}</span>
            </div>

            <!-- A11: Submit order button -->
            <button
              @click="handleCheckout"
              :disabled="ordersStore.isCheckoutLoading || !shippingAddress"
              class="btn-submit-order"
            >
              {{ ordersStore.isCheckoutLoading ? 'Submitting...' : 'Place Order' }}
            </button>

            <p v-if="!shippingAddress" class="warning-text">
              Please fill in the shipping address
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useCartStore } from '../stores/cart'
import { useOrdersStore } from '../stores/orders'

const router = useRouter()
const authStore = useAuthStore()
const cartStore = useCartStore()
const ordersStore = useOrdersStore()

const shippingAddress = ref('')

onMounted(() => {
  // 预填充用户地址
  if (authStore.user) {
    shippingAddress.value = authStore.user.shippingAddress
  }
})

// A11: 提交订单
const handleCheckout = async () => {
  if (!shippingAddress.value) {
    alert('请填写配送地址')
    return
  }

  const result = await ordersStore.checkout(shippingAddress.value)

  if (result.success) {
    alert(`${result.message}\n订单号: ${result.orderId}`)
    router.push('/') // 跳转到首页或订单列表
  } else {
    alert(result.message)
  }
}
</script>

<style scoped>
.checkout-page {
  min-height: calc(100vh - 80px);
  background: #f5f5f5;
  padding: 2rem 0;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}

h1 {
  margin-bottom: 2rem;
  color: #333;
}

.login-required,
.empty-cart {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.login-required p,
.empty-cart p {
  font-size: 1.25rem;
  color: #666;
  margin-bottom: 1.5rem;
}

.btn-login,
.btn-shop {
  display: inline-block;
  padding: 1rem 2rem;
  background: #667eea;
  color: white;
  text-decoration: none;
  border-radius: 6px;
  font-weight: 600;
  transition: background 0.3s;
}

.btn-login:hover,
.btn-shop:hover {
  background: #5568d3;
}

.checkout-content {
  display: grid;
  grid-template-columns: 1fr 350px;
  gap: 2rem;
}

.checkout-main {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.section {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.section h2 {
  margin: 0 0 1.5rem 0;
  color: #333;
  font-size: 1.25rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.5rem;
}

.info-text {
  color: #666;
  margin: 0;
}

.address-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-family: inherit;
  font-size: 1rem;
  resize: vertical;
}

.address-input:focus {
  outline: none;
  border-color: #667eea;
}

.order-items {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.order-item {
  display: flex;
  gap: 1rem;
  align-items: center;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 6px;
}

.item-image {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 4px;
}

.item-details {
  flex: 1;
}

.item-name {
  font-weight: 600;
  color: #333;
  margin: 0 0 0.25rem 0;
}

.item-meta {
  color: #666;
  font-size: 0.875rem;
  margin: 0;
}

.item-total {
  font-weight: bold;
  color: #667eea;
}

.checkout-sidebar {
  height: fit-content;
  position: sticky;
  top: 100px;
}

.order-summary {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.order-summary h2 {
  margin: 0 0 1.5rem 0;
  color: #333;
  font-size: 1.5rem;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;
  color: #666;
}

.summary-row.total {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 2px solid #eee;
  font-size: 1.25rem;
  font-weight: bold;
  color: #333;
}

.total-amount {
  color: #667eea;
}

.btn-submit-order {
  width: 100%;
  padding: 1rem;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.3s;
  margin-top: 1.5rem;
}

.btn-submit-order:hover:not(:disabled) {
  background: #218838;
}

.btn-submit-order:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.warning-text {
  color: #dc3545;
  font-size: 0.875rem;
  margin-top: 0.5rem;
  text-align: center;
}

@media (max-width: 968px) {
  .checkout-content {
    grid-template-columns: 1fr;
  }
}
</style>
