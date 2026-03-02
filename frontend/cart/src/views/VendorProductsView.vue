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
            🔍 Search
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
        <p>😕 No products found</p>
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

onMounted(async () => {
  productsStore.currentPage = 1
  productsStore.itemsPerPage = 6
  productsStore.searchQuery = ''
  await productsStore.fetchProducts()
})

const filteredProducts = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  const list = productsStore.products || []
  if (!kw) return list
  return list.filter(p => {
    const name = String(p.name || '').toLowerCase()
    const desc = String(p.description || '').toLowerCase()
    const id = String(p.id || '').toLowerCase()
    const category = String(p.category || '').toLowerCase()
    return name.includes(kw) || desc.includes(kw) || id.includes(kw) || category.includes(kw)
  })
})

const hasServerPagination = computed(() => {
  const totalItems = productsStore.pagination?.totalItems || 0
  const listLen = (productsStore.products || []).length
  return totalItems > listLen
})

const vendorTotalPages = computed(() => {
  if (hasServerPagination.value) return productsStore.totalPages
  const total = filteredProducts.value.length
  const per = productsStore.itemsPerPage || 12
  return Math.max(1, Math.ceil(total / per))
})

const displayedProducts = computed(() => {
  if (hasServerPagination.value) return filteredProducts.value
  const per = productsStore.itemsPerPage || 12
  const start = (productsStore.currentPage - 1) * per
  return filteredProducts.value.slice(start, start + per)
})

const handleSearch = async () => {
  productsStore.searchProducts(keyword.value)
  productsStore.currentPage = 1
  await productsStore.fetchProducts()
}

const clearSearch = async () => {
  keyword.value = ''
  productsStore.searchProducts('')
  productsStore.currentPage = 1
  await productsStore.fetchProducts()
}

const handlePageChange = async (page) => {
  if (hasServerPagination.value) {
    productsStore.goToPage(page)
    await productsStore.fetchProducts()
    return
  }
  const total = vendorTotalPages.value
  if (page >= 1 && page <= total) {
    productsStore.currentPage = page
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}
</script>

<style scoped>
.products-page {
  min-height: calc(100vh - 80px);
  background: #f5f5f5;
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
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.search-section h1 {
  margin: 0 0 1.5rem 0;
  color: #333;
}

.search-bar {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.search-input {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
}

.search-input:focus {
  outline: none;
  border-color: #667eea;
}

.btn-search {
  padding: 0.75rem 1.5rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.3s;
}

.btn-search:hover {
  background: #5568d3;
}

.result-count {
  color: #666;
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
  color: #666;
  margin-bottom: 1rem;
}

.btn-clear {
  padding: 0.75rem 1.5rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.btn-clear:hover {
  background: #5568d3;
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
