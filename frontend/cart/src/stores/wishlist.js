import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { useAuthStore } from './auth'
import { useProductsStore } from './products'

const STORAGE_KEY = 'wishlist_v1'

function loadStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : {}
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch (e) {
    return {}
  }
}

function saveStorage(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (e) {
    // ignore
  }
}

export const useWishlistStore = defineStore('wishlist', () => {
  const authStore = useAuthStore()
  const productsStore = useProductsStore()
  const db = ref(loadStorage())

  const userKey = computed(() => {
    const uid = authStore.user?.id
    return uid ? String(uid) : ''
  })

  const records = computed(() => {
    const key = userKey.value
    if (!key) return []
    return Array.isArray(db.value[key]) ? db.value[key] : []
  })

  const wishlistIds = computed(() => records.value.map(r => String(r.productId)))

  const count = computed(() => records.value.length)

  const items = computed(() => {
    const map = new Map((productsStore.products || []).map(p => [String(p.id), p]))
    return records.value
      .map((record) => {
        const product = map.get(String(record.productId))
        if (!product) return null
        const current = Number(product.price || 0)
        const saved = Number(record.savedPrice || 0)
        const dropAmount = saved > current ? saved - current : 0
        const dropPercent = saved > 0 ? (dropAmount / saved) * 100 : 0
        return {
          ...record,
          product,
          currentPrice: current,
          savedPrice: saved,
          isOnSale: product.isOnSale === true,
          hasPriceDrop: dropAmount > 0,
          dropAmount,
          dropPercent
        }
      })
      .filter(Boolean)
  })

  const dealCount = computed(() => items.value.filter(x => x.isOnSale || x.hasPriceDrop).length)

  const ensureUser = () => {
    const key = userKey.value
    if (!key) return null
    if (!Array.isArray(db.value[key])) db.value[key] = []
    return key
  }

  const isWished = (productId) => wishlistIds.value.includes(String(productId))

  const add = (product) => {
    const key = ensureUser()
    if (!key || !product?.id) return { success: false, message: 'Please login first.' }
    const pid = String(product.id)
    const list = [...db.value[key]]
    if (list.find(x => String(x.productId) === pid)) {
      return { success: true, message: 'Already in wishlist.' }
    }
    list.unshift({
      productId: pid,
      savedAt: new Date().toISOString(),
      savedPrice: Number(product.price || 0),
      lastAlertPrice: null
    })
    db.value = { ...db.value, [key]: list }
    saveStorage(db.value)
    return { success: true, message: 'Added to wishlist.' }
  }

  const remove = (productId) => {
    const key = ensureUser()
    if (!key) return { success: false, message: 'Please login first.' }
    const pid = String(productId)
    const list = [...db.value[key]].filter(x => String(x.productId) !== pid)
    db.value = { ...db.value, [key]: list }
    saveStorage(db.value)
    return { success: true, message: 'Removed from wishlist.' }
  }

  const toggle = (product) => {
    if (!product?.id) return { success: false, message: 'Invalid product.' }
    if (isWished(product.id)) return remove(product.id)
    return add(product)
  }

  const checkNewPriceDropAlerts = () => {
    const key = ensureUser()
    if (!key) return { count: 0, items: [] }
    const productsMap = new Map((productsStore.products || []).map(p => [String(p.id), p]))
    const list = [...db.value[key]]
    const alerts = []

    for (const entry of list) {
      const product = productsMap.get(String(entry.productId))
      if (!product) continue
      const current = Number(product.price || 0)
      const saved = Number(entry.savedPrice || 0)
      if (saved > 0 && current < saved) {
        const alertedPrice = Number(entry.lastAlertPrice || 0)
        if (!alertedPrice || current < alertedPrice) {
          alerts.push({ ...entry, product, currentPrice: current })
          entry.lastAlertPrice = current
        }
      }
    }

    if (alerts.length > 0) {
      db.value = { ...db.value, [key]: list }
      saveStorage(db.value)
    }
    return { count: alerts.length, items: alerts }
  }

  const simulatePriceDropForWishlist = () => {
    const targetIds = items.value
      .filter(x => !x.isOnSale && x.currentPrice > 0)
      .slice(0, 3)
      .map(x => String(x.product.id))

    if (!targetIds.length) return { changed: 0, ids: [] }
    return productsStore.simulatePriceDrop({ productIds: targetIds, hours: 24 })
  }

  return {
    records,
    items,
    wishlistIds,
    count,
    dealCount,
    isWished,
    add,
    remove,
    toggle,
    checkNewPriceDropAlerts,
    simulatePriceDropForWishlist
  }
})
