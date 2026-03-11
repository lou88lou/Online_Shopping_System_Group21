<!-- frontend/src/components/Pagination.vue -->
<template>
  <div class="pagination" v-if="totalPages > 1">
    <button 
      @click="$emit('page-change', currentPage - 1)"
      :disabled="currentPage === 1"
      class="page-btn"
    >
      &larr; Previous
    </button>

    <div class="page-numbers">
      <button
        v-for="page in displayPages"
        :key="page"
        @click="$emit('page-change', page)"
        :class="['page-number', { active: page === currentPage }]"
      >
        {{ page }}
      </button>
    </div>

    <button 
      @click="$emit('page-change', currentPage + 1)"
      :disabled="currentPage === totalPages"
      class="page-btn"
    >
      Next &rarr;
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  currentPage: {
    type: Number,
    required: true
  },
  totalPages: {
    type: Number,
    required: true
  }
})

defineEmits(['page-change'])

const displayPages = computed(() => {
  const pages = []
  const start = Math.max(1, props.currentPage - 2)
  const end = Math.min(props.totalPages, props.currentPage + 2)
  
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  
  return pages
})
</script>

<style scoped>
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  margin: 2rem 0;
}

.page-btn {
  padding: 0.5rem 1rem;
  background: white;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s;
}

.page-btn:hover:not(:disabled) {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-numbers {
  display: flex;
  gap: 0.25rem;
}

.page-number {
  padding: 0.5rem 0.75rem;
  background: white;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.page-number:hover {
  background: var(--color-bg);
}

.page-number.active {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
  font-weight: bold;
}
</style>

