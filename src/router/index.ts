import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { checkTokenValidity } from '../utils/request'
import { ElMessage } from 'element-plus'

// 页面导入
import Login from '../views/Login.vue'
import colorChange from '../components/design/colorChange.vue'
import StyleExtension from '../components/design/StyleExtension.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: {
      title: '登录 - D-Design鞋款设计平台'
    }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/Register.vue')
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('../views/Home.vue'),
    meta: {
      title: '控制台 - D-Design鞋款设计平台',
      requiresAuth: true
    }
  },
  {
    path: '/design',
    name: 'Design',
    component: () => import('../views/Design.vue'),
    meta: {
      title: '设计区 - D-Design鞋款设计平台',
      requiresAuth: true
    },
    children: [
      {
        path: 'style-fusion',
        name: 'StyleFusion',
        component: () => import('../components/design/StyleFusion.vue'),
        meta: {
          title: '款式融合 - D-Design鞋款设计平台',
          requiresAuth: true
        }
      },
      {
        path: 'sole-fusion',
        name: 'SoleFusion',
        component: () => import('../components/design/SoleFusion.vue'),
        meta: {
          title: '鞋底换面 - D-Design鞋款设计平台',
          requiresAuth: true
        }
      },
      {
        path: 'style-extension',
        name: 'StyleExtension',
        component: () => import('../components/design/StyleExtension.vue'),
        meta: {
          title: '款式延伸 - D-Design鞋款设计平台',
          requiresAuth: true
        }
      },
      {
        path: 'partial-modify',
        name: 'PartialModify',
        component: () => import('../components/design/PartialModify.vue'),
        meta: {
          title: '局部修改 - D-Design鞋款设计平台',
          requiresAuth: true
        }
      },
      {
        path: 'text-design',
        name: 'TextDesign',
        component: () => import('../components/design/TextDesign.vue'),
        meta: {
          title: '文字创款 - D-Design鞋款设计平台',
          requiresAuth: true
        }
      },
      {
        path: 'color-change',
        name: 'ColorChange',
        component: () => import('../components/design/colorChange.vue'),
        meta: {
          title: '配色换新 - D-Design鞋款设计平台',
          requiresAuth: true
        }
      },
      {
        path: 'smart-cutout',
        name: 'SmartCutout',
        component: () => import('../components/design/SmartCutout.vue'),
        meta: {
          title: '智能抠图 - D-Design鞋款设计平台',
          requiresAuth: true
        }
      }
    ]
  },
  {
    path: '/design/color-create',
    component: colorChange,
  },
  {
    path: '/design/style-extension',
    component: StyleExtension,
  },
  {
    path: '/design/style-extend',
    redirect: '/design/style-extension',
  },

  {
    path: '/ai-tools',
    name: 'AITools',
    component: () => import('../views/AITools.vue'),
    meta: {
      title: 'AI小工具 - D-Design鞋款设计平台',
      requiresAuth: true
    },
    children: [
      {
        path: 'image-swap',
        name: 'AIImageSwap',
        component: () => import('../components/ai-tools/AIImageSwap.vue'),
        meta: {
          title: 'AI换图 - D-Design鞋款设计平台',
          requiresAuth: true
        }
      },
      {
        path: 'element-remove',
        name: 'ElementRemove',
        component: () => import('../components/ai-tools/ElementRemove.vue'),
        meta: {
          title: '元素消除 - D-Design鞋款设计平台',
          requiresAuth: true
        }
      },
      {
        path: 'hd-enhance',
        name: 'HDEnhance',
        component: () => import('../components/ai-tools/HDEnhance.vue'),
        meta: {
          title: '高清放大 - D-Design鞋款设计平台',
          requiresAuth: true
        }
      },
      {
        path: 'image-restore',
        name: 'ImageRestore',
        component: () => import('../components/ai-tools/ImageRestore.vue'),
        meta: {
          title: '图片恢复 - D-Design鞋款设计平台',
          requiresAuth: true
        }
      },
      {
        path: 'watermark-remove',
        name: 'WatermarkRemove',
        component: () => import('../components/ai-tools/WatermarkRemove.vue'),
        meta: {
          title: '一键去水印 - D-Design鞋款设计平台',
          requiresAuth: true
        }
      },
      {
        path: 'line-art',
        name: 'LineArt',
        component: () => import('../components/ai-tools/LineArt.vue'),
        meta: {
          title: '一键线稿图 - D-Design鞋款设计平台',
          requiresAuth: true
        }
      }
    ]
  },
  {
    path: '/history',
    name: 'History',
    component: () => import('../views/History.vue'),
    meta: {
      title: '历史记录 - D-Design鞋款设计平台',
      requiresAuth: true
    }
  },
  {
    path: '/about',
    name: 'About',
    // 路由级别的代码分割，生成单独的chunk (about.[hash].js)
    // 当访问路由时才会加载
    component: () => import('../views/About.vue'),
    meta: {
      title: '关于我们 - D-Design鞋款设计平台'
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 全局导航守卫，设置页面标题
router.beforeEach(async (to, from, next) => {
  // 设置页面标题
  if (to.meta.title) {
    document.title = to.meta.title as string
  }
  
  // 登录验证逻辑
  if (to.meta.requiresAuth) {
    try {
      // 检查token是否有效
      const isTokenValid = await checkTokenValidity()
      
      if (isTokenValid) {
        // token有效，允许访问
        next()
      } else {
        // token无效，保存当前路径并重定向到登录页
        localStorage.setItem('redirectAfterLogin', to.fullPath)
        ElMessage.warning('登录已过期，请重新登录')
        next('/login')
      }
    } catch (error) {
      // 发生错误，重定向到登录页
      localStorage.setItem('redirectAfterLogin', to.fullPath)
      next('/login')
    }
  } else {
    // 不需要登录验证的页面
    // 如果是登录或注册页面，并且token有效，则重定向到首页
    if ((to.path === '/login' || to.path === '/register')) {
      const token = localStorage.getItem('token')
      if (token) {
        try {
          const isTokenValid = await checkTokenValidity()
          if (isTokenValid) {
            next('/dashboard')
            return
          }
        } catch (error) {
          // token验证失败，继续访问登录页
        }
      }
    }
    next()
  }
})

export default router 