<template>
  <div class="product-card" :class="{ inactive: product.is_active === false }" @click="goToDetail">
    <div class="product-image">
      <img :src="product.thumbnail" :alt="product.name" />
    </div>
    <div class="product-info">
      <div class="title-row">
        <h3 class="product-name" v-html="highlightedName"></h3>
        <span v-if="showId" class="product-id">ID: {{ product.id }}</span>
      </div>

      <p class="product-category" v-html="highlightedCategory"></p>
      <p class="product-desc" v-html="highlightedDescription"></p>

      <div v-if="product.tags?.length" class="product-tags">
        <span v-for="tag in highlightedTags" :key="tag.raw" class="tag" v-html="tag.html"></span>
      </div>

      <div class="price-wrap">
        <p class="product-price">${{ Number(product.price || 0).toFixed(2) }}</p>
        <p v-if="showSalePrice" class="original-price">${{ Number(product.originalPrice || 0).toFixed(2) }}</p>
        <span v-if="showSalePrice" class="sale-badge">SALE</span>
        <button
          v-if="!hideActions && actionType === 'add'"
          class="wish-inline"
          :class="{ active: wishlistStore.isWished(product.id) }"
          @click.stop="handleToggleWishlist"
          :aria-label="wishlistStore.isWished(product.id) ? 'Remove from wishlist' : 'Add to wishlist'"
        >
          {{ wishlistStore.isWished(product.id) ? '♥' : '♡' }}
        </button>
      </div>
      <div class="product-rating" v-if="product.rating">
        Rating: {{ product.rating }}
      </div>
      <div v-if="!hideActions" class="action-row">
        <button
          @click.stop="handleAction"
          class="btn-add-cart"
          :disabled="(actionType === 'add' && product.stock === 0) || (actionType === 'add' && product.is_active === false)"
        >
          {{ actionType === 'edit' ? 'Edit' : (product.is_active === false ? 'Disabled' : (product.stock === 0 ? 'Out of Stock' : 'Add to Cart')) }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '../stores/cart'
import { useUiStore } from '../stores/ui'
import { useAuthStore } from '../stores/auth'
import { useWishlistStore } from '../stores/wishlist'
import { useToast } from '../composables/useToast'
import { MESSAGES } from '../constants/messages'

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
  },
  highlightQuery: {
    type: String,
    default: ''
  }
})

const router = useRouter()
const cartStore = useCartStore()
const uiStore = useUiStore()
const authStore = useAuthStore()
const wishlistStore = useWishlistStore()
const toast = useToast()

const normalizedQuery = computed(() => String(props.highlightQuery || '').trim())

const shortDescription = computed(() => {
  const text = String(props.product?.description || '').trim()
  if (!text) return 'No description.'
  return text.length > 88 ? `${text.slice(0, 88)}...` : text
})

const escapeHtml = (text) => {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

const escapeRegExp = (text) => String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const highlightText = (text) => {
  const safe = escapeHtml(text)
  const q = normalizedQuery.value
  if (!q) return safe
  const re = new RegExp(`(${escapeRegExp(q)})`, 'ig')
  return safe.replace(re, '<mark class="kw-highlight">$1</mark>')
}

const highlightedName = computed(() => highlightText(props.product?.name || ''))
const highlightedCategory = computed(() => highlightText(props.product?.category || ''))
const highlightedDescription = computed(() => highlightText(shortDescription.value))
const highlightedTags = computed(() => {
  return (props.product?.tags || []).slice(0, 4).map((tag) => ({
    raw: tag,
    html: highlightText(`#${tag}`)
  }))
})
const showSalePrice = computed(() => {
  const current = Number(props.product?.price || 0)
  const original = Number(props.product?.originalPrice || 0)
  return Number.isFinite(original) && original > 0 && current < original
})

const goToDetail = () => {
  router.push(`${props.detailRouteBase}/${props.product.id}`)
}

const handleAddToCart = async () => {
  const result = await cartStore.addToCart(props.product, 1)
  if (result && result.success) {
    toast.success(result.message || MESSAGES.cart.added)
    uiStore.openCartDrawer()
    return
  }
  if (result && result.requiresLogin) {
    router.push('/login')
    return
  }
  if (result && result.message) {
    toast.error(result.message || MESSAGES.cart.addFailed)
  }
}

const handleAction = async () => {
  if (props.actionType === 'edit') {
    goToDetail()
    return
  }
  await handleAddToCart()
}

const handleToggleWishlist = () => {
  if (!authStore.isLoggedIn) {
    toast.warning(MESSAGES.auth.loginRequired)
    router.push('/login')
    return
  }
  const res = wishlistStore.toggle(props.product)
  if (res?.success) toast.success(res.message)
  else toast.error(res?.message || 'Wishlist action failed.')
}
</script>

<style scoped>
.product-card {
  background: var(--color-surface);
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  cursor: pointer;
  border: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
}

.product-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.product-card.inactive {
  opacity: 0.6;
}

.product-card.inactive:hover {
  transform: none;
  box-shadow: var(--shadow-sm);
}

.product-image {
  width: 100%;
  height: 200px;
  overflow: hidden;
  background: var(--color-surface-soft);
  flex-shrink: 0;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-info {
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  height: 100%;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  justify-content: space-between;
}

.product-name {
  font-size: var(--text-md);
  font-weight: 600;
  margin: 0 0 var(--space-2) 0;
  color: var(--color-text);
}

.product-id {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  white-space: nowrap;
}

.product-category {
  margin: 0 0 0.2rem;
  color: var(--color-text-muted);
  font-size: 0.85rem;
}

.product-desc {
  margin: 0 0 0.3rem;
  color: var(--color-text-muted);
  font-size: 0.84rem;
  line-height: 1.45;
  min-height: 2.4em;
}

.product-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin: 0.2rem 0 0.35rem;
}

.tag {
  font-size: 0.74rem;
  padding: 0.14rem 0.45rem;
  border-radius: var(--radius-pill);
  background: var(--color-surface-soft);
  color: var(--color-text-muted);
  border: 1px solid var(--color-border);
}

.product-price {
  font-size: var(--text-lg);
  font-weight: 800;
  color: var(--color-primary);
  margin: auto 0 var(--space-2);
}
.price-wrap {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  margin-top: auto;
}
.wish-inline {
  margin-left: auto;
  border: none;
  background: transparent;
  color: #9ca3af;
  font-size: 1.05rem;
  line-height: 1;
  cursor: pointer;
  padding: 0;
  transition: transform 0.15s ease, color 0.15s ease;
}
.wish-inline:hover {
  color: #dc2626;
  transform: scale(1.08);
}
.wish-inline.active {
  color: #dc2626;
}
.original-price {
  margin: 0;
  color: var(--color-text-muted);
  text-decoration: line-through;
  font-size: var(--text-sm);
}
.sale-badge {
  background: #eaf8ef;
  border: 1px solid #b5e3c1;
  color: #166534;
  border-radius: var(--radius-pill);
  font-size: 0.68rem;
  font-weight: 700;
  padding: 0.1rem 0.42rem;
}

.product-rating {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  margin: 0 0 var(--space-2);
  min-height: 1.2em;
}

.action-row { display: block; }
.btn-add-cart {
  width: 100%;
  padding: var(--space-3);
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s ease;
  margin-top: 0;
}

.btn-add-cart:hover:not(:disabled) {
  background: var(--color-primary-hover);
}

.btn-add-cart:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.product-card :deep(.kw-highlight) {
  background: #ffe08a;
  color: #1f2937;
  border-radius: 3px;
  padding: 0 0.12rem;
}
</style>
