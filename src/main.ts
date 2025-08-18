import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import App from './App.vue'
import router from './router'
import './styles/index.scss'

const app = createApp(App)

// 使用Element Plus，并设置中文语言
app.use(ElementPlus, {
  locale: zhCn,
})

// 使用路由
app.use(router)

// 使用Pinia状态管理
const pinia = createPinia()
app.use(pinia)

// 初始化用户状态
import { useUserStore } from './store/user'
const userStore = useUserStore()
userStore.initializeFromStorage()

app.mount('#app')
