import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../api'
import sampleProducts from '../data/sampleProducts'

const PRICE_OVERRIDES_KEY = 'local_price_overrides'

function uniqueStrings(list = []) {
  return [...new Set((list || []).map(x => String(x || '').trim()).filter(Boolean))]
}

function inferMediaType(url = '') {
  const lower = String(url).toLowerCase().split('?')[0]
  if (lower.endsWith('.mp4') || lower.endsWith('.webm') || lower.endsWith('.ogg') || lower.endsWith('.mov')) {
    return 'video'
  }
  return 'image'
}

function parseTags(raw) {
  if (Array.isArray(raw)) return uniqueStrings(raw.map(x => String(x).replace(/^#/, '')))
  if (typeof raw === 'string') {
    return uniqueStrings(
      raw
        .split(/[,\s]+/)
        .map(x => x.replace(/^#/, ''))
        .filter(Boolean)
    )
  }
  return []
}

function normalizePhotos(rawPhotos, fallbackImage = '') {
  let list = []
  if (Array.isArray(rawPhotos)) {
    list = rawPhotos
  } else if (typeof rawPhotos === 'string' && rawPhotos.trim()) {
    try {
      const parsed = JSON.parse(rawPhotos)
      list = Array.isArray(parsed) ? parsed : [rawPhotos]
    } catch (e) {
      list = rawPhotos.split(',').map(x => x.trim()).filter(Boolean)
    }
  }

  const normalized = list
    .map(x => (typeof x === 'string' ? x : x?.url))
    .filter(Boolean)

  if (fallbackImage && !normalized.includes(fallbackImage)) normalized.unshift(fallbackImage)
  return uniqueStrings(normalized)
}

function normalizeMedia(rawMedia, rawPhotos, fallbackImage = '') {
  const media = []
  if (Array.isArray(rawMedia)) {
    for (const item of rawMedia) {
      if (typeof item === 'string') {
        media.push({ type: inferMediaType(item), url: item })
      } else if (item?.url) {
        media.push({ type: item.type === 'video' ? 'video' : inferMediaType(item.url), url: item.url })
      }
    }
  } else if (typeof rawMedia === 'string' && rawMedia.trim()) {
    try {
      const parsed = JSON.parse(rawMedia)
      if (Array.isArray(parsed)) {
        return normalizeMedia(parsed, rawPhotos, fallbackImage)
      }
      media.push({ type: inferMediaType(rawMedia), url: rawMedia })
    } catch (e) {
      media.push({ type: inferMediaType(rawMedia), url: rawMedia })
    }
  }

  const photos = normalizePhotos(rawPhotos, fallbackImage)
  for (const photo of photos) {
    if (!media.find(m => m.url === photo)) {
      media.unshift({ type: 'image', url: photo })
    }
  }

  if (fallbackImage && !media.find(m => m.url === fallbackImage)) {
    media.unshift({ type: 'image', url: fallbackImage })
  }

  const dedup = new Map()
  for (const m of media) {
    if (!m?.url) continue
    if (!dedup.has(m.url)) dedup.set(m.url, { type: m.type === 'video' ? 'video' : 'image', url: m.url })
  }
  return Array.from(dedup.values())
}

function buildDefaultAttributes(product) {
  const name = String(product?.name || '')
  const category = String(product?.category || '').toLowerCase()
  const base = {
    brand: product?.brand || (name.split(' ')[0] || 'Generic'),
    model: product?.model || name,
    material: product?.material || (category.includes('food') ? 'Fresh ingredients' : 'Standard build'),
    warranty: product?.warranty || (category.includes('food') ? 'Same-day only' : '12 months')
  }
  return base
}

function buildDefaultSpecs(product) {
  const category = String(product?.category || '').toLowerCase()
  if (category.includes('laptop')) {
    return {
      cpu: product?.specs?.cpu || 'Intel Core i7',
      ram: product?.specs?.ram || '16GB',
      storage: product?.specs?.storage || '512GB SSD'
    }
  }
  if (category.includes('smartphone')) {
    return {
      screen: product?.specs?.screen || '6.1-inch OLED',
      battery: product?.specs?.battery || '4500mAh',
      camera: product?.specs?.camera || '50MP main camera'
    }
  }
  return {
    feature1: product?.specs?.feature1 || 'Well-balanced daily use',
    feature2: product?.specs?.feature2 || 'Stable quality',
    feature3: product?.specs?.feature3 || 'Good value'
  }
}

function defaultHtmlDescription(product) {
  const title = product?.name || 'Product'
  const desc = product?.description || 'No detailed description yet.'
  return `
    <p><strong>${title}</strong> is suitable for daily use.</p>
    <p>${desc}</p>
    <ul>
      <li>Selected quality materials</li>
      <li>Reliable after-sales support</li>
      <li>Fast delivery and secure packaging</li>
    </ul>
  `.trim()
}

function normalizeProduct(p) {
  if (!p) return null
  const thumbnail = p.thumbnail_url || p.thumbnail || p.image || ''
  const media = normalizeMedia(p.media, p.photos, thumbnail)
  const photos = media.filter(m => m.type === 'image').map(m => m.url)
  const cover = photos[0] || media[0]?.url || thumbnail
  const tags = parseTags(p.tags || p.tag_list || p.keywords)
  const specs = { ...buildDefaultSpecs(p), ...(p.specs || {}) }
  const attributes = { ...buildDefaultAttributes(p), ...(p.attributes || {}) }
  const currentPrice = parseFloat(p.current_price ?? p.currentPrice ?? p.price ?? 0)
  const op = parseFloat(p.original_price ?? p.originalPrice)
  const originalPrice = Number.isFinite(op) ? op : null
  const saleEndAt = p.sale_end_at ?? p.saleEndAt ?? null
  const isOnSale = p.is_on_sale === true || p.isOnSale === true || (Number.isFinite(originalPrice) && currentPrice < originalPrice)

  return {
    id: p.id,
    name: p.name,
    price: currentPrice,
    originalPrice,
    saleEndAt,
    isOnSale,
    image: cover,
    thumbnail: cover,
    media,
    photos,
    description: p.description || '',
    htmlDescription: p.html_description || p.htmlDescription || defaultHtmlDescription(p),
    category: p.category || '',
    tags,
    attributes,
    specs,
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

function findLocalProductById(id) {
  const list = loadLocalProducts()
  return list.find(p => String(p?.id) === String(id)) || null
}

function saveLocalProducts(list) {
  try {
    localStorage.setItem('local_products', JSON.stringify(list))
  } catch (e) {
    // ignore
  }
}

function loadPriceOverrides() {
  try {
    const raw = localStorage.getItem(PRICE_OVERRIDES_KEY)
    const parsed = raw ? JSON.parse(raw) : {}
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch (e) {
    return {}
  }
}

function savePriceOverrides(overrides) {
  try {
    localStorage.setItem(PRICE_OVERRIDES_KEY, JSON.stringify(overrides || {}))
  } catch (e) {
    // ignore
  }
}

function applyPriceOverride(product, overrides) {
  const key = String(product?.id || '')
  if (!key || !overrides?.[key]) return product
  const patch = overrides[key]
  const nextPrice = Number(patch.price)
  const nextOriginal = Number(patch.originalPrice)
  return {
    ...product,
    price: Number.isFinite(nextPrice) ? nextPrice : product.price,
    originalPrice: Number.isFinite(nextOriginal) ? nextOriginal : (product.originalPrice ?? null),
    saleEndAt: patch.saleEndAt || product.saleEndAt || null,
    isOnSale: patch.isOnSale === true || (Number.isFinite(nextOriginal) && Number.isFinite(nextPrice) && nextPrice < nextOriginal)
  }
}

function productSearchText(p) {
  return [
    p.name,
    p.category,
    p.description,
    p.htmlDescription,
    p.attributes?.brand,
    p.attributes?.model,
    p.attributes?.material,
    p.attributes?.warranty,
    ...(Array.isArray(p.tags) ? p.tags : []),
    ...Object.values(p.specs || {}),
    String(p.id || '')
  ].join(' ').toLowerCase()
}

function filterByKeyword(list, keyword) {
  if (!keyword) return list
  const kw = String(keyword).toLowerCase().trim()
  return list.filter(p => productSearchText(normalizeProduct(p)).includes(kw))
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
  const media = Array.isArray(p.media) ? p.media : normalizeMedia(p.media, p.photos, p.thumbnail || p.image)
  return {
    id: p.id,
    name: p.name,
    price: p.price,
    original_price: p.originalPrice ?? null,
    sale_end_at: p.saleEndAt ?? null,
    is_on_sale: p.isOnSale === true,
    thumbnail_url: p.thumbnail || p.image || p.thumbnail_url || '',
    media,
    photos: media.filter(m => m.type === 'image').map(m => m.url),
    description: p.description || '',
    html_description: p.htmlDescription || '',
    category: p.category || '',
    tags: Array.isArray(p.tags) ? p.tags : parseTags(p.tags),
    attributes: p.attributes || {},
    specs: p.specs || {},
    stock: p.stock,
    is_active: p.is_active !== false
  }
}

function buildRelatedReasons(baseProduct, candidate, overlapTags = []) {
  const reasons = []

  if (String(candidate.category || '').toLowerCase() === String(baseProduct.category || '').toLowerCase()) {
    reasons.push(`Same category: ${candidate.category}`)
  }
  if (overlapTags.length > 0) {
    reasons.push(`Shared tags: ${overlapTags.slice(0, 2).join(', ')}`)
  }
  if (candidate.attributes?.brand && candidate.attributes.brand === baseProduct.attributes?.brand) {
    reasons.push(`Same brand: ${candidate.attributes.brand}`)
  }

  const basePrice = Number(baseProduct.price || 0)
  const candidatePrice = Number(candidate.price || 0)
  if (basePrice > 0 && Math.abs(candidatePrice - basePrice) / basePrice <= 0.2) {
    reasons.push('Similar price range')
  }

  if (reasons.length === 0) reasons.push('Similar product profile')
  return reasons
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
  const allCategories = computed(() => uniqueStrings(products.value.map(p => p.category)).sort())
  const allTags = computed(() => uniqueStrings(products.value.flatMap(p => p.tags || [])).sort())

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

  const fetchProducts = async () => {
    isLoading.value = true
    const keyword = searchQuery.value?.trim()
    const priceOverrides = loadPriceOverrides()
    try {
      const url = keyword
        ? `/products/search?keyword=${encodeURIComponent(keyword)}&page=${currentPage.value}&limit=${itemsPerPage.value}`
        : `/products?page=${currentPage.value}&limit=${itemsPerPage.value}`
      const { data } = await api.get(url)
      if (data.success && data.data) {
        const serverList = (data.data.products || []).map(normalizeProduct)
        const localList = filterByKeyword(loadLocalProducts(), keyword).map(normalizeProduct)
        const merged = mergeLocalProducts(serverList, localList)
        products.value = merged.map(p => applyPriceOverride(p, priceOverrides))
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
        const kw = searchQuery.value ? searchQuery.value.toLowerCase() : ''
        let list = filterByKeyword(sampleProducts, kw)
        const localList = filterByKeyword(loadLocalProducts(), kw)
        list = mergeLocalProducts(list, localList)
        products.value = list.map(normalizeProduct).map(p => applyPriceOverride(p, priceOverrides))
        pagination.value = {
          currentPage: 1,
          totalPages: 1,
          totalItems: products.value.length,
          itemsPerPage: itemsPerPage.value
        }
      }
    } catch (err) {
      console.error('Fetch products error:', err)
      const kw = searchQuery.value ? searchQuery.value.toLowerCase() : ''
      let list = filterByKeyword(sampleProducts, kw)
      const localList = filterByKeyword(loadLocalProducts(), kw)
      list = mergeLocalProducts(list, localList)
      products.value = list.map(normalizeProduct).map(p => applyPriceOverride(p, priceOverrides))
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

  const fetchVendorProducts = async ({ page = 1, limit = 10, keyword = '', idSubstring = '' } = {}) => {
    isLoading.value = true
    const priceOverrides = loadPriceOverrides()
    try {
      const query = new URLSearchParams()
      query.set('page', String(page))
      query.set('limit', String(limit))
      if (keyword) query.set('keyword', String(keyword).trim())
      if (idSubstring) query.set('product_id', String(idSubstring).trim())

      const { data } = await api.get(`/vendor/products?${query.toString()}`)
      if (data?.success && data?.data) {
        const list = (data.data.products || []).map(normalizeProduct)
        products.value = list.map(p => applyPriceOverride(p, priceOverrides))
        const p = data.data.pagination || {}
        pagination.value = {
          currentPage: Number(p.currentPage || page),
          totalPages: Number(p.totalPages || 1),
          totalItems: Number(p.totalItems || list.length),
          itemsPerPage: Number(p.itemsPerPage || limit)
        }
        currentPage.value = Number(p.currentPage || page)
        return { success: true, products: list, pagination: pagination.value }
      }
      return { success: false, message: 'Failed to fetch vendor products' }
    } catch (err) {
      // fallback to local/front-end mode
      searchQuery.value = keyword || ''
      currentPage.value = page
      itemsPerPage.value = limit
      await fetchProducts()
      return { success: true, products: products.value, pagination: pagination.value, fallback: true }
    } finally {
      isLoading.value = false
    }
  }

  const getVendorProductById = async (id) => {
    isLoading.value = true
    const priceOverrides = loadPriceOverrides()
    try {
      const { data } = await api.get(`/vendor/products/${id}`)
      if (data?.success && data?.data?.product) {
        const item = applyPriceOverride(normalizeProduct(data.data.product), priceOverrides)
        currentProduct.value = item
        return item
      }
      return null
    } catch (err) {
      return getProductById(id)
    } finally {
      isLoading.value = false
    }
  }

  const createVendorProduct = async (payload = {}) => {
    isLoading.value = true
    try {
      const { data } = await api.post('/vendor/products', payload)
      if (data?.success && data?.data?.product) {
        const created = applyPriceOverride(normalizeProduct(data.data.product), loadPriceOverrides())
        products.value.unshift(created)
        return { success: true, product: created, message: data.message || 'Product created' }
      }
      return { success: false, message: data?.error || 'Failed to create product' }
    } catch (err) {
      const local = addLocalProduct(payload)
      return { success: true, product: local, message: 'Created in local fallback mode', fallback: true }
    } finally {
      isLoading.value = false
    }
  }

  const updateVendorProduct = async (id, payload = {}) => {
    isLoading.value = true
    try {
      const { data } = await api.put(`/vendor/products/${id}`, payload)
      if (data?.success && data?.data?.product) {
        const updated = applyPriceOverride(normalizeProduct(data.data.product), loadPriceOverrides())
        const idx = products.value.findIndex(x => String(x.id) === String(id))
        if (idx !== -1) products.value[idx] = updated
        return { success: true, product: updated, message: data.message || 'Product updated' }
      }
      return { success: false, message: data?.error || 'Failed to update product' }
    } catch (err) {
      const updated = editLocalProduct(id, payload)
      return { success: !!updated, product: updated, message: 'Updated in local fallback mode', fallback: true }
    } finally {
      isLoading.value = false
    }
  }

  const uploadVendorMedia = async (file) => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      const { data } = await api.post('/vendor/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      if (data?.success && data?.data?.media) {
        return { success: true, media: data.data.media, message: data.message || 'Uploaded' }
      }
      return { success: false, message: data?.error || 'Upload failed' }
    } catch (err) {
      return { success: false, message: err?.message || 'Upload failed' }
    }
  }

  const getProductById = async (id) => {
    isLoading.value = true
    const priceOverrides = loadPriceOverrides()
    try {
      const found = products.value.find(p => String(p.id) === String(id))
      if (found) {
        currentProduct.value = found
        return currentProduct.value
      }

      // Prefer local edited record (media/videos/tags/specs) when available.
      const localHit = findLocalProductById(id)
      if (localHit) {
        currentProduct.value = applyPriceOverride(normalizeProduct(localHit), priceOverrides)
        return currentProduct.value
      }

      const { data } = await api.get(`/products/${id}`)
      if (data.success && data.data?.product) {
        const backendProduct = normalizeProduct(data.data.product)
        const localOverlay = findLocalProductById(id)
        const merged = localOverlay
          ? normalizeProduct({ ...backendProduct, ...localOverlay, id })
          : backendProduct
        currentProduct.value = applyPriceOverride(merged, priceOverrides)
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

  const getRelatedProducts = (product, limit = 4) => {
    if (!product) return []
    const currentTags = new Set(product.tags || [])
    return (products.value || [])
      .filter(p => String(p.id) !== String(product.id))
      .map(p => {
        let score = 0
        if (String(p.category).toLowerCase() === String(product.category).toLowerCase()) score += 3
        const overlap = (p.tags || []).filter(t => currentTags.has(t)).length
        score += overlap * 2
        if (p.attributes?.brand && p.attributes.brand === product.attributes?.brand) score += 1
        return { p, score }
      })
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(x => x.p)
  }

  const getRelatedProductsWithReasons = (product, limit = 4) => {
    if (!product) return []
    const currentTags = new Set(product.tags || [])

    return (products.value || [])
      .filter(p => String(p.id) !== String(product.id))
      .map(p => {
        let score = 0
        if (String(p.category).toLowerCase() === String(product.category).toLowerCase()) score += 3
        const overlapTags = (p.tags || []).filter(t => currentTags.has(t))
        score += overlapTags.length * 2
        if (p.attributes?.brand && p.attributes.brand === product.attributes?.brand) score += 1

        const reasons = buildRelatedReasons(product, p, overlapTags)
        return { product: p, score, reason: reasons[0], reasons }
      })
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
  }

  const addLocalProduct = (p) => {
    const np = normalizeProduct(p)
    if (!np.id) np.id = `local-${Date.now()}`
    const existing = loadLocalProducts()
    existing.unshift(toLocalRecord(np))
    saveLocalProducts(existing)
    products.value.unshift(np)
    pagination.value.totalItems = products.value.length
    pagination.value.totalPages = Math.max(1, Math.ceil(products.value.length / itemsPerPage.value))
    return np
  }

  const editLocalProduct = (id, updates) => {
    const idx = products.value.findIndex(x => String(x.id) === String(id))
    if (idx !== -1) {
      products.value[idx] = normalizeProduct({ ...products.value[idx], ...updates, id })
    } else {
      const base = { id, name: '', price: 0, thumbnail: '', description: '', category: '', stock: 0, photos: [] }
      products.value.unshift(normalizeProduct({ ...base, ...updates, id }))
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
  }

  const toggleProductActive = (id) => {
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

  const simulatePriceDrop = ({ productIds = [], hours = 24 } = {}) => {
    const ids = (Array.isArray(productIds) ? productIds : []).map(x => String(x))
    if (!ids.length) return { changed: 0, ids: [] }

    const overrides = loadPriceOverrides()
    const endAt = new Date(Date.now() + Math.max(1, Number(hours) || 24) * 60 * 60 * 1000).toISOString()
    const changedIds = []

    for (const p of products.value) {
      const pid = String(p.id)
      if (!ids.includes(pid)) continue
      const original = Number(p.originalPrice || p.price || 0)
      if (!Number.isFinite(original) || original <= 0) continue
      const dropped = Math.max(1, Math.round(original * 0.9))
      if (dropped >= original) continue

      overrides[pid] = {
        price: dropped,
        originalPrice: original,
        saleEndAt: endAt,
        isOnSale: true
      }
      changedIds.push(pid)
    }

    savePriceOverrides(overrides)
    if (changedIds.length > 0) {
      products.value = products.value.map(p => applyPriceOverride(p, overrides))
      if (currentProduct.value) {
        currentProduct.value = applyPriceOverride(currentProduct.value, overrides)
      }
    }
    return { changed: changedIds.length, ids: changedIds }
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
    allCategories,
    allTags,
    searchProducts,
    goToPage,
    getProductById,
    getRelatedProducts,
    getRelatedProductsWithReasons,
    fetchProducts,
    fetchVendorProducts,
    getVendorProductById,
    createVendorProduct,
    updateVendorProduct,
    uploadVendorMedia,
    addLocalProduct,
    editLocalProduct,
    toggleProductActive,
    simulatePriceDrop
  }
})
