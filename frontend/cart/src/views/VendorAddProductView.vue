<template>
  <div class="products-page">
    <div class="container">
      <div class="form-card">
        <h1>Add New Product</h1>
        <p class="hint">This will create a product in backend database via vendor API.</p>

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
            Cover Image URL
            <input v-model="form.thumbnail_url" type="text" placeholder="https://..." />
          </label>

          <div class="full photo-manager">
            <label>Product Media (Images + Videos)</label>
            <div class="photo-input-row">
              <select v-model="newMediaType">
                <option value="image">Image</option>
                <option value="video">Video</option>
              </select>
              <input v-model="newMediaUrl" type="text" placeholder="Paste media URL and click Add" />
              <button type="button" class="btn-secondary" @click="addMedia">Add</button>
            </div>
            <div class="photo-input-row upload-row">
              <input type="file" @change="onFileSelected" accept="image/*,video/*" />
              <button type="button" class="btn-secondary" :disabled="!selectedFile || uploading" @click="uploadSelectedFile">
                {{ uploading ? 'Uploading...' : 'Upload File' }}
              </button>
            </div>
            <div v-if="form.media.length" class="photo-list">
              <div v-for="(item, idx) in form.media" :key="`${item.url}-${idx}`" class="photo-item">
                <img v-if="item.type === 'image'" :src="item.url" alt="product-media" />
                <video v-else :src="item.url" muted playsinline></video>
                <span class="photo-url">[{{ item.type }}] {{ item.url }}</span>
                <button type="button" class="btn-remove" @click="removeMedia(idx)">Remove</button>
              </div>
            </div>
          </div>

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
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useProductsStore } from '../stores/products'
import { useToast } from '../composables/useToast'
import { MESSAGES } from '../constants/messages'

const router = useRouter()
const productsStore = useProductsStore()
const toast = useToast()

const form = reactive({
  name: '',
  price: 0,
  category: '',
  stock: 99,
  thumbnail_url: '',
  media: [],
  description: ''
})
const newMediaUrl = ref('')
const newMediaType = ref('image')
const selectedFile = ref(null)
const uploading = ref(false)

const addMedia = () => {
  const url = String(newMediaUrl.value || '').trim()
  if (!url) return
  if (!form.media.find(x => x.url === url)) form.media.push({ type: newMediaType.value, url })
  if (!form.thumbnail_url && newMediaType.value === 'image') form.thumbnail_url = url
  newMediaUrl.value = ''
}

const removeMedia = (idx) => {
  const [removed] = form.media.splice(idx, 1)
  if (removed && form.thumbnail_url === removed.url) {
    const firstImage = form.media.find(x => x.type === 'image')
    form.thumbnail_url = firstImage?.url || ''
  }
}

const onFileSelected = (evt) => {
  const file = evt?.target?.files?.[0] || null
  selectedFile.value = file
}

const uploadSelectedFile = async () => {
  if (!selectedFile.value) return
  uploading.value = true
  const result = await productsStore.uploadVendorMedia(selectedFile.value)
  uploading.value = false
  if (!result?.success || !result?.media?.url) {
    toast.error(result?.message || MESSAGES.product.updateFailed)
    return
  }
  const media = {
    type: result.media.type === 'video' ? 'video' : 'image',
    url: result.media.url
  }
  if (!form.media.find(x => x.url === media.url)) form.media.push(media)
  if (!form.thumbnail_url && media.type === 'image') form.thumbnail_url = media.url
  selectedFile.value = null
  toast.success('File uploaded successfully.')
}

const handleSubmit = async () => {
  if (!form.name || form.price === null || form.price === undefined) {
    toast.warning(MESSAGES.product.namePriceRequired)
    return
  }

  const payload = {
    name: form.name,
    price: Number(form.price || 0),
    category: form.category,
    stock: Number(form.stock || 0),
    thumbnail_url: form.thumbnail_url,
    media: form.media.length ? form.media : (form.thumbnail_url ? [{ type: 'image', url: form.thumbnail_url }] : []),
    photos: form.media.filter(x => x.type === 'image').map(x => x.url),
    description: form.description,
    html_description: '',
    tags: [],
    attributes: {},
    specs: {}
  }
  const result = await productsStore.createVendorProduct(payload)
  if (!result?.success || !result?.product) {
    toast.error(result?.message || 'Failed to create product.')
    return
  }
  toast.success(`${MESSAGES.product.created} Product ID: ${result.product.id}`)
  router.push('/vendor/products')
}

const goBack = () => {
  router.push('/vendor/products')
}
</script>

<style scoped>
.products-page { min-height: calc(100vh - 80px); background: var(--color-bg); padding: 2rem 0; }
.container { max-width: 900px; margin: 0 auto; padding: 0 2rem; }
.form-card { background: #fff; padding: 2rem; border-radius: 8px; box-shadow: var(--shadow-sm); }
.hint { color: var(--color-text-muted); margin-bottom: 1.5rem; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.form-grid label { display: flex; flex-direction: column; gap: 0.5rem; font-weight: 600; color: var(--color-text); }
.form-grid input, .form-grid textarea { padding: 0.75rem 1rem; border: 1px solid var(--color-border); border-radius: 6px; font-size: 1rem; }
.photo-manager { border: 1px solid #e5e7eb; border-radius: 8px; padding: 0.75rem; }
.photo-input-row { display: flex; gap: 0.5rem; margin-top: 0.4rem; }
.photo-input-row input { flex: 1; }
.upload-row input[type="file"] { flex: 1; padding: 0.5rem; border: 1px dashed var(--color-border); border-radius: 6px; background: #fafafa; }
.photo-input-row select { padding: 0.75rem 0.6rem; border: 1px solid var(--color-border); border-radius: 6px; background: #fff; }
.photo-list { margin-top: 0.6rem; display: flex; flex-direction: column; gap: 0.45rem; }
.photo-item { display: grid; grid-template-columns: 48px 1fr auto; gap: 0.5rem; align-items: center; border: 1px solid #eee; border-radius: 6px; padding: 0.3rem 0.45rem; }
.photo-item img { width: 48px; height: 48px; object-fit: cover; border-radius: 4px; }
.photo-item video { width: 48px; height: 48px; object-fit: cover; border-radius: 4px; background: #111; }
.photo-url { color: #4b5563; font-size: 0.85rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.btn-remove { background: #ef4444; color: #fff; border: none; border-radius: 6px; padding: 0.35rem 0.65rem; cursor: pointer; }
.full { grid-column: 1 / -1; }
.actions { margin-top: 1.5rem; display: flex; gap: 0.75rem; }
.btn-primary { padding: 0.75rem 1.5rem; background: var(--color-primary); color: #fff; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; }
.btn-secondary { padding: 0.75rem 1.5rem; background: var(--color-bg); color: var(--color-text); border: none; border-radius: 6px; cursor: pointer; }
@media (max-width: 768px) { .form-grid { grid-template-columns: 1fr; } }
</style>

