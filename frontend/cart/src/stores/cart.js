// frontend/src/stores/cart.js — 对接后端 /api/cart
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../api'
import { getToken } from '../api'

// 后端购物车项：cart_item_id, product_id, quantity, name, price, thumbnail_url, subtotal
// 前端统一为：id(cart_item_id，用于更新/删除), productId(用于跳转详情), name, price, image, quantity
function normalizeCartItem(item) {
  return {
    id: item.cart_item_id,
    productId: item.product_id,
    product_id: item.product_id,
    name: item.name,
    price: parseFloat(item.price),
    image: item.thumbnail_url || item.image,
    quantity: item.quantity
  }
}

export const useCartStore = defineStore('cart', () => {
  const cartItems = ref([])
  const isLoading = ref(false)

  const getErrorStatus = (err) => err?.response?.status ?? err?.status
  const getErrorMessage = (err) =>
    (err?.response?.data?.error || err?.response?.data?.message || err?.message || '')
      .toString()
      .toLowerCase()

  const addToLocalCart = (product, quantity = 1) => {
    try {
      const localUser = JSON.parse(localStorage.getItem('user'))
      if (!localUser || !localUser.id) {
        return { success: false, message: 'Please login first to add items to cart', requiresLogin: true }
      }
      const key = `cart_${localUser.id}`
      const raw = localStorage.getItem(key)
      const list = raw ? JSON.parse(raw) : []
      const existing = list.find(i => String(i.productId) === String(product.id))
      if (existing) {
        existing.quantity += quantity
      } else {
        list.push({
          id: `local-${Date.now()}`,
          productId: product.id,
          name: product.name,
          price: Number(product.price || 0),
          image: product.thumbnail_url || product.image || product.thumbnail,
          quantity
        })
      }
      localStorage.setItem(key, JSON.stringify(list))
      cartItems.value = list
      return { success: true, message: 'Added to cart.' }
    } catch (e) {
      return { success: false, message: 'Failed to add to cart' }
    }
  }

  const totalItems = computed(() => {
    return cartItems.value.reduce((sum, item) => sum + item.quantity, 0)
  })
  const subtotal = computed(() => {
    return cartItems.value.reduce((sum, item) => sum + item.price * item.quantity, 0)
  })
  const isEmpty = computed(() => cartItems.value.length === 0)

  const loadCart = async () => {
    const token = getToken()
    // If no token, but a local user session exists, load from localStorage
    // If no token, or this is a frontend-only demo token/user, load from localStorage
    if (!token) {
      try {
        const localUser = JSON.parse(localStorage.getItem('user'))
        if (localUser && localUser.id) {
          const key = `cart_${localUser.id}`
          const raw = localStorage.getItem(key)
          cartItems.value = raw ? JSON.parse(raw) : []
          return
        }
      } catch (e) {
        // ignore
      }
      cartItems.value = []
      return
    }
    // If token indicates a local/demo session, load from localStorage instead of calling backend
    try {
      const rawUser = localStorage.getItem('user')
      const isLocalUser = rawUser ? JSON.parse(rawUser)?.id?.toString().startsWith('local') : false
      if (token === 'local-token' || isLocalUser) {
        const localUser = JSON.parse(rawUser)
        const key = `cart_${localUser.id}`
        const raw = localStorage.getItem(key)
        cartItems.value = raw ? JSON.parse(raw) : []
        return
      }
    } catch (e) {
      // ignore and fallthrough to backend fetch
    }
    isLoading.value = true
    try {
      const { data } = await api.get('/cart')
      if (data.success && data.data?.cartItems) {
        cartItems.value = data.data.cartItems.map(normalizeCartItem)
      } else {
        cartItems.value = []
      }
    } catch (err) {
      console.error('Load cart error:', err)
      // If auth error or backend down, try to load demo/local cart
      const status = getErrorStatus(err)
      if (err && (status === 401 || status === 403)) {
        try {
          const localUser = JSON.parse(localStorage.getItem('user'))
          if (localUser && localUser.id) {
            const key = `cart_${localUser.id}`
            const raw = localStorage.getItem(key)
            cartItems.value = raw ? JSON.parse(raw) : []
            return
          }
        } catch (e) {
          // ignore
        }
      }
      cartItems.value = []
    } finally {
      isLoading.value = false
    }
  }

  const addToCart = async (product, quantity = 1) => {
    const token = getToken()
    let localUser = null
    let isLocalUser = false
    try {
      localUser = JSON.parse(localStorage.getItem('user'))
      isLocalUser = !!localUser?.id?.toString().startsWith('local')
    } catch (e) {
      // ignore
    }
    const isLocalToken = token === 'local-token'
    const isNumericProductId = /^\d+$/.test(String(product?.id ?? ''))

    // Demo/local user or non-numeric product ID should stay in local cart mode.
    if (!token || isLocalToken || isLocalUser || !isNumericProductId) {
      return addToLocalCart(product, quantity)
    }

    isLoading.value = true
    // prevent global auth interceptor from immediately redirecting on 401
    if (typeof window !== 'undefined') window.__authRedirect = true
    try {
      const { data } = await api.post('/cart', { productId: product.id, quantity })
      if (data.success && data.data?.cart?.cartItems) {
        cartItems.value = data.data.cart.cartItems.map(normalizeCartItem)
        return { success: true, message: data.message || 'Added to cart successfully' }
      }
      // If backend returned an auth-related error message (e.g. 'Invalid token'), perform local fallback
      const lowerMsg = (data?.error || data?.message || '').toString().toLowerCase()
      if (lowerMsg.includes('token') || lowerMsg.includes('invalid')) {
        return addToLocalCart(product, quantity)
      }
      return { success: false, message: data?.error || 'Failed to add to cart' }
    } catch (err) {
      // For auth/backend errors (including 500), gracefully fallback to local cart.
      const status = getErrorStatus(err)
      if (err && (status === 401 || status === 403 || status === 500 || status === 404)) {
        return addToLocalCart(product, quantity)
      }
      return { success: false, message: err.message || 'Failed to add to cart' }
    } finally {
      isLoading.value = false
      if (typeof window !== 'undefined') window.__authRedirect = false
    }
  }

  const updateQuantity = async (cartItemId, quantity) => {
    const token = getToken()
    let localUser = null
    let isLocalUser = false
    try {
      localUser = JSON.parse(localStorage.getItem('user'))
      isLocalUser = !!localUser?.id?.toString().startsWith('local')
    } catch (e) {
      // ignore
    }
    const isLocalToken = token === 'local-token'
    const isNumericCartItemId = /^\d+$/.test(String(cartItemId ?? ''))

    if (!token || isLocalToken || isLocalUser || !isNumericCartItemId) {
      try {
        if (!localUser || !localUser.id) return
        const key = `cart_${localUser.id}`
        const list = JSON.parse(localStorage.getItem(key) || '[]')
        const idx = list.findIndex(i => String(i.id) === String(cartItemId))
        if (idx === -1) return
        if (quantity < 1) {
          list.splice(idx, 1)
        } else {
          list[idx].quantity = quantity
        }
        localStorage.setItem(key, JSON.stringify(list))
        cartItems.value = list
      } catch (e) {
        // ignore
      }
      return
    }
    if (quantity < 1) {
      await removeFromCart(cartItemId)
      return
    }
    isLoading.value = true
    try {
      const { data } = await api.put(`/cart/${cartItemId}`, { quantity })
      if (data.success && data.data?.cart?.cartItems) {
        cartItems.value = data.data.cart.cartItems.map(normalizeCartItem)
      }
    } catch (err) {
      // If auth error or backend unavailable, try local fallback
      const status = getErrorStatus(err)
      const lowerMsg = getErrorMessage(err)
      if (err && (status === 401 || status === 403 || status === 404 || status === 500 || lowerMsg.includes('token') || lowerMsg.includes('invalid') || lowerMsg.includes('network'))) {
        try {
          if (!localUser || !localUser.id) return
          const key = `cart_${localUser.id}`
          const list = JSON.parse(localStorage.getItem(key) || '[]')
          const idx = list.findIndex(i => String(i.id) === String(cartItemId))
          if (idx === -1) return
          if (quantity < 1) {
            list.splice(idx, 1)
          } else {
            list[idx].quantity = quantity
          }
          localStorage.setItem(key, JSON.stringify(list))
          cartItems.value = list
          return
        } catch (e) {
          console.error('Local updateQuantity fallback failed:', e)
        }
      }
      console.error('Update quantity error:', err)
    } finally {
      isLoading.value = false
    }
  }

  const removeFromCart = async (cartItemId) => {
    const token = getToken()
    let localUser = null
    let isLocalUser = false
    try {
      localUser = JSON.parse(localStorage.getItem('user'))
      isLocalUser = !!localUser?.id?.toString().startsWith('local')
    } catch (e) {
      // ignore
    }
    const isLocalToken = token === 'local-token'
    const isNumericCartItemId = /^\d+$/.test(String(cartItemId ?? ''))

    if (!token || isLocalToken || isLocalUser || !isNumericCartItemId) {
      try {
        if (!localUser || !localUser.id) return { success: false, message: 'Not logged in' }
        const key = `cart_${localUser.id}`
        const list = JSON.parse(localStorage.getItem(key) || '[]')
        const idx = list.findIndex(i => String(i.id) === String(cartItemId))
        if (idx !== -1) list.splice(idx, 1)
        localStorage.setItem(key, JSON.stringify(list))
        cartItems.value = list
        return { success: true, message: 'Item removed from cart.' }
      } catch (e) {
        return { success: false, message: 'Failed to remove' }
      }
    }
    isLoading.value = true
    try {
      const { data } = await api.delete(`/cart/${cartItemId}`)
      if (data.success && data.data?.cart?.cartItems) {
        cartItems.value = data.data.cart.cartItems.map(normalizeCartItem)
        return { success: true, message: data.message || 'Item removed from cart' }
      }
      return { success: false, message: data?.error || 'Failed to remove' }
    } catch (err) {
      // If auth error or backend unavailable, try local fallback
      const status = getErrorStatus(err)
      const lowerMsg = getErrorMessage(err)
      if (err && (status === 401 || status === 403 || status === 404 || status === 500 || lowerMsg.includes('token') || lowerMsg.includes('invalid') || lowerMsg.includes('network'))) {
        try {
          if (!localUser || !localUser.id) return { success: false, message: 'Not logged in' }
          const key = `cart_${localUser.id}`
          const list = JSON.parse(localStorage.getItem(key) || '[]')
          const idx = list.findIndex(i => String(i.id) === String(cartItemId))
          if (idx !== -1) list.splice(idx, 1)
          localStorage.setItem(key, JSON.stringify(list))
          cartItems.value = list
          return { success: true, message: 'Item removed from cart.' }
        } catch (e) {
          console.error('Local removeFromCart fallback failed:', e)
          return { success: false, message: 'Failed to remove' }
        }
      }
      return { success: false, message: err.message || 'Failed to remove' }
    } finally {
      isLoading.value = false
    }
  }

  const clearCart = async () => {
    const token = getToken()
    if (!token) {
      try {
        const localUser = JSON.parse(localStorage.getItem('user'))
        if (localUser && localUser.id) {
          localStorage.removeItem(`cart_${localUser.id}`)
        }
      } catch (e) { // ignore
      }
      cartItems.value = []
      return { success: true, message: 'Cart cleared' }
    }
    // Demo/本地用户：不请求后端，直接清空 localStorage 和内存
    try {
      const rawUser = localStorage.getItem('user')
      const isLocalUser = rawUser ? JSON.parse(rawUser)?.id?.toString().startsWith('local') : false
      if (token === 'local-token' || isLocalUser) {
        const localUser = JSON.parse(rawUser)
        if (localUser?.id) {
          localStorage.removeItem(`cart_${localUser.id}`)
        }
        cartItems.value = []
        return { success: true, message: 'Cart cleared.' }
      }
    } catch (e) {
      // ignore and fallthrough to backend
    }
    isLoading.value = true
    try {
      await api.delete('/cart')
      cartItems.value = []
      return { success: true, message: 'Cart cleared successfully' }
    } catch (err) {
      // 后端不可用时（如仅前端 demo），回退到清空本地购物车
      const status = getErrorStatus(err)
      const lowerMsg = getErrorMessage(err)
      if (err && (status === 401 || status === 403 || status === 404 || status === 500 || lowerMsg.includes('token') || lowerMsg.includes('invalid') || lowerMsg.includes('network'))) {
        try {
          const localUser = JSON.parse(localStorage.getItem('user'))
          if (localUser?.id) {
            localStorage.removeItem(`cart_${localUser.id}`)
          }
          cartItems.value = []
          return { success: true, message: 'Cart cleared.' }
        } catch (e) {
          console.error('Local clearCart fallback failed:', e)
        }
      }
      return { success: false, message: err.message || 'Failed to clear cart' }
    } finally {
      isLoading.value = false
    }
  }

  const clearCartOnLogout = () => {
    cartItems.value = []
  }

  return {
    cartItems,
    isLoading,
    totalItems,
    subtotal,
    isEmpty,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    clearCartOnLogout,
    loadCart
  }
})
