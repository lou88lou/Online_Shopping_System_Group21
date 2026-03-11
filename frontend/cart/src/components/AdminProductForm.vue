<template>
  <div class="modal">
    <div class="panel">
      <h2>{{ product ? 'Edit Product' : 'Add Product' }}</h2>
      <div class="form">
        <label>Name</label>
        <input v-model="local.name" />

        <label>Category</label>
        <input v-model="local.category" placeholder="e.g. Laptops" />

        <label>Price</label>
        <input type="number" v-model.number="local.price" />

        <label>Stock</label>
        <input type="number" v-model.number="local.stock" />

        <label>Thumbnail URL</label>
        <input v-model="local.thumbnail_url" />

        <label>Media (Images + Videos)</label>
        <div class="photo-row">
          <select v-model="newMediaType">
            <option value="image">Image</option>
            <option value="video">Video</option>
          </select>
          <input v-model="newMediaUrl" placeholder="Add media URL" />
          <button type="button" @click="addMedia">Add</button>
        </div>
        <div v-if="local.media.length" class="photo-list">
          <div v-for="(item, idx) in local.media" :key="`${item.url}-${idx}`" class="photo-item">
            <img v-if="item.type === 'image'" :src="item.url" alt="photo" />
            <video v-else :src="item.url" muted playsinline></video>
            <span>[{{ item.type }}] {{ item.url }}</span>
            <button type="button" @click="removeMedia(idx)">Remove</button>
          </div>
        </div>

        <label>Short Description</label>
        <textarea v-model="local.description" rows="3"></textarea>

        <label>HTML Detail (C1)</label>
        <div class="rte">
          <div class="rte-toolbar">
            <button type="button" @click="insertParagraph">Paragraph</button>
            <button type="button" @click="insertList">List</button>
            <button type="button" @click="wrapSelection('strong')">Bold</button>
            <button type="button" @click="wrapSelection('em')">Italic</button>
            <button type="button" @click="insertHeading">Heading</button>
          </div>
          <textarea
            ref="htmlTextareaRef"
            v-model="local.htmlDescription"
            rows="7"
            placeholder="<p>...</p><ul><li>...</li></ul>"
          ></textarea>
          <div class="rte-preview">
            <p class="preview-title">Preview</p>
            <div class="preview-body" v-html="safeHtmlPreview"></div>
          </div>
        </div>

        <label>Tags (C3, separate by space/comma)</label>
        <input v-model="tagText" placeholder="#gaming #laptop" />

        <div class="grid2">
          <div>
            <label>Brand</label>
            <input v-model="local.attributes.brand" />
          </div>
          <div>
            <label>Model</label>
            <input v-model="local.attributes.model" />
          </div>
          <div>
            <label>Material</label>
            <input v-model="local.attributes.material" />
          </div>
          <div>
            <label>Warranty</label>
            <input v-model="local.attributes.warranty" />
          </div>
        </div>

        <div class="grid2">
          <div>
            <label>Spec 1 Key</label>
            <input v-model="specKey1" placeholder="cpu / screen / weight" />
          </div>
          <div>
            <label>Spec 1 Value</label>
            <input v-model="specValue1" />
          </div>
          <div>
            <label>Spec 2 Key</label>
            <input v-model="specKey2" />
          </div>
          <div>
            <label>Spec 2 Value</label>
            <input v-model="specValue2" />
          </div>
          <div>
            <label>Spec 3 Key</label>
            <input v-model="specKey3" />
          </div>
          <div>
            <label>Spec 3 Value</label>
            <input v-model="specValue3" />
          </div>
        </div>
      </div>

      <div class="buttons">
        <button @click="$emit('close')">Cancel</button>
        <button @click="save" class="primary">Save</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { sanitizeProductHtml } from '../utils/sanitizeHtml'

const props = defineProps({ product: { type: Object, default: null } })
const emit = defineEmits(['close', 'save'])

const local = reactive({
  id: props.product?.id || null,
  name: props.product?.name || '',
  category: props.product?.category || '',
  price: props.product?.price || 0,
  stock: props.product?.stock ?? 0,
  thumbnail_url: props.product?.thumbnail_url || props.product?.thumbnail || '',
  media: Array.isArray(props.product?.media)
    ? [...props.product.media]
    : (Array.isArray(props.product?.photos)
        ? props.product.photos.map(url => ({ type: 'image', url }))
        : [props.product?.thumbnail || props.product?.image || ''].filter(Boolean).map(url => ({ type: 'image', url }))),
  description: props.product?.description || '',
  htmlDescription: props.product?.htmlDescription || '',
  attributes: {
    brand: props.product?.attributes?.brand || '',
    model: props.product?.attributes?.model || '',
    material: props.product?.attributes?.material || '',
    warranty: props.product?.attributes?.warranty || ''
  }
})

const newMediaUrl = ref('')
const newMediaType = ref('image')
const tagText = ref(Array.isArray(props.product?.tags) ? props.product.tags.map(t => `#${t}`).join(' ') : '')
const htmlTextareaRef = ref(null)
const safeHtmlPreview = computed(() => sanitizeProductHtml(local.htmlDescription))

const specEntries = Object.entries(props.product?.specs || {})
const specKey1 = ref(specEntries[0]?.[0] || '')
const specValue1 = ref(specEntries[0]?.[1] || '')
const specKey2 = ref(specEntries[1]?.[0] || '')
const specValue2 = ref(specEntries[1]?.[1] || '')
const specKey3 = ref(specEntries[2]?.[0] || '')
const specValue3 = ref(specEntries[2]?.[1] || '')

const parseTags = (raw) => {
  return [...new Set(String(raw || '')
    .split(/[,\s]+/)
    .map(x => x.trim().replace(/^#/, '').toLowerCase())
    .filter(Boolean))]
}

const addMedia = () => {
  const url = String(newMediaUrl.value || '').trim()
  if (!url) return
  if (!local.media.find(x => x.url === url)) local.media.push({ type: newMediaType.value, url })
  if (!local.thumbnail_url && newMediaType.value === 'image') local.thumbnail_url = url
  newMediaUrl.value = ''
}

const removeMedia = (idx) => {
  const [removed] = local.media.splice(idx, 1)
  if (removed && local.thumbnail_url === removed.url) {
    const firstImage = local.media.find(x => x.type === 'image')
    local.thumbnail_url = firstImage?.url || ''
  }
}

const insertAtCursor = (snippet, fallback = '') => {
  const el = htmlTextareaRef.value
  if (!el) {
    local.htmlDescription += snippet
    return
  }
  const start = el.selectionStart ?? 0
  const end = el.selectionEnd ?? 0
  const src = local.htmlDescription || ''
  const selected = src.slice(start, end) || fallback
  const value = snippet.replace('__TEXT__', selected)
  local.htmlDescription = `${src.slice(0, start)}${value}${src.slice(end)}`
}

const wrapSelection = (tag) => {
  insertAtCursor(`<${tag}>__TEXT__</${tag}>`, 'text')
}

const insertParagraph = () => {
  insertAtCursor('<p>__TEXT__</p>', 'New paragraph')
}

const insertList = () => {
  const snippet = '<ul><li>Point 1</li><li>Point 2</li></ul>'
  const el = htmlTextareaRef.value
  if (!el) {
    local.htmlDescription += snippet
    return
  }
  const start = el.selectionStart ?? 0
  const src = local.htmlDescription || ''
  local.htmlDescription = `${src.slice(0, start)}${snippet}${src.slice(start)}`
}

const insertHeading = () => {
  insertAtCursor('<h3>__TEXT__</h3>', 'Section Title')
}

const save = () => {
  const specs = {}
  if (specKey1.value && specValue1.value) specs[specKey1.value] = specValue1.value
  if (specKey2.value && specValue2.value) specs[specKey2.value] = specValue2.value
  if (specKey3.value && specValue3.value) specs[specKey3.value] = specValue3.value

  emit('save', {
    ...local,
    htmlDescription: sanitizeProductHtml(local.htmlDescription),
    media: [...local.media],
    photos: local.media.filter(x => x.type === 'image').map(x => x.url),
    tags: parseTags(tagText.value),
    specs
  })
}
</script>

<style scoped>
.modal { position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.45); }
.panel { background: #fff; padding: 1rem; border-radius: 10px; width: 900px; max-width: 96%; max-height: 90vh; overflow: auto; }
.form { display: flex; flex-direction: column; gap: 0.45rem; }
.photo-row { display: flex; gap: 0.5rem; }
.photo-row select { padding: 0.5rem; border: 1px solid var(--color-border); border-radius: 6px; background: #fff; }
.photo-row input { flex: 1; }
.photo-list { display: flex; flex-direction: column; gap: 0.4rem; }
.photo-item { display: grid; grid-template-columns: 40px 1fr auto; gap: 0.5rem; align-items: center; border: 1px solid #eee; border-radius: 6px; padding: 0.35rem; }
.photo-item img { width: 40px; height: 40px; border-radius: 4px; object-fit: cover; }
.photo-item video { width: 40px; height: 40px; border-radius: 4px; object-fit: cover; background: #111; }
.photo-item span { font-size: 0.85rem; color: #444; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rte { border: 1px solid var(--color-border); border-radius: 8px; overflow: hidden; }
.rte-toolbar { display: flex; flex-wrap: wrap; gap: 0.45rem; padding: 0.5rem; background: var(--color-surface-soft); border-bottom: 1px solid var(--color-border); }
.rte-toolbar button { padding: 0.35rem 0.6rem; border: 1px solid var(--color-border); border-radius: 999px; background: #fff; cursor: pointer; font-size: 0.8rem; }
.rte textarea { border: 0; border-radius: 0; width: 100%; resize: vertical; min-height: 120px; }
.rte-preview { border-top: 1px solid var(--color-border); padding: 0.6rem 0.75rem; background: #fff; }
.preview-title { margin: 0 0 0.35rem; font-weight: 700; font-size: 0.82rem; color: var(--color-text); }
.preview-body { color: var(--color-text-muted); line-height: 1.6; }
.preview-body :deep(p) { margin: 0.25rem 0; }
.preview-body :deep(ul), .preview-body :deep(ol) { margin: 0.25rem 0; padding-left: 1.1rem; }
.grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem 0.8rem; }
.buttons { display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 0.8rem; }
.primary { background: var(--color-primary); color: #fff; padding: 0.5rem 0.75rem; border-radius: 6px; border: none; cursor: pointer; }
input, textarea { padding: 0.5rem; border: 1px solid var(--color-border); border-radius: 6px; }
@media (max-width: 768px) { .grid2 { grid-template-columns: 1fr; } }
</style>

