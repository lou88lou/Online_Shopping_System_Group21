// frontend/src/stores/products.js — 对接后端 /api/products
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../api'
import sampleProducts from '../data/sampleProducts'

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
    rating: p.rating,
    is_active: p.is_active !== false
  }
}

function loadLocalProducts() {
  try {
    const raw = localStorage.getItem('local_products')
    const list = raw ? JSON.parse(raw) : []
    return Array.isArray(list) ? list : []
  } catch (e) {
    return []
  }
}

function saveLocalProducts(list) {
  try {
    localStorage.setItem('local_products', JSON.stringify(list))
  } catch (e) {
    // ignore
  }
}

function filterByKeyword(list, keyword) {
  if (!keyword) return list
  const kw = keyword.toLowerCase()
  return list.filter(p => {
    return (p.name || '').toLowerCase().includes(kw) ||
      (p.category || '').toLowerCase().includes(kw) ||
      (p.description || '').toLowerCase().includes(kw) ||
      String(p.id || '').toLowerCase().includes(kw)
  })
}

function mergeLocalProducts(baseList, localList) {
  const map = new Map()
  const merged = []
  for (const p of localList) {
    if (!p || map.has(String(p.id))) continue
    map.set(String(p.id), true)
    merged.push(p)
  }
  for (const p of baseList) {
    if (!p || map.has(String(p.id))) continue
    map.set(String(p.id), true)
    merged.push(p)
  }
  return merged
}

function toLocalRecord(p) {
  if (!p) return null
  return {
    id: p.id,
    name: p.name,
    price: p.price,
    thumbnail_url: p.thumbnail || p.image || p.thumbnail_url,
    description: p.description || '',
    category: p.category || '',
    stock: p.stock,
    is_active: p.is_active !== false
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
    const keyword = searchQuery.value?.trim()
    try {
      const url = keyword
        ? `/products/search?keyword=${encodeURIComponent(keyword)}&page=${currentPage.value}&limit=${itemsPerPage.value}`
        : `/products?page=${currentPage.value}&limit=${itemsPerPage.value}`
      const { data } = await api.get(url)
      if (data.success && data.data) {
        const serverList = (data.data.products || []).map(normalizeProduct)
        const localList = filterByKeyword(loadLocalProducts(), keyword).map(normalizeProduct)
        const merged = mergeLocalProducts(serverList, localList)
        products.value = merged
        if (data.data.pagination) {
          pagination.value = {
            currentPage: data.data.pagination.currentPage,
            totalPages: data.data.pagination.totalPages,
            totalItems: data.data.pagination.totalItems,
            itemsPerPage: data.data.pagination.itemsPerPage
          }
        }
        if (localList.length > 0) {
          pagination.value.totalItems = merged.length
          pagination.value.totalPages = Math.max(1, Math.ceil(merged.length / itemsPerPage.value))
        }
      } else {
        // Backend returned no products — fallback to local sample products
        // Apply keyword filter locally when searching in offline/demo mode
        const kw = searchQuery.value ? searchQuery.value.toLowerCase() : ''
        let list = filterByKeyword(sampleProducts, kw)
        const localList = filterByKeyword(loadLocalProducts(), kw)
        list = mergeLocalProducts(list, localList)
        products.value = list.map(normalizeProduct)
        pagination.value = {
          currentPage: 1,
          totalPages: 1,
          totalItems: products.value.length,
          itemsPerPage: itemsPerPage.value
        }
      }
    } catch (err) {
      console.error('Fetch products error:', err)
      // If backend not available, load sample products so frontend shows data
      const kw = searchQuery.value ? searchQuery.value.toLowerCase() : ''
      let list = filterByKeyword(sampleProducts, kw)
      const localList = filterByKeyword(loadLocalProducts(), kw)
      list = mergeLocalProducts(list, localList)
      products.value = list.map(normalizeProduct)
      pagination.value = {
        currentPage: 1,
        totalPages: 1,
        totalItems: products.value.length,
        itemsPerPage: itemsPerPage.value
      }
    } finally {
      isLoading.value = false
    }
  }

  // 获取单个产品详情
  const getProductById = async (id) => {
    isLoading.value = true
    try {
      // Try to find the product in the already-loaded products list first
      const found = products.value.find(p => String(p.id) === String(id))
      if (found) {
        currentProduct.value = found
        return currentProduct.value
      }

      // Fallback to backend API if not in local list
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
    ,
    // Local admin helpers (frontend-only fallback)
    addLocalProduct: (p) => {
      const np = normalizeProduct(p)
      // assign a unique id if missing
      if (!np.id) np.id = `local-${Date.now()}`
      const existing = loadLocalProducts()
      existing.unshift({
        id: np.id,
        name: np.name,
        price: np.price,
        thumbnail_url: np.thumbnail || np.image,
        description: np.description,
        category: np.category,
        stock: np.stock,
        is_active: np.is_active !== false
      })
      saveLocalProducts(existing)
      products.value.unshift(np)
      pagination.value.totalItems = products.value.length
      pagination.value.totalPages = Math.max(1, Math.ceil(products.value.length / itemsPerPage.value))
      return np
    },
    editLocalProduct: (id, updates) => {
      const idx = products.value.findIndex(x => String(x.id) === String(id))
      if (idx !== -1) {
        products.value[idx] = { ...products.value[idx], ...updates }
      } else {
        const base = { id, name: '', price: 0, thumbnail: '', description: '', category: '', stock: 0 }
        products.value.unshift({ ...base, ...updates, id })
      }

      const current = products.value.find(x => String(x.id) === String(id))
      const list = loadLocalProducts()
      const localIdx = list.findIndex(x => String(x.id) === String(id))
      const record = toLocalRecord(current)
      if (record) {
        if (localIdx !== -1) list[localIdx] = record
        else list.unshift(record)
        saveLocalProducts(list)
      }

      pagination.value.totalItems = products.value.length
      pagination.value.totalPages = Math.max(1, Math.ceil(products.value.length / itemsPerPage.value))
      return current
    },
    toggleProductActive: (id) => {
      const idx = products.value.findIndex(x => String(x.id) === String(id))
      if (idx === -1) return null
      products.value[idx].is_active = !products.value[idx].is_active

      const list = loadLocalProducts()
      const localIdx = list.findIndex(x => String(x.id) === String(id))
      const record = toLocalRecord(products.value[idx])
      if (record) {
        if (localIdx !== -1) list[localIdx] = record
        else list.unshift(record)
        saveLocalProducts(list)
      }

      return products.value[idx]
    }
  }
})
