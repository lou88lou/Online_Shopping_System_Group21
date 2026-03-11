<template>
  <div class="wishlist-page">
    <div class="container">
      <section class="page-head">
        <div>
          <h1>My Wishlist</h1>
          <p>
            You have <strong>{{ wishlistStore.count }}</strong> item(s) saved.
            <span v-if="wishlistStore.dealCount > 0" class="sale-highlight">
              {{ wishlistStore.dealCount }} of them {{ wishlistStore.dealCount === 1 ? 'is' : 'are' }} currently on sale.
            </span>
            <span v-else class="muted-tip">No active deal yet, we will alert you when price drops.</span>
          </p>
        </div>
        <div class="head-actions">
          <button class="btn-secondary" @click="simulateDrop">Simulate Price Drop</button>
          <router-link to="/products" class="btn-primary">Browse Products</router-link>
        </div>
      </section>

      <section class="toolbar">
        <div class="tabs">
          <button class="tab" :class="{ active: filterMode === 'all' }" @click="filterMode = 'all'">All</button>
          <button class="tab" :class="{ active: filterMode === 'sale' }" @click="filterMode = 'sale'">On Sale</button>
          <button class="tab" :class="{ active: filterMode === 'drop' }" @click="filterMode = 'drop'">Price Dropped</button>
        </div>
        <select v-model="sortMode" class="sort-select">
          <option value="savedAt">Newest Saved</option>
          <option value="discount">Biggest Discount</option>
          <option value="priceAsc">Price Low to High</option>
          <option value="priceDesc">Price High to Low</option>
        </select>
      </section>

      <section v-if="viewItems.length" class="grid-wrap">
        <article v-for="item in viewItems" :key="item.product.id" class="wish-card">
          <router-link :to="`/products/${item.product.id}`" class="thumb-link">
            <img :src="item.product.thumbnail || item.product.image" :alt="item.product.name" class="thumb" />
            <span v-if="item.hasPriceDrop" class="promo-badge">Price Dropped</span>
            <span v-else-if="item.isOnSale" class="promo-badge">On Sale</span>
          </router-link>

          <button class="remove-icon" @click="remove(item.product.id)" aria-label="Remove from wishlist">&#10005;</button>

          <div class="card-body">
            <router-link :to="`/products/${item.product.id}`" class="title-link">
              <h3>{{ item.product.name }}</h3>
            </router-link>
            <p class="meta">{{ item.product.category }}</p>

            <div class="price-row">
              <strong class="current">${{ item.currentPrice.toFixed(2) }}</strong>
              <span v-if="item.product.originalPrice && item.currentPrice < item.product.originalPrice" class="original">
                ${{ Number(item.product.originalPrice).toFixed(2) }}
              </span>
            </div>

            <p v-if="item.hasPriceDrop" class="drop-note">
              Save ${{ item.dropAmount.toFixed(2) }} ({{ item.dropPercent.toFixed(0) }}% off)
            </p>
            <p v-if="item.product.saleEndAt" class="countdown">
              <span class="clock">&#9201;</span>
              Ends in {{ remainingText(item.product.saleEndAt) }}
            </p>

            <button class="btn-move" @click="moveToCart(item.product)">Add to Cart</button>
          </div>
        </article>
      </section>

      <section v-else class="empty">
        <p>No wishlist items in this view.</p>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useProductsStore } from '../stores/products'
import { useWishlistStore } from '../stores/wishlist'
import { useCartStore } from '../stores/cart'
import { useToast } from '../composables/useToast'

const productsStore = useProductsStore()
const wishlistStore = useWishlistStore()
const cartStore = useCartStore()
const toast = useToast()

const filterMode = ref('all')
const sortMode = ref('savedAt')
const now = ref(Date.now())
let timer = null

onMounted(async () => {
  productsStore.searchProducts('')
  await productsStore.fetchProducts()
  const alert = wishlistStore.checkNewPriceDropAlerts()
  if (alert.count > 0) {
    toast.success(`Great news! ${alert.count} item(s) in your wishlist dropped in price!`)
  }
  timer = setInterval(() => {
    now.value = Date.now()
  }, 1000)
})

onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
})

const filteredItems = computed(() => {
  if (filterMode.value === 'sale') return wishlistStore.items.filter(x => x.isOnSale)
  if (filterMode.value === 'drop') return wishlistStore.items.filter(x => x.hasPriceDrop)
  return wishlistStore.items
})

const viewItems = computed(() => {
  const list = [...filteredItems.value]
  if (sortMode.value === 'discount') {
    return list.sort((a, b) => (b.dropAmount || 0) - (a.dropAmount || 0))
  }
  if (sortMode.value === 'priceAsc') {
    return list.sort((a, b) => a.currentPrice - b.currentPrice)
  }
  if (sortMode.value === 'priceDesc') {
    return list.sort((a, b) => b.currentPrice - a.currentPrice)
  }
  return list.sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt))
})

const remove = (productId) => {
  const res = wishlistStore.remove(productId)
  if (res?.success) toast.success(res.message)
  else toast.error(res?.message || 'Failed to remove from wishlist.')
}

const moveToCart = async (product) => {
  const addRes = await cartStore.addToCart(product, 1)
  if (addRes?.success) {
    wishlistStore.remove(product.id)
    toast.success('Moved to cart.')
    return
  }
  toast.error(addRes?.message || 'Failed to move item to cart.')
}

const simulateDrop = async () => {
  if (!wishlistStore.count) {
    toast.warning('Please save at least one product first.')
    return
  }
  productsStore.searchProducts('')
  await productsStore.fetchProducts()
  const sim = wishlistStore.simulatePriceDropForWishlist()
  if (!sim.changed) {
    toast.info('No eligible wishlist items for simulated drop.')
    return
  }
  await productsStore.fetchProducts()
  const alert = wishlistStore.checkNewPriceDropAlerts()
  if (alert.count > 0) toast.success(`Great news! ${alert.count} item(s) in your wishlist dropped in price!`)
}

const remainingText = (saleEndAt) => {
  const target = new Date(saleEndAt).getTime()
  if (!target) return '--:--:--'
  const left = Math.max(0, Math.floor((target - now.value) / 1000))
  const h = String(Math.floor(left / 3600)).padStart(2, '0')
  const m = String(Math.floor((left % 3600) / 60)).padStart(2, '0')
  const s = String(left % 60).padStart(2, '0')
  return `${h}:${m}:${s}`
}
</script>

<style scoped>
.wishlist-page { min-height: calc(100vh - 80px); background: var(--color-bg); padding: var(--space-7) 0; }
.container { max-width: 1200px; margin: 0 auto; padding: 0 2rem; display: flex; flex-direction: column; gap: var(--space-4); }

.page-head {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  padding: var(--space-4);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}
.page-head h1 { margin: 0; color: var(--color-text); }
.page-head p { margin: 0.35rem 0 0; color: var(--color-text-muted); }
.sale-highlight { color: #b42318; font-weight: 800; margin-left: 0.2rem; }
.muted-tip { margin-left: 0.2rem; }
.head-actions { display: flex; gap: 0.6rem; flex-wrap: wrap; }

.btn-primary,
.btn-secondary {
  height: 40px;
  border-radius: var(--radius-sm);
  padding: 0 0.9rem;
  font-weight: 700;
  cursor: pointer;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.btn-primary { border: none; background: var(--color-primary); color: #fff; }
.btn-primary:hover { background: var(--color-primary-hover); }
.btn-secondary { border: 1px solid var(--color-border); background: #fff; color: var(--color-text); }
.btn-secondary:hover { background: var(--color-surface-soft); }

.toolbar {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 0.7rem 0.8rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.8rem;
}
.tabs { display: flex; gap: 0.5rem; flex-wrap: wrap; }
.tab {
  height: 34px;
  border-radius: var(--radius-pill);
  border: 1px solid var(--color-border);
  background: #fff;
  color: var(--color-text);
  padding: 0 0.8rem;
  font-weight: 700;
  cursor: pointer;
}
.tab.active {
  background: var(--color-primary-soft);
  border-color: var(--color-primary);
  color: var(--color-primary-hover);
}
.sort-select {
  min-width: 220px;
  height: 36px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  background: #fff;
  padding: 0 0.6rem;
}

.grid-wrap {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1rem;
}

.wish-card {
  position: relative;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.thumb-link {
  position: relative;
  display: block;
  height: 200px;
  background: var(--color-surface-soft);
}
.thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.promo-badge {
  position: absolute;
  top: 0.6rem;
  left: 0.6rem;
  background: #b42318;
  color: #fff;
  border-radius: var(--radius-pill);
  font-size: 0.72rem;
  font-weight: 800;
  padding: 0.2rem 0.5rem;
  letter-spacing: 0.02em;
}

.remove-icon {
  position: absolute;
  top: 0.6rem;
  right: 0.6rem;
  width: 28px;
  height: 28px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.9);
  background: rgba(20, 20, 24, 0.55);
  color: #fff;
  font-size: 0.95rem;
  line-height: 1;
  cursor: pointer;
}
.remove-icon:hover { background: rgba(20, 20, 24, 0.72); }

.card-body {
  padding: 0.85rem;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  flex: 1;
}
.title-link { text-decoration: none; }
.title-link h3 {
  margin: 0;
  color: var(--color-text);
  font-size: 1.08rem;
  line-height: 1.3;
}
.meta { margin: 0; color: var(--color-text-muted); font-size: var(--text-sm); }

.price-row { display: flex; align-items: baseline; gap: 0.45rem; }
.current {
  color: #b42318;
  font-size: 1.35rem;
  font-weight: 800;
}
.original {
  color: #8c8c96;
  text-decoration: line-through;
  font-size: 0.93rem;
}

.drop-note {
  margin: 0;
  color: #166534;
  font-size: 0.82rem;
  font-weight: 700;
}
.countdown {
  margin: 0;
  color: #9a3412;
  font-size: 0.8rem;
  font-weight: 700;
}
.clock { margin-right: 0.2rem; }

.btn-move {
  margin-top: auto;
  border: none;
  border-radius: var(--radius-sm);
  height: 40px;
  background: var(--color-primary);
  color: #fff;
  font-weight: 700;
  cursor: pointer;
}
.btn-move:hover { background: var(--color-primary-hover); }

.empty {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 2rem;
  text-align: center;
  color: var(--color-text-muted);
}

@media (max-width: 768px) {
  .container { padding: 0 1rem; }
  .page-head { flex-direction: column; align-items: flex-start; }
  .toolbar { flex-direction: column; align-items: flex-start; }
  .sort-select { min-width: 100%; }
}
</style>
