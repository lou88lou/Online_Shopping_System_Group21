import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../api'
import { useAuthStore } from './auth'
import { useCartStore } from './cart'

const ORDER_STATUS = {
  PENDING: 'pending',
  HOLD: 'hold',
  SHIPPED: 'shipped',
  CANCELLED: 'cancelled'
}

const STATUS_TRANSITIONS = {
  [ORDER_STATUS.PENDING]: [ORDER_STATUS.HOLD, ORDER_STATUS.SHIPPED, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.HOLD]: [ORDER_STATUS.SHIPPED, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.SHIPPED]: [],
  [ORDER_STATUS.CANCELLED]: []
}

function normalizeStatusHistory(raw = [], fallbackStatus = ORDER_STATUS.PENDING, fallbackCreatedAt = null) {
  const list = Array.isArray(raw) ? raw : []
  const normalized = list
    .map(x => ({
      status: String(x?.status || '').toLowerCase(),
      changedAt: x?.changedAt || x?.changed_at || x?.date || null,
      actor: x?.actor || 'system',
      note: x?.note || ''
    }))
    .filter(x => x.status && x.changedAt)

  if (normalized.length > 0) return normalized
  return [{
    status: fallbackStatus,
    changedAt: fallbackCreatedAt || new Date().toISOString(),
    actor: 'system',
    note: 'Order created'
  }]
}

function extractDateByStatus(history, status) {
  const hit = history.find(x => x.status === status)
  return hit?.changedAt || null
}

function normalizeOrder(o) {
  if (!o) return null
  const status = String(o.status || ORDER_STATUS.PENDING).toLowerCase()
  const createdAt = o.purchase_date ?? o.createdAt ?? new Date().toISOString()
  const statusHistory = normalizeStatusHistory(o.status_history ?? o.statusHistory, status, createdAt)
  return {
    id: o.id,
    orderId: o.id ?? o.orderId,
    orderNumber: o.order_number ?? o.orderNumber ?? o.id,
    totalAmount: parseFloat(o.total_amount ?? o.totalAmount ?? 0),
    status,
    createdAt,
    shippingAddress: o.shipping_address ?? o.shippingAddress,
    customerName: o.customer_name ?? o.customerName ?? o.full_name ?? o.fullName,
    items: o.items || [],
    statusHistory,
    holdAt: o.hold_date ?? o.holdAt ?? extractDateByStatus(statusHistory, ORDER_STATUS.HOLD),
    shippedAt: o.shipment_date ?? o.shippedAt ?? extractDateByStatus(statusHistory, ORDER_STATUS.SHIPPED),
    cancelledAt: o.cancel_date ?? o.cancelledAt ?? extractDateByStatus(statusHistory, ORDER_STATUS.CANCELLED)
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
      if (Array.isArray(list)) {
        for (const item of list) {
          all.push(item)
        }
      }
    }
  } catch (e) {
    return []
  }
  return all
}

function mutateOrderInAllLocal(orderId, updater) {
  let updatedOrder = null
  let changed = false

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key || !key.startsWith('orders_')) continue

      const raw = localStorage.getItem(key)
      const list = raw ? JSON.parse(raw) : []
      if (!Array.isArray(list)) continue

      let touched = false
      const nextList = list.map(order => {
        const matched = String(order?.id) === String(orderId) || String(order?.orderId) === String(orderId)
        if (!matched) return order
        touched = true
        changed = true
        const nextOrder = updater(order)
        updatedOrder = nextOrder
        return nextOrder
      })

      if (touched) {
        localStorage.setItem(key, JSON.stringify(nextList))
      }
    }
  } catch (e) {
    return { success: false, message: 'Failed to update local order' }
  }

  if (!changed) {
    return { success: false, message: 'Order not found' }
  }
  return { success: true, order: updatedOrder }
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

function canTransition(fromStatus, toStatus) {
  const allowed = STATUS_TRANSITIONS[String(fromStatus || '').toLowerCase()] || []
  return allowed.includes(String(toStatus || '').toLowerCase())
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
    } catch (err) {
      // fallback to local
    }

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
    const list = loadAllLocalOrders()
    orders.value = list.map(normalizeOrder)
    return { orders: orders.value, pagination: null }
  }

  const fetchVendorOrders = async (page = 1, limit = 10, status = '') => {
    try {
      const query = new URLSearchParams()
      query.set('page', String(page))
      query.set('limit', String(limit))
      if (status) query.set('status', String(status).toLowerCase())

      const { data } = await api.get(`/vendor/orders?${query.toString()}`)
      if (data?.success && data?.data?.orders) {
        orders.value = data.data.orders.map(normalizeOrder)
        return { success: true, orders: orders.value, pagination: data.data.pagination || null }
      }
      return { success: false, message: data?.error || 'Failed to load vendor orders' }
    } catch (err) {
      await fetchAllOrders()
      return { success: true, orders: orders.value, pagination: null, fallback: true }
    }
  }

  const getVendorOrderById = async (orderId) => {
    try {
      const { data } = await api.get(`/vendor/orders/${orderId}`)
      if (data?.success && data?.data?.order) return normalizeOrder(data.data.order)
      return null
    } catch (err) {
      return getOrderByIdAll(orderId)
    }
  }

  const updateVendorOrderStatus = async (orderId, nextStatus, note = '') => {
    try {
      const { data } = await api.patch(`/vendor/orders/${orderId}/status`, {
        status: nextStatus,
        note
      })
      if (data?.success && data?.data?.order) {
        const updated = normalizeOrder(data.data.order)
        const idx = orders.value.findIndex(o => String(o.id) === String(orderId) || String(o.orderId) === String(orderId))
        if (idx !== -1) orders.value[idx] = updated
        return { success: true, order: updated, message: data.message || 'Order updated' }
      }
      return { success: false, message: data?.error || 'Failed to update order status' }
    } catch (err) {
      return updateOrderStatus(orderId, nextStatus, 'vendor', note)
    }
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

      const auth = useAuthStore()
      const userId = auth.user?.id || 'local-user-1'
      const orderId = `local-order-${Date.now()}`
      const sourceItems = Array.isArray(selectedItems) && selectedItems.length ? selectedItems : cartStore.cartItems
      const items = sourceItems.map(i => ({
        product_id: i.productId,
        product_name: i.name,
        quantity: i.quantity,
        unit_price: i.price,
        subtotal: i.price * i.quantity
      }))
      const total = cartStore.subtotal
      const createdAt = new Date().toISOString()
      const newOrder = {
        id: orderId,
        orderId,
        order_number: orderId,
        total_amount: total,
        status: ORDER_STATUS.PENDING,
        purchase_date: createdAt,
        shipping_address: shippingAddress || auth.user?.shippingAddress || '',
        customer_name: auth.user?.fullName || auth.user?.full_name || auth.user?.name || '',
        items,
        status_history: [{
          status: ORDER_STATUS.PENDING,
          changedAt: createdAt,
          actor: 'customer',
          note: 'Order placed'
        }]
      }

      const key = `orders_${userId}`
      const raw = localStorage.getItem(key)
      const list = raw ? JSON.parse(raw) : []
      list.unshift(newOrder)
      localStorage.setItem(key, JSON.stringify(list))
      orders.value = list.map(normalizeOrder)

      if (auth.user && auth.user.id) {
        localStorage.removeItem(`cart_${auth.user.id}`)
      }
      cartStore.cartItems = []
      return { success: true, message: 'Order placed successfully.', orderId }
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
    try {
      const list = loadAllLocalOrders()
      const found = list.find(o => String(o.id) === String(orderId) || String(o.orderId) === String(orderId))
      return found ? normalizeOrder(found) : null
    } catch (e) {
      return null
    }
  }

  const updateOrderStatus = async (orderId, nextStatus, actor = 'system', note = '') => {
    const targetStatus = String(nextStatus || '').toLowerCase()
    if (!Object.values(ORDER_STATUS).includes(targetStatus)) {
      return { success: false, message: 'Invalid status' }
    }

    let transitionApplied = false
    const localResult = mutateOrderInAllLocal(orderId, (rawOrder) => {
      const current = normalizeOrder(rawOrder)
      const currentStatus = current?.status || ORDER_STATUS.PENDING
      if (!canTransition(currentStatus, targetStatus)) {
        return rawOrder
      }
      transitionApplied = true

      const changedAt = new Date().toISOString()
      const statusHistory = [...(rawOrder.status_history || []), {
        status: targetStatus,
        changedAt,
        actor,
        note: note || `${actor} changed status to ${targetStatus}`
      }]

      const nextRaw = {
        ...rawOrder,
        status: targetStatus,
        status_history: statusHistory
      }

      if (targetStatus === ORDER_STATUS.HOLD) nextRaw.hold_date = changedAt
      if (targetStatus === ORDER_STATUS.SHIPPED) nextRaw.shipment_date = changedAt
      if (targetStatus === ORDER_STATUS.CANCELLED) nextRaw.cancel_date = changedAt
      return nextRaw
    })

    if (!localResult.success) return localResult
    if (!transitionApplied) return { success: false, message: 'Status transition not allowed' }

    const normalized = normalizeOrder(localResult.order)
    await fetchAllOrders()
    return { success: true, order: normalized }
  }

  const getAllowedActions = (order, actor = 'customer') => {
    const status = String(order?.status || '').toLowerCase()
    if (actor === 'customer') {
      if (status === ORDER_STATUS.PENDING || status === ORDER_STATUS.HOLD) {
        return [{ label: 'Cancel Order', nextStatus: ORDER_STATUS.CANCELLED }]
      }
      return []
    }
    if (actor === 'vendor' || actor === 'admin') {
      if (status === ORDER_STATUS.PENDING) {
        return [
          { label: 'Put On Hold', nextStatus: ORDER_STATUS.HOLD },
          { label: 'Mark As Shipped', nextStatus: ORDER_STATUS.SHIPPED }
        ]
      }
      if (status === ORDER_STATUS.HOLD) {
        return [
          { label: 'Mark As Shipped', nextStatus: ORDER_STATUS.SHIPPED }
        ]
      }
      return []
    }
    return []
  }

  const deleteOrder = async (orderId) => {
    try {
      const { data } = await api.delete(`/orders/${orderId}`)
      if (data && data.success) {
        orders.value = orders.value.filter(o => String(o.id) !== String(orderId) && String(o.orderId) !== String(orderId))
        return { success: true }
      }
    } catch (err) {
      // fallback to local
    }

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
    ORDER_STATUS,
    fetchOrders,
    fetchAllOrders,
    fetchVendorOrders,
    checkout,
    getOrderById,
    getOrderByIdAll,
    getVendorOrderById,
    getAllowedActions,
    updateOrderStatus,
    updateVendorOrderStatus,
    deleteOrder,
    deleteOrderAll
  }
})
