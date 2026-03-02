<template>
  <div class="products-page">
    <div class="container">
      <div v-if="product" class="form-card">
        <h1>Edit Product</h1>
        <p class="hint">Product ID: {{ product.id }}</p>

        <div class="form-grid">
          <label>
            Product Name
            <input v-model="form.name" type="text" />
          </label>

          <label>
            Price
            <input v-model.number="form.price" type="number" min="0" step="0.01" />
          </label>

          <label>
            Category
            <input v-model="form.category" type="text" />
          </label>

          <label>
            Stock
            <input v-model.number="form.stock" type="number" min="0" step="1" />
          </label>

          <label class="full">
            Image URL
            <input v-model="form.thumbnail" type="text" />
          </label>

          <label class="full">
            Description
            <textarea v-model="form.description" rows="3"></textarea>
          </label>
        </div>

        <div class="status-row">
          <span>Status: {{ product.is_active === false ? 'Disabled' : 'Active' }}</span>
          <button class="btn-secondary" @click="toggleActive">{{ product.is_active === false ? 'Enable' : 'Disable' }}</button>
        </div>

        <div class="actions">
          <button class="btn-primary" @click="handleSave">Save Changes</button>
          <button class="btn-secondary" @click="goBack">Back</button>
        </div>
      </div>

      <div v-else class="not-found">
        <p>Product not found</p>
        <button class="btn-secondary" @click="goBack">Back</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProductsStore } from '../stores/products'

const route = useRoute()
const router = useRouter()
const productsStore = useProductsStore()

const product = ref(null)
const form = reactive({
  name: '',
  price: 0,
  category: '',
  stock: 0,
  thumbnail: '',
  description: ''
})

onMounted(async () => {
  const id = route.params.id
  let found = await productsStore.getProductById(id)
  if (!found) {
    await productsStore.fetchProducts()
    found = productsStore.products.find(p => String(p.id) === String(id)) || null
  }
  product.value = found
  if (found) {
    form.name = found.name || ''
    form.price = Number(found.price || 0)
    form.category = found.category || ''
    form.stock = Number(found.stock || 0)
    form.thumbnail = found.thumbnail || found.image || ''
    form.description = found.description || ''
  }
})

const handleSave = () => {
  if (!product.value) return
  if (!form.name) {
    alert('Please enter product name')
    return
  }
  const updated = productsStore.editLocalProduct(product.value.id, {
    name: form.name,
    price: Number(form.price || 0),
    category: form.category,
    stock: Number(form.stock || 0),
    thumbnail: form.thumbnail,
    image: form.thumbnail,
    description: form.description
  })
  if (updated) {
    alert('Product updated')
    router.push('/vendor/products')
  } else {
    alert('Failed to update product')
  }
}

const toggleActive = () => {
  if (!product.value) return
  const updated = productsStore.toggleProductActive(product.value.id)
  if (updated) {
    product.value = { ...updated }
  }
}

const goBack = () => {
  router.push('/vendor/products')
}
</script>

<style scoped>
.products-page { min-height: calc(100vh - 80px); background: #f5f5f5; padding: 2rem 0; }
.container { max-width: 900px; margin: 0 auto; padding: 0 2rem; }
.form-card { background: #fff; padding: 2rem; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
.hint { color: #666; margin-bottom: 1.5rem; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.form-grid label { display: flex; flex-direction: column; gap: 0.5rem; font-weight: 600; color: #333; }
.form-grid input, .form-grid textarea { padding: 0.75rem 1rem; border: 1px solid #ddd; border-radius: 6px; font-size: 1rem; }
.full { grid-column: 1 / -1; }
.actions { margin-top: 1.5rem; display: flex; gap: 0.75rem; }
.status-row { margin-top: 0.5rem; display: flex; align-items: center; gap: 0.75rem; color: #555; }
.btn-primary { padding: 0.75rem 1.5rem; background: #667eea; color: #fff; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; }
.btn-secondary { padding: 0.75rem 1.5rem; background: #f5f5f5; color: #333; border: none; border-radius: 6px; cursor: pointer; }
.not-found { text-align: center; padding: 4rem 2rem; background: #fff; border-radius: 8px; }
@media (max-width: 768px) { .form-grid { grid-template-columns: 1fr; } }
</style>
