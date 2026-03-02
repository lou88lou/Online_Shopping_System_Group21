<template>
  <div class="admin-products">
    <div class="container">
      <h1>Product Catalog (Admin)</h1>

      <div class="controls">
        <input v-model="q" type="text" placeholder="Search by name or ID" class="search"/>
        <button @click="onSearch" class="btn">Search</button>
        <button @click="openAdd" class="btn primary">Add New Product</button>
      </div>

      <div class="products-grid">
        <div v-for="p in filtered" :key="p.id" class="prod-card">
          <img :src="p.thumbnail || p.image" alt="p.name"/>
          <div class="info">
            <h3>{{ p.name }}</h3>
            <p>Price: ${{ p.price.toFixed(2) }}</p>
            <p>ID: {{ p.id }}</p>
            <p>Status: {{ p.is_active === false ? 'Disabled' : 'Active' }}</p>
            <div class="actions">
              <button @click="edit(p)">Edit</button>
              <button @click="toggle(p)">{{ p.is_active === false ? 'Enable' : 'Disable' }}</button>
            </div>
          </div>
        </div>
      </div>

      <AdminProductForm v-if="showForm" :product="editing" @close="closeForm" @save="onSave"/>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useProductsStore } from '../stores/products'
import AdminProductForm from '../components/AdminProductForm.vue'

const productsStore = useProductsStore()
const q = ref('')
const showForm = ref(false)
const editing = ref(null)

onMounted(async ()=>{
  await productsStore.fetchProducts()
})

const filtered = computed(()=>{
  if (!q.value) return productsStore.products
  const s = q.value.toLowerCase()
  return productsStore.products.filter(p => (p.name||'').toLowerCase().includes(s) || String(p.id).includes(s))
})

const onSearch = async () => {
  productsStore.searchProducts(q.value)
  productsStore.currentPage = 1
  await productsStore.fetchProducts()
}
const openAdd = ()=>{ editing.value = null; showForm.value = true }
const edit = (p)=>{ editing.value = { ...p }; showForm.value = true }
const closeForm = ()=>{ showForm.value = false; editing.value = null }
const onSave = (product) => {
  if (product.id && String(product.id).startsWith('local')) {
    productsStore.editLocalProduct(product.id, product)
  } else if (product.id && productsStore.products.find(x=>String(x.id)===String(product.id))) {
    productsStore.editLocalProduct(product.id, product)
  } else {
    productsStore.addLocalProduct(product)
  }
  closeForm()
}

const toggle = (p)=>{ productsStore.toggleProductActive(p.id) }

</script>

<style scoped>
.controls{display:flex;gap:0.5rem;align-items:center;margin-bottom:1rem}
.search{flex:1;padding:0.5rem}
.btn{padding:0.5rem 0.75rem}
.btn.primary{background:#667eea;color:#fff}
.products-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:1rem}
.prod-card{background:#fff;padding:0.75rem;border-radius:8px;display:flex;gap:0.5rem}
.prod-card img{width:80px;height:80px;object-fit:cover;border-radius:6px}
.info{flex:1}
.actions{display:flex;gap:0.5rem;margin-top:0.5rem}
</style>
