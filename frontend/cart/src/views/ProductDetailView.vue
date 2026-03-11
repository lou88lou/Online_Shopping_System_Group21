<template>
  <div class="product-detail-page">
    <div class="container">
      <div v-if="product" class="hero-grid">
        <section class="media-card">
          <div
            ref="mainMediaRef"
            class="main-media-wrap"
            @mouseenter="handleZoomEnter"
            @mouseleave="handleZoomLeave"
            @mousemove="handleZoomMove"
          >
            <img v-if="selectedMedia?.type !== 'video'" :src="selectedMedia?.url || ''" :alt="product.name" class="main-image" />
            <video v-else class="main-image" :src="selectedMedia?.url || ''" controls playsinline preload="metadata"></video>

            <div v-if="zoomActive && canZoom" class="zoom-lens" :style="zoomLensStyle"></div>
            <div
              v-if="zoomActive && canZoom"
              class="zoom-pane"
              :style="zoomPaneStyle"
            ></div>
          </div>

          <div v-if="productMedia.length > 1" class="thumb-list">
            <button
              v-for="(item, idx) in productMedia"
              :key="`${item.url}-${idx}`"
              class="thumb-btn"
              :class="{ active: selectedMedia?.url === item.url }"
              @click="selectedMedia = item"
            >
              <img v-if="item.type !== 'video'" :src="item.url" :alt="`media-${idx + 1}`" class="thumb-image" />
              <div v-else class="thumb-video">Video</div>
            </button>
          </div>
        </section>

        <section class="buy-card">
          <h1 class="product-title">{{ product.name }}</h1>
          <div class="product-price">
            <span class="price">${{ product.price.toFixed(2) }}</span>
            <span v-if="showSalePrice" class="price-original">${{ Number(product.originalPrice || 0).toFixed(2) }}</span>
            <span v-if="showSalePrice" class="price-sale-tag">Limited Offer</span>
            <span v-if="product.rating" class="rating">Rating: {{ product.rating }}</span>
          </div>

          <p class="short-desc">{{ shortDescription }}</p>

          <div class="tag-list" v-if="product.tags && product.tags.length">
            <span v-for="tag in product.tags" :key="tag" class="tag">#{{ tag }}</span>
          </div>

          <div class="meta-row">
            <span>Category: {{ product.category }}</span>
            <span :class="{ 'out-of-stock': product.stock === 0 }">
              {{ product.stock > 0 ? `Stock: ${product.stock}` : 'Out of Stock' }}
            </span>
          </div>

          <div class="quantity-row">
            <label>Quantity:</label>
            <button @click="decreaseQuantity" :disabled="quantity <= 1">-</button>
            <input v-model.number="quantity" type="number" min="1" :max="product.stock" />
            <button @click="increaseQuantity" :disabled="quantity >= product.stock">+</button>
          </div>

          <button
            @click="handleAddToCart"
            class="btn-add-to-cart"
            :disabled="product.stock === 0 || product.is_active === false"
          >
            {{ product.is_active === false ? 'Disabled' : (product.stock === 0 ? 'Out of Stock' : 'Add to Cart') }}
          </button>
          <button @click="toggleWishlist" class="btn-wishlist-main" :class="{ active: wishlistStore.isWished(product.id) }">
            {{ wishlistStore.isWished(product.id) ? 'Saved in Wishlist' : 'Add to Wishlist' }}
          </button>

          <button @click="goBack" class="btn-back">Back to Products</button>
        </section>
      </div>

      <section v-if="product" class="details-tabs">
        <div class="tabs-header">
          <button class="tab-btn" :class="{ active: activeTab === 'description' }" @click="activeTab = 'description'">Product Description</button>
          <button class="tab-btn" :class="{ active: activeTab === 'specifications' }" @click="activeTab = 'specifications'">Specifications</button>
          <button class="tab-btn" :class="{ active: activeTab === 'reviews' }" @click="activeTab = 'reviews'">Customer Reviews</button>
        </div>

        <div class="tabs-body">
          <div v-if="activeTab === 'description'" class="tab-panel">
            <h3>Overview</h3>
            <p>{{ product.description }}</p>
            <div class="html-description">
              <div v-html="safeHtmlDescription"></div>
            </div>
          </div>

          <div v-else-if="activeTab === 'specifications'" class="tab-panel">
            <h3>Technical Specifications</h3>
            <table class="spec-table">
              <tbody>
                <tr v-for="[k, v] in specEntries" :key="k">
                  <th>{{ k }}</th>
                  <td>{{ v }}</td>
                </tr>
              </tbody>
            </table>

            <div class="attr-grid">
              <div class="attr"><strong>Brand:</strong> {{ product.attributes?.brand }}</div>
              <div class="attr"><strong>Model:</strong> {{ product.attributes?.model }}</div>
              <div class="attr"><strong>Material:</strong> {{ product.attributes?.material }}</div>
              <div class="attr"><strong>Warranty:</strong> {{ product.attributes?.warranty }}</div>
            </div>
          </div>

          <div v-else class="tab-panel">
            <h3>Customer Reviews</h3>
            <div class="review-summary">
              <strong>{{ ratingSummary.avg.toFixed(1) }}</strong>
              <span>/ 5</span>
              <span class="review-count">({{ ratingSummary.count }} reviews)</span>
            </div>

            <p class="review-note-static">
              Reviews can only be submitted from your purchased orders.
              Go to <router-link to="/orders">My Orders</router-link> and open a shipped order to write feedback.
            </p>

            <div class="review-list">
              <article v-for="review in productReviews" :key="review.id" class="review-item">
                <div class="review-head">
                  <strong>{{ review.userName }}</strong>
                  <span class="review-stars">{{ review.rating }}/5</span>
                </div>
                <p>{{ review.comment }}</p>
                <small class="review-time">{{ formatReviewTime(review.createdAt) }}</small>
              </article>
              <p v-if="productReviews.length === 0" class="review-empty">No reviews yet. Be the first to share feedback.</p>
            </div>
          </div>
        </div>
      </section>

      <div v-if="relatedProducts.length" class="related-section">
        <h2>Related Products</h2>
        <div class="related-grid">
          <div v-for="entry in relatedProducts" :key="entry.product.id" class="related-card" @click="goToRelated(entry.product.id)">
            <img :src="entry.product.thumbnail || entry.product.image" :alt="entry.product.name" />
            <div class="related-info">
              <h4>{{ entry.product.name }}</h4>
              <p>{{ entry.product.category }}</p>
              <p class="related-reason">{{ entry.reason }}</p>
              <strong>${{ Number(entry.product.price || 0).toFixed(2) }}</strong>
            </div>
          </div>
        </div>
      </div>

      <div v-if="!product" class="not-found">
        <p>Product not found</p>
        <button @click="goBack" class="btn-back">Back to Products</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProductsStore } from '../stores/products'
import { useCartStore } from '../stores/cart'
import { useAuthStore } from '../stores/auth'
import { useReviewsStore } from '../stores/reviews'
import { useWishlistStore } from '../stores/wishlist'
import { useUiStore } from '../stores/ui'
import { useToast } from '../composables/useToast'
import { MESSAGES } from '../constants/messages'
import { sanitizeProductHtml } from '../utils/sanitizeHtml'

const route = useRoute()
const router = useRouter()
const productsStore = useProductsStore()
const cartStore = useCartStore()
const authStore = useAuthStore()
const reviewsStore = useReviewsStore()
const wishlistStore = useWishlistStore()
const uiStore = useUiStore()
const toast = useToast()

const product = ref(null)
const quantity = ref(1)
const selectedMedia = ref(null)
const activeTab = ref('description')
const mainMediaRef = ref(null)
const zoomScale = 2.2
const zoomLensSize = 120
const zoomState = reactive({
  xPercent: 50,
  yPercent: 50,
  lensLeft: 0,
  lensTop: 0
})
const zoomActive = ref(false)

const productMedia = computed(() => {
  if (!product.value) return []
  if (Array.isArray(product.value.media) && product.value.media.length > 0) return product.value.media
  const photos = Array.isArray(product.value.photos) ? product.value.photos : [product.value.image].filter(Boolean)
  return photos.map(url => ({ type: 'image', url }))
})

const specEntries = computed(() => Object.entries(product.value?.specs || {}))
const safeHtmlDescription = computed(() => sanitizeProductHtml(product.value?.htmlDescription))
const canZoom = computed(() => selectedMedia.value?.type !== 'video' && !!selectedMedia.value?.url)
const zoomLensStyle = computed(() => ({
  width: `${zoomLensSize}px`,
  height: `${zoomLensSize}px`,
  left: `${zoomState.lensLeft}px`,
  top: `${zoomState.lensTop}px`
}))
const zoomPaneStyle = computed(() => ({
  backgroundImage: `url('${selectedMedia.value?.url || ''}')`,
  backgroundPosition: `${zoomState.xPercent}% ${zoomState.yPercent}%`,
  backgroundSize: `${zoomScale * 100}% ${zoomScale * 100}%`
}))

const shortDescription = computed(() => {
  const desc = String(product.value?.description || '').trim()
  if (!desc) return 'High-quality electronic product with reliable performance.'
  return desc.length > 120 ? `${desc.slice(0, 120)}...` : desc
})
const showSalePrice = computed(() => {
  const current = Number(product.value?.price || 0)
  const original = Number(product.value?.originalPrice || 0)
  return Number.isFinite(original) && original > 0 && current < original
})

const productReviews = computed(() => reviewsStore.getProductReviews(product.value?.id))
const ratingSummary = computed(() => reviewsStore.getRatingSummary(product.value?.id))

const relatedProducts = computed(() => productsStore.getRelatedProductsWithReasons(product.value, 4))

const loadProduct = async () => {
  const productId = route.params.id
  if (!productsStore.products.length) await productsStore.fetchProducts()
  product.value = await productsStore.getProductById(productId)
  selectedMedia.value = productMedia.value[0] || null
  activeTab.value = 'description'
}

onMounted(loadProduct)

const increaseQuantity = () => {
  if (quantity.value < product.value.stock) quantity.value++
}

const decreaseQuantity = () => {
  if (quantity.value > 1) quantity.value--
}

const handleAddToCart = async () => {
  const result = await cartStore.addToCart(product.value, quantity.value)
  if (result?.success) {
    toast.success(result.message || `${MESSAGES.cart.added} Quantity: ${quantity.value}.`)
    uiStore.openCartDrawer()
    quantity.value = 1
  } else if (result?.message) {
    toast.error(result.message || MESSAGES.cart.addFailed)
  }
}

const handleZoomEnter = () => {
  if (!canZoom.value) return
  zoomActive.value = true
}

const handleZoomLeave = () => {
  zoomActive.value = false
}

const handleZoomMove = (event) => {
  if (!canZoom.value || !mainMediaRef.value) return
  const rect = mainMediaRef.value.getBoundingClientRect()
  if (!rect.width || !rect.height) return

  const localX = Math.max(0, Math.min(rect.width, event.clientX - rect.left))
  const localY = Math.max(0, Math.min(rect.height, event.clientY - rect.top))

  zoomState.xPercent = (localX / rect.width) * 100
  zoomState.yPercent = (localY / rect.height) * 100

  const half = zoomLensSize / 2
  zoomState.lensLeft = Math.max(0, Math.min(rect.width - zoomLensSize, localX - half))
  zoomState.lensTop = Math.max(0, Math.min(rect.height - zoomLensSize, localY - half))
}

const goBack = () => router.push('/products')

const goToRelated = async (id) => {
  await router.push(`/products/${id}`)
  await loadProduct()
}

const toggleWishlist = () => {
  if (!authStore.isLoggedIn) {
    toast.warning(MESSAGES.auth.loginRequired)
    router.push('/login')
    return
  }
  const res = wishlistStore.toggle(product.value)
  if (res?.success) toast.success(res.message)
  else toast.error(res?.message || 'Wishlist action failed.')
}

const formatReviewTime = (ts) => {
  if (!ts) return ''
  const d = new Date(ts)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString()
}
</script>

<style scoped>
.product-detail-page { min-height: calc(100vh - 80px); background: var(--color-bg); padding: var(--space-7) 0; }
.container { max-width: 1200px; margin: 0 auto; padding: 0 2rem; display: flex; flex-direction: column; gap: var(--space-6); }

.hero-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-6); align-items: start; }
.media-card, .buy-card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg); box-shadow: var(--shadow-sm); padding: var(--space-4); }

.media-card { display: flex; flex-direction: column; gap: var(--space-4); }
.main-media-wrap { position: relative; }
.main-image { width: 100%; aspect-ratio: 4 / 3; object-fit: contain; border: 1px solid var(--color-border); border-radius: var(--radius-md); background: var(--color-surface-soft); padding: var(--space-3); }
.zoom-lens {
  position: absolute;
  border: 1px solid rgba(20, 30, 50, 0.25);
  background: rgba(255, 255, 255, 0.35);
  border-radius: 8px;
  pointer-events: none;
  z-index: 5;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.12);
}
.zoom-pane {
  position: absolute;
  left: calc(100% + 12px);
  top: 0;
  width: 260px;
  height: 260px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background-repeat: no-repeat;
  background-color: #fff;
  box-shadow: 0 10px 24px rgba(10, 18, 34, 0.18);
  z-index: 6;
}
.thumb-list { display: flex; flex-wrap: wrap; gap: var(--space-2); }
.thumb-btn { width: 56px; height: 56px; border: 1px solid var(--color-border); border-radius: var(--radius-sm); background: #fff; overflow: hidden; cursor: pointer; }
.thumb-btn.active { border: 2px solid var(--color-primary); background: var(--color-primary-soft); }
.thumb-image { width: 100%; height: 100%; object-fit: cover; display: block; }
.thumb-video { width: 100%; height: 100%; display: grid; place-items: center; background: #0f172a; color: #fff; font-size: var(--text-xs); font-weight: 700; }

.buy-card { display: flex; flex-direction: column; gap: var(--space-4); }
.product-title { margin: 0; color: var(--color-text); font-size: var(--text-xl); }
.product-price { display: flex; align-items: center; gap: var(--space-4); }
.price { font-size: 2rem; color: var(--color-primary); font-weight: 800; }
.price-original {
  color: var(--color-text-muted);
  text-decoration: line-through;
  font-size: var(--text-md);
}
.price-sale-tag {
  border-radius: var(--radius-pill);
  border: 1px solid #b5e3c1;
  background: #eaf8ef;
  color: #166534;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0.2rem 0.55rem;
}
.rating { font-size: var(--text-md); color: var(--color-text-muted); }
.short-desc { margin: 0; color: var(--color-text-muted); line-height: 1.6; }
.tag-list { display: flex; gap: var(--space-2); flex-wrap: wrap; }
.tag { background: var(--color-primary-soft); color: var(--color-primary-hover); padding: 0.2rem 0.55rem; border-radius: var(--radius-pill); font-size: var(--text-sm); font-weight: 600; }
.meta-row { display: flex; justify-content: space-between; color: var(--color-text); padding: var(--space-3) 0; border-top: 1px solid var(--color-border); border-bottom: 1px solid var(--color-border); }
.out-of-stock { color: var(--color-danger); font-weight: 700; }

.quantity-row { display: flex; align-items: center; gap: var(--space-2); }
.quantity-row label { min-width: 70px; font-weight: 600; }
.quantity-row button { width: 36px; height: 36px; border: 1px solid var(--color-border); border-radius: var(--radius-sm); background: #fff; cursor: pointer; }
.quantity-row input { width: 72px; height: 36px; border: 1px solid var(--color-border); border-radius: var(--radius-sm); text-align: center; }

.btn-add-to-cart { width: 100%; padding: var(--space-4) var(--space-6); background: var(--color-primary); color: #fff; border: none; border-radius: var(--radius-md); font-size: var(--text-md); font-weight: 700; cursor: pointer; }
.btn-add-to-cart:hover:not(:disabled) { background: var(--color-primary-hover); }
.btn-add-to-cart:disabled { background: #ccc; cursor: not-allowed; }
.btn-wishlist-main {
  width: 100%;
  padding: var(--space-3) var(--space-6);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: #fff;
  color: var(--color-text);
  font-size: var(--text-md);
  font-weight: 700;
  cursor: pointer;
}
.btn-wishlist-main:hover {
  border-color: var(--color-primary);
  color: var(--color-primary-hover);
  background: var(--color-primary-soft);
}
.btn-wishlist-main.active {
  border-color: #b5e3c1;
  background: #eaf8ef;
  color: #166534;
}
.btn-back { width: fit-content; padding: var(--space-3) var(--space-5); background: var(--color-surface-soft); color: var(--color-text); border: 1px solid var(--color-border); border-radius: var(--radius-sm); cursor: pointer; font-weight: 600; }

.details-tabs { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg); box-shadow: var(--shadow-sm); overflow: hidden; }
.tabs-header { display: flex; gap: 0; border-bottom: 1px solid var(--color-border); background: var(--color-surface-soft); }
.tab-btn { flex: 1; padding: var(--space-4); border: none; background: transparent; cursor: pointer; font-weight: 700; color: var(--color-text-muted); }
.tab-btn.active { color: var(--color-text); background: #fff; border-bottom: 2px solid var(--color-primary); }
.tabs-body { padding: var(--space-5); }
.tab-panel h3 { margin: 0 0 var(--space-3); color: var(--color-text); }
.tab-panel p { margin: 0 0 var(--space-3); color: var(--color-text-muted); line-height: 1.7; }
.html-description { border-left: 3px solid var(--color-primary); padding-left: var(--space-3); }
.html-description :deep(p) { margin: 0.25rem 0; color: var(--color-text-muted); }
.html-description :deep(ul) { margin: 0.25rem 0; padding-left: 1rem; color: var(--color-text-muted); }

.spec-table { width: 100%; border-collapse: collapse; margin-bottom: var(--space-4); }
.spec-table th, .spec-table td { text-align: left; padding: 0.6rem 0.75rem; border-bottom: 1px solid var(--color-border); }
.spec-table th { width: 220px; color: var(--color-text); font-weight: 700; }
.spec-table td { color: var(--color-text-muted); }
.attr-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.45rem var(--space-4); color: var(--color-text); }

.review-list { display: flex; flex-direction: column; gap: var(--space-3); }
.review-item { border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: var(--space-3); background: var(--color-surface-soft); }
.review-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem; }
.review-stars { color: var(--color-primary); font-weight: 700; }
.review-time { color: var(--color-text-muted); }
.review-empty { margin: 0; color: var(--color-text-muted); }
.review-summary {
  display: flex;
  align-items: baseline;
  gap: 0.3rem;
  color: var(--color-text);
  margin-bottom: var(--space-3);
}
.review-summary strong { font-size: 1.6rem; color: var(--color-primary); }
.review-count { color: var(--color-text-muted); margin-left: 0.35rem; }
.review-note-static {
  margin: 0 0 var(--space-3);
  color: var(--color-text-muted);
  font-size: var(--text-sm);
}

.related-section { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg); box-shadow: var(--shadow-sm); padding: var(--space-4); }
.related-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: var(--space-3); margin-top: var(--space-3); }
.related-card { border: 1px solid var(--color-border); border-radius: var(--radius-md); overflow: hidden; cursor: pointer; background: var(--color-surface); }
.related-card img { width: 100%; height: 120px; object-fit: cover; }
.related-info { padding: 0.6rem; }
.related-info h4 { margin: 0 0 0.25rem; font-size: 0.95rem; color: var(--color-text); }
.related-info p { margin: 0 0 0.3rem; font-size: 0.82rem; color: var(--color-text-muted); }
.related-reason { color: var(--color-primary); font-size: 0.78rem; font-weight: 700; }

.not-found { text-align: center; padding: 4rem; background: var(--color-surface); border-radius: var(--radius-md); box-shadow: var(--shadow-sm); }

@media (max-width: 968px) {
  .hero-grid { grid-template-columns: 1fr; }
  .tabs-header { flex-direction: column; }
  .attr-grid { grid-template-columns: 1fr; }
  .zoom-pane { display: none; }
}
</style>


