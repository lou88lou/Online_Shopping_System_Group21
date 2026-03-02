<template>
  <div class="order-detail-page">
    <div class="container">
      <h1>Order Detail</h1>
      <div v-if="order" class="order-detail">
        <p><strong>Order Number:</strong> {{ order.orderNumber }}</p>
        <p><strong>Purchase Date:</strong> {{ formatDate(order.createdAt) }}</p>
        <p><strong>Shipping Address:</strong> {{ order.shippingAddress || 'N/A' }}</p>
        <p><strong>Total Amount:</strong> ${{ (order.totalAmount || 0).toFixed(2) }}</p>
        <p><strong>Status:</strong> {{ order.status }}</p>

        <h3>Items</h3>
        <div v-if="order.items && order.items.length">
          <div v-for="(it, idx) in order.items" :key="it.product_id || idx" class="order-item">
            <div>{{ it.product_name || it.name || it.product_name }}</div>
            <div>{{ it.quantity }} × ${{ (it.unit_price || it.unitPrice || it.price || 0).toFixed(2) }}</div>
            <div>Subtotal: ${{ (it.subtotal || it.subTotal || (it.unit_price || it.price || 0) * it.quantity || 0).toFixed(2) }}</div>
          </div>
        </div>
      </div>
      <div v-else class="not-found">Order not found</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useOrdersStore } from '../stores/orders'

const route = useRoute()
const router = useRouter()
const ordersStore = useOrdersStore()
const order = ref(null)

onMounted(async () => {
  const id = route.params.id
  order.value = await ordersStore.getOrderById(id)
})

const formatDate = (d) => { try { return new Date(d).toLocaleString() } catch(e){ return d }}
</script>

<style scoped>
.order-detail { background:#fff; padding:1.5rem; border-radius:8px }
.order-item { display:flex; justify-content:space-between; padding:0.5rem 0; border-bottom:1px solid #eee }
.not-found { padding:2rem; background:#fff; border-radius:8px }
</style>
