<template>
  <div class="orders-page">
    <div class="container">
      <h1>My Orders</h1>

      <div class="filters">
        <label for="status-filter">Filter by status (B3):</label>
        <select id="status-filter" v-model="statusFilter">
          <option value="">All</option>
          <option value="pending">Pending</option>
          <option value="hold">Hold</option>
          <option value="shipped">Shipped</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div v-if="filteredOrders.length === 0" class="no-orders">
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
            <div><strong>Status:</strong> <StatusBadge :status="order.status" /></div>
          </div>
          <div class="order-actions">
            <button
              v-for="action in getCustomerActions(order)"
              :key="action.nextStatus"
              class="btn btn-danger"
              @click.stop="applyStatus(order.orderId, action.nextStatus)"
            >
              {{ action.label }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useOrdersStore } from '../stores/orders'
import { useProductsStore } from '../stores/products'
import StatusBadge from '../components/StatusBadge.vue'
import { useToast } from '../composables/useToast'
import { MESSAGES } from '../constants/messages'

const router = useRouter()
const ordersStore = useOrdersStore()
const productsStore = useProductsStore()
const toast = useToast()
const statusFilter = ref('')

onMounted(async () => {
  await productsStore.fetchProducts()
  await ordersStore.fetchOrders()
})

const orders = computed(() => ordersStore.userOrders || [])
const filteredOrders = computed(() => {
  if (!statusFilter.value) return orders.value
  return orders.value.filter(o => String(o.status || '').toLowerCase() === statusFilter.value)
})

const sortedOrders = computed(() => {
  return (filteredOrders.value || []).slice().sort((a, b) => {
    try {
      return new Date(b.createdAt || b.purchase_date) - new Date(a.createdAt || a.purchase_date)
    } catch (e) {
      return 0
    }
  })
})

const getCustomerActions = (order) => {
  return ordersStore.getAllowedActions(order, 'customer')
}

const applyStatus = async (orderId, nextStatus) => {
  const sure = confirm(`Change order status to "${nextStatus}"?`)
  if (!sure) return
  const res = await ordersStore.updateOrderStatus(orderId, nextStatus, 'customer')
  if (!res?.success) {
    toast.error(res?.message || MESSAGES.order.updateFailed)
    return
  }
  toast.success(MESSAGES.order.updated)
  await ordersStore.fetchOrders()
}

const goDetail = (id) => {
  router.push(`/orders/${id}`)
}

const formatDate = (d) => {
  try { return new Date(d).toLocaleString() } catch (e) { return d }
}
</script>

<style scoped>
.orders-list { display: flex; flex-direction: column; gap: 1rem; }
.order-card { background: #fff; padding: 1rem; border-radius: 8px; cursor: pointer; }
.order-header { display: flex; justify-content: space-between; margin-bottom: 0.5rem; }
.order-body { display: flex; justify-content: space-between; }
.filters { display: flex; align-items: center; gap: 0.6rem; margin: 0.6rem 0 1rem; }
.filters select { padding: 0.45rem 0.6rem; border: 1px solid #d1d5db; border-radius: 6px; }
.no-orders { text-align: center; padding: 2rem; background: #fff; border-radius: 8px; }
.btn { display: inline-block; margin-top: 1rem; padding: 0.5rem 1rem; background: var(--color-primary); color: #fff; border-radius: 6px; border: none; cursor: pointer; }
.order-actions { margin-top: 0.5rem; display: flex; gap: 0.5rem; }
.btn-danger { background: #e53e3e; color: #fff; border: none; padding: 0.4rem 0.8rem; border-radius: 6px; }
</style>

