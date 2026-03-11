// frontend/src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useToastStore } from '../stores/toast'
import { MESSAGES } from '../constants/messages'

// 导入页面组件
const HomeView = () => import('../views/HomeView.vue')
const RegisterView = () => import('../views/RegisterView.vue')
const LoginView = () => import('../views/LoginView.vue')
const ProductListView = () => import('../views/ProductListView.vue')
const ProductDetailView = () => import('../views/ProductDetailView.vue')
const WishlistView = () => import('../views/WishlistView.vue')
const CartView = () => import('../views/CartView.vue')
const CheckoutView = () => import('../views/CheckoutView.vue')
const OrdersView = () => import('../views/OrdersView.vue')
const OrderDetailView = () => import('../views/OrderDetailView.vue')
const AdminProductsView = () => import('../views/AdminProductsView.vue')
const AdminOrdersView = () => import('../views/AdminOrdersView.vue')
const AdminOrderDetailView = () => import('../views/AdminOrderDetailView.vue')
const VendorLoginView = () => import('../views/VendorLoginView.vue')
const VendorProductsView = () => import('../views/VendorProductsView.vue')
const VendorAddProductView = () => import('../views/VendorAddProductView.vue')
const VendorProductDetailView = () => import('../views/VendorProductDetailView.vue')
const VendorOrdersView = () => import('../views/VendorOrdersView.vue')
const VendorOrderDetailView = () => import('../views/VendorOrderDetailView.vue')

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView
    },
    {
      path: '/products',
      name: 'products',
      component: ProductListView
    },
    {
      path: '/products/:id',
      name: 'product-detail',
      component: ProductDetailView
    },
    {
      path: '/wishlist',
      name: 'wishlist',
      component: WishlistView,
      meta: { requiresAuth: true }
    },
    {
      path: '/orders',
      name: 'orders',
      component: OrdersView,
      meta: { requiresAuth: true }
    },
    {
      path: '/orders/:id',
      name: 'order-detail',
      component: OrderDetailView,
      meta: { requiresAuth: true }
    },
    {
      path: '/admin/products',
      name: 'admin-products',
      component: AdminProductsView,
      meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
      path: '/admin/orders',
      name: 'admin-orders',
      component: AdminOrdersView,
      meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
      path: '/admin/orders/:id',
      name: 'admin-order-detail',
      component: AdminOrderDetailView,
      meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
      path: '/vendor/login',
      name: 'vendor-login',
      component: VendorLoginView
    },
    {
      path: '/vendor/products',
      name: 'vendor-products',
      component: VendorProductsView,
      meta: { requiresAuth: true, requiresVendor: true }
    },
    {
      path: '/vendor/products/new',
      name: 'vendor-add-product',
      component: VendorAddProductView,
      meta: { requiresAuth: true, requiresVendor: true }
    },
    {
      path: '/vendor/products/:id',
      name: 'vendor-product-detail',
      component: VendorProductDetailView,
      meta: { requiresAuth: true, requiresVendor: true }
    },
    {
      path: '/vendor/orders',
      name: 'vendor-orders',
      component: VendorOrdersView,
      meta: { requiresAuth: true, requiresVendor: true }
    },
    {
      path: '/vendor/orders/:id',
      name: 'vendor-order-detail',
      component: VendorOrderDetailView,
      meta: { requiresAuth: true, requiresVendor: true }
    },
    {
      path: '/cart',
      name: 'cart',
      component: CartView,
         meta: { requiresAuth: true }  // ✅ 添加：需要登录
    },
    {
      path: '/checkout',
      name: 'checkout',
      component: CheckoutView,
      meta: { requiresAuth: true } // 需要登录
    }
  ]
})

// 路由守卫 - 检查登录状态
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  const toast = useToastStore()
  const email = String(authStore.user?.email || '').toLowerCase()
  const role = String(localStorage.getItem('role') || '').toLowerCase()
  const isVendorOrAdmin = role === 'vendor' || role === 'admin' || email === 'vendor@example.com' || email === 'admin@example.com'
  const isAdmin = role === 'admin' || email === 'admin@example.com'
  
  if (to.meta.requiresAuth && !authStore.isLoggedIn) {
    // Requires login but user is not authenticated — redirect to login
    toast.warning(MESSAGES.auth.loginRequired)
    next('/login')
  } else if (to.meta.requiresVendor && !isVendorOrAdmin) {
    toast.warning(MESSAGES.auth.vendorAccessOnly)
    next('/products')
  } else if (to.meta.requiresAdmin && !isAdmin) {
    toast.warning(MESSAGES.auth.adminAccessOnly)
    next('/products')
  } else {
    next()
  }
})

export default router
