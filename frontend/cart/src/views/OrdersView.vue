<template>
  <div class="orders-page">
    <div class="container">
      <h1>My Orders</h1>
      <div v-if="orders.length === 0" class="no-orders">
        <p>No orders found.</p>
        <router-link to="/products" class="btn">Go Shopping</router-link>
      </div>

      <div v-else class="orders-list">
        <div v-for="order in sortedOrders" :key="order.orderId" class="order-card" @click="goDetail(order.orderId)">
          <div class="order-header">
            <div><strong>Order:</strong> {{ order.orderNumber }}</div>
            <div><strong>Date:</strong> {{ formatDate(order.createdAt) }}</div>
          </div>
          <div class="order-body">
            <div><strong>Total:</strong> ${{ (order.totalAmount || 0).toFixed(2) }}</div>
            <div><strong>Status:</strong> {{ order.status }}</div>
          </div>
          <div class="order-actions">
            <button class="btn btn-danger" @click.stop="handleDelete(order.orderId)">Delete</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useOrdersStore } from '../stores/orders'
import { useAuthStore } from '../stores/auth'
import { useProductsStore } from '../stores/products'

const router = useRouter()
const ordersStore = useOrdersStore()
const productsStore = useProductsStore()

onMounted(async () => {
  await productsStore.fetchProducts()
  await ordersStore.fetchOrders()
})

const orders = computed(() => ordersStore.userOrders || [])

// show newest orders first
const sortedOrders = computed(() => {
  return (orders.value || []).slice().sort((a, b) => {
    try { return new Date(b.createdAt || b.purchase_date) - new Date(a.createdAt || a.purchase_date) } catch (e) { return 0 }
  })
})

const goDetail = (id) => {
  router.push(`/orders/${id}`)
}

const handleDelete = async (id) => {
  if (!confirm('Are you sure you want to delete this order? This action cannot be undone.')) return
  try {
    if (ordersStore && typeof ordersStore.deleteOrder === 'function') {
      const res = await ordersStore.deleteOrder(id)
      if (res && res.success) {
        await ordersStore.fetchOrders()
        return
      }
      alert(res?.message || '删除订单失败')
      return
    }

    // Fallback when deleteOrder is not available (runtime/bundle mismatch)
    const auth = useAuthStore()
    const userId = auth.user?.id || 'local-user-1'
    const key = `orders_${userId}`
    const raw = localStorage.getItem(key)
    const list = raw ? JSON.parse(raw) : []
    const filtered = list.filter(o => String(o.id) !== String(id) && String(o.orderId) !== String(id))
    localStorage.setItem(key, JSON.stringify(filtered))
    // refresh in-memory store if possible
    if (ordersStore && typeof ordersStore.fetchOrders === 'function') {
      await ordersStore.fetchOrders()
    }
  } catch (e) {
    console.error('删除订单失败', e)
    alert('删除订单失败')
  }
}

const formatDate = (d) => {
  try { return new Date(d).toLocaleString() } catch(e) { return d }
}
</script>

<style scoped>
.orders-list { display: flex; flex-direction: column; gap: 1rem; }
.order-card { background: #fff; padding: 1rem; border-radius: 8px; cursor: pointer; }
.order-header { display:flex; justify-content:space-between; margin-bottom:0.5rem }
.order-body { display:flex; justify-content:space-between }
.no-orders { text-align:center; padding:2rem; background:#fff; border-radius:8px }
.btn { display:inline-block; margin-top:1rem; padding:0.5rem 1rem; background:#667eea;color:#fff;border-radius:6px }
.order-actions { margin-top:0.5rem; display:flex; gap:0.5rem }
.btn-danger { background:#e53e3e; color:#fff; border:none; padding:0.4rem 0.8rem; border-radius:6px }
</style>
