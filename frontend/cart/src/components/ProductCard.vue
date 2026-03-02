<!-- frontend/src/components/ProductCard.vue -->
<template>
  <div class="product-card" :class="{ inactive: product.is_active === false }" @click="goToDetail">
    <div class="product-image">
      <img :src="product.thumbnail" :alt="product.name" />
    </div>
    <div class="product-info">
      <div class="title-row">
        <h3 class="product-name">{{ product.name }}</h3>
        <span v-if="showId" class="product-id">ID: {{ product.id }}</span>
      </div>
      <p class="product-price">${{ product.price.toFixed(2) }}</p>
      <div class="product-rating" v-if="product.rating">
        ⭐ {{ product.rating }}
      </div>
      <button
        v-if="!hideActions"
        @click.stop="handleAction"
        class="btn-add-cart"
        :disabled="(actionType === 'add' && product.stock === 0) || (actionType === 'add' && product.is_active === false)"
      >
        {{ actionType === 'edit' ? 'Edit' : (product.is_active === false ? 'Disabled' : (product.stock === 0 ? 'Out of Stock' : 'Add to Cart')) }}
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
  },
  showId: {
    type: Boolean,
    default: false
  },
  hideActions: {
    type: Boolean,
    default: false
  },
  actionType: {
    type: String,
    default: 'add'
  },
  detailRouteBase: {
    type: String,
    default: '/products'
  }
})

const router = useRouter()
const cartStore = useCartStore()

const goToDetail = () => {
  router.push(`${props.detailRouteBase}/${props.product.id}`)
}

const handleAddToCart = async () => {
  const result = await cartStore.addToCart(props.product, 1)
  if (result && result.success) {
    alert(result.message || 'Added to cart')
    return
  }
  // If requires login, navigate to login page
  if (result && result.requiresLogin) {
    router.push('/login')
    return
  }
  if (result && result.message) {
    alert(result.message)
  }
}

const handleAction = async () => {
  if (props.actionType === 'edit') {
    goToDetail()
    return
  }
  await handleAddToCart()
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

.product-card.inactive {
  opacity: 0.6;
}

.product-card.inactive:hover {
  transform: none;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
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

.title-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  justify-content: space-between;
}

.product-name {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  color: #333;
}

.product-id {
  font-size: 0.8rem;
  color: #666;
  white-space: nowrap;
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
