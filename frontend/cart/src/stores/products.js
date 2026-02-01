// frontend/src/stores/products.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useProductsStore = defineStore('products', () => {
  // 状态定义
  const products = ref([])
  const currentProduct = ref(null)
  const searchQuery = ref('')
  const currentPage = ref(1)
  const itemsPerPage = ref(12)
  const isLoading = ref(false)

  // 初始化产品数据
  const initProducts = () => {
    const savedProducts = localStorage.getItem('products')
    if (savedProducts) {
      products.value = JSON.parse(savedProducts)
    } else {
      products.value = [
        {
          id: 1,
          name: 'iPhone 17 Pro',
          price: 8999,
          image: 'https://via.placeholder.com/300x300/667eea/ffffff?text=iPhone+15',
          thumbnail: 'https://via.placeholder.com/150x150/667eea/ffffff?text=iPhone',
          description: '全新A17 Pro芯片，一体铝合金',
          category: '手机',
          stock: 50,
          rating: 4.8
        },
        {
          id: 2,
          name: 'MacBook Pro 16',
          price: 18999,
          image: 'https://via.placeholder.com/300x300/764ba2/ffffff?text=MacBook',
          thumbnail: 'https://via.placeholder.com/150x150/764ba2/ffffff?text=MacBook',
          description: 'M3 Max芯片，极致性能',
          category: '电脑',
          stock: 30,
          rating: 4.9
        },
        {
          id: 3,
          name: 'AirPods Pro 2',
          price: 1899,
          image: 'https://via.placeholder.com/300x300/4CAF50/ffffff?text=AirPods',
          thumbnail: 'https://via.placeholder.com/150x150/4CAF50/ffffff?text=AirPods',
          description: '主动降噪，空间音频',
          category: '耳机',
          stock: 100,
          rating: 4.7
        },
        {
          id: 4,
          name: 'iPad Air',
          price: 4799,
          image: 'https://via.placeholder.com/300x300/FF6B6B/ffffff?text=iPad',
          thumbnail: 'https://via.placeholder.com/150x150/FF6B6B/ffffff?text=iPad',
          description: 'M1芯片，10.9英寸显示屏',
          category: '平板',
          stock: 60,
          rating: 4.6
        },
        {
          id: 5,
          name: 'Apple Watch Series 9',
          price: 3199,
          image: 'https://via.placeholder.com/300x300/FFA500/ffffff?text=Watch',
          thumbnail: 'https://via.placeholder.com/150x150/FFA500/ffffff?text=Watch',
          description: 'S9芯片，全天候视网膜显示屏',
          category: '智能手表',
          stock: 80,
          rating: 4.5
        },
        {
          id: 6,
          name: 'Magic Keyboard',
          price: 899,
          image: 'https://via.placeholder.com/300x300/9C27B0/ffffff?text=Keyboard',
          thumbnail: 'https://via.placeholder.com/150x150/9C27B0/ffffff?text=Keyboard',
          description: '妙控键盘，蓝牙无线连接',
          category: '配件',
          stock: 150,
          rating: 4.4
        },
        {
          id: 7,
          name: 'HomePod mini',
          price: 749,
          image: 'https://via.placeholder.com/300x300/00BCD4/ffffff?text=HomePod',
          thumbnail: 'https://via.placeholder.com/150x150/00BCD4/ffffff?text=HomePod',
          description: '智能音箱，360度环绕音效',
          category: '音箱',
          stock: 90,
          rating: 4.3
        },
        {
          id: 8,
          name: 'Apple TV 4K',
          price: 1199,
          image: 'https://via.placeholder.com/300x300/E91E63/ffffff?text=AppleTV',
          thumbnail: 'https://via.placeholder.com/150x150/E91E63/ffffff?text=AppleTV',
          description: '4K HDR，A15仿生芯片',
          category: '电视盒子',
          stock: 70,
          rating: 4.2
        },
           {
        id: 9, // 注意ID不要重复
        name: 'Mac Studio',
        price: 15999,
        image: 'https://via.placeholder.com/300x300/8B4513/ffffff?text=MacStudio',
        thumbnail: 'https://via.placeholder.com/150x150/8B4513/ffffff?text=Studio',
        description: 'M2 Max/M2 Ultra芯片，专业级性能',
        category: '电脑',
        stock: 20,
        rating: 4.8
        }, 
        {
        id: 10,
        name: 'iPhone 16 Pro',
        price: 8999,
        image: 'https://via.placeholder.com/300x300/1E40AF/ffffff?text=iPhone+16+Pro',
        thumbnail: 'https://via.placeholder.com/150x150/1E40AF/ffffff?text=16+Pro',
        description: 'A18 Pro芯片，6.3英寸超视网膜XDR显示屏，钛金属设计，4800万像素主摄',
        category: '手机',
        stock: 45,
        rating: 4.9
        },
        {
          id: 11,
          name: 'iPhone 16 Pro Max',
          price: 9999,
          image: 'https://via.placeholder.com/300x300/1E3A8A/ffffff?text=iPhone+16+Pro+Max',
          thumbnail: 'https://via.placeholder.com/150x150/1E3A8A/ffffff?text=16+Pro+Max',
          description: 'A18 Pro芯片，6.9英寸大屏幕，5倍光学变焦，史上最长电池续航',
          category: '手机',
          stock: 38,
          rating: 5.0
        },
        {
          id: 12,
          name: 'iPhone 16',
          price: 6999,
          image: 'https://via.placeholder.com/300x300/3B82F6/ffffff?text=iPhone+16',
          thumbnail: 'https://via.placeholder.com/150x150/3B82F6/ffffff?text=iPhone+16',
          description: 'A17芯片，6.1英寸显示屏，智能岛，4800万像素双摄系统',
          category: '手机',
          stock: 65,
          rating: 4.7
        },
        {
          id: 16,
          name: 'Apple Watch Series 10',
          price: 3499,
          image: 'https://via.placeholder.com/300x300/EF4444/ffffff?text=Watch+Series+10',
          thumbnail: 'https://via.placeholder.com/150x150/EF4444/ffffff?text=Watch+10',
          description: 'S10芯片，更薄的机身设计，血压监测功能，2天电池续航',
          category: '智能手表',
          stock: 55,
          rating: 4.6
        },
        {
          id: 17,
          name: 'Apple Watch Ultra 3',
          price: 6499,
          image: 'https://via.placeholder.com/300x300/059669/ffffff?text=Watch+Ultra+3',
          thumbnail: 'https://via.placeholder.com/150x150/059669/ffffff?text=Ultra+3',
          description: '为极限运动设计，100米防水，双频GPS，Micro-LED显示屏',
          category: '智能手表',
          stock: 20,
          rating: 4.8
        }
  
      ]
      localStorage.setItem('products', JSON.stringify(products.value))
    }
  }

  // 计算属性：过滤产品
  const filteredProducts = computed(() => {
    if (!searchQuery.value) {
      return products.value
    }
    const query = searchQuery.value.toLowerCase()
    return products.value.filter(p => 
      p.name.toLowerCase().includes(query) ||
      p.category.toLowerCase().includes(query) ||
      p.description.toLowerCase().includes(query)
    )
  })

  // 计算属性：总页数
  const totalPages = computed(() => {
    return Math.ceil(filteredProducts.value.length / itemsPerPage.value)
  })

  // 计算属性：当前页产品
  const paginatedProducts = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage.value
    const end = start + itemsPerPage.value
    return filteredProducts.value.slice(start, end)
  })

  // 方法：搜索产品
  const searchProducts = (query) => {
    searchQuery.value = query
    currentPage.value = 1
  }

  // 方法：切换页码
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages.value) {
      currentPage.value = page
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  // 方法：获取产品详情
  const getProductById = (id) => {
    const product = products.value.find(p => p.id === parseInt(id))
    if (product) {
      currentProduct.value = product
    }
    return product
  }

  // 初始化
  initProducts()

  // 返回所有需要暴露的内容
  return {
    products,
    currentProduct,
    searchQuery,
    currentPage,
    itemsPerPage,
    isLoading,
    filteredProducts,
    paginatedProducts,
    totalPages,
    searchProducts,
    goToPage,
    getProductById
  }
})
