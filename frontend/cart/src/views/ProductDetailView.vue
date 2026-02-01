<!-- frontend/src/views/ProductDetailView.vue -->
<template>
  <div class="product-detail-page">
    <div class="container">
      <div v-if="product" class="product-detail">
        <!-- 左侧：产品图片 -->
        <div class="product-image-section">
          <img :src="product.image" :alt="product.name" class="main-image" />
        </div>

        <!-- 右侧：产品信息 -->
        <div class="product-info-section">
          <!-- A6: 产品名称 -->
          <h1 class="product-title">{{ product.name }}</h1>

          <!-- A6: 产品价格 -->
          <div class="product-price">
            <span class="price">¥{{ product.price.toFixed(2) }}</span>
            <span v-if="product.rating" class="rating">⭐ {{ product.rating }}</span>
          </div>

          <!-- A6: 产品分类 -->
          <div class="product-meta">
            <span class="category">Category: {{ product.category }}</span>
            <span class="stock" :class="{ 'out-of-stock': product.stock === 0 }">
              {{ product.stock > 0 ? `Stock: ${product.stock}` : 'Out of Stock' }}
            </span>
          </div>

          <!-- A6: 产品描述（额外属性） -->
          <div class="product-description">
            <h3>Product Description</h3>
            <p>{{ product.description }}</p>
          </div>

          <!-- A7: 购买数量和加入购物车 -->
          <div class="purchase-section">
            <div class="quantity-selector">
              <label>Quantity:</label>
              <button @click="decreaseQuantity" :disabled="quantity <= 1">-</button>
              <input
                v-model.number="quantity"
                type="number"
                min="1"
                :max="product.stock"
              />
              <button @click="increaseQuantity" :disabled="quantity >= product.stock">+</button>
            </div>

            <button
              @click="handleAddToCart"
              class="btn-add-to-cart"
              :disabled="product.stock === 0"
            >
              {{ product.stock === 0 ? 'Out of Stock' : 'Add to Cart' }}
            </button>
          </div>

          <button @click="goBack" class="btn-back">← Back to Products</button>
        </div>
      </div>

      <div v-else class="not-found">
        <p>Product not found</p>
        <button @click="goBack" class="btn-back">Back to Products</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProductsStore } from '../stores/products'
import { useCartStore } from '../stores/cart'

const route = useRoute()
const router = useRouter()
const productsStore = useProductsStore()
const cartStore = useCartStore()

const product = ref(null)
const quantity = ref(1)

onMounted(() => {
  // A6: 根据ID获取产品详情
  const productId = route.params.id
  product.value = productsStore.getProductById(productId)
})

const increaseQuantity = () => {
  if (quantity.value < product.value.stock) {
    quantity.value++
  }
}

const decreaseQuantity = () => {
  if (quantity.value > 1) {
    quantity.value--
  }
}

// A7: 添加到购物车
const handleAddToCart = () => {
  const result = cartStore.addToCart(product.value, quantity.value)
  if (result.success) {
    alert(`已添加 ${quantity.value} 件商品到购物车`)
    quantity.value = 1
  }
}

const goBack = () => {
  router.push('/products')
}
</script>

<style scoped>
.product-detail-page {
  min-height: calc(100vh - 80px);
  background: #f5f5f5;
  padding: 2rem 0;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}

.product-detail {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3rem;
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.product-image-section {
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

.main-image {
  width: 100%;
  max-width: 500px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.product-info-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.product-title {
  font-size: 2rem;
  color: #333;
  margin: 0;
}

.product-price {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.price {
  font-size: 2rem;
  font-weight: bold;
  color: #667eea;
}

.rating {
  font-size: 1rem;
  color: #666;
}

.product-meta {
  display: flex;
  gap: 2rem;
  padding: 1rem 0;
  border-top: 1px solid #eee;
  border-bottom: 1px solid #eee;
}

.category {
  color: #666;
}

.stock {
  color: #28a745;
  font-weight: 600;
}

.stock.out-of-stock {
  color: #dc3545;
}

.product-description h3 {
  color: #333;
  margin-bottom: 0.5rem;
}

.product-description p {
  color: #666;
  line-height: 1.6;
}

.purchase-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.quantity-selector {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.quantity-selector label {
  font-weight: 600;
}

.quantity-selector button {
  width: 40px;
  height: 40px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1.25rem;
  transition: all 0.3s;
}

.quantity-selector button:hover:not(:disabled) {
  background: #f5f5f5;
}

.quantity-selector button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.quantity-selector input {
  width: 80px;
  height: 40px;
  text-align: center;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.btn-add-to-cart {
  padding: 1rem 2rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1.125rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.3s;
}

.btn-add-to-cart:hover:not(:disabled) {
  background: #5568d3;
}

.btn-add-to-cart:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.btn-back {
  padding: 0.75rem 1.5rem;
  background: #f5f5f5;
  color: #333;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}

.btn-back:hover {
  background: #e0e0e0;
}

.not-found {
  text-align: center;
  padding: 4rem;
  background: white;
  border-radius: 8px;
}

@media (max-width: 768px) {
  .product-detail {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
}
</style>
