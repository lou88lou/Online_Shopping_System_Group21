<template>
  <div class="products-page">
    <div class="container">
      <!-- A4: 搜索栏 -->
      <div class="search-section">
        <h1>Product List</h1>
        <div class="search-bar">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search products, categories..."
            @input="handleSearch"
            class="search-input"
          />
          <button @click="handleSearch" class="btn-search">
            🔍 Search
          </button>
        </div>
        <p class="result-count">
          Found {{ productsStore.pagination.totalItems ?? productsStore.products.length }} products
        </p>
      </div>

      <!-- A3: 产品列表（网格显示） -->
      <div v-if="productsStore.paginatedProducts.length > 0" class="products-grid">
        <ProductCard
          v-for="product in productsStore.paginatedProducts"
          :key="product.id"
          :product="product"
        />
      </div>

      <!-- 无结果提示 -->
      <div v-else class="no-results">
        <p>😕 No products found</p>
        <button @click="clearSearch" class="btn-clear">Clear Search</button>
      </div>

      <!-- A5: 分页组件 -->
      <Pagination
        :current-page="productsStore.currentPage"
        :total-pages="productsStore.totalPages"
        @page-change="handlePageChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useProductsStore } from '../stores/products'
import ProductCard from '../components/ProductCard.vue'
import Pagination from '../components/Pagination.vue'

const productsStore = useProductsStore()
const searchQuery = ref(productsStore.searchQuery || '')

onMounted(async () => {
  productsStore.currentPage = 1
  productsStore.searchQuery = searchQuery.value
  await productsStore.fetchProducts()
})

// A4: 搜索功能（调用后端）
const handleSearch = async () => {
  productsStore.searchProducts(searchQuery.value)
  productsStore.currentPage = 1
  await productsStore.fetchProducts()
}

// A5: 分页切换
const handlePageChange = async (page) => {
  productsStore.goToPage(page)
  await productsStore.fetchProducts()
}

const clearSearch = async () => {
  searchQuery.value = ''
  productsStore.searchProducts('')
  productsStore.currentPage = 1
  await productsStore.fetchProducts()
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
