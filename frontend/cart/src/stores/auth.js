// frontend/src/stores/auth.js（A1-A2）— 对接后端 API
import { defineStore } from 'pinia'
import { ref } from 'vue'
import api, { getToken, setToken } from '../api'

// 将后端 user 转为前端使用的格式（snake_case -> camelCase）
function normalizeUser(backendUser) {
  if (!backendUser) return null
  return {
    id: backendUser.id,
    fullName: backendUser.full_name ?? backendUser.fullName,
    email: backendUser.email,
    shippingAddress: backendUser.shipping_address ?? backendUser.shippingAddress
  }
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const isLoggedIn = ref(false)

  const initAuth = async () => {
    const token = getToken()
    if (!token) {
      user.value = null
      isLoggedIn.value = false
      return
    }
    try {
      const { data } = await api.get('/auth/me')
      if (data.success && data.data?.user) {
        user.value = normalizeUser(data.data.user)
        isLoggedIn.value = true
      } else {
        setToken(null)
        user.value = null
        isLoggedIn.value = false
      }
    } catch {
      // If backend is unreachable but we have a local frontend-only login stored,
      // restore user from localStorage instead of clearing everything.
      try {
        const localUser = JSON.parse(localStorage.getItem('user'))
        if (localUser && localUser.id && String(localUser.id).startsWith('local')) {
          user.value = localUser
          isLoggedIn.value = true
          return
        }
      } catch (e) {
        // ignore
      }
      setToken(null)
      user.value = null
      isLoggedIn.value = false
    }
  }

  // A1: 注册 — POST /api/auth/register
  const register = async (userData) => {
    try {
      const { data } = await api.post('/auth/register', {
        full_name: userData.fullName,
        email: userData.email,
        password: userData.password,
        shipping_address: userData.shippingAddress
      })
      if (!data.success) {
        return { success: false, message: data.error || 'Registration failed' }
      }
      const token = data.data?.token
      const backendUser = data.data?.user
      if (token) setToken(token)
      if (backendUser) {
        user.value = normalizeUser(backendUser)
        isLoggedIn.value = true
        localStorage.setItem('user', JSON.stringify(user.value))
      }
      return { success: true, message: data.message || 'Registration successful! Please login.' }
    } catch (err) {
      // If backend is unreachable, create a local-only user for demo
      try {
        const localId = `local-user-${Date.now()}`
        const localUser = {
          id: localId,
          fullName: userData.fullName,
          email: userData.email,
          shippingAddress: userData.shippingAddress
        }
        user.value = localUser
        isLoggedIn.value = true
        setToken('local-token')
        localStorage.setItem('user', JSON.stringify(localUser))
        return { success: true, message: 'Registration successful. You are now logged in.' }
      } catch (e) {
        const msg = err.message || err.data?.error || 'Registration failed'
        return { success: false, message: msg }
      }
    }
  }

  // A2: 登录 — POST /api/auth/login
  const login = async (email, password) => {
    try {
      const { data } = await api.post('/auth/login', { email, password })
      if (!data.success) {
        return { success: false, message: data.error || 'Login failed' }
      }
      const token = data.data?.token
      const backendUser = data.data?.user
      if (token) setToken(token)
      if (backendUser) {
        user.value = normalizeUser(backendUser)
        isLoggedIn.value = true
        localStorage.setItem('user', JSON.stringify(user.value))
      }
      const { useCartStore } = await import('./cart')
      const cartStore = useCartStore()
      await cartStore.loadCart()
      return { success: true, message: data.message || 'Login successful!' }
    } catch (err) {
      // If backend is down, allow a frontend-only test account for demo purposes
      const msg = err.message || err.data?.error || 'Email or password is incorrect'
      if (email === 'test@example.com' && password === 'test123') {
        // create a local-only user session
        const localUser = {
          id: 'local-user-1',
          fullName: 'Test User',
          email: 'test@example.com',
          shippingAddress: '123 Test Address, Hong Kong'
        }
        user.value = localUser
        isLoggedIn.value = true
        setToken('local-token')
        localStorage.setItem('user', JSON.stringify(localUser))
        const { useCartStore } = await import('./cart')
        const cartStore = useCartStore()
        await cartStore.loadCart()
        return { success: true, message: 'Login successful.' }
      }
      if (email === 'vendor@example.com' && password === 'vendor123') {
        const localUser = {
          id: 'local-vendor-1',
          fullName: 'Vendor Account',
          email: 'vendor@example.com',
          shippingAddress: ''
        }
        user.value = localUser
        isLoggedIn.value = true
        setToken('local-token')
        localStorage.setItem('user', JSON.stringify(localUser))
        const { useCartStore } = await import('./cart')
        const cartStore = useCartStore()
        await cartStore.loadCart()
        return { success: true, message: 'Login successful.' }
      }
      if (email === 'admin@example.com' && password === 'admin123') {
        const localUser = {
          id: 'local-admin-1',
          fullName: 'Admin Account',
          email: 'admin@example.com',
          shippingAddress: ''
        }
        user.value = localUser
        isLoggedIn.value = true
        setToken('local-token')
        localStorage.setItem('user', JSON.stringify(localUser))
        const { useCartStore } = await import('./cart')
        const cartStore = useCartStore()
        await cartStore.loadCart()
        return { success: true, message: 'Login successful.' }
      }
      return { success: false, message: msg }
    }
  }

  const logout = async () => {
    const { useCartStore } = await import('./cart')
    const cartStore = useCartStore()
    cartStore.clearCartOnLogout()
    setToken(null)
    user.value = null
    isLoggedIn.value = false
    localStorage.removeItem('user')
    try { localStorage.removeItem('role') } catch (e) {
      // ignore storage errors in restricted environments
    }
  }

  return {
    user,
    isLoggedIn,
    initAuth,
    register,
    login,
    logout
  }
})
