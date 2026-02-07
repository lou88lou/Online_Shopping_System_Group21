/**
 * 前端 API 客户端：统一 baseURL、Authorization、错误处理
 * 开发环境通过 vue.config.js 代理 /api -> http://localhost:5000
 */
import axios from 'axios'

const API_BASE = '/api'

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
})

const TOKEN_KEY = 'token'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token)
  } else {
    localStorage.removeItem(TOKEN_KEY)
  }
}

// 请求拦截：自动带上 JWT
api.interceptors.request.use(
  (config) => {
    const token = getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (err) => Promise.reject(err)
)

// 响应拦截：统一错误与 401 处理
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status
    const data = err.response?.data
    const message = data?.error || data?.message || err.message || 'Network error'

    if (status === 401) {
      setToken(null)
      localStorage.removeItem('user')
      // 可选：跳转登录页（由各页面或 router 守卫处理）
      if (typeof window !== 'undefined' && !window.__authRedirect) {
        window.__authRedirect = true
        setTimeout(() => {
          window.__authRedirect = false
          if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
            window.location.href = '/login'
          }
        }, 100)
      }
    }

    return Promise.reject({ status, message, data })
  }
)

export default api
