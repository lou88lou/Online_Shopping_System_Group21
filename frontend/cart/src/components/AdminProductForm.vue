<template>
  <div class="modal">
    <div class="panel">
      <h2>{{ product ? 'Edit Product' : 'Add Product' }}</h2>
      <div class="form">
        <label>Name</label>
        <input v-model="local.name" />
        <label>Price</label>
        <input type="number" v-model.number="local.price" />
        <label>Thumbnail URL</label>
        <input v-model="local.thumbnail_url" />
        <label>Description</label>
        <textarea v-model="local.description" rows="4"></textarea>
        <label>Stock</label>
        <input type="number" v-model.number="local.stock" />
      </div>
      <div class="buttons">
        <button @click="$emit('close')">Cancel</button>
        <button @click="save" class="primary">Save</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, toRefs } from 'vue'
const props = defineProps({ product: { type: Object, default: null } })
const emit = defineEmits(['close','save'])

const local = reactive({
  id: props.product?.id || null,
  name: props.product?.name || '',
  price: props.product?.price || 0,
  thumbnail_url: props.product?.thumbnail_url || props.product?.thumbnail || '',
  description: props.product?.description || '',
  stock: props.product?.stock ?? 0
})

const save = () => {
  emit('save', { ...local })
}
</script>

<style scoped>
.modal{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.4)}
.panel{background:#fff;padding:1rem;border-radius:8px;width:600px;max-width:95%}
.form{display:flex;flex-direction:column;gap:0.5rem}
.buttons{display:flex;justify-content:flex-end;gap:0.5rem;margin-top:0.5rem}
.primary{background:#667eea;color:#fff;padding:0.5rem 0.75rem;border-radius:6px}
input,textarea{padding:0.5rem;border:1px solid #ddd;border-radius:6px}
</style>
