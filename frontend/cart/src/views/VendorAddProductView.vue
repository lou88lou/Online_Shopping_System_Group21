<template>
  <div class="products-page">
    <div class="container">
      <div class="form-card">
        <h1>Add New Product</h1>
        <p class="hint">This will create a frontend-only product with an auto-generated ID.</p>

        <div class="form-grid">
          <label>
            Product Name
            <input v-model="form.name" type="text" placeholder="e.g. Organic Salad" />
          </label>

          <label>
            Price
            <input v-model.number="form.price" type="number" min="0" step="0.01" placeholder="0.00" />
          </label>

          <label>
            Category
            <input v-model="form.category" type="text" placeholder="e.g. Food" />
          </label>

          <label>
            Stock
            <input v-model.number="form.stock" type="number" min="0" step="1" placeholder="99" />
          </label>

          <label class="full">
            Image URL
            <input v-model="form.thumbnail_url" type="text" placeholder="https://..." />
          </label>

          <label class="full">
            Description
            <textarea v-model="form.description" rows="3" placeholder="Product description"></textarea>
          </label>
        </div>

        <div class="actions">
          <button class="btn-primary" @click="handleSubmit">Add Product</button>
          <button class="btn-secondary" @click="goBack">Cancel</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useProductsStore } from '../stores/products'

const router = useRouter()
const productsStore = useProductsStore()

const form = reactive({
  name: '',
  price: 0,
  category: '',
  stock: 99,
  thumbnail_url: '',
  description: ''
})

const handleSubmit = () => {
  if (!form.name || form.price === null || form.price === undefined) {
    alert('Please provide product name and price')
    return
  }

  const created = productsStore.addLocalProduct({
    name: form.name,
    price: Number(form.price || 0),
    category: form.category,
    stock: Number(form.stock || 0),
    thumbnail_url: form.thumbnail_url,
    description: form.description
  })

  alert(`Product created. ID: ${created.id}`)
  router.push('/vendor/products')
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
.btn-primary { padding: 0.75rem 1.5rem; background: #667eea; color: #fff; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; }
.btn-secondary { padding: 0.75rem 1.5rem; background: #f5f5f5; color: #333; border: none; border-radius: 6px; cursor: pointer; }
@media (max-width: 768px) { .form-grid { grid-template-columns: 1fr; } }
</style>
