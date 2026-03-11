<template>
  <div class="cart-page">
    <div class="container">
      <h1>Shopping Cart</h1>

      <!-- A8: Empty Cart -->
      <div v-if="cartStore.isEmpty" class="empty-cart">
        <p>Your shopping cart is empty</p>
        <router-link to="/products" class="btn-shop">Go Shopping!</router-link>
      </div>

      <!-- A8: Cart List -->
      <div v-else class="cart-content">
        <div class="cart-items">
          <div
            v-for="item in cartStore.cartItems"
            :key="item.id"
            class="cart-item"
          >
            <!-- Product image click to open detail -->
            <div class="item-image" @click="goToProductDetail(item.productId || item.product_id || item.id)">
              <img :src="item.image" :alt="item.name" />
              <div class="image-overlay">
                <span class="view-detail-text">View Details</span>
              </div>
            </div>

            <!-- Product info click to open detail -->
            <div class="item-info" @click="goToProductDetail(item.productId || item.product_id || item.id)">
              <h3 class="item-name">{{ item.name }}</h3>
              <p class="item-price">Unit Price: ${{ item.price.toFixed(2) }}</p>
              <p class="view-detail-hint">Click to view details -></p>
            </div>

            <!-- A9: Modify Quantity -->
            <div class="item-quantity">
              <button
                @click="decreaseQuantity(item)"
                class="qty-btn"
                :disabled="getDisplayQuantity(item) <= 1"
              >
                -
              </button>
              <input
                :value="getDisplayQuantity(item)"
                type="number"
                min="1"
                :max="getMaxStockInput(item)"
                @input="onQuantityInput(item, $event)"
                @change="commitQuantityNow(item)"
                class="qty-input"
              />
              <div class="qty-plus-wrap">
                <button
                  @click="increaseQuantity(item)"
                  class="qty-btn"
                  :disabled="isAtMax(item)"
                  :title="isAtMax(item) ? 'Maximum stock reached' : 'Increase quantity'"
                >
                  +
                </button>
                <span v-if="isAtMax(item)" class="stock-tip">Maximum stock reached</span>
              </div>
            </div>

            <!-- Subtotal -->
            <div class="item-subtotal">
              <p class="subtotal-label">Subtotal</p>
              <transition name="subtotal-roll" mode="out-in">
                <p :key="`${item.id}-${getDisplayQuantity(item)}`" class="subtotal-price">
                  ${{ (item.price * getDisplayQuantity(item)).toFixed(2) }}
                </p>
              </transition>
            </div>

            <!-- A10: Remove Item -->
            <button
              @click="removeItem(item.id)"
              class="btn-remove"
              title="Remove"
              aria-label="Remove item"
            >
              <svg class="trash-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M9 3h6l1 2h4v2H4V5h4l1-2zm1 6h2v9h-2V9zm4 0h2v9h-2V9zM7 9h2v9H7V9zm-1 12h12a1 1 0 0 0 1-1V7H5v13a1 1 0 0 0 1 1z"
                  fill="currentColor"
                />
              </svg>
            </button>
          </div>
        </div>

        <!-- Cart Summary -->
        <div class="cart-summary">
          <h2>Order Summary</h2>
          
          <div class="summary-row">
            <span>Total Items:</span>
            <span>{{ cartStore.totalItems }} items</span>
          </div>

          <div class="summary-row">
            <span>Subtotal:</span>
            <transition name="subtotal-roll" mode="out-in">
              <span :key="`summary-${displaySubtotal.toFixed(2)}`">${{ displaySubtotal.toFixed(2) }}</span>
            </transition>
          </div>

          <div class="summary-row total">
            <span>Total Amount:</span>
            <transition name="subtotal-roll" mode="out-in">
              <span :key="`total-${displaySubtotal.toFixed(2)}`" class="total-amount">${{ displaySubtotal.toFixed(2) }}</span>
            </transition>
          </div>

          <!-- A11: Checkout Button -->
          <router-link to="/checkout" class="btn-checkout">
            Proceed to Checkout
          </router-link>

          <button @click="handleClearCart" class="btn-clear-cart">
            Clear Cart
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useCartStore } from '../stores/cart'
import { useProductsStore } from '../stores/products'
import { useRouter } from 'vue-router'
import { useToast } from '../composables/useToast'
import { MESSAGES } from '../constants/messages'

const cartStore = useCartStore()
const productsStore = useProductsStore()
const router = useRouter()
const toast = useToast()
const DEBOUNCE_MS = 260
const qtyDrafts = ref({})
const debounceTimers = new Map()
const displaySubtotal = ref(0)

onMounted(async () => {
  cartStore.loadCart()
  if (!productsStore.products.length) await productsStore.fetchProducts()
})

watch(
  () => cartStore.cartItems,
  (items) => {
    const next = {}
    for (const item of items || []) {
      next[item.id] = qtyDrafts.value[item.id] ?? Number(item.quantity || 1)
    }
    qtyDrafts.value = next
  },
  { immediate: true, deep: true }
)

watch(
  () => cartStore.subtotal,
  (next, prev) => {
    animateSubtotal(Number(prev || 0), Number(next || 0))
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  debounceTimers.forEach((timer) => clearTimeout(timer))
  debounceTimers.clear()
})

// Navigate to product detail
const goToProductDetail = (productId) => {
  router.push(`/products/${productId}`)
}

const getMaxStock = (item) => {
  const direct = Number(item.stock)
  if (Number.isFinite(direct) && direct > 0) return direct
  const pid = String(item.productId || item.product_id || item.id)
  const hit = (productsStore.products || []).find(p => String(p.id) === pid)
  const fromProduct = Number(hit?.stock)
  return Number.isFinite(fromProduct) && fromProduct > 0 ? fromProduct : Number.POSITIVE_INFINITY
}

const getMaxStockInput = (item) => {
  const max = getMaxStock(item)
  return Number.isFinite(max) ? max : null
}

const clampQuantity = (item, qty) => {
  const max = getMaxStock(item)
  const n = Number.isFinite(Number(qty)) ? Number(qty) : 1
  if (!Number.isFinite(max)) return Math.max(1, n)
  return Math.min(Math.max(1, n), max)
}

const getDisplayQuantity = (item) => {
  return clampQuantity(item, qtyDrafts.value[item.id] ?? item.quantity ?? 1)
}

const isAtMax = (item) => {
  const max = getMaxStock(item)
  return Number.isFinite(max) && getDisplayQuantity(item) >= max
}

const queueQuantityUpdate = (item, nextQty) => {
  const qty = clampQuantity(item, nextQty)
  qtyDrafts.value[item.id] = qty

  const oldTimer = debounceTimers.get(item.id)
  if (oldTimer) clearTimeout(oldTimer)

  const timer = setTimeout(() => {
    cartStore.updateQuantity(item.id, qty)
    debounceTimers.delete(item.id)
  }, DEBOUNCE_MS)
  debounceTimers.set(item.id, timer)
}

const commitQuantityNow = (item) => {
  const qty = getDisplayQuantity(item)
  const oldTimer = debounceTimers.get(item.id)
  if (oldTimer) clearTimeout(oldTimer)
  debounceTimers.delete(item.id)
  cartStore.updateQuantity(item.id, qty)
}

const increaseQuantity = (item) => {
  queueQuantityUpdate(item, getDisplayQuantity(item) + 1)
}

const decreaseQuantity = (item) => {
  const current = getDisplayQuantity(item)
  if (current > 1) {
    queueQuantityUpdate(item, current - 1)
  }
}

const onQuantityInput = (item, evt) => {
  const raw = Number(evt?.target?.value)
  queueQuantityUpdate(item, raw)
}

// A10: 绉婚櫎鍟嗗搧锛堜紶鍏?cartItemId锛?
const removeItem = async (cartItemId) => {
  if (confirm('Are you sure you want to remove this item?')) {
    const result = await cartStore.removeFromCart(cartItemId)
    if (result?.success) toast.success(result.message || MESSAGES.cart.itemRemoved)
    else toast.error(result?.message || MESSAGES.cart.removeFailed)
  }
}

// 娓呯┖璐墿杞?
const handleClearCart = async () => {
  if (confirm('Are you sure you want to clear the shopping cart?')) {
    const result = await cartStore.clearCart()
    if (result?.success) toast.success(result.message || MESSAGES.cart.cleared)
    else toast.error(result?.message || MESSAGES.cart.clearFailed)
  }
}

function animateSubtotal(fromValue, toValue) {
  const start = Number(fromValue || 0)
  const end = Number(toValue || 0)
  if (start === end) {
    displaySubtotal.value = end
    return
  }

  const startTime = performance.now()
  const duration = 220

  const tick = (ts) => {
    const p = Math.min(1, (ts - startTime) / duration)
    const eased = 1 - Math.pow(1 - p, 3)
    displaySubtotal.value = start + (end - start) * eased
    if (p < 1) requestAnimationFrame(tick)
    else displaySubtotal.value = end
  }

  requestAnimationFrame(tick)
}
</script>

<style scoped>
.cart-page {
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

.empty-cart {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 8px;
  box-shadow: var(--shadow-sm);
}

.empty-cart p {
  font-size: 1.25rem;
  color: var(--color-text-muted);
  margin-bottom: 1.5rem;
}

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

.btn-shop:hover {
  background: var(--color-primary-hover);
}

.cart-content {
  display: grid;
  grid-template-columns: 1fr 350px;
  gap: 2rem;
}

.cart-items {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.cart-item {
  display: grid;
  grid-template-columns: 100px 1fr auto auto auto;
  gap: 1.5rem;
  align-items: center;
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: var(--shadow-sm);
}

.item-image img {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 6px;
}

.item-info {
  flex: 1;
}

.item-name {
  font-size: 1.125rem;
  color: var(--color-text);
  margin: 0 0 0.5rem 0;
}

.item-price {
  color: var(--color-text-muted);
  margin: 0;
}

.item-quantity {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.qty-plus-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.qty-btn {
  width: 32px;
  height: 32px;
  border: 1px solid var(--color-border);
  background: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s;
}

.qty-btn:hover:not(:disabled) {
  background: var(--color-bg);
}

.qty-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.stock-tip {
  position: absolute;
  top: -34px;
  left: 50%;
  transform: translateX(-50%);
  background: #1f2937;
  color: #fff;
  font-size: 0.72rem;
  white-space: nowrap;
  padding: 0.22rem 0.45rem;
  border-radius: 4px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.18s ease;
}

.stock-tip::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: -4px;
  width: 8px;
  height: 8px;
  transform: translateX(-50%) rotate(45deg);
  background: #1f2937;
}

.qty-plus-wrap:hover .stock-tip {
  opacity: 1;
}

.qty-input {
  width: 60px;
  height: 32px;
  text-align: center;
  border: 1px solid var(--color-border);
  border-radius: 4px;
}

.item-subtotal {
  text-align: right;
  min-width: 100px;
}

.subtotal-label {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  margin: 0 0 0.25rem 0;
}

.subtotal-price {
  font-size: 1.125rem;
  font-weight: bold;
  color: var(--color-primary);
  margin: 0;
}

.subtotal-roll-enter-active,
.subtotal-roll-leave-active {
  transition: all 0.2s ease;
  display: inline-block;
}

.subtotal-roll-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.subtotal-roll-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.btn-remove {
  width: 40px;
  height: 40px;
  border: none;
  background: #fff5f5;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1.25rem;
  transition: background 0.3s;
}

.trash-icon {
  width: 18px;
  height: 18px;
  display: block;
  margin: 0 auto;
}

.btn-remove:hover {
  background: #ffe0e0;
}

.cart-summary {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: var(--shadow-sm);
  height: fit-content;
  position: sticky;
  top: 100px;
}

.cart-summary h2 {
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

.btn-checkout {
  display: block;
  width: 100%;
  padding: 1rem;
  background: var(--color-primary);
  color: white;
  text-align: center;
  text-decoration: none;
  border-radius: 6px;
  font-weight: 600;
  margin-top: 1.5rem;
  transition: background 0.3s;
}

.btn-checkout:hover {
  background: var(--color-primary-hover);
}

.btn-clear-cart {
  width: 100%;
  padding: 0.75rem;
  background: var(--color-bg);
  color: var(--color-text-muted);
  border: none;
  border-radius: 6px;
  cursor: pointer;
  margin-top: 0.75rem;
  font-weight: 500;
}

.btn-clear-cart:hover {
  background: #e0e0e0;
}

@media (max-width: 968px) {
  .cart-content {
    grid-template-columns: 1fr;
  }

  .cart-item {
    grid-template-columns: 80px 1fr;
    gap: 1rem;
  }

  .item-quantity,
  .item-subtotal {
    grid-column: 2;
  }

  .btn-remove {
    grid-column: 2;
    justify-self: end;
  }
}
</style>

