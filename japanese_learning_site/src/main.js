import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import Home from './components/Home.vue'
import Words from './components/Words.vue'
import Sentences from './components/Sentences.vue'
import QA from './components/QA.vue'
import Review from './components/Review.vue'
import Quiz from './components/Quiz.vue'
import { useDataStore } from './stores/dataStore.js'

const routes = [
  { path: '/', component: Home },
  { path: '/words', component: Words },
  { path: '/sentences', component: Sentences },
  { path: '/qa', component: QA },
  { path: '/review', component: Review },
  { path: '/quiz', component: Quiz },
  // 语言路由
  { path: '/japanese', component: Home },
  { path: '/english', component: Home },
  { path: '/korean', component: Home },
  { path: '/hindi', component: Home }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫 - 处理语言切换
router.beforeEach((to, from, next) => {
  const dataStore = useDataStore()
  
  // 检查是否是语言路由
  const languageMap = {
    '/japanese': 'ja',
    '/english': 'en', 
    '/korean': 'ko',
    '/hindi': 'hi'
  }
  
  if (languageMap[to.path]) {
    // 切换到对应语言
    dataStore.switchLanguage(languageMap[to.path])
    // 重定向到首页
    next('/')
  } else {
    next()
  }
})

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(router)

// 初始化云端同步
const dataStore = useDataStore()
dataStore.initializeCloudSync()

// 应用启动后立即尝试自动登录
app.mount('#app')

// 设备认证会在authService构造函数中自动初始化
// 不需要额外的登录逻辑
