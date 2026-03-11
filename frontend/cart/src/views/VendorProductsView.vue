<template>
  <div class="products-page">
    <div class="container">
      <div class="search-section">
        <h1>Vendor Product Catalog</h1>
        <div class="search-bar">
          <input
            v-model="keyword"
            type="text"
            placeholder="Search by name, description, or ID"
            @input="handleSearch"
            class="search-input"
          />
          <button @click="handleSearch" class="btn-search">
            Search
          </button>
        </div>
        <p class="result-count">Found {{ filteredProducts.length }} products</p>
      </div>

      <div v-if="displayedProducts.length > 0" class="products-grid">
        <ProductCard
          v-for="product in displayedProducts"
          :key="product.id"
          :product="product"
          :show-id="true"
          :hide-actions="false"
          action-type="edit"
          detail-route-base="/vendor/products"
        />
      </div>

      <div v-else class="no-results">
        <p>No products found</p>
        <button @click="clearSearch" class="btn-clear">Clear Search</button>
      </div>

      <Pagination
        :current-page="productsStore.currentPage"
        :total-pages="vendorTotalPages"
        @page-change="handlePageChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useProductsStore } from '../stores/products'
import ProductCard from '../components/ProductCard.vue'
import Pagination from '../components/Pagination.vue'

const productsStore = useProductsStore()
const keyword = ref('')
const pageSize = 6

onMounted(async () => {
  productsStore.currentPage = 1
  await loadVendorProducts()
})

const filteredProducts = computed(() => productsStore.products || [])
const vendorTotalPages = computed(() => Math.max(1, Number(productsStore.pagination?.totalPages || 1)))
const displayedProducts = computed(() => filteredProducts.value)

const loadVendorProducts = async () => {
  await productsStore.fetchVendorProducts({
    page: productsStore.currentPage,
    limit: pageSize,
    keyword: keyword.value
  })
}

const handleSearch = async () => {
  productsStore.currentPage = 1
  await loadVendorProducts()
}

const clearSearch = async () => {
  keyword.value = ''
  productsStore.currentPage = 1
  await loadVendorProducts()
}

const handlePageChange = async (page) => {
  if (page < 1 || page > vendorTotalPages.value) return
  productsStore.currentPage = page
  await loadVendorProducts()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<style scoped>
.products-page {
  min-height: calc(100vh - 80px);
  background: var(--color-bg);
  padding: 2rem 0;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}

.search-section {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  margin-bottom: 2rem;
  box-shadow: var(--shadow-sm);
}

.search-section h1 {
  margin: 0 0 1.5rem 0;
  color: var(--color-text);
}

.search-bar {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.search-input {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  font-size: 1rem;
}

.search-input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.btn-search {
  padding: 0.75rem 1.5rem;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.3s;
}

.btn-search:hover {
  background: var(--color-primary-hover);
}

.result-count {
  color: var(--color-text-muted);
  font-size: 0.875rem;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.no-results {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 8px;
}

.no-results p {
  font-size: 1.25rem;
  color: var(--color-text-muted);
  margin-bottom: 1rem;
}

.btn-clear {
  padding: 0.75rem 1.5rem;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.btn-clear:hover {
  background: var(--color-primary-hover);
}

@media (max-width: 768px) {
  .products-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
  }

  .search-bar {
    flex-direction: column;
  }
}
</style>

