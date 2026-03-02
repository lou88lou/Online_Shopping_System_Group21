<template>
  <div class="cart-page">
    <div class="container">
      <h1>🛒 Shopping Cart</h1>

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
            <!-- ✅ 修改：商品图片可点击 -->
            <div class="item-image" @click="goToProductDetail(item.productId || item.product_id || item.id)">
              <img :src="item.image" :alt="item.name" />
              <div class="image-overlay">
                <span class="view-detail-text">View Details</span>
              </div>
            </div>

            <!-- ✅ 修改：商品信息区域可点击 -->
            <div class="item-info" @click="goToProductDetail(item.productId || item.product_id || item.id)">
              <h3 class="item-name">{{ item.name }}</h3>
              <p class="item-price">Unit Price: ${{ item.price.toFixed(2) }}</p>
              <p class="view-detail-hint">Click to view details →</p>  <!-- ✅ 新增提示 -->
            </div>

            <!-- A9: Modify Quantity -->
            <div class="item-quantity">
              <button
                @click="decreaseQuantity(item)"
                class="qty-btn"
                :disabled="item.quantity <= 1"
              >
                -
              </button>
              <input
                v-model.number="item.quantity"
                type="number"
                min="1"
                @change="updateItemQuantity(item)"
                class="qty-input"
              />
              <button
                @click="increaseQuantity(item)"
                class="qty-btn"
              >
                +
              </button>
            </div>

            <!-- Subtotal -->
            <div class="item-subtotal">
              <p class="subtotal-label">Subtotal</p>
              <p class="subtotal-price">${{ (item.price * item.quantity).toFixed(2) }}</p>
            </div>

            <!-- A10: Remove Item -->
            <button
              @click="removeItem(item.id)"
              class="btn-remove"
              title="Remove"
            >
              🗑️
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
            <span>${{ cartStore.subtotal.toFixed(2) }}</span>
          </div>

          <div class="summary-row total">
            <span>Total Amount:</span>
            <span class="total-amount">${{ cartStore.subtotal.toFixed(2) }}</span>
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
import { onMounted } from 'vue'
import { useCartStore } from '../stores/cart'
import { useRouter } from 'vue-router'

const cartStore = useCartStore()
const router = useRouter()

onMounted(() => {
  cartStore.loadCart()
})

// ✅ 新增：跳转到商品详情页
const goToProductDetail = (productId) => {
  router.push(`/products/${productId}`)
}
// A9: 增加数量
const increaseQuantity = (item) => {
  cartStore.updateQuantity(item.id, item.quantity + 1)
}

// A9: 减少数量
const decreaseQuantity = (item) => {
  if (item.quantity > 1) {
    cartStore.updateQuantity(item.id, item.quantity - 1)
  }
}

// A9: 直接输入数量
const updateItemQuantity = (item) => {
  if (item.quantity < 1) {
    item.quantity = 1
  }
  cartStore.updateQuantity(item.id, item.quantity)
}

// A10: 移除商品（传入 cartItemId）
const removeItem = async (cartItemId) => {
  if (confirm('Are you sure you want to remove this item?')) {
    const result = await cartStore.removeFromCart(cartItemId)
    if (result?.success) alert(result.message)
  }
}

// 清空购物车
const handleClearCart = async () => {
  if (confirm('Are you sure you want to clear the shopping cart?')) {
    const result = await cartStore.clearCart()
    if (result?.success) alert(result.message)
  }
}
</script>

<style scoped>
.cart-page {
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

.empty-cart {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.empty-cart p {
  font-size: 1.25rem;
  color: #666;
  margin-bottom: 1.5rem;
}

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

.btn-shop:hover {
  background: #5568d3;
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
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
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
  color: #333;
  margin: 0 0 0.5rem 0;
}

.item-price {
  color: #666;
  margin: 0;
}

.item-quantity {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.qty-btn {
  width: 32px;
  height: 32px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s;
}

.qty-btn:hover:not(:disabled) {
  background: #f5f5f5;
}

.qty-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.qty-input {
  width: 60px;
  height: 32px;
  text-align: center;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.item-subtotal {
  text-align: right;
  min-width: 100px;
}

.subtotal-label {
  font-size: 0.875rem;
  color: #666;
  margin: 0 0 0.25rem 0;
}

.subtotal-price {
  font-size: 1.125rem;
  font-weight: bold;
  color: #667eea;
  margin: 0;
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

.btn-remove:hover {
  background: #ffe0e0;
}

.cart-summary {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  height: fit-content;
  position: sticky;
  top: 100px;
}

.cart-summary h2 {
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

.btn-checkout {
  display: block;
  width: 100%;
  padding: 1rem;
  background: #667eea;
  color: white;
  text-align: center;
  text-decoration: none;
  border-radius: 6px;
  font-weight: 600;
  margin-top: 1.5rem;
  transition: background 0.3s;
}

.btn-checkout:hover {
  background: #5568d3;
}

.btn-clear-cart {
  width: 100%;
  padding: 0.75rem;
  background: #f5f5f5;
  color: #666;
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
