<template>
  <div class="products-page">
    <div class="container">
      <section class="search-hero">
        <h1>Product Catalogue</h1>
        <p>Discover products quickly with keyword search and advanced filters.</p>
        <div class="hero-search-bar">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Keyword search across name/category/tags/specs/description"
            @input="handleSearch"
            class="hero-search-input"
          />
          <button @click="handleSearch" class="btn-search hero-search-btn">Search</button>
        </div>
      </section>

      <div class="catalog-layout">
        <aside class="sidebar-col">
          <div class="sidebar-filter-card">
            <div class="sidebar-head">
              <h2>Filters</h2>
              <button @click="clearFilters" class="btn-clear">Clear</button>
            </div>

            <div class="filter-group">
              <p class="filter-title">Category</p>
              <select v-model="selectedCategory" @change="resetPage" class="category-select">
                <option value="">All Categories</option>
                <option v-for="cat in productsStore.allCategories" :key="cat" :value="cat">{{ cat }}</option>
              </select>
            </div>

            <div class="filter-group price-range-panel">
              <div class="price-range-head">
                <span>Price Range</span>
                <strong>${{ priceLower }} - ${{ priceUpper }}</strong>
              </div>
              <div class="range-track-wrap">
                <div class="range-selected" :style="rangeSelectedStyle"></div>
                <input
                  class="range-dual range-min"
                  type="range"
                  :min="priceBounds.min"
                  :max="priceBounds.max"
                  :step="priceStep"
                  :value="priceLower"
                  @input="onMinRangeInput"
                  aria-label="Minimum price"
                />
                <input
                  class="range-dual range-max"
                  type="range"
                  :min="priceBounds.min"
                  :max="priceBounds.max"
                  :step="priceStep"
                  :value="priceUpper"
                  @input="onMaxRangeInput"
                  aria-label="Maximum price"
                />
              </div>
              <div class="range-inputs">
                <label class="range-input-field">
                  <span>Min</span>
                  <input
                    type="number"
                    :min="priceBounds.min"
                    :max="priceBounds.max"
                    :step="priceStep"
                    :value="priceLower"
                    @input="onMinNumberInput"
                    aria-label="Minimum price input"
                  />
                </label>
                <label class="range-input-field">
                  <span>Max</span>
                  <input
                    type="number"
                    :min="priceBounds.min"
                    :max="priceBounds.max"
                    :step="priceStep"
                    :value="priceUpper"
                    @input="onMaxNumberInput"
                    aria-label="Maximum price input"
                  />
                </label>
              </div>
            </div>

            <div class="filter-group tags-panel" v-if="allTagOptions.length">
              <p class="filter-title">Tags</p>
              <div class="tags-pills">
                <button
                  v-for="tag in visibleTagOptions"
                  :key="tag"
                  type="button"
                  class="pill"
                  :class="{ active: selectedTags.includes(tag) }"
                  @click="toggleTag(tag)"
                >
                  #{{ tag }}
                </button>
                <button
                  v-if="canToggleTags"
                  type="button"
                  class="pill pill-more"
                  @click="tagExpanded = !tagExpanded"
                >
                  {{ tagExpanded ? 'Show Less' : `+${hiddenTagCount} More` }}
                </button>
              </div>
            </div>
          </div>
        </aside>

        <section class="content-col">
          <div class="catalog-toolbar">
            <p class="result-count">Found {{ filteredProducts.length }} products</p>
            <div v-if="activeChips.length" class="active-tags">
              <button
                v-for="chip in activeChips"
                :key="chip.key"
                class="tag-chip removable"
                @click="removeChip(chip)"
                :title="`Remove ${chip.label}`"
              >
                <span>{{ chip.label }}</span>
                <span class="chip-close">x</span>
              </button>
            </div>
          </div>

          <div v-if="pagedProducts.length > 0" class="products-grid">
            <ProductCard
              v-for="product in pagedProducts"
              :key="product.id"
              :product="product"
              :highlight-query="searchQuery"
            />
          </div>

          <div v-else class="no-results">
            <p>No products found</p>
            <button @click="clearFilters" class="btn-clear">Clear Filters</button>
          </div>

          <Pagination
            :current-page="currentPage"
            :total-pages="localTotalPages"
            @page-change="handlePageChange"
          />
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useProductsStore } from '../stores/products'
import ProductCard from '../components/ProductCard.vue'
import Pagination from '../components/Pagination.vue'

const productsStore = useProductsStore()
const searchQuery = ref(productsStore.searchQuery || '')
const selectedCategory = ref('')
const selectedTags = ref([])
const tagExpanded = ref(false)
const currentPage = ref(1)
const pageSize = 12
const priceLower = ref(0)
const priceUpper = ref(0)
const priceStep = 1
const maxCollapsedTags = 14

onMounted(async () => {
  productsStore.searchProducts('')
  await productsStore.fetchProducts()
})

const normalizedQuery = computed(() => String(searchQuery.value || '').trim().toLowerCase())
const allTagOptions = computed(() => [...(productsStore.allTags || [])])
const orderedTagOptions = computed(() => {
  const selected = new Set(selectedTags.value)
  const picked = allTagOptions.value.filter(t => selected.has(t))
  const others = allTagOptions.value.filter(t => !selected.has(t))
  return [...picked, ...others]
})
const visibleTagOptions = computed(() => {
  if (tagExpanded.value) return orderedTagOptions.value
  return orderedTagOptions.value.slice(0, maxCollapsedTags)
})
const hiddenTagCount = computed(() => Math.max(0, orderedTagOptions.value.length - visibleTagOptions.value.length))
const canToggleTags = computed(() => orderedTagOptions.value.length > maxCollapsedTags)
const priceBounds = computed(() => {
  const prices = (productsStore.products || [])
    .map(p => Number(p.price))
    .filter(n => Number.isFinite(n))

  if (prices.length === 0) return { min: 0, max: 10000 }

  const min = Math.floor(Math.min(...prices))
  const max = Math.ceil(Math.max(...prices))
  return { min, max: Math.max(min, max) }
})
const rangeSelectedStyle = computed(() => {
  const min = Number(priceBounds.value.min)
  const max = Number(priceBounds.value.max)
  const span = Math.max(1, max - min)
  const leftPct = ((Number(priceLower.value) - min) / span) * 100
  const rightPct = ((max - Number(priceUpper.value)) / span) * 100
  return {
    left: `${Math.max(0, Math.min(100, leftPct))}%`,
    right: `${Math.max(0, Math.min(100, rightPct))}%`
  }
})

const hasPriceFilter = computed(() => priceLower.value > priceBounds.value.min || priceUpper.value < priceBounds.value.max)

watch(priceBounds, (bounds) => {
  const firstLoad = priceLower.value === 0 && priceUpper.value === 0
  const outOfRange = priceLower.value < bounds.min || priceUpper.value > bounds.max || priceLower.value > priceUpper.value
  if (firstLoad || outOfRange) {
    priceLower.value = bounds.min
    priceUpper.value = bounds.max
  }
}, { immediate: true })

const activeChips = computed(() => {
  const chips = []

  if (normalizedQuery.value) {
    chips.push({
      key: `query_${normalizedQuery.value}`,
      type: 'query',
      label: `Keyword: ${searchQuery.value.trim()}`
    })
  }

  if (selectedCategory.value) {
    chips.push({
      key: `category_${selectedCategory.value}`,
      type: 'category',
      label: `Category: ${selectedCategory.value}`
    })
  }

  if (hasPriceFilter.value) {
    chips.push({
      key: `price_${priceLower.value}_${priceUpper.value}`,
      type: 'price',
      label: `Price: $${Number(priceLower.value).toFixed(2)} - $${Number(priceUpper.value).toFixed(2)}`
    })
  }

  for (const tag of selectedTags.value) {
    chips.push({
      key: `tag_${tag}`,
      type: 'tag',
      value: tag,
      label: `#${tag}`
    })
  }

  return chips
})

const filteredProducts = computed(() => {
  let list = [...(productsStore.products || [])]

  if (normalizedQuery.value) {
    list = list.filter(p => {
      const searchText = [
        p.name,
        p.category,
        p.description,
        p.htmlDescription,
        ...(p.tags || []),
        p.attributes?.brand,
        p.attributes?.model,
        p.attributes?.material,
        p.attributes?.warranty,
        ...Object.values(p.specs || {}),
        String(p.id || '')
      ].join(' ').toLowerCase()
      return searchText.includes(normalizedQuery.value)
    })
  }

  if (selectedCategory.value) {
    list = list.filter(p => String(p.category) === String(selectedCategory.value))
  }

  list = list.filter(p => Number(p.price) >= Number(priceLower.value) && Number(p.price) <= Number(priceUpper.value))

  if (selectedTags.value.length > 0) {
    list = list.filter(p => {
      const tags = (p.tags || []).map(t => String(t).toLowerCase())
      return selectedTags.value.every(t => tags.includes(t))
    })
  }

  return list
})

const localTotalPages = computed(() => Math.max(1, Math.ceil(filteredProducts.value.length / pageSize)))
const pagedProducts = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredProducts.value.slice(start, start + pageSize)
})

const handleSearch = async () => {
  // Always fetch base catalogue; advanced multi-attribute search runs locally.
  productsStore.searchProducts('')
  currentPage.value = 1
  await productsStore.fetchProducts()
}

const toggleTag = (tag) => {
  if (selectedTags.value.includes(tag)) {
    selectedTags.value = selectedTags.value.filter(t => t !== tag)
  } else {
    selectedTags.value = [...selectedTags.value, tag]
    if (!tagExpanded.value && visibleTagOptions.value.length >= maxCollapsedTags) {
      // keep interaction smooth: expanding when user picks beyond collapsed region
      tagExpanded.value = true
    }
  }
  resetPage()
}

const onMinRangeInput = (e) => {
  const next = Number(e.target.value)
  setPriceLower(next)
  resetPage()
}

const onMaxRangeInput = (e) => {
  const next = Number(e.target.value)
  setPriceUpper(next)
  resetPage()
}

const clampPrice = (value) => {
  const min = Number(priceBounds.value.min)
  const max = Number(priceBounds.value.max)
  const safe = Number.isFinite(value) ? value : min
  return Math.min(max, Math.max(min, Math.round(safe)))
}

const setPriceLower = (value) => {
  const next = clampPrice(value)
  priceLower.value = Math.min(next, priceUpper.value)
}

const setPriceUpper = (value) => {
  const next = clampPrice(value)
  priceUpper.value = Math.max(next, priceLower.value)
}

const onMinNumberInput = (e) => {
  const next = Number(e.target.value)
  setPriceLower(next)
  resetPage()
}

const onMaxNumberInput = (e) => {
  const next = Number(e.target.value)
  setPriceUpper(next)
  resetPage()
}

const removeChip = (chip) => {
  if (chip.type === 'query') searchQuery.value = ''
  if (chip.type === 'category') selectedCategory.value = ''
  if (chip.type === 'price') {
    priceLower.value = priceBounds.value.min
    priceUpper.value = priceBounds.value.max
  }
  if (chip.type === 'tag') {
    selectedTags.value = selectedTags.value.filter(t => t !== chip.value)
  }
  resetPage()
}

const clearFilters = () => {
  searchQuery.value = ''
  selectedCategory.value = ''
  priceLower.value = priceBounds.value.min
  priceUpper.value = priceBounds.value.max
  selectedTags.value = []
  tagExpanded.value = false
  productsStore.searchProducts('')
  currentPage.value = 1
}

const handlePageChange = (page) => {
  if (page < 1 || page > localTotalPages.value) return
  currentPage.value = page
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const resetPage = () => {
  currentPage.value = 1
}
</script>

<style scoped>
.products-page { min-height: calc(100vh - 80px); background: var(--color-bg); padding: var(--space-7) 0; }
.container { max-width: 1200px; margin: 0 auto; padding: 0 2rem; }

.search-hero {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  padding: var(--space-5);
  margin-bottom: var(--space-5);
}
.search-hero h1 { margin: 0; color: var(--color-text); }
.search-hero p { margin: 0.35rem 0 var(--space-4); color: var(--color-text-muted); }
.hero-search-bar { display: flex; gap: var(--space-3); }
.hero-search-input {
  flex: 1;
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--text-md);
  background: #fff;
}
.hero-search-btn { min-width: 120px; }

.catalog-layout {
  display: grid;
  grid-template-columns: minmax(240px, 290px) minmax(0, 1fr);
  gap: var(--space-5);
  align-items: start;
}
.sidebar-col {
  position: sticky;
  top: 96px;
}
.sidebar-filter-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
.sidebar-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.sidebar-head h2 {
  margin: 0;
  font-size: var(--text-lg);
  color: var(--color-text);
}
.filter-group { display: flex; flex-direction: column; gap: 0.55rem; }
.filter-title {
  margin: 0;
  font-size: var(--text-sm);
  font-weight: 700;
  color: var(--color-text-muted);
}
.category-select {
  height: 42px;
  padding: 0 var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface-soft);
  color: var(--color-text);
}

.content-col { min-width: 0; }
.catalog-toolbar {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  margin-bottom: var(--space-3);
}

.price-range-panel input[type='range'] {
  padding: 0 !important;
  border: 0 !important;
  background: transparent !important;
  border-radius: 0 !important;
}
.btn-search {
  padding: var(--space-3) var(--space-5);
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  font-weight: 700;
  cursor: pointer;
}
.btn-search:hover { background: var(--color-primary-hover); }
.result-count { color: var(--color-text-muted); font-size: var(--text-sm); margin: 0; }
.price-range-panel { border: 1px solid var(--color-border); border-radius: var(--radius-md); background: var(--color-surface-soft); padding: 0.65rem 0.85rem; }
.price-range-head { display: flex; justify-content: space-between; align-items: center; font-size: var(--text-sm); color: var(--color-text); margin-bottom: 0.4rem; }
.price-range-head strong { color: var(--color-primary-hover); }
.range-track-wrap { position: relative; height: 22px; margin-bottom: 0.2rem; }
.range-track-wrap::before {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 8px;
  height: 5px;
  border-radius: 999px;
  background: #dbe4ef;
  z-index: 0;
}
.range-selected {
  position: absolute;
  top: 8px;
  height: 5px;
  border-radius: 999px;
  background: var(--color-primary);
  z-index: 1;
}
.range-dual {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  width: 100%;
  height: 22px;
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  appearance: none;
  -webkit-appearance: none;
  pointer-events: none;
  z-index: 2;
}
.range-dual::-webkit-slider-runnable-track { height: 22px; background: transparent; border: 0; }
.range-dual::-moz-range-track { height: 22px; background: transparent; border: 0; }
.range-dual::-webkit-slider-thumb {
  appearance: none;
  -webkit-appearance: none;
  pointer-events: auto;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--color-primary);
  border: 2px solid #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  margin-top: 3px;
  cursor: pointer;
}
.range-dual::-moz-range-thumb {
  pointer-events: auto;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--color-primary);
  border: 2px solid #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  cursor: pointer;
}
.range-dual:focus { outline: none; }
.range-min { z-index: 3; }
.range-max { z-index: 4; }
.range-inputs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.6rem;
  margin-top: 0.4rem;
}
.range-input-field {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 0.45rem;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}
.range-input-field input {
  width: 100%;
  padding: 0.35rem 0.55rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: #fff;
  color: var(--color-text);
}
.tags-pills { display: flex; flex-wrap: wrap; gap: 0.45rem; }
.pill { border: 1px solid var(--color-border); border-radius: var(--radius-pill); background: #fff; color: var(--color-text); padding: 0.3rem 0.65rem; font-size: var(--text-sm); cursor: pointer; transition: all 0.18s ease; }
.pill:hover { border-color: var(--color-primary); color: var(--color-primary-hover); background: var(--color-primary-soft); }
.pill.active { background: var(--color-primary); color: #fff; border-color: var(--color-primary); }
.pill-more {
  background: #eef4ff;
  border-color: #9bb9ec;
  color: #0b4aa8;
  font-weight: 700;
}
.pill-more:hover {
  background: #dce9ff;
  border-color: #6f98df;
  color: #08397f;
}
.active-tags { display: flex; gap: 0.4rem; flex-wrap: wrap; }
.tag-chip { background: var(--color-primary-soft); color: var(--color-primary-hover); padding: var(--space-1) var(--space-3); border-radius: var(--radius-pill); font-size: var(--text-sm); border: none; }
.tag-chip.removable { display: inline-flex; align-items: center; gap: 0.35rem; cursor: pointer; font-weight: 600; }
.tag-chip.removable:hover { background: #dbe8ff; }
.chip-close { font-weight: 700; line-height: 1; }
.products-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1.5rem; margin-bottom: 2rem; }
.no-results { text-align: center; padding: 4rem 2rem; background: var(--color-surface); border-radius: var(--radius-md); box-shadow: var(--shadow-sm); border: 1px solid var(--color-border); }
.btn-clear { padding: var(--space-3) var(--space-4); background: var(--color-text); color: white; border: none; border-radius: var(--radius-sm); cursor: pointer; font-weight: 700; }
.btn-clear:hover { background: #0b1626; }

@media (max-width: 968px) {
  .catalog-layout { grid-template-columns: 1fr; }
  .sidebar-col {
    position: static;
  }
  .sidebar-filter-card {
    gap: var(--space-3);
  }
}

@media (max-width: 768px) {
  .hero-search-bar { flex-direction: column; }
  .hero-search-btn { width: 100%; }
  .products-grid { grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem; }
}
</style>
