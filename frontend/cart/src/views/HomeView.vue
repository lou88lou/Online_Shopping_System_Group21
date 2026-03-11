<template>
  <div class="home-page">
    <section class="hero">
      <div class="container hero-container hero-grid">
        <div class="hero-copy">
          <span class="eyebrow">SEASON CAMPAIGN</span>
          <h1>Spring Sale - Up to 40% OFF</h1>
          <p>
            Limited-time offers across smartphones, laptops and daily accessories. Save now while stock lasts.
          </p>

          <div class="hero-strip" v-if="heroThumbProducts.length">
            <div class="brand-pill" v-for="brand in heroBrands" :key="brand">{{ brand }}</div>
            <img
              v-for="p in heroThumbProducts"
              :key="p.id"
              :src="p.thumbnail || p.image"
              :alt="p.name"
              class="hero-thumb"
            />
          </div>

          <div class="hero-buttons">
            <router-link to="/products" class="btn-primary">Shop Deals</router-link>
            <router-link to="/wishlist" class="btn-secondary" v-if="authStore.isLoggedIn">View Wishlist</router-link>
          </div>
        </div>

        <div class="hero-panel">
          <article class="entry-card" v-for="entry in promoEntries" :key="entry.key">
            <div class="entry-top">
              <h3>{{ entry.title }}</h3>
              <span class="entry-tag">{{ entry.tag }}</span>
            </div>
            <div class="entry-product" v-if="entry.product">
              <img :src="entry.product.thumbnail || entry.product.image" :alt="entry.product.name" />
              <div>
                <p class="entry-name">{{ entry.product.name }}</p>
                <p class="entry-price">${{ Number(entry.product.price || 0).toFixed(2) }}</p>
              </div>
            </div>
            <router-link class="entry-btn" :to="entry.link">{{ entry.buttonText }}</router-link>
          </article>
        </div>
      </div>
    </section>

    <section class="floor-section" v-for="floor in floors" :key="floor.key">
      <div class="container">
        <div class="floor-head">
          <h2>{{ floor.title }}</h2>
          <router-link to="/products" class="inline-link">View all</router-link>
        </div>

        <div v-if="floor.items.length" class="floor-scroller">
          <div class="floor-track">
            <div class="floor-item" v-for="item in floor.items" :key="item.id">
              <ProductCard :product="item" />
            </div>
          </div>
        </div>

        <div v-else class="floor-empty">No products available in this section right now.</div>
      </div>
    </section>

  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useProductsStore } from '../stores/products'
import ProductCard from '../components/ProductCard.vue'

const authStore = useAuthStore()
const productsStore = useProductsStore()

onMounted(async () => {
  if (!productsStore.products.length) {
    await productsStore.fetchProducts()
  }
})

const allProducts = computed(() => {
  return (productsStore.products || []).filter(p => p?.is_active !== false)
})

const heroThumbProducts = computed(() => allProducts.value.slice(0, 4))

const heroBrands = computed(() => {
  const map = new Set()
  for (const p of allProducts.value) {
    const brand = p?.attributes?.brand || p?.name?.split(' ')?.[0]
    if (brand) map.add(String(brand))
    if (map.size >= 3) break
  }
  return Array.from(map)
})

const dealProduct = computed(() => {
  const sale = allProducts.value.filter(p => p.isOnSale)
  if (sale.length) return sale[0]
  return allProducts.value[0] || null
})

const newArrivalProduct = computed(() => {
  return allProducts.value[1] || allProducts.value[0] || null
})

const topRatedProduct = computed(() => {
  const sorted = [...allProducts.value].sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0))
  return sorted[0] || allProducts.value[0] || null
})

const promoEntries = computed(() => ([
  {
    key: 'deals',
    title: "Today's Deals",
    tag: 'Hot',
    product: dealProduct.value,
    buttonText: 'See Deals',
    link: '/products'
  },
  {
    key: 'new',
    title: 'New Arrivals',
    tag: 'New',
    product: newArrivalProduct.value,
    buttonText: 'Shop New',
    link: '/products'
  },
  {
    key: 'top',
    title: 'Top Rated',
    tag: 'Best',
    product: topRatedProduct.value,
    buttonText: 'View Top',
    link: '/products'
  }
]))

const featuredSmartphones = computed(() => {
  return allProducts.value.filter((p) => String(p.category || '').toLowerCase().includes('smartphone')).slice(0, 8)
})

const laptopTabletPicks = computed(() => {
  return allProducts.value
    .filter((p) => {
      const c = String(p.category || '').toLowerCase()
      return c.includes('laptop') || c.includes('tablet') || c.includes('ipad')
    })
    .slice(0, 8)
})

const accessoriesUnder5000 = computed(() => {
  return allProducts.value
    .filter((p) => String(p.category || '').toLowerCase().includes('accessories') && Number(p.price || 0) <= 5000)
    .slice(0, 8)
})

const floors = computed(() => ([
  { key: 'smartphones', title: 'Featured Smartphones', items: featuredSmartphones.value },
  { key: 'laptops-tablets', title: 'Laptops & Tablets Picks', items: laptopTabletPicks.value },
  { key: 'accessories-under-5000', title: 'Accessories Under $5000', items: accessoriesUnder5000.value }
]))
</script>

<style scoped>
.home-page {
  min-height: calc(100vh - 80px);
}

.container {
  max-width: 1240px;
  margin: 0 auto;
  padding: 0 var(--space-7);
}

.hero-container {
  width: min(92vw, 1780px);
  max-width: none;
  padding: 0 0.75rem;
}

.hero {
  padding: var(--space-8) 0 var(--space-7);
}

.hero-grid {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 1rem;
}

.hero-copy {
  background: linear-gradient(135deg, #7a5638 0%, #8d6747 60%, #a57b56 100%);
  color: #fff;
  border-radius: var(--radius-lg);
  padding: clamp(1.2rem, 2.4vw, 2.2rem);
  border: 1px solid rgba(255, 255, 255, 0.14);
  box-shadow: var(--shadow-md);
}

.eyebrow {
  display: inline-flex;
  align-items: center;
  border-radius: var(--radius-pill);
  background: var(--color-accent);
  color: #2b241d;
  font-size: var(--text-xs);
  font-weight: 800;
  letter-spacing: 0.04em;
  padding: 0.24rem 0.55rem;
}

.hero-copy h1 {
  margin: 0.8rem 0 0.9rem;
  font-size: clamp(1.8rem, 4vw, 2.8rem);
  line-height: 1.1;
}

.hero-copy p {
  margin: 0;
  color: rgba(255, 255, 255, 0.92);
  max-width: 40ch;
}

.hero-strip {
  margin-top: 1rem;
  display: flex;
  align-items: center;
  gap: 0.45rem;
  flex-wrap: wrap;
}

.brand-pill {
  border-radius: var(--radius-pill);
  border: 1px solid rgba(255, 255, 255, 0.28);
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  font-size: 0.74rem;
  font-weight: 700;
  padding: 0.2rem 0.48rem;
}

.hero-thumb {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  object-fit: cover;
  border: 1px solid rgba(255, 255, 255, 0.36);
}

.hero-buttons {
  margin-top: 1.1rem;
  display: flex;
  gap: 0.7rem;
  flex-wrap: wrap;
}

.btn-primary,
.btn-secondary {
  text-decoration: none;
  border-radius: var(--radius-md);
  font-weight: 700;
  padding: 0.7rem 1.15rem;
}

.btn-primary {
  background: var(--color-accent);
  color: #2b241d;
}

.btn-primary:hover {
  background: #ffd76d;
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: #fff;
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.24);
}

.hero-panel {
  display: grid;
  grid-template-rows: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;
}

.entry-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  padding: 0.85rem;
  display: grid;
  gap: 0.6rem;
}

.entry-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.7rem;
}

.entry-top h3 {
  margin: 0;
  font-size: 1rem;
  color: var(--color-text);
}

.entry-tag {
  border-radius: var(--radius-pill);
  background: var(--color-primary-soft);
  color: var(--color-primary);
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0.16rem 0.5rem;
}

.entry-product {
  display: flex;
  align-items: center;
  gap: 0.55rem;
}

.entry-product img {
  width: 56px;
  height: 56px;
  border-radius: 10px;
  object-fit: cover;
  border: 1px solid var(--color-border);
  background: var(--color-surface-soft);
}

.entry-name {
  margin: 0;
  color: var(--color-text);
  font-size: 0.86rem;
  line-height: 1.3;
}

.entry-price {
  margin: 0.2rem 0 0;
  color: var(--color-primary);
  font-weight: 800;
}

.entry-btn {
  width: fit-content;
  text-decoration: none;
  border-radius: var(--radius-sm);
  background: var(--color-primary);
  color: #fff;
  font-size: 0.82rem;
  font-weight: 700;
  padding: 0.45rem 0.65rem;
}

.entry-btn:hover {
  background: var(--color-primary-hover);
}

.floor-section {
  padding-bottom: var(--space-7);
}

.floor-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.85rem;
}

.floor-head h2 {
  margin: 0;
  color: var(--color-text);
  font-size: var(--text-xl);
}

.inline-link {
  color: var(--color-primary);
  text-decoration: none;
  font-weight: 700;
}

.inline-link:hover {
  text-decoration: underline;
}

.floor-scroller {
  overflow-x: auto;
  padding-bottom: 0.35rem;
}

.floor-track {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(240px, 280px);
  gap: 0.85rem;
  align-items: stretch;
}

.floor-item {
  min-width: 0;
  display: flex;
}

.floor-item :deep(.product-card) {
  width: 100%;
  height: 100%;
}

.floor-item :deep(.product-info) {
  display: flex;
  flex-direction: column;
}

.floor-item :deep(.product-desc) {
  min-height: 2.8em;
}

.floor-item :deep(.product-tags) {
  min-height: 2.7rem;
  align-content: flex-start;
}

.floor-item :deep(.price-wrap) {
  margin-top: auto;
}

.floor-empty {
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-muted);
  background: var(--color-surface-soft);
  padding: 1rem;
}

@media (max-width: 1080px) {
  .hero-grid {
    grid-template-columns: 1fr;
  }

  .hero-panel {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    grid-template-rows: none;
  }
}

@media (max-width: 768px) {
  .container {
    padding: 0 1rem;
  }

  .hero {
    padding: var(--space-7) 0;
  }

  .hero-panel,
  .hero-panel {
    grid-template-columns: 1fr;
  }

  .floor-track {
    grid-auto-columns: minmax(220px, 78vw);
  }
}
</style>
