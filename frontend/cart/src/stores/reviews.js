import { defineStore } from 'pinia'
import { ref } from 'vue'

const STORAGE_KEY = 'product_reviews_v1'

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : {}
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch (e) {
    return {}
  }
}

function saveToStorage(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (e) {
    // ignore storage errors in restricted environments
  }
}

export const useReviewsStore = defineStore('reviews', () => {
  const reviewsByProduct = ref(loadFromStorage())

  const getProductReviews = (productId) => {
    if (!productId) return []
    const list = reviewsByProduct.value[String(productId)] || []
    return [...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }

  const getUserReview = (productId, userId) => {
    if (!productId || !userId) return null
    const list = reviewsByProduct.value[String(productId)] || []
    return list.find(r => String(r.userId) === String(userId)) || null
  }

  const getRatingSummary = (productId) => {
    const list = getProductReviews(productId)
    if (!list.length) return { count: 0, avg: 0 }
    const total = list.reduce((sum, r) => sum + Number(r.rating || 0), 0)
    return {
      count: list.length,
      avg: total / list.length
    }
  }

  const upsertReview = ({ productId, userId, userName, rating, comment }) => {
    if (!productId || !userId) {
      return { success: false, message: 'Invalid review data.' }
    }

    const key = String(productId)
    const current = reviewsByProduct.value[key] || []
    const cleanComment = String(comment || '').trim()
    const cleanRating = Math.min(5, Math.max(1, Number(rating) || 0))

    if (!cleanComment || cleanRating < 1) {
      return { success: false, message: 'Please provide rating and review content.' }
    }

    const nextItem = {
      id: `review-${Date.now()}`,
      productId: key,
      userId: String(userId),
      userName: String(userName || 'User'),
      rating: cleanRating,
      comment: cleanComment,
      createdAt: new Date().toISOString()
    }

    const idx = current.findIndex(r => String(r.userId) === String(userId))
    const nextList = [...current]
    if (idx >= 0) nextList[idx] = { ...nextList[idx], ...nextItem, id: nextList[idx].id }
    else nextList.push(nextItem)

    reviewsByProduct.value = {
      ...reviewsByProduct.value,
      [key]: nextList
    }
    saveToStorage(reviewsByProduct.value)
    return { success: true, message: idx >= 0 ? 'Review updated.' : 'Review submitted.' }
  }

  return {
    reviewsByProduct,
    getProductReviews,
    getUserReview,
    getRatingSummary,
    upsertReview
  }
})
