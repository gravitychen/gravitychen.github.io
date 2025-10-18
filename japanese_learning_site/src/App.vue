<template>
  <div id="app">
    <nav class="navbar">
      <div class="nav-brand">
        <h1 v-if="!isUserLoggedIn">为了别人，学内在映射表达 log out</h1>
        <div v-else>
          <h1>为了别人，学内在映射表达 log in</h1>
          <div class="user-id-display">
            <div class="user-info">
              <span class="user-label">用户ID:</span>
              <span class="user-id">[{{ currentUserId }}]</span>
            </div>
            <div class="device-info">
              <span class="device-label">设备ID:</span>
              <span class="device-id">[{{ deviceId }}]</span>
            </div>
          </div>
        </div>
      </div>
      <div class="nav-controls">
        <!-- 同步状态指示器 -->
        <div v-if="dataStore.isOnline" class="sync-status">
          <div class="status-indicator" :class="{ 
            'online': !dataStore.syncInProgress, 
            'syncing': dataStore.syncInProgress 
          }"></div>
          <span class="sync-text">{{ dataStore.syncInProgress ? '同步中...' : '云端同步' }}</span>
          <span v-if="dataStore.lastSyncTime" class="sync-time">
            {{ formatSyncTime(dataStore.lastSyncTime) }}
          </span>
        </div>
        
        <!-- 控制按钮组 -->
        <div class="button-group">
          <!-- 语言切换按钮 -->
          <button @click="toggleLanguage" class="nav-button language-btn" :disabled="dataStore.syncInProgress" title="切换语言">
            {{ dataStore.showJapanese ? '🇯🇵' : '🇨🇳' }}
          </button>
          
          <!-- 检测重复数据按钮 -->
          <button @click="checkDuplicates" class="nav-button duplicate-btn" :disabled="dataStore.syncInProgress" title="检测并删除重复数据">
            🔍
          </button>
          
          <!-- 认证按钮 -->
          <button @click="showAuth = true" class="nav-button auth-btn" title="设置">
            {{ dataStore.isOnline ? '⚙️' : '🔑' }}
          </button>
        </div>
      </div>
    </nav>
    
    <main class="main-content">
      <router-view />
    </main>
    
    <!-- 认证弹窗 -->
    <div v-if="showAuth" class="auth-modal" @click="showAuth = false">
      <div class="auth-modal-content" @click.stop>
        <Auth @close="showAuth = false" />
      </div>
    </div>
    
    <nav class="bottom-nav">
      <router-link to="/" class="nav-item">
        <span class="nav-icon">🏠</span>
        <span class="nav-label">首页</span>
      </router-link>
      <router-link to="/words" class="nav-item">
        <span class="nav-icon">📝</span>
        <span class="nav-label">单词</span>
      </router-link>
      <router-link to="/sentences" class="nav-item">
        <span class="nav-icon">💬</span>
        <span class="nav-label">句子</span>
      </router-link>
      <router-link to="/qa" class="nav-item">
        <span class="nav-icon">❓</span>
        <span class="nav-label">问答</span>
      </router-link>
      <router-link to="/review" class="nav-item">
        <span class="nav-icon">📚</span>
        <span class="nav-label">复习</span>
      </router-link>
      <router-link to="/quiz" class="nav-item">
        <span class="nav-icon">🎯</span>
        <span class="nav-label">考试</span>
      </router-link>
    </nav>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useDataStore } from './stores/dataStore'
import Auth from './components/Auth.vue'
import authService from './firebase/authService.js'

export default {
  name: 'App',
  components: {
    Auth
  },
  setup() {
    const dataStore = useDataStore()
    const showAuth = ref(false)
    const syncTimeInterval = ref(null)
    const isLoggedIn = ref(false)
    
    // 监听认证状态变化
    authService.onAuthStateChange((user) => {
      isLoggedIn.value = !!(user && user.uid)
      console.log('认证状态变化:', isLoggedIn.value ? '已登录' : '未登录')
    })
    
    // 检查用户是否已登录
    const isUserLoggedIn = computed(() => {
      return isLoggedIn.value
    })
    
    // 获取当前用户ID（现在显示设备ID）
    const currentUserId = computed(() => {
      if (!isLoggedIn.value) return '未登录'
      const deviceUserId = authService.getDeviceUserId()
      if (deviceUserId) {
        // 显示设备ID（即用户ID）
        return deviceUserId
      }
      return '未登录'
    })

    // 获取设备ID（现在和用户ID相同）
    const deviceId = computed(() => {
      if (!isLoggedIn.value) return '未知设备'
      const deviceUserId = authService.getDeviceUserId()
      if (deviceUserId) {
        // 显示完整的设备ID（和用户ID相同）
        return deviceUserId
      }
      return '未知设备'
    })
    
    // 优化的语言切换
    const toggleLanguage = () => {
      if (!dataStore.syncInProgress) {
        dataStore.toggleLanguage()
      }
    }

    // 检测并删除重复数据
    const checkDuplicates = async () => {
      console.log('🔍 开始检测并删除重复数据...')
      
      let deletedCount = 0
      
      try {
        // 检测并删除重复单词
        const wordKeys = new Set()
        const wordsToDelete = []
        
        dataStore.words.forEach((word, index) => {
          const key = `${word.japanese}|${word.chinese}`
          if (wordKeys.has(key)) {
            wordsToDelete.push({ index, word, key })
          } else {
            wordKeys.add(key)
          }
        })

        // 删除重复单词
        for (const duplicate of wordsToDelete.reverse()) {
          try {
            await dataStore.deleteWord(duplicate.word.id)
            deletedCount++
            console.log('🗑️ 删除重复单词:', duplicate.word.japanese)
          } catch (error) {
            console.error('删除单词失败:', error)
          }
        }

        // 检测并删除重复句子
        const sentenceKeys = new Set()
        const sentencesToDelete = []
        
        dataStore.sentences.forEach((sentence, index) => {
          const key = `${sentence.japanese}|${sentence.chinese}`
          if (sentenceKeys.has(key)) {
            sentencesToDelete.push({ index, sentence, key })
          } else {
            sentenceKeys.add(key)
          }
        })

        // 删除重复句子
        for (const duplicate of sentencesToDelete.reverse()) {
          try {
            await dataStore.deleteSentence(duplicate.sentence.id)
            deletedCount++
            console.log('🗑️ 删除重复句子:', duplicate.sentence.japanese)
          } catch (error) {
            console.error('删除句子失败:', error)
          }
        }

        // 检测并删除重复问答
        const qaKeys = new Set()
        const qaToDelete = []
        
        dataStore.qa.forEach((qa, index) => {
          const key = `${qa.question}|${qa.answer}`
          if (qaKeys.has(key)) {
            qaToDelete.push({ index, qa, key })
          } else {
            qaKeys.add(key)
          }
        })

        // 删除重复问答
        for (const duplicate of qaToDelete.reverse()) {
          try {
            await dataStore.deleteQA(duplicate.qa.id)
            deletedCount++
            console.log('🗑️ 删除重复问答:', duplicate.qa.question)
          } catch (error) {
            console.error('删除问答失败:', error)
          }
        }

        // 显示结果
        if (deletedCount > 0) {
          alert(`✅ 成功删除 ${deletedCount} 个重复数据！\n- 重复单词: ${wordsToDelete.length} 个\n- 重复句子: ${sentencesToDelete.length} 个\n- 重复问答: ${qaToDelete.length} 个`)
        } else {
          alert('✅ 没有发现重复数据！')
        }

        console.log(`🎉 重复数据清理完成，共删除 ${deletedCount} 个重复项`)

      } catch (error) {
        console.error('删除重复数据时出错:', error)
        alert('❌ 删除重复数据时出错，请查看控制台')
      }
    }

    // 格式化同步时间
    const formatSyncTime = (timeString) => {
      if (!timeString) return ''
      
      try {
        const date = new Date(timeString)
        const now = new Date()
        const diffMs = now - date
        const diffMins = Math.floor(diffMs / 60000)
        
        if (diffMins < 1) return '刚刚'
        if (diffMins < 60) return `${diffMins}分钟前`
        
        const diffHours = Math.floor(diffMins / 60)
        if (diffHours < 24) return `${diffHours}小时前`
        
        return date.toLocaleDateString('zh-CN')
      } catch (error) {
        return '未知'
      }
    }

    // 组件挂载时的优化
    onMounted(() => {
      // 初始化检查登录状态
      const user = authService.getCurrentUser()
      isLoggedIn.value = !!(user && user.uid)
      console.log('组件挂载时登录状态:', isLoggedIn.value ? '已登录' : '未登录')
      
      // 设置定时器更新同步时间显示
      syncTimeInterval.value = setInterval(() => {
        // 触发响应式更新
      }, 60000) // 每分钟更新一次
    })

    // 组件卸载时清理
    onUnmounted(() => {
      if (syncTimeInterval.value) {
        clearInterval(syncTimeInterval.value)
      }
    })

    return {
      dataStore,
      showAuth,
      currentUserId,
      deviceId,
      isUserLoggedIn,
      toggleLanguage,
      checkDuplicates,
      formatSyncTime
    }
  }
}
</script>

<style>
#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.navbar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.nav-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.button-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  padding: 0.25rem;
  border-radius: 12px;
  backdrop-filter: blur(10px);
}

.sync-status {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  background: rgba(255, 255, 255, 0.15);
  padding: 8px 12px;
  border-radius: 20px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.sync-text {
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #4CAF50;
  transition: all 0.3s ease;
}

.status-indicator.online {
  background: #4CAF50;
  box-shadow: 0 0 6px rgba(76, 175, 80, 0.6);
}

.status-indicator.syncing {
  background: #FF9800;
}

.sync-time {
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.7);
  margin-left: 5px;
}

.auth-button {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.3);
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s;
}

.auth-button:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
}

.nav-brand h1 {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
}

.user-id-display {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.8);
  margin-top: 5px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.user-info, .device-info {
  display: flex;
  align-items: center;
  gap: 5px;
}

.user-label, .device-label {
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 500;
}

.user-id, .device-id {
  font-family: 'Courier New', monospace;
  font-size: 0.75rem;
  background: rgba(255, 255, 255, 0.1);
  padding: 2px 6px;
  border-radius: 3px;
  color: #4CAF50;
  font-weight: 600;
}

.nav-button {
  background: rgba(255, 255, 255, 0.15);
  color: white;
  border: none;
  padding: 0.5rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 1.1rem;
  min-width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(5px);
}

.nav-button:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.25);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.nav-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.language-btn:hover:not(:disabled) {
  background: rgba(33, 150, 243, 0.3);
}

.duplicate-btn {
  background: rgba(255, 193, 7, 0.2);
  color: #FFC107;
}

.duplicate-btn:hover:not(:disabled) {
  background: rgba(255, 193, 7, 0.4);
  color: #FFD54F;
}

.auth-btn:hover:not(:disabled) {
  background: rgba(76, 175, 80, 0.3);
}

.main-content {
  flex: 1;
  padding: 1rem;
  padding-bottom: 80px; /* 为底部导航留出空间 */
}

.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  border-top: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-around;
  padding: 0.5rem 0;
  box-shadow: 0 -2px 10px rgba(0,0,0,0.1);
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-decoration: none;
  color: #666;
  padding: 0.5rem;
  transition: color 0.3s;
  min-width: 60px;
}

.nav-item.router-link-active {
  color: #667eea;
}

.nav-icon {
  font-size: 1.2rem;
  margin-bottom: 0.2rem;
}

.nav-label {
  font-size: 0.7rem;
  font-weight: 500;
}

/* 认证弹窗样式 */
.auth-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
}

.auth-modal-content {
  background: white;
  border-radius: 12px;
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

/* 移动端优化 */
@media (max-width: 480px) {
  .main-content {
    padding: 0.8rem;
  }
  
  .nav-brand h1 {
    font-size: 1.3rem;
  }
  
  .nav-controls {
    gap: 5px;
  }
  
  .sync-status {
    font-size: 0.8rem;
    padding: 3px 8px;
  }
  
  .auth-button {
    padding: 0.3rem 0.6rem;
    font-size: 0.8rem;
  }
}
</style>
