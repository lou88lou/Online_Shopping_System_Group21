// frontend/src/stores/auth.js（A1-A2）
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  // 状态
  const user = ref(null)
  const isLoggedIn = ref(false)

  // 从 localStorage 恢复登录状态
  const initAuth = () => {
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      user.value = JSON.parse(savedUser)
      isLoggedIn.value = true
    }
  }

  // A1: 注册新用户
  const register = async (userData) => {
    try {
      // 模拟注册（实际应调用后端API）
      const newUser = {
        id: Date.now(),
        fullName: userData.fullName,
        email: userData.email,
        shippingAddress: userData.shippingAddress,
        createdAt: new Date().toISOString()
      }

      // 保存到 localStorage（模拟数据库）
      const users = JSON.parse(localStorage.getItem('users') || '[]')
      
      // 检查邮箱是否已存在
      if (users.find(u => u.email === userData.email)) {
        throw new Error('this email is already registered')
      }

      users.push({ ...newUser, password: userData.password })
      localStorage.setItem('users', JSON.stringify(users))

      return { success: true, message: 'registration successful! please login' }
    } catch (error) {
      return { success: false, message: error.message }
    }
  }

  // A2: 用户登录
  const login = async (email, password) => {
    try {
      // 模拟登录验证
      const users = JSON.parse(localStorage.getItem('users') || '[]')
      const foundUser = users.find(u => u.email === email && u.password === password)

      if (!foundUser) {
        throw new Error('email or password is incorrect')
      }

      // 保存用户信息（不包含密码）
      user.value = {
        id: foundUser.id,
        fullName: foundUser.fullName,
        email: foundUser.email,
        shippingAddress: foundUser.shippingAddress
      }
      isLoggedIn.value = true

      // 持久化到 localStorage
      localStorage.setItem('user', JSON.stringify(user.value))

      return { success: true, message: 'login successful!' }
    } catch (error) {
      return { success: false, message: error.message }
    }
  }

  // 登出
  const logout = () => {
    user.value = null
    isLoggedIn.value = false
    localStorage.removeItem('user')
  }

  // 初始化
  initAuth()

  return {
    user,
    isLoggedIn,
    register,
    login,
    logout
  }
})
