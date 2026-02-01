// frontend/src/stores/cart.js
import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

export const useCartStore = defineStore('cart', () => {
  // 状态
  const cartItems = ref([])
  const isLoading = ref(false)

  // 从 localStorage 加载
  const loadCart = () => {
    try {
      const saved = localStorage.getItem('cart')
      if (saved) {
        cartItems.value = JSON.parse(saved)
      }
    } catch (e) {
      console.error('failed to load cart:', e)
    }
  }

  // 保存到 localStorage
  const saveCart = () => {
    try {
      localStorage.setItem('cart', JSON.stringify(cartItems.value))
    } catch (e) {
      console.error('failed to save cart:', e)
    }
  }

  // 初始化加载
  loadCart()

  // 监听变化自动保存
  watch(cartItems, saveCart, { deep: true })

  // 计算属性
  const totalItems = computed(() => {
    return cartItems.value.reduce((sum, item) => sum + item.quantity, 0)
  })

  const subtotal = computed(() => {
    return cartItems.value.reduce((sum, item) => sum + item.price * item.quantity, 0)
  })

  const isEmpty = computed(() => cartItems.value.length === 0)

  // A7: 添加商品到购物车（默认数量为1）
  const addToCart = (product, quantity = 1) => {
    const existingItem = cartItems.value.find(item => item.id === product.id)

    if (existingItem) {
      // 如果商品已存在，增加数量
      existingItem.quantity += quantity
      existingItem.updatedAt = new Date().toISOString()
    } else {
      // 添加新商品
      cartItems.value.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.thumbnail || product.image,
        quantity: quantity,
        addedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
    }

    return { success: true, message: 'added to cart successfully' }
  }

  // A9: 修改商品数量
  const updateQuantity = (productId, quantity) => {
    if (quantity < 1) {
      removeFromCart(productId)
      return
    }

    const item = cartItems.value.find(item => item.id === productId)
    if (item) {
      item.quantity = quantity
      item.updatedAt = new Date().toISOString()
    }
  }

  // A10: 从购物车移除商品
  const removeFromCart = (productId) => {
    const index = cartItems.value.findIndex(item => item.id === productId)
    if (index !== -1) {
      cartItems.value.splice(index, 1)
      return { success: true, message: 'item removed from cart successfully' }
    }
    return { success: false, message: 'item not found in cart' }
  }

  // 清空购物车
  const clearCart = () => {
    cartItems.value = []
    return { success: true, message: 'cart cleared successfully' }
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
    clearCart
  }
})
