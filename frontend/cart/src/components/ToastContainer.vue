<template>
  <div class="toast-wrap">
    <transition-group name="toast">
      <div
        v-for="item in toastStore.items"
        :key="item.id"
        class="toast"
        :class="`toast-${item.type}`"
      >
        <span>{{ item.message }}</span>
        <button class="close" @click="toastStore.remove(item.id)">x</button>
      </div>
    </transition-group>
  </div>
</template>

<script setup>
import { useToastStore } from '../stores/toast'

const toastStore = useToastStore()
</script>

<style scoped>
.toast-wrap { position: fixed; right: 1rem; top: 1rem; z-index: 9999; display: flex; flex-direction: column; gap: 0.55rem; width: min(360px, 92vw); }
.toast { display: flex; justify-content: space-between; align-items: center; gap: 0.6rem; border-radius: 10px; padding: 0.75rem 0.85rem; color: #fff; box-shadow: 0 8px 24px rgba(0,0,0,0.18); font-size: 0.92rem; }
.toast-success { background: #16a34a; }
.toast-error { background: #dc2626; }
.toast-warning { background: #d97706; }
.toast-info { background: #2563eb; }
.close { background: transparent; color: inherit; border: none; cursor: pointer; font-weight: 700; }
.toast-enter-active, .toast-leave-active { transition: all 0.2s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(-8px); }
</style>
