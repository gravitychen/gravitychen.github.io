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
import SyncTest from './components/SyncTest.vue'
import AuthDebug from './components/AuthDebug.vue'

const routes = [
  { path: '/', component: Home },
  { path: '/words', component: Words },
  { path: '/sentences', component: Sentences },
  { path: '/qa', component: QA },
  { path: '/review', component: Review },
  { path: '/quiz', component: Quiz },
  { path: '/sync-test', component: SyncTest },
  { path: '/auth-debug', component: AuthDebug }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')
