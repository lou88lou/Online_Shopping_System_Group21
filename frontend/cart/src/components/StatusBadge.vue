<template>
  <span class="badge" :class="statusClass">{{ label }}</span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  status: {
    type: String,
    default: ''
  }
})

const normalized = computed(() => String(props.status || '').toLowerCase())

const label = computed(() => {
  if (!normalized.value) return 'Unknown'
  return normalized.value.charAt(0).toUpperCase() + normalized.value.slice(1)
})

const statusClass = computed(() => {
  const v = normalized.value
  if (v === 'pending') return 'pending'
  if (v === 'hold') return 'hold'
  if (v === 'shipped') return 'shipped'
  if (v === 'cancelled') return 'cancelled'
  if (v === 'complete') return 'complete'
  if (v === 'ticket-issued') return 'issued'
  if (v === 'refunded') return 'refunded'
  return 'default'
})
</script>

<style scoped>
.badge { display: inline-flex; align-items: center; border-radius: 999px; padding: 0.14rem 0.58rem; font-size: 0.78rem; font-weight: 700; line-height: 1.35; }
.pending { background: #fef3c7; color: #92400e; }
.hold { background: #fee2e2; color: #991b1b; }
.shipped { background: #dbeafe; color: #1e3a8a; }
.cancelled { background: #f3f4f6; color: #374151; }
.complete { background: #dcfce7; color: #14532d; }
.issued { background: #e0e7ff; color: #3730a3; }
.refunded { background: #fce7f3; color: #9d174d; }
.default { background: #e5e7eb; color: #111827; }
</style>
