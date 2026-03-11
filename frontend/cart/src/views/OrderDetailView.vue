<template>
  <div class="order-detail-page">
    <div class="container">
      <div class="page-head">
        <h1>Order Detail</h1>
        <p>Track your order progress and manage purchased items.</p>
      </div>

      <div v-if="order" class="layout-stack">
        <section class="summary-card">
          <div class="summary-top">
            <div>
              <p class="eyebrow">Order Number</p>
              <h2>{{ order.orderNumber }}</h2>
            </div>
            <div class="status-wrap">
              <StatusBadge :status="order.status" />
            </div>
          </div>

          <div class="summary-grid">
            <article class="summary-item">
              <span>Purchase Date</span>
              <strong>{{ formatDate(order.createdAt) }}</strong>
            </article>
            <article class="summary-item">
              <span>Shipping Address</span>
              <strong>{{ order.shippingAddress || 'N/A' }}</strong>
            </article>
            <article class="summary-item">
              <span>Total Amount</span>
              <strong class="price">${{ (order.totalAmount || 0).toFixed(2) }}</strong>
            </article>
          </div>

          <div class="status-actions" v-if="actions.length">
            <button
              v-for="action in actions"
              :key="action.nextStatus"
              class="btn btn-danger"
              @click="applyStatus(action.nextStatus)"
            >
              {{ action.label }}
            </button>
          </div>
        </section>

        <section class="block-card">
          <h3>Status Timeline (B2/B4)</h3>
          <OrderStatusStepper :order="order" />
        </section>

        <section class="block-card">
          <h3>Status History</h3>
          <div v-if="order.statusHistory && order.statusHistory.length" class="history-list">
            <div v-for="(entry, idx) in order.statusHistory" :key="idx" class="timeline-item">
              <strong>{{ entry.status }}</strong>
              <span>{{ formatDate(entry.changedAt) }}</span>
              <span>by {{ entry.actor || 'system' }}</span>
            </div>
          </div>
        </section>

        <section class="block-card">
          <h3>Items</h3>
          <div v-if="order.items && order.items.length" class="items-list">
          <div v-for="(it, idx) in order.items" :key="it.product_id || idx" class="order-item">
            <div class="item-main">
              <div class="item-title">{{ it.product_name || it.name || it.product_name }}</div>
              <div class="item-meta">{{ it.quantity }} x ${{ (it.unit_price || it.unitPrice || it.price || 0).toFixed(2) }}</div>
              <div class="item-subtotal">Subtotal: ${{ (it.subtotal || it.subTotal || (it.unit_price || it.price || 0) * it.quantity || 0).toFixed(2) }}</div>
              <router-link v-if="getProductId(it)" :to="`/products/${getProductId(it)}`" class="item-link">View Product</router-link>
            </div>

            <div class="item-review">
              <div class="review-headline">
                <strong>Rate this purchase</strong>
                <span
                  class="review-state"
                  :class="{
                    reviewed: getProductId(it) && reviewDrafts[getProductId(it)]?.hasExisting,
                    pending: !(getProductId(it) && reviewDrafts[getProductId(it)]?.hasExisting)
                  }"
                >
                  {{ getProductId(it) && reviewDrafts[getProductId(it)]?.hasExisting ? 'Reviewed' : 'Not reviewed' }}
                </span>
              </div>

              <p class="review-warning" v-if="!canReview">
                Review unlocks after shipment.
              </p>
              <template v-else-if="getProductId(it) && reviewDrafts[getProductId(it)]">
                <p class="review-hint">
                  {{ reviewDrafts[getProductId(it)].hasExisting ? 'You already reviewed this item.' : 'Share your feedback for this item.' }}
                </p>
                <button class="btn-review" @click="openReviewModal(it)">
                  {{ reviewDrafts[getProductId(it)].hasExisting ? 'Edit Review' : 'Write Review' }}
                </button>
              </template>
              <p v-else class="review-hint">Review unavailable for this item.</p>
            </div>
          </div>
          </div>
        </section>
      </div>
      <div v-else class="not-found">Order not found</div>

      <div v-if="reviewModal.open" class="review-modal-wrap" @click.self="closeReviewModal">
        <div class="review-modal" role="dialog" aria-modal="true" aria-label="Review dialog">
          <div class="review-modal-head">
            <h3>{{ reviewModal.hasExisting ? 'Update Review' : 'Write a Review' }}</h3>
            <button class="btn-close-modal" @click="closeReviewModal" aria-label="Close review dialog">x</button>
          </div>

          <p class="review-modal-item">{{ reviewModal.productName }}</p>

          <div class="star-rating" @mouseleave="hoverRating = 0">
            <button
              v-for="star in 5"
              :key="star"
              type="button"
              class="star-btn"
              :class="{ active: star <= activeStarValue }"
              @mouseenter="hoverRating = star"
              @click="reviewModal.rating = star"
              :aria-label="`Rate ${star} star`"
            >
              ★
            </button>
          </div>

          <textarea
            v-model="reviewModal.comment"
            rows="4"
            placeholder="Write your review"
            maxlength="300"
            class="review-modal-textarea"
          ></textarea>
          <p class="review-char-hint">{{ reviewCharCount }}/300</p>

          <div class="review-modal-actions">
            <button class="btn-secondary" @click="closeReviewModal">Cancel</button>
            <button class="btn-review" @click="submitModalReview">Submit</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, reactive } from 'vue'
import { useRoute } from 'vue-router'
import { useOrdersStore } from '../stores/orders'
import { useAuthStore } from '../stores/auth'
import { useReviewsStore } from '../stores/reviews'
import StatusBadge from '../components/StatusBadge.vue'
import OrderStatusStepper from '../components/OrderStatusStepper.vue'
import { useToast } from '../composables/useToast'
import { MESSAGES } from '../constants/messages'

const route = useRoute()
const ordersStore = useOrdersStore()
const authStore = useAuthStore()
const reviewsStore = useReviewsStore()
const toast = useToast()
const order = ref(null)
const reviewDrafts = reactive({})
const hoverRating = ref(0)
const reviewModal = reactive({
  open: false,
  productId: '',
  productName: '',
  rating: 5,
  comment: '',
  hasExisting: false
})

const canReview = computed(() => String(order.value?.status || '').toLowerCase() === 'shipped')
const activeStarValue = computed(() => Number(hoverRating.value || reviewModal.rating || 0))
const reviewCharCount = computed(() => String(reviewModal.comment || '').length)

const loadOrder = async () => {
  const id = route.params.id
  order.value = await ordersStore.getOrderById(id)
  initReviewDrafts()
}

onMounted(loadOrder)

const actions = computed(() => {
  return ordersStore.getAllowedActions(order.value, 'customer')
})

const applyStatus = async (nextStatus) => {
  const sure = confirm(`Change order status to "${nextStatus}"?`)
  if (!sure) return
  const res = await ordersStore.updateOrderStatus(order.value.orderId || order.value.id, nextStatus, 'customer')
  if (!res?.success) {
    toast.error(res?.message || MESSAGES.order.updateFailed)
    return
  }
  toast.success(MESSAGES.order.updated)
  await loadOrder()
}

const getProductId = (it) => String(it?.product_id || it?.productId || '').trim()

const initReviewDrafts = () => {
  const list = order.value?.items || []
  for (const it of list) {
    const pid = getProductId(it)
    if (!pid) continue
    const existing = reviewsStore.getUserReview(pid, authStore.user?.id)
    reviewDrafts[pid] = {
      rating: Number(existing?.rating || 5),
      comment: existing?.comment || '',
      hasExisting: !!existing
    }
  }
}

const openReviewModal = (it) => {
  if (!canReview.value) {
    toast.warning('Reviews are available after shipment.')
    return
  }
  const pid = getProductId(it)
  if (!pid) {
    toast.error('Product reference missing for this item.')
    return
  }
  const draft = reviewDrafts[pid] || { rating: 5, comment: '', hasExisting: false }
  reviewModal.open = true
  reviewModal.productId = pid
  reviewModal.productName = it.product_name || it.name || `Product ${pid}`
  reviewModal.rating = Number(draft.rating || 5)
  reviewModal.comment = draft.comment || ''
  reviewModal.hasExisting = !!draft.hasExisting
  hoverRating.value = 0
}

const closeReviewModal = () => {
  reviewModal.open = false
  hoverRating.value = 0
}

const submitModalReview = () => {
  if (!reviewModal.productId) {
    toast.error('Product reference missing for this item.')
    return
  }
  if (!String(reviewModal.comment || '').trim() || String(reviewModal.comment || '').trim().length < 4) {
    toast.warning('Please write at least 4 characters for your review.')
    return
  }
  if (String(reviewModal.comment || '').length > 300) {
    toast.warning('Review must be within 300 characters.')
    return
  }

  const res = reviewsStore.upsertReview({
    productId: reviewModal.productId,
    userId: authStore.user?.id,
    userName: authStore.user?.fullName,
    rating: reviewModal.rating,
    comment: reviewModal.comment
  })

  if (!res?.success) {
    toast.error(res?.message || 'Failed to submit review.')
    return
  }

  reviewDrafts[reviewModal.productId] = {
    rating: reviewModal.rating,
    comment: reviewModal.comment,
    hasExisting: true
  }

  closeReviewModal()
  toast.success('Review submitted!')
}

const formatDate = (d) => {
  if (!d) return 'N/A'
  try { return new Date(d).toLocaleString() } catch (e) { return d }
}
</script>

<style scoped>
.order-detail-page { min-height: calc(100vh - 80px); background: var(--color-bg); padding: var(--space-7) 0; }
.container { max-width: 1200px; margin: 0 auto; padding: 0 2rem; }
.page-head { margin-bottom: var(--space-4); }
.page-head h1 { margin: 0; color: var(--color-text); }
.page-head p { margin: 0.35rem 0 0; color: var(--color-text-muted); }
.layout-stack { display: flex; flex-direction: column; gap: var(--space-4); }

.summary-card,
.block-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  padding: var(--space-4);
}
.summary-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 0.8rem; margin-bottom: var(--space-3); }
.eyebrow { margin: 0; font-size: var(--text-sm); color: var(--color-text-muted); }
.summary-top h2 { margin: 0.2rem 0 0; color: var(--color-text); font-size: var(--text-xl); }
.summary-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0.75rem; }
.summary-item {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface-soft);
  padding: 0.7rem 0.85rem;
  display: flex;
  flex-direction: column;
  gap: 0.22rem;
}
.summary-item span { color: var(--color-text-muted); font-size: var(--text-sm); }
.summary-item strong { color: var(--color-text); word-break: break-word; }
.summary-item .price { color: var(--color-primary); }
.block-card h3 { margin: 0 0 var(--space-3); color: var(--color-text); }

.status-actions { margin-top: var(--space-3); display: flex; gap: 0.5rem; flex-wrap: wrap; }
.btn { border: none; border-radius: var(--radius-sm); padding: 0.5rem 0.9rem; cursor: pointer; color: #fff; font-weight: 700; }
.btn-danger { background: #dc2626; }
.btn-danger:hover { background: #b91c1c; }

.history-list { display: flex; flex-direction: column; gap: 0.35rem; }
.timeline-item {
  display: flex;
  gap: 0.7rem;
  color: var(--color-text-muted);
  padding: 0.48rem 0;
  border-bottom: 1px dashed var(--color-border);
}
.timeline-item strong { color: var(--color-text); text-transform: capitalize; min-width: 86px; }
.items-list { display: flex; flex-direction: column; }
.order-item {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 1rem;
  padding: 0.9rem 0;
  border-bottom: 1px solid var(--color-border);
}
.item-main { display: flex; flex-direction: column; gap: 0.25rem; }
.item-title { font-weight: 700; color: var(--color-text); }
.item-meta, .item-subtotal { color: var(--color-text-muted); }
.item-link { width: fit-content; font-size: 0.9rem; color: var(--color-primary); text-decoration: none; }
.item-link:hover { text-decoration: underline; }
.item-review {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 0.75rem;
  background: linear-gradient(180deg, #f8fbff 0%, #f3f7ff 100%);
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}
.item-review label { font-size: 0.85rem; font-weight: 600; color: var(--color-text); }
.review-headline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.45rem;
}
.review-headline strong {
  color: var(--color-text);
  font-size: 0.95rem;
}
.review-state {
  font-size: 0.75rem;
  font-weight: 700;
  border-radius: var(--radius-pill);
  padding: 0.2rem 0.5rem;
  border: 1px solid transparent;
}
.review-state.reviewed {
  color: #166534;
  background: #eaf8ef;
  border-color: #b8e5c4;
}
.review-state.pending {
  color: #7c2d12;
  background: #fff7ed;
  border-color: #fed7aa;
}
.review-warning {
  margin: 0;
  color: #9a3412;
  background: #fff7ed;
  border: 1px solid #fdba74;
  border-radius: var(--radius-sm);
  font-size: 0.82rem;
  padding: 0.34rem 0.5rem;
}
.btn-review {
  border: none;
  border-radius: var(--radius-sm);
  height: 44px;
  background: var(--color-primary);
  color: #fff;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 6px 14px rgba(21, 112, 224, 0.22);
}
.btn-review:hover {
  background: var(--color-primary-hover);
  transform: translateY(-1px);
}
.review-hint { margin: 0; color: var(--color-text-muted); font-size: 0.88rem; }
.not-found {
  padding: 2rem;
  background: var(--color-surface);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  color: var(--color-text);
}
.review-modal-wrap {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.4);
  display: grid;
  place-items: center;
  z-index: 1200;
}
.review-modal {
  width: min(520px, 92vw);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: 0 16px 44px rgba(15, 23, 42, 0.24);
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}
.review-modal-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.review-modal-head h3 {
  margin: 0;
  color: var(--color-text);
}
.btn-close-modal {
  border: 1px solid var(--color-border);
  background: #fff;
  border-radius: var(--radius-sm);
  width: 30px;
  height: 30px;
  font-weight: 700;
  cursor: pointer;
}
.review-modal-item {
  margin: 0;
  color: var(--color-text-muted);
  font-weight: 600;
}
.star-rating {
  display: flex;
  gap: 0.35rem;
}
.star-btn {
  border: none;
  background: transparent;
  font-size: 1.9rem;
  line-height: 1;
  color: #cbd5e1;
  cursor: pointer;
  padding: 0;
}
.star-btn.active {
  color: #fbbf24;
}
.review-modal-textarea {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 0.55rem 0.65rem;
  resize: vertical;
  font-family: inherit;
}
.review-char-hint {
  margin: -0.25rem 0 0;
  text-align: right;
  color: var(--color-text-muted);
  font-size: 0.8rem;
}
.review-modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.55rem;
}
.btn-secondary {
  border: 1px solid var(--color-border);
  background: #fff;
  color: var(--color-text);
  border-radius: var(--radius-sm);
  padding: 0.45rem 0.8rem;
  font-weight: 700;
  cursor: pointer;
}
 .btn-secondary:hover {
  background: #f3f4f6;
}

@media (max-width: 968px) {
  .order-item { grid-template-columns: 1fr; }
  .summary-grid { grid-template-columns: 1fr; }
  .summary-top { flex-direction: column; }
  .timeline-item { flex-direction: column; gap: 0.15rem; }
}
</style>
