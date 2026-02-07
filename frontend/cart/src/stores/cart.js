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

  const totalItems = computed(() => {
    return cartItems.value.reduce((sum, item) => sum + item.quantity, 0)
  })
  const subtotal = computed(() => {
    return cartItems.value.reduce((sum, item) => sum + item.price * item.quantity, 0)
  })
  const isEmpty = computed(() => cartItems.value.length === 0)

  const loadCart = async () => {
    if (!getToken()) {
      cartItems.value = []
      return
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
      cartItems.value = []
    } finally {
      isLoading.value = false
    }
  }

  const addToCart = async (product, quantity = 1) => {
    if (!getToken()) {
      return { success: false, message: 'Please login first to add items to cart', requiresLogin: true }
    }
    isLoading.value = true
    try {
      const { data } = await api.post('/cart', { productId: product.id, quantity })
      if (data.success && data.data?.cart?.cartItems) {
        cartItems.value = data.data.cart.cartItems.map(normalizeCartItem)
        return { success: true, message: data.message || 'Added to cart successfully' }
      }
      return { success: false, message: data?.error || 'Failed to add to cart' }
    } catch (err) {
      return { success: false, message: err.message || 'Failed to add to cart' }
    } finally {
      isLoading.value = false
    }
  }

  const updateQuantity = async (cartItemId, quantity) => {
    if (!getToken()) return
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
      console.error('Update quantity error:', err)
    } finally {
      isLoading.value = false
    }
  }

  const removeFromCart = async (cartItemId) => {
    if (!getToken()) return { success: false, message: 'Not logged in' }
    isLoading.value = true
    try {
      const { data } = await api.delete(`/cart/${cartItemId}`)
      if (data.success && data.data?.cart?.cartItems) {
        cartItems.value = data.data.cart.cartItems.map(normalizeCartItem)
        return { success: true, message: data.message || 'Item removed from cart' }
      }
      return { success: false, message: data?.error || 'Failed to remove' }
    } catch (err) {
      return { success: false, message: err.message || 'Failed to remove' }
    } finally {
      isLoading.value = false
    }
  }

  const clearCart = async () => {
    if (!getToken()) {
      cartItems.value = []
      return { success: true, message: 'Cart cleared' }
    }
    isLoading.value = true
    try {
      await api.delete('/cart')
      cartItems.value = []
      return { success: true, message: 'Cart cleared successfully' }
    } catch (err) {
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
