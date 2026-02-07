// frontend/src/stores/products.js — 对接后端 /api/products
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../api'

// 后端产品字段转前端（thumbnail_url -> image）
function normalizeProduct(p) {
  if (!p) return null
  return {
    id: p.id,
    name: p.name,
    price: parseFloat(p.price),
    image: p.thumbnail_url || p.image,
    thumbnail: p.thumbnail_url || p.thumbnail || p.image,
    description: p.description || '',
    category: p.category || '',
    stock: p.stock != null ? p.stock : 99,
    rating: p.rating
  }
}

export const useProductsStore = defineStore('products', () => {
  const products = ref([])
  const currentProduct = ref(null)
  const searchQuery = ref('')
  const currentPage = ref(1)
  const itemsPerPage = ref(12)
  const isLoading = ref(false)
  const pagination = ref({ totalPages: 1, totalItems: 0 })

  const filteredProducts = computed(() => products.value)
  const totalPages = computed(() => pagination.value.totalPages || 1)
  const paginatedProducts = computed(() => products.value)

  const searchProducts = (query) => {
    searchQuery.value = query
    currentPage.value = 1
  }

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages.value) {
      currentPage.value = page
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  // 从后端拉取产品列表（分页）
  const fetchProducts = async () => {
    isLoading.value = true
    try {
      const keyword = searchQuery.value?.trim()
      const url = keyword
        ? `/products/search?keyword=${encodeURIComponent(keyword)}&page=${currentPage.value}&limit=${itemsPerPage.value}`
        : `/products?page=${currentPage.value}&limit=${itemsPerPage.value}`
      const { data } = await api.get(url)
      if (data.success && data.data) {
        products.value = (data.data.products || []).map(normalizeProduct)
        if (data.data.pagination) {
          pagination.value = {
            currentPage: data.data.pagination.currentPage,
            totalPages: data.data.pagination.totalPages,
            totalItems: data.data.pagination.totalItems,
            itemsPerPage: data.data.pagination.itemsPerPage
          }
        }
      }
    } catch (err) {
      console.error('Fetch products error:', err)
      products.value = []
    } finally {
      isLoading.value = false
    }
  }

  // 获取单个产品详情
  const getProductById = async (id) => {
    isLoading.value = true
    try {
      const { data } = await api.get(`/products/${id}`)
      if (data.success && data.data?.product) {
        currentProduct.value = normalizeProduct(data.data.product)
        return currentProduct.value
      }
      currentProduct.value = null
      return null
    } catch (err) {
      console.error('Get product error:', err)
      currentProduct.value = null
      return null
    } finally {
      isLoading.value = false
    }
  }

  return {
    products,
    currentProduct,
    searchQuery,
    currentPage,
    itemsPerPage,
    isLoading,
    pagination,
    filteredProducts,
    paginatedProducts,
    totalPages,
    searchProducts,
    goToPage,
    getProductById,
    fetchProducts
  }
})
