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
    customerName: o.customer_name ?? o.customerName ?? o.full_name ?? o.fullName,
    items: o.items || []
  }
}

function loadAllLocalOrders() {
  const all = []
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key || !key.startsWith('orders_')) continue
      const raw = localStorage.getItem(key)
      const list = raw ? JSON.parse(raw) : []
      if (Array.isArray(list)) all.push(...list)
    }
  } catch (e) {
    return []
  }
  return all
}

function deleteOrderFromAllLocal(orderId) {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key || !key.startsWith('orders_')) continue
      const raw = localStorage.getItem(key)
      const list = raw ? JSON.parse(raw) : []
      if (!Array.isArray(list)) continue
      const filtered = list.filter(o => String(o.id) !== String(orderId) && String(o.orderId) !== String(orderId))
      localStorage.setItem(key, JSON.stringify(filtered))
    }
    return true
  } catch (e) {
    return false
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
      // Try backend first
      const { data } = await api.get(`/orders?page=${page}&limit=${limit}`)
      if (data.success && data.data?.orders) {
        orders.value = data.data.orders.map(normalizeOrder)
        return { orders: orders.value, pagination: data.data.pagination }
      }
    } catch (err) {
      // ignore — fallback to localStorage
    }
    // Fallback: read orders from localStorage (per user)
    try {
      const authStore = useAuthStore()
      const userId = authStore.user?.id || 'local-user-1'
      const key = `orders_${userId}`
      const raw = localStorage.getItem(key)
      const list = raw ? JSON.parse(raw) : []
      orders.value = list.map(normalizeOrder)
      return { orders: orders.value, pagination: null }
    } catch (e) {
      orders.value = []
      return { orders: [], pagination: null }
    }
  }

  const fetchAllOrders = async () => {
    // For vendor/admin: load all local orders across users
    const list = loadAllLocalOrders()
    orders.value = list.map(normalizeOrder)
    return { orders: orders.value, pagination: null }
  }

  const checkout = async (shippingAddress, selectedItems = null) => {
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
      // Try backend create order
      try {
        const payload = shippingAddress ? { shipping_address: shippingAddress } : {}
        if (selectedItems) payload.items = selectedItems
        const { data } = await api.post('/orders', payload)
        if (data.success && data.data?.order) {
          const orderData = data.data.order
          const orderId = orderData?.id ?? orderData?.orderNumber
          const newOrder = normalizeOrder(orderData)
          if (newOrder) orders.value.unshift(newOrder)
          await cartStore.loadCart()
          return { success: true, message: data.message || 'Order created successfully!', orderId }
        }
      } catch (e) {
        // fallback to local order creation
      }

      // Local frontend-only order creation
      const auth = useAuthStore()
      const userId = auth.user?.id || 'local-user-1'
      const orderId = `local-order-${Date.now()}`
      const sourceItems = Array.isArray(selectedItems) && selectedItems.length ? selectedItems : cartStore.cartItems
      const items = sourceItems.map(i => ({ product_id: i.productId, product_name: i.name, quantity: i.quantity, unit_price: i.price, subtotal: i.price * i.quantity }))
      const total = cartStore.subtotal
      const newOrder = {
        id: orderId,
        orderId,
        orderNumber: orderId,
        total_amount: total,
        totalAmount: total,
        status: 'pending',
        purchase_date: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        shipping_address: shippingAddress || auth.user?.shippingAddress || '',
        customer_name: auth.user?.fullName || auth.user?.full_name || auth.user?.name || '',
        items
      }
      // persist (store raw newOrder then normalize into orders.value)
      const key = `orders_${userId}`
      const raw = localStorage.getItem(key)
      const list = raw ? JSON.parse(raw) : []
      list.unshift(newOrder)
      localStorage.setItem(key, JSON.stringify(list))
      orders.value = list.map(normalizeOrder)
      // clear local cart
      if (auth.user && auth.user.id) {
        localStorage.removeItem(`cart_${auth.user.id}`)
      }
      cartStore.cartItems = []
      return { success: true, message: 'Order created (demo)', orderId }
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
    } catch (err) {
      // fallback: search localStorage
      try {
        const auth = useAuthStore()
        const userId = auth.user?.id || 'local-user-1'
        const key = `orders_${userId}`
        const raw = localStorage.getItem(key)
        const list = raw ? JSON.parse(raw) : []
        const found = list.find(o => String(o.id) === String(orderId) || String(o.orderId) === String(orderId))
        return found ? normalizeOrder(found) : null
      } catch (e) {
        return null
      }
    }
    return null
  }

  const getOrderByIdAll = async (orderId) => {
    // Vendor/admin: search across all local orders
    try {
      const list = loadAllLocalOrders()
      const found = list.find(o => String(o.id) === String(orderId) || String(o.orderId) === String(orderId))
      return found ? normalizeOrder(found) : null
    } catch (e) {
      return null
    }
  }

  const deleteOrder = async (orderId) => {
    // Try backend delete first
    try {
      const { data } = await api.delete(`/orders/${orderId}`)
      if (data && data.success) {
        orders.value = orders.value.filter(o => String(o.id) !== String(orderId) && String(o.orderId) !== String(orderId))
        return { success: true }
      }
    } catch (err) {
      // ignore and fallback to localStorage
    }

    // Local fallback: remove from localStorage list
    try {
      const auth = useAuthStore()
      const userId = auth.user?.id || 'local-user-1'
      const key = `orders_${userId}`
      const raw = localStorage.getItem(key)
      const list = raw ? JSON.parse(raw) : []
      const filtered = list.filter(o => String(o.id) !== String(orderId) && String(o.orderId) !== String(orderId))
      localStorage.setItem(key, JSON.stringify(filtered))
      orders.value = filtered.map(normalizeOrder)
      return { success: true }
    } catch (e) {
      return { success: false, message: e?.message || 'Failed to delete order' }
    }
  }

  const deleteOrderAll = async (orderId) => {
    const ok = deleteOrderFromAllLocal(orderId)
    if (ok) {
      orders.value = orders.value.filter(o => String(o.id) !== String(orderId) && String(o.orderId) !== String(orderId))
      return { success: true }
    }
    return { success: false, message: 'Failed to delete order' }
  }

  return {
    orders,
    userOrders,
    isCheckoutLoading,
    fetchOrders,
    fetchAllOrders,
    checkout,
    getOrderById,
    getOrderByIdAll,
    deleteOrder,
    deleteOrderAll
  }
})
