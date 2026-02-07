// frontend/src/stores/orders.js — 对接后端 /api/orders
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../api'
import { useAuthStore } from './auth'
import { useCartStore } from './cart'

function normalizeOrder(o) {
  if (!o) return null
  return {
    id: o.id,
    orderId: o.id,
    orderNumber: o.order_number ?? o.orderNumber,
    totalAmount: parseFloat(o.total_amount ?? o.totalAmount ?? 0),
    status: o.status,
    createdAt: o.purchase_date ?? o.createdAt,
    shippingAddress: o.shipping_address ?? o.shippingAddress,
    items: o.items || []
  }
}

export const useOrdersStore = defineStore('orders', () => {
  const orders = ref([])
  const isCheckoutLoading = ref(false)

  const userOrders = computed(() => {
    const authStore = useAuthStore()
    if (!authStore.user) return []
    return orders.value.filter(order => order.userId === authStore.user.id || true)
  })

  const fetchOrders = async (page = 1, limit = 10) => {
    try {
      const { data } = await api.get(`/orders?page=${page}&limit=${limit}`)
      if (data.success && data.data?.orders) {
        orders.value = data.data.orders.map(normalizeOrder)
        return { orders: orders.value, pagination: data.data.pagination }
      }
      orders.value = []
      return { orders: [], pagination: null }
    } catch (err) {
      console.error('Fetch orders error:', err)
      orders.value = []
      return { orders: [], pagination: null }
    }
  }

  const checkout = async (shippingAddress) => {
    const cartStore = useCartStore()
    const authStore = useAuthStore()
    if (!authStore.isLoggedIn) {
      return { success: false, message: 'Please login first' }
    }
    if (cartStore.isEmpty) {
      return { success: false, message: 'The cart is empty' }
    }

    isCheckoutLoading.value = true
    try {
      const { data } = await api.post('/orders', shippingAddress ? { shipping_address: shippingAddress } : {})
      if (!data.success) {
        return { success: false, message: data.error || 'Failed to create order' }
      }
      const orderData = data.data?.order
      const orderId = orderData?.id ?? orderData?.orderNumber
      const newOrder = normalizeOrder({
        id: orderData?.id,
        order_number: orderData?.orderNumber,
        total_amount: orderData?.totalAmount,
        status: orderData?.status ?? 'pending',
        purchase_date: orderData?.createdAt
      })
      if (newOrder) orders.value.unshift(newOrder)
      await cartStore.loadCart()
      return {
        success: true,
        message: data.message || 'Order created successfully!',
        orderId: orderId || newOrder?.orderNumber
      }
    } catch (err) {
      return { success: false, message: err.message || 'Failed to create order, please try again' }
    } finally {
      isCheckoutLoading.value = false
    }
  }

  const getOrderById = async (orderId) => {
    try {
      const { data } = await api.get(`/orders/${orderId}`)
      if (data.success && data.data?.order) {
        return normalizeOrder(data.data.order)
      }
      return null
    } catch (err) {
      console.error('Get order error:', err)
      return null
    }
  }

  return {
    orders,
    userOrders,
    isCheckoutLoading,
    fetchOrders,
    checkout,
    getOrderById
  }
})
