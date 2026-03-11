<template>
  <div class="checkout-page">
    <div class="container">
      <h1>Confirm Order</h1>

      <!-- Check login status -->
      <div v-if="!authStore.isLoggedIn" class="login-required">
        <p>Please log in to checkout</p>
        <router-link to="/login" class="btn-login">Go to Login</router-link>
      </div>

      <!-- If an order was just created, show the created summary first so
           the user sees the buttons even if the cart has been cleared. -->
      <div v-else-if="lastOrderId" class="order-created-wrap">
        <section class="order-created-hero">
          <div class="hero-top">
            <span class="success-badge">Order Placed</span>
            <h2>Thank you. Your order has been confirmed.</h2>
            <p class="hero-subtitle">We have received your order and are preparing the next processing steps.</p>
          </div>

          <div class="hero-meta">
            <div class="meta-item">
              <span class="meta-label">Order ID</span>
              <strong class="meta-value">{{ lastOrderId }}</strong>
            </div>
            <div class="meta-item">
              <span class="meta-label">Status</span>
              <strong class="meta-value">Pending</strong>
            </div>
            <div class="meta-item">
              <span class="meta-label">Amount</span>
              <strong class="meta-value">${{ lastOrderAmount.toFixed(2) }}</strong>
            </div>
          </div>

          <div class="hero-actions">
            <button @click="viewOrder" class="btn-primary-action">View Order</button>
            <router-link to="/orders" class="btn-secondary-action">Go to Orders</router-link>
            <router-link to="/products" class="btn-secondary-action">Continue Shopping</router-link>
          </div>
        </section>
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
                <div class="select-all">
                  <input type="checkbox" id="selectAll" v-model="selectAll" />
                  <label for="selectAll">Select All</label>
                </div>
                <div
                  v-for="item in cartStore.cartItems"
                  :key="item.id"
                  class="order-item"
                >
                  <input class="item-checkbox" type="checkbox" :value="item.id" v-model="selectedIds" />
                  <img :src="item.image" :alt="item.name" class="item-image" />
                  <div class="item-details">
                    <p class="item-name">{{ item.name }}</p>
                    <p class="item-meta">${{ item.price.toFixed(2) }} x {{ item.quantity }}</p>
                  </div>
                  <div class="item-total">
                    ${{ (item.price * item.quantity).toFixed(2) }}
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
              <span>Selected Items:</span>
              <span>{{ selectedCount }} items</span>
            </div>

            <div class="summary-row">
              <span>Subtotal:</span>
              <span>${{ selectedSubtotal.toFixed(2) }}</span>
            </div>

            <div class="summary-row total">
              <span>Total Amount:</span>
              <span class="total-amount">${{ selectedSubtotal.toFixed(2) }}</span>
            </div>

            <!-- A11: Submit order button -->
            <button
              @click="handleCheckout"
              :disabled="ordersStore.isCheckoutLoading || !shippingAddress || selectedCount === 0"
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
import { ref, onMounted, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useCartStore } from '../stores/cart'
import { useOrdersStore } from '../stores/orders'
import { useToast } from '../composables/useToast'
import { MESSAGES } from '../constants/messages'

const router = useRouter()
const authStore = useAuthStore()
const cartStore = useCartStore()
const ordersStore = useOrdersStore()
const toast = useToast()

const shippingAddress = ref('')
const lastOrderId = ref(null)
const lastOrderAmount = ref(0)
const selectedIds = ref([])
const selectAll = ref(true)

onMounted(() => {
  // prefill user address and default-select all cart items
  if (authStore.user) {
    shippingAddress.value = authStore.user.shippingAddress
  }
  selectedIds.value = cartStore.cartItems.map(i => i.id)
  selectAll.value = true
})

// keep selectedIds in sync when cart items change
watch(() => cartStore.cartItems, (list) => {
  const ids = list.map(i => i.id)
  if (selectAll.value || selectedIds.value.length === 0) {
    selectedIds.value = ids
  } else {
    selectedIds.value = selectedIds.value.filter(id => ids.includes(id))
  }
})

watch(selectAll, (v) => {
  if (v) selectedIds.value = cartStore.cartItems.map(i => i.id)
})

const selectedCount = computed(() => selectedIds.value.length)
const selectedSubtotal = computed(() => {
  return cartStore.cartItems.reduce((sum, it) => {
    if (selectedIds.value.includes(it.id)) return sum + it.price * it.quantity
    return sum
  }, 0)
})

// A11: 鎻愪氦璁㈠崟
const handleCheckout = async () => {
  if (!shippingAddress.value) {
    toast.warning(MESSAGES.order.addressRequired)
    return
  }

  // prepare selected items to pass to checkout
  const items = cartStore.cartItems.filter(i => selectedIds.value.includes(i.id))
  const orderAmount = selectedSubtotal.value
  const result = await ordersStore.checkout(shippingAddress.value, items)

  if (result.success) {
    toast.success(`${result.message || MESSAGES.order.created} Order ID: ${result.orderId}`)
    // store last created order id and show buttons to view or go to orders
    lastOrderId.value = result.orderId
    lastOrderAmount.value = orderAmount
  } else {
    toast.error(result.message || MESSAGES.order.createFailed)
  }
}

const viewOrder = () => {
  if (lastOrderId.value) router.push(`/orders/${lastOrderId.value}`)
}
</script>

<style scoped>
.checkout-page {
  min-height: calc(100vh - 80px);
  background: var(--color-bg);
  padding: 2rem 0;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}

h1 {
  margin-bottom: 2rem;
  color: var(--color-text);
}

.login-required,
.empty-cart {
  text-align: center;
  padding: 4rem 2rem;
  background: var(--color-surface);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--color-border);
}

.login-required p,
.empty-cart p {
  font-size: 1.25rem;
  color: var(--color-text-muted);
  margin-bottom: 1.5rem;
}

.btn-login,
.btn-shop {
  display: inline-block;
  padding: 1rem 2rem;
  background: var(--color-primary);
  color: white;
  text-decoration: none;
  border-radius: 6px;
  font-weight: 600;
  transition: background 0.3s;
}

.btn-login:hover,
.btn-shop:hover {
  background: var(--color-primary-hover);
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
  background: var(--color-surface);
  padding: 2rem;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--color-border);
}

.section h2 {
  margin: 0 0 1.5rem 0;
  color: var(--color-text);
  font-size: 1.25rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 0.5rem;
}

.info-text {
  color: var(--color-text-muted);
  margin: 0;
}

.address-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  font-family: inherit;
  font-size: 1rem;
  resize: vertical;
}

.address-input:focus {
  outline: none;
  border-color: var(--color-primary);
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
  background: var(--color-surface-soft);
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
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
  color: var(--color-text);
  margin: 0 0 0.25rem 0;
}

.item-meta {
  color: var(--color-text-muted);
  font-size: 0.875rem;
  margin: 0;
}

.item-total {
  font-weight: bold;
  color: var(--color-primary);
}

.checkout-sidebar {
  height: fit-content;
  position: sticky;
  top: 100px;
}

.order-summary {
  background: var(--color-surface);
  padding: 2rem;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--color-border);
}

.order-summary h2 {
  margin: 0 0 1.5rem 0;
  color: var(--color-text);
  font-size: 1.5rem;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;
  color: var(--color-text-muted);
}

.summary-row.total {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 2px solid #eee;
  font-size: 1.25rem;
  font-weight: bold;
  color: var(--color-text);
}

.total-amount {
  color: var(--color-primary);
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

.order-created-wrap {
  margin-bottom: 0.75rem;
}

.order-created-hero {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  padding: 1.75rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.hero-top h2 {
  margin: 0.5rem 0 0.4rem;
  color: var(--color-text);
  font-size: 1.65rem;
}

.hero-subtitle {
  margin: 0;
  color: var(--color-text-muted);
}

.success-badge {
  display: inline-flex;
  align-items: center;
  border-radius: var(--radius-pill);
  background: #eaf8ef;
  border: 1px solid #b5e3c1;
  color: #166534;
  font-weight: 700;
  font-size: 0.82rem;
  padding: 0.25rem 0.62rem;
}

.hero-meta {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;
}

.meta-item {
  border: 1px solid var(--color-border);
  background: var(--color-surface-soft);
  border-radius: var(--radius-md);
  padding: 0.7rem 0.85rem;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.meta-label {
  font-size: 0.78rem;
  color: var(--color-text-muted);
}

.meta-value {
  color: var(--color-text);
  word-break: break-all;
}

.hero-actions {
  display: flex;
  gap: 0.65rem;
  flex-wrap: wrap;
}

.btn-primary-action,
.btn-secondary-action {
  height: 40px;
  border-radius: var(--radius-sm);
  padding: 0 var(--space-4);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
}

.btn-primary-action {
  border: none;
  background: var(--color-primary);
  color: #fff;
}

.btn-primary-action:hover {
  background: var(--color-primary-hover);
}

.btn-secondary-action {
  border: 1px solid var(--color-border);
  background: #fff;
  color: var(--color-text);
}

.btn-secondary-action:hover {
  background: var(--color-surface-soft);
}

@media (max-width: 968px) {
  .checkout-content {
    grid-template-columns: 1fr;
  }
  .hero-meta {
    grid-template-columns: 1fr;
  }
}
</style>

