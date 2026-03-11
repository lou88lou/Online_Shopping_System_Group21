import { defineStore } from 'pinia'
import { ref } from 'vue'

let seed = 0

export const useToastStore = defineStore('toast', () => {
  const items = ref([])

  const remove = (id) => {
    items.value = items.value.filter(x => x.id !== id)
  }

  const push = (message, type = 'info', duration = 2600) => {
    const id = `${Date.now()}_${seed++}`
    items.value.push({ id, message, type })
    if (duration > 0) {
      setTimeout(() => remove(id), duration)
    }
    return id
  }

  const success = (message, duration) => push(message, 'success', duration)
  const error = (message, duration) => push(message, 'error', duration)
  const warning = (message, duration) => push(message, 'warning', duration)
  const info = (message, duration) => push(message, 'info', duration)

  return {
    items,
    remove,
    push,
    success,
    error,
    warning,
    info
  }
})
