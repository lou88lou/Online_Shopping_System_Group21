// frontend/src/stores/orders.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useCartStore } from './cart'
import { useAuthStore } from './auth'

export const useOrdersStore = defineStore('orders', () => {
  const orders = ref([])
  const isCheckoutLoading = ref(false)

  // 从 localStorage 加载订单
  const loadOrders = () => {
    try {
      const saved = localStorage.getItem('orders')
      if (saved) {
        orders.value = JSON.parse(saved)
      }
    } catch (e) {
      console.error('failed to load orders:', e)
    }
  }

  // 保存订单
  const saveOrders = () => {
    try {
      localStorage.setItem('orders', JSON.stringify(orders.value))
    } catch (e) {
      console.error('failed to save orders:', e)
    }
  }

  // 初始化
  loadOrders()

  // 获取用户订单
  const userOrders = computed(() => {
    const authStore = useAuthStore()
    if (!authStore.user) return []
    return orders.value.filter(order => order.userId === authStore.user.id)
  })

  // A11: 结账 - 创建订单并清空购物车
  const checkout = async (shippingAddress) => {
    const cartStore = useCartStore()
    const authStore = useAuthStore()

    // 检查登录状态
    if (!authStore.isLoggedIn) {
      return { success: false, message: 'please login first' }
    }

    // 检查购物车
    if (cartStore.isEmpty) {
      return { success: false, message: 'the cart is empty' }
    }

    isCheckoutLoading.value = true

    try {
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 1000))

      // 创建订单
      const newOrder = {
        id: `PO${Date.now()}`,
        userId: authStore.user.id,
        customerName: authStore.user.fullName,
        items: [...cartStore.cartItems],
        subtotal: cartStore.subtotal,
        shippingAddress: shippingAddress || authStore.user.shippingAddress,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      // 保存订单
      orders.value.unshift(newOrder)
      saveOrders()

      // 清空购物车
      cartStore.clearCart()

      return { 
        success: true, 
        message: 'order created successfully!',
        orderId: newOrder.id 
      }
    } catch (error) {
      return { success: false, message: 'failed to create order, please try again' }
    } finally {
      isCheckoutLoading.value = false
    }
  }

  // 获取订单详情
  const getOrderById = (orderId) => {
    return orders.value.find(order => order.id === orderId)
  }

  return {
    orders,
    userOrders,
    isCheckoutLoading,
    checkout,
    getOrderById
  }
})
