<template>
  <div class="status-stepper">
    <div
      v-for="(step, idx) in steps"
      :key="step.key"
      class="step"
      :class="[`step-${step.state}`, { 'step-cancelled': step.key === 'cancelled' }]"
    >
      <div class="node-wrap">
        <div class="node">
          <span v-if="step.state === 'done'">x</span>
          <span v-else-if="step.state === 'current'">&gt;</span>
          <span v-else>o</span>
        </div>
        <div v-if="idx < steps.length - 1" class="line" :class="{ active: isConnectorActive(idx) }"></div>
      </div>

      <div class="meta">
        <div class="label">{{ step.label }}</div>
        <div class="time">{{ step.time ? formatDate(step.time) : 'Pending' }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  order: {
    type: Object,
    required: true
  }
})

const FLOW = [
  { key: 'pending', label: 'Pending' },
  { key: 'hold', label: 'On Hold' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'cancelled', label: 'Cancelled' }
]

const timeByStatus = computed(() => {
  const map = new Map()
  const history = Array.isArray(props.order?.statusHistory) ? props.order.statusHistory : []
  for (const entry of history) {
    const key = String(entry?.status || '').toLowerCase()
    if (!key || map.has(key)) continue
    map.set(key, entry?.changedAt || null)
  }
  return map
})

const steps = computed(() => {
  const current = String(props.order?.status || '').toLowerCase()
  const cancelled = current === 'cancelled'
  const currentIndex = FLOW.findIndex(s => s.key === current)
  const pendingTime = props.order?.createdAt || timeByStatus.value.get('pending') || null

  return FLOW.map((base, idx) => {
    const t = base.key === 'pending' ? pendingTime : (timeByStatus.value.get(base.key) || null)
    let state = 'todo'

    if (base.key === current) {
      state = 'current'
    } else if (t) {
      state = 'done'
    } else if (!cancelled && currentIndex >= 0 && idx < currentIndex && base.key !== 'cancelled') {
      state = 'done'
    }

    return {
      ...base,
      time: t,
      state
    }
  })
})

const isConnectorActive = (idx) => {
  const left = steps.value[idx]
  const right = steps.value[idx + 1]
  if (!left || !right) return false
  const leftDone = left.state === 'done' || left.state === 'current'
  const rightReached = right.state === 'done' || right.state === 'current'
  return leftDone && rightReached
}

const formatDate = (d) => {
  try {
    return new Date(d).toLocaleString()
  } catch (e) {
    return String(d || '')
  }
}
</script>

<style scoped>
.status-stepper {
  margin: 0.8rem 0 1.2rem;
  padding: 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface-soft);
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.75rem;
}

.step {
  min-width: 0;
}

.node-wrap {
  display: flex;
  align-items: center;
}

.node {
  width: 24px;
  height: 24px;
  border-radius: var(--radius-pill);
  border: 1px solid var(--color-border);
  display: grid;
  place-items: center;
  font-size: 0.8rem;
  color: var(--color-text-muted);
  background: var(--color-surface);
  flex: 0 0 auto;
}

.line {
  height: 2px;
  flex: 1;
  margin: 0 0.35rem;
  background: var(--color-border);
}

.line.active {
  background: var(--color-primary);
}

.step-done .node {
  color: #fff;
  background: var(--color-primary);
  border-color: var(--color-primary);
}

.step-current .node {
  color: #fff;
  background: var(--color-primary-hover);
  border-color: var(--color-primary-hover);
}

.step-cancelled.step-current .node {
  background: var(--color-danger);
  border-color: var(--color-danger);
}

.meta {
  margin-top: 0.4rem;
}

.label {
  font-size: var(--text-sm);
  font-weight: 700;
  color: var(--color-text);
}

.time {
  margin-top: 0.1rem;
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (max-width: 768px) {
  .status-stepper {
    grid-template-columns: 1fr;
    gap: 0.55rem;
  }

  .line {
    display: none;
  }
}
</style>
