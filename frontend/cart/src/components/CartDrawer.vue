<template>
  <transition name="drawer-shell">
    <div v-if="uiStore.isCartDrawerOpen" class="drawer-root">
      <div class="drawer-backdrop" @click="uiStore.closeCartDrawer"></div>

      <aside class="drawer-panel" role="dialog" aria-label="Shopping cart drawer" aria-modal="true">
        <header class="drawer-header">
          <h3>Your Cart</h3>
          <button class="btn-close" @click="uiStore.closeCartDrawer" aria-label="Close cart drawer">x</button>
        </header>

        <div v-if="cartStore.isEmpty" class="drawer-empty">
          <p>Your cart is empty.</p>
        </div>

        <div v-else class="drawer-list">
          <article v-for="item in cartStore.cartItems" :key="item.id" class="drawer-item">
            <img :src="item.image" :alt="item.name" class="item-thumb" />
            <div class="item-info">
              <p class="item-name">{{ item.name }}</p>
              <p class="item-price">${{ Number(item.price || 0).toFixed(2) }}</p>

              <div class="item-actions">
                <button @click="decreaseQty(item)" :disabled="item.quantity <= 1">-</button>
                <span>{{ item.quantity }}</span>
                <button @click="increaseQty(item)">+</button>
                <button class="btn-remove" @click="removeItem(item.id)">Remove</button>
              </div>
            </div>
          </article>
        </div>

        <footer class="drawer-footer">
          <div class="summary-line">
            <span>Total</span>
            <strong>${{ Number(cartStore.subtotal || 0).toFixed(2) }}</strong>
          </div>
          <div class="footer-actions">
            <button class="btn-view" @click="goTo('/cart')">View Cart</button>
            <button class="btn-checkout" @click="goTo('/checkout')">Checkout</button>
          </div>
        </footer>
      </aside>
    </div>
  </transition>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useCartStore } from '../stores/cart'
import { useUiStore } from '../stores/ui'

const router = useRouter()
const cartStore = useCartStore()
const uiStore = useUiStore()

const decreaseQty = (item) => {
  const next = Number(item.quantity) - 1
  if (next < 1) return
  cartStore.updateQuantity(item.id, next)
}

const increaseQty = (item) => {
  const next = Number(item.quantity) + 1
  cartStore.updateQuantity(item.id, next)
}

const removeItem = (cartItemId) => {
  cartStore.removeFromCart(cartItemId)
}

const goTo = async (path) => {
  uiStore.closeCartDrawer()
  await router.push(path)
}
</script>

<style scoped>
.drawer-root { position: fixed; inset: 0; z-index: 1200; }
.drawer-backdrop { position: absolute; inset: 0; background: rgba(15, 23, 42, 0.32); }
.drawer-panel {
  position: absolute;
  top: 0;
  right: 0;
  height: 100%;
  width: min(420px, 94vw);
  background: var(--color-surface);
  border-left: 1px solid var(--color-border);
  box-shadow: -8px 0 28px rgba(13, 22, 38, 0.16);
  display: flex;
  flex-direction: column;
}
.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-4);
  border-bottom: 1px solid var(--color-border);
}
.drawer-header h3 { margin: 0; color: var(--color-text); }
.btn-close {
  width: 32px;
  height: 32px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: #fff;
  cursor: pointer;
  color: var(--color-text);
  font-weight: 700;
}
.drawer-empty {
  padding: var(--space-5);
  color: var(--color-text-muted);
}
.drawer-list {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-3) var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
.drawer-item {
  display: grid;
  grid-template-columns: 72px 1fr;
  gap: var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-3);
}
.item-thumb {
  width: 72px;
  height: 72px;
  object-fit: cover;
  border-radius: var(--radius-sm);
  background: var(--color-surface-soft);
}
.item-name {
  margin: 0 0 0.25rem;
  font-weight: 700;
  color: var(--color-text);
}
.item-price {
  margin: 0 0 0.5rem;
  color: var(--color-primary);
  font-weight: 700;
}
.item-actions {
  display: flex;
  align-items: center;
  gap: 0.45rem;
}
.item-actions button {
  border: 1px solid var(--color-border);
  background: #fff;
  color: var(--color-text);
  border-radius: var(--radius-sm);
  min-width: 30px;
  height: 30px;
  cursor: pointer;
}
.item-actions button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.btn-remove {
  padding: 0 0.55rem;
  min-width: auto !important;
}
.drawer-footer {
  border-top: 1px solid var(--color-border);
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  background: var(--color-surface-soft);
}
.summary-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: var(--color-text);
}
.footer-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-2);
}
.btn-view, .btn-checkout {
  height: 40px;
  border-radius: var(--radius-sm);
  font-weight: 700;
  cursor: pointer;
}
.btn-view {
  border: 1px solid var(--color-border);
  background: #fff;
  color: var(--color-text);
}
.btn-checkout {
  border: none;
  background: var(--color-primary);
  color: #fff;
}
.btn-checkout:hover { background: var(--color-primary-hover); }

.drawer-shell-enter-active .drawer-backdrop,
.drawer-shell-leave-active .drawer-backdrop {
  transition: opacity 0.22s ease;
}
.drawer-shell-enter-active .drawer-panel,
.drawer-shell-leave-active .drawer-panel {
  transition: transform 0.24s ease;
}
.drawer-shell-enter-from .drawer-backdrop,
.drawer-shell-leave-to .drawer-backdrop {
  opacity: 0;
}
.drawer-shell-enter-from .drawer-panel,
.drawer-shell-leave-to .drawer-panel {
  transform: translateX(100%);
}
</style>
