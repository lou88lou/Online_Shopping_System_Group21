<template>
  <div class="orders-page">
    <div class="container">
      <h1>Order List (Admin)</h1>
      <div v-if="orders.length === 0" class="no-orders">
        <p>No orders found.</p>
      </div>

      <div v-else class="orders-list">
        <div v-for="order in sortedOrders" :key="order.orderId" class="order-card" @click="goDetail(order.orderId)">
          <div class="order-header">
            <div><strong>Order:</strong> {{ order.orderNumber }}</div>
            <div><strong>Date:</strong> {{ formatDate(order.createdAt) }}</div>
          </div>
          <div class="order-body">
            <div><strong>Customer:</strong> {{ order.customerName || 'N/A' }}</div>
            <div><strong>Total:</strong> ${{ (order.totalAmount || 0).toFixed(2) }}</div>
            <div><strong>Status:</strong> <StatusBadge :status="order.status" /></div>
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
import StatusBadge from '../components/StatusBadge.vue'
import { useToast } from '../composables/useToast'
import { MESSAGES } from '../constants/messages'

const router = useRouter()
const ordersStore = useOrdersStore()
const toast = useToast()

onMounted(async () => {
  await ordersStore.fetchAllOrders()
})

const orders = computed(() => ordersStore.orders || [])

const sortedOrders = computed(() => {
  return (orders.value || []).slice().sort((a, b) => {
    try {
      return new Date(b.createdAt || b.purchase_date) - new Date(a.createdAt || a.purchase_date)
    } catch (e) {
      return 0
    }
  })
})

const goDetail = (id) => {
  router.push(`/admin/orders/${id}`)
}

const handleDelete = async (id) => {
  if (!confirm('Are you sure you want to delete this order? This action cannot be undone.')) return
  const res = await ordersStore.deleteOrderAll(id)
  if (res?.success) {
    toast.success(MESSAGES.order.deleted)
    await ordersStore.fetchAllOrders()
    return
  }
  toast.error(res?.message || MESSAGES.order.deleteFailed)
}

const formatDate = (d) => {
  try {
    return new Date(d).toLocaleString()
  } catch (e) {
    return d
  }
}
</script>

<style scoped>
.orders-list { display: flex; flex-direction: column; gap: 1rem; }
.order-card { background: #fff; padding: 1rem; border-radius: 8px; cursor: pointer; }
.order-header { display: flex; justify-content: space-between; margin-bottom: 0.5rem; }
.order-body { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0.5rem; }
.no-orders { text-align: center; padding: 2rem; background: #fff; border-radius: 8px; }
.btn { display: inline-block; margin-top: 1rem; padding: 0.5rem 1rem; background: var(--color-primary); color: #fff; border-radius: 6px; }
.order-actions { margin-top: 0.5rem; display: flex; gap: 0.5rem; }
.btn-danger { background: #e53e3e; color: #fff; border: none; padding: 0.4rem 0.8rem; border-radius: 6px; }
</style>

