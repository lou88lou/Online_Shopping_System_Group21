<template>
  <div class="order-detail-page">
    <div class="container">
      <h1>Order Detail</h1>
      <div v-if="order" class="order-detail">
        <p><strong>Customer Name:</strong> {{ order.customerName || 'N/A' }}</p>
        <p><strong>Order Number:</strong> {{ order.orderNumber }}</p>
        <p><strong>Purchase Date:</strong> {{ formatDate(order.createdAt) }}</p>
        <p><strong>Shipping Address:</strong> {{ order.shippingAddress || 'N/A' }}</p>
        <p><strong>Total Amount:</strong> ${{ (order.totalAmount || 0).toFixed(2) }}</p>
        <p><strong>Status:</strong> <StatusBadge :status="order.status" /></p>
        <h3>Status Timeline (B2/B4)</h3>
        <OrderStatusStepper :order="order" />

        <div class="status-actions">
          <button
            v-for="action in actions"
            :key="action.nextStatus"
            class="btn"
            @click="applyStatus(action.nextStatus)"
          >
            {{ action.label }}
          </button>
        </div>

        <h3>Status History</h3>
        <div v-if="order.statusHistory && order.statusHistory.length">
          <div v-for="(entry, idx) in order.statusHistory" :key="idx" class="timeline-item">
            <strong>{{ entry.status }}</strong>
            <span>{{ formatDate(entry.changedAt) }}</span>
            <span>by {{ entry.actor || 'system' }}</span>
          </div>
        </div>

        <h3>Items</h3>
        <div v-if="order.items && order.items.length">
          <div v-for="(it, idx) in order.items" :key="it.product_id || idx" class="order-item">
            <div>{{ it.product_name || it.name || it.productName || '' }}</div>
            <div>{{ it.quantity }} x ${{ (it.unit_price || it.unitPrice || it.price || 0).toFixed(2) }}</div>
            <div>Subtotal: ${{ (it.subtotal || it.subTotal || (it.unit_price || it.price || 0) * it.quantity || 0).toFixed(2) }}</div>
          </div>
        </div>
      </div>
      <div v-else class="not-found">Order not found</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useOrdersStore } from '../stores/orders'
import StatusBadge from '../components/StatusBadge.vue'
import OrderStatusStepper from '../components/OrderStatusStepper.vue'
import { useToast } from '../composables/useToast'
import { MESSAGES } from '../constants/messages'

const route = useRoute()
const ordersStore = useOrdersStore()
const toast = useToast()
const order = ref(null)

const loadOrder = async () => {
  const id = route.params.id
  order.value = await ordersStore.getVendorOrderById(id)
}

onMounted(loadOrder)

const actions = computed(() => {
  return ordersStore.getAllowedActions(order.value, 'vendor')
})

const applyStatus = async (nextStatus) => {
  const sure = confirm(`Change order status to "${nextStatus}"?`)
  if (!sure) return
  const res = await ordersStore.updateVendorOrderStatus(order.value.orderId || order.value.id, nextStatus)
  if (!res?.success) {
    toast.error(res?.message || MESSAGES.order.updateFailed)
    return
  }
  toast.success(MESSAGES.order.updated)
  await loadOrder()
}

const formatDate = (d) => {
  if (!d) return 'N/A'
  try { return new Date(d).toLocaleString() } catch (e) { return d }
}
</script>

<style scoped>
.order-detail { background: #fff; padding: 1.5rem; border-radius: 8px; }
.status-actions { margin: 0.6rem 0 1rem; display: flex; gap: 0.5rem; }
.btn { border: none; border-radius: 6px; padding: 0.45rem 0.8rem; cursor: pointer; color: #fff; background: #2563eb; }
.timeline-item { display: flex; gap: 0.7rem; color: #4b5563; padding: 0.3rem 0; }
.order-item { display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid #eee; }
.not-found { padding: 2rem; background: #fff; border-radius: 8px; }
</style>
