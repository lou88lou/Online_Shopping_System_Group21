<!-- frontend/src/components/ProductCard.vue -->
<template>
  <div class="product-card" @click="goToDetail">
    <div class="product-image">
      <img :src="product.thumbnail" :alt="product.name" />
    </div>
    <div class="product-info">
      <h3 class="product-name">{{ product.name }}</h3>
      <p class="product-price">¥{{ product.price.toFixed(2) }}</p>
      <div class="product-rating" v-if="product.rating">
        ⭐ {{ product.rating }}
      </div>
      <button 
        @click.stop="handleAddToCart" 
        class="btn-add-cart"
        :disabled="product.stock === 0"
      >
        {{ product.stock === 0 ? 'Out of Stock' : 'Add to Cart' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useCartStore } from '../stores/cart'

const props = defineProps({
  product: {
    type: Object,
    required: true
  }
})

const router = useRouter()
const cartStore = useCartStore()

const goToDetail = () => {
  router.push(`/products/${props.product.id}`)
}

const handleAddToCart = () => {
  const result = cartStore.addToCart(props.product, 1)
  if (result.success) {
    alert(result.message)
  }
}
</script>

<style scoped>
.product-card {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  transition: transform 0.3s, box-shadow 0.3s;
  cursor: pointer;
}

.product-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.product-image {
  width: 100%;
  height: 200px;
  overflow: hidden;
  background: #f5f5f5;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-info {
  padding: 1rem;
}

.product-name {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  color: #333;
}

.product-price {
  font-size: 1.25rem;
  font-weight: bold;
  color: #667eea;
  margin: 0.5rem 0;
}

.product-rating {
  font-size: 0.875rem;
  color: #666;
  margin: 0.5rem 0;
}

.btn-add-cart {
  width: 100%;
  padding: 0.75rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.3s;
  margin-top: 0.5rem;
}

.btn-add-cart:hover:not(:disabled) {
  background: #5568d3;
}

.btn-add-cart:disabled {
  background: #ccc;
  cursor: not-allowed;
}
</style>
