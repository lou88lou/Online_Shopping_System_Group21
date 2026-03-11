import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUiStore = defineStore('ui', () => {
  const isCartDrawerOpen = ref(false)

  const openCartDrawer = () => {
    isCartDrawerOpen.value = true
  }

  const closeCartDrawer = () => {
    isCartDrawerOpen.value = false
  }

  const toggleCartDrawer = () => {
    isCartDrawerOpen.value = !isCartDrawerOpen.value
  }

  return {
    isCartDrawerOpen,
    openCartDrawer,
    closeCartDrawer,
    toggleCartDrawer
  }
})
