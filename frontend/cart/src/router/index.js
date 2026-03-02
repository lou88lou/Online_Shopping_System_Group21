// frontend/src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

// 导入页面组件
const HomeView = () => import('../views/HomeView.vue')
const RegisterView = () => import('../views/RegisterView.vue')
const LoginView = () => import('../views/LoginView.vue')
const ProductListView = () => import('../views/ProductListView.vue')
const ProductDetailView = () => import('../views/ProductDetailView.vue')
const CartView = () => import('../views/CartView.vue')
const CheckoutView = () => import('../views/CheckoutView.vue')
const OrdersView = () => import('../views/OrdersView.vue')
const OrderDetailView = () => import('../views/OrderDetailView.vue')
const AdminProductsView = () => import('../views/AdminProductsView.vue')
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
      component: AdminProductsView
    },
    {
      path: '/vendor/login',
      name: 'vendor-login',
      component: VendorLoginView
    },
    {
      path: '/vendor/products',
      name: 'vendor-products',
      component: VendorProductsView
    },
    {
      path: '/vendor/products/new',
      name: 'vendor-add-product',
      component: VendorAddProductView
    },
    {
      path: '/vendor/products/:id',
      name: 'vendor-product-detail',
      component: VendorProductDetailView
    },
    {
      path: '/vendor/orders',
      name: 'vendor-orders',
      component: VendorOrdersView,
      meta: { requiresAuth: true }
    },
    {
      path: '/vendor/orders/:id',
      name: 'vendor-order-detail',
      component: VendorOrderDetailView,
      meta: { requiresAuth: true }
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
  
  if (to.meta.requiresAuth && !authStore.isLoggedIn) {
    // Requires login but user is not authenticated — redirect to login
    alert('Please log in first')
    next('/login')
  } else {
    next()
  }
})

export default router
