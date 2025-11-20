<template>
  <div id="app">
    <!-- 页面刷新时的提示弹窗 -->
    <div v-if="showRefreshQuestion" class="refresh-question-modal" @click="showRefreshQuestion = false">
      <!-- 修改前
      <div class="refresh-question-content" @click.stop>  <!- 内容 -></div>
      问题：@click.stop 阻止了事件冒泡，点击内容区域不会触发父元素的点击事件。
      修改后
      <div class="refresh-question-content">  <!- 内容 -></div>
      原理：
      移除了 @click.stop
      点击内容区域时，事件会冒泡到父元素（.refresh-question-modal）
      父元素的 @click="showRefreshQuestion = false" 会执行，关闭弹窗 -->

      <div class="refresh-question-content">
        <h3>你为什么要学习 "内在的另外一种表达" ？</h3>
        <p class="question-hint">点击屏幕任何地方关闭</p>
      </div>
    </div>

    <nav class="navbar">
      <div class="nav-brand">
        <h1 v-if="!isUserLoggedIn">把内在外在表达出来 log out</h1>
        <div v-else>
          <h1>把内在外在表达出来</h1>
          <div class="user-id-display">
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
          <!-- 学习语言选择器 -->
          <div class="language-selector">
            <select v-model="dataStore.currentLanguage" @change="switchLanguage" class="language-select" :disabled="dataStore.syncInProgress" title="选择学习语言">
              <option v-for="lang in dataStore.supportedLanguages" :key="lang.code" :value="lang.code">
                {{ lang.flag }} {{ lang.name }}
              </option>
            </select>
          </div>
          
          <!-- 语言切换按钮 -->
          <button @click="toggleLanguage" class="nav-button language-btn" :disabled="dataStore.syncInProgress" title="切换显示语言">
            ↔️
          </button>
          
          <!-- 检测重复数据按钮 -->
          <button @click="checkDuplicates" class="nav-button duplicate-btn" :disabled="dataStore.syncInProgress" title="检测并删除重复数据">
            🔍
          </button>
          
          <!-- 认证按钮 -->
          <button @click="showAuth = true" class="nav-button auth-btn" title="设置">
            {{ dataStore.isOnline ? '⚙️' : '🔑' }}
          </button>
          
          <!-- 日志查看按钮 -->
          <button @click="showLogs = !showLogs" class="nav-button log-btn" title="查看日志">
            📋
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
    
    <!-- 日志显示面板 -->
    <div v-if="showLogs" class="log-panel">
      <div class="log-header">
        <h3>📋 日志查看器</h3>
        <div class="log-controls">
          <button @click="clearLogs" class="log-btn-clear">清空</button>
          <button @click="copyLogs" class="log-btn-copy">复制</button>
          <button @click="showLogs = false" class="log-btn-close">关闭</button>
        </div>
      </div>
      <div class="log-content" ref="logContent">
        <div v-for="(log, index) in logs" :key="index" :class="['log-item', log.type]">
          <span class="log-time">{{ log.time }}</span>
          <span class="log-message">{{ log.message }}</span>
        </div>
        <div v-if="logs.length === 0" class="log-empty">暂无日志</div>
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
    const showLogs = ref(false)
    const showRefreshQuestion = ref(false)
    const syncTimeInterval = ref(null)
    const isLoggedIn = ref(false)
    const logs = ref([])
    const logContent = ref(null)
    const maxLogs = 500 // 最多保存500条日志
    
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

    // 切换学习语言
    const switchLanguage = () => {
      if (!dataStore.syncInProgress) {
        dataStore.switchLanguage(dataStore.currentLanguage)
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

    // 拦截 console.log 并显示在页面上
    const originalLog = console.log
    const originalError = console.error
    const originalWarn = console.warn
    
    console.log = (...args) => {
      originalLog.apply(console, args)
      addLog('log', formatLogMessage(args))
    }
    
    console.error = (...args) => {
      originalError.apply(console, args)
      addLog('error', formatLogMessage(args))
    }
    
    console.warn = (...args) => {
      originalWarn.apply(console, args)
      addLog('warn', formatLogMessage(args))
    }
    
    const formatLogMessage = (args) => {
      return args.map(arg => {
        if (typeof arg === 'object' && arg !== null) {
          try {
            return JSON.stringify(arg, null, 2)
          } catch (e) {
            return String(arg)
          }
        }
        return String(arg)
      }).join(' ')
    }
    
    const addLog = (type, message) => {
      const time = new Date().toLocaleTimeString('zh-CN')
      logs.value.push({
        type,
        message,
        time
      })
      
      // 限制日志数量
      if (logs.value.length > maxLogs) {
        logs.value.shift()
      }
      
      // 自动滚动到底部
      if (showLogs.value && logContent.value) {
        setTimeout(() => {
          logContent.value.scrollTop = logContent.value.scrollHeight
        }, 100)
      }
    }
    
    const clearLogs = () => {
      logs.value = []
    }
    
    const copyLogs = () => {
      const logText = logs.value.map(log => `[${log.time}] ${log.message}`).join('\n')
      navigator.clipboard.writeText(logText).then(() => {
        alert('日志已复制到剪贴板！')
      }).catch(() => {
        // 如果复制失败，使用备用方法
        const textarea = document.createElement('textarea')
        textarea.value = logText
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
        alert('日志已复制到剪贴板！')
      })
    }
    
    // 组件挂载时的优化
    onMounted(() => {
      // 初始化检查登录状态
      const user = authService.getCurrentUser()
      isLoggedIn.value = !!(user && user.uid)
      console.log('组件挂载时登录状态:', isLoggedIn.value ? '已登录' : '未登录')
      
      // 页面刷新时显示问题弹窗
      showRefreshQuestion.value = true
      
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
      // 恢复原始的 console 方法
      console.log = originalLog
      console.error = originalError
      console.warn = originalWarn
    })

    return {
      dataStore,
      showAuth,
      showLogs,
      showRefreshQuestion,
      logs,
      logContent,
      currentUserId,
      deviceId,
      isUserLoggedIn,
      toggleLanguage,
      switchLanguage,
      checkDuplicates,
      formatSyncTime,
      clearLogs,
      copyLogs
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

.language-selector {
  display: flex;
  align-items: center;
}

.language-select {
  background: rgba(255, 255, 255, 0.15);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 0.4rem 0.6rem;
  border-radius: 8px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(5px);
  min-width: 120px;
}

.language-select:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.25);
  border-color: rgba(255, 255, 255, 0.5);
}

.language-select:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.language-select option {
  background: #333;
  color: white;
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

/* 页面刷新时的提示弹窗样式 */
.refresh-question-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 3000;
  padding: 20px;
  animation: fadeIn 0.3s ease;
  cursor: pointer;
  /* 确保弹窗不会影响页面其他内容的显示 */
  pointer-events: auto;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.refresh-question-content {
  background: white;
  border-radius: 16px;
  padding: 2.5rem;
  max-width: 500px;
  width: 100%;
  text-align: center;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease;
  cursor: pointer;
  pointer-events: auto;
}

@keyframes slideUp {
  from {
    transform: translateY(30px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.refresh-question-content h3 {
  font-size: 1.5rem;
  color: #333;
  margin-bottom: 1.5rem;
  line-height: 1.6;
  font-weight: 600;
}

.question-hint {
  color: #999;
  font-size: 0.9rem;
  margin-top: 1rem;
  font-style: italic;
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
@media (max-width: 768px) {
  .navbar {
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
  }
  
  .nav-brand {
    width: 100%;
    text-align: center;
  }
  
  .nav-brand h1 {
    font-size: 1.2rem;
  }
  
  .nav-controls {
    width: 100%;
    justify-content: center;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  
  .button-group {
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.3rem;
  }
  
  .language-selector {
    order: 1;
    width: 100%;
    max-width: 200px;
  }
  
  .language-select {
    width: 100%;
    font-size: 0.8rem;
    padding: 0.3rem 0.5rem;
  }
  
  .nav-button {
    min-width: 35px;
    height: 35px;
    font-size: 1rem;
    padding: 0.3rem;
  }
  
  .sync-status {
    font-size: 0.7rem;
    padding: 2px 6px;
    order: 2;
    width: 100%;
    justify-content: center;
  }
  
  .main-content {
    padding: 0.8rem;
    padding-bottom: 100px;
  }
  
  .user-id-display {
    font-size: 0.7rem;
  }
}

@media (max-width: 480px) {
  .navbar {
    padding: 0.8rem;
  }
  
  .nav-brand h1 {
    font-size: 1rem;
  }
  
  .nav-controls {
    gap: 0.3rem;
  }
  
  .button-group {
    gap: 0.2rem;
  }
  
  .nav-button {
    min-width: 30px;
    height: 30px;
    font-size: 0.9rem;
    padding: 0.2rem;
  }
  
  .language-select {
    font-size: 0.7rem;
    padding: 0.2rem 0.4rem;
  }
  
  .sync-status {
    font-size: 0.6rem;
    padding: 1px 4px;
  }
  
  .user-id-display {
    font-size: 0.6rem;
  }
  
  .user-id, .device-id {
    font-size: 0.6rem;
    padding: 1px 4px;
  }
}

/* 日志面板样式 */
.log-panel {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  z-index: 2000;
  display: flex;
  flex-direction: column;
  color: white;
}

.log-header {
  padding: 1rem;
  background: rgba(102, 126, 234, 0.9);
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 2px solid rgba(255, 255, 255, 0.2);
}

.log-header h3 {
  margin: 0;
  font-size: 1.2rem;
}

.log-controls {
  display: flex;
  gap: 0.5rem;
}

.log-btn-clear,
.log-btn-copy,
.log-btn-close {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s;
}

.log-btn-clear:hover,
.log-btn-copy:hover,
.log-btn-close:hover {
  background: rgba(255, 255, 255, 0.3);
}

.log-content {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  font-family: 'Courier New', monospace;
  font-size: 0.85rem;
  line-height: 1.6;
}

.log-item {
  margin-bottom: 0.5rem;
  padding: 0.5rem;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.05);
  word-break: break-all;
}

.log-item.error {
  background: rgba(244, 67, 54, 0.2);
  border-left: 3px solid #f44336;
}

.log-item.warn {
  background: rgba(255, 152, 0, 0.2);
  border-left: 3px solid #ff9800;
}

.log-item.log {
  background: rgba(76, 175, 80, 0.1);
  border-left: 3px solid #4caf50;
}

.log-time {
  color: rgba(255, 255, 255, 0.6);
  margin-right: 0.5rem;
  font-size: 0.75rem;
}

.log-message {
  color: rgba(255, 255, 255, 0.9);
}

.log-empty {
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
  padding: 2rem;
}

.log-btn {
  background: rgba(33, 150, 243, 0.2);
  color: #2196F3;
}

.log-btn:hover:not(:disabled) {
  background: rgba(33, 150, 243, 0.4);
}

/* 移动端优化 */
@media (max-width: 768px) {
  .log-header {
    padding: 0.8rem;
    flex-wrap: wrap;
  }
  
  .log-header h3 {
    font-size: 1rem;
    width: 100%;
    margin-bottom: 0.5rem;
  }
  
  .log-controls {
    width: 100%;
    justify-content: flex-end;
  }
  
  .log-content {
    font-size: 0.75rem;
    padding: 0.8rem;
  }
  
  .log-item {
    padding: 0.4rem;
  }
}
</style>
