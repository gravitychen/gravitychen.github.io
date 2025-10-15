<template>
  <div class="auth-container">
    <div class="auth-card">
      <h2>数据同步</h2>
      <p class="auth-description">
        登录后，你的学习数据将在所有设备间自动同步
      </p>
      
      <div v-if="!isLoggedIn" class="auth-options">
        <button 
          @click="signInAnonymously" 
          class="auth-btn primary"
          :disabled="loading"
        >
          {{ loading ? '登录中...' : '快速登录（推荐）' }}
        </button>
        
        <div class="auth-note">
          <small>💡 如果快速登录失败，请使用邮箱登录</small>
        </div>
        
        <div class="divider">
          <span>或</span>
        </div>
        
        <div class="email-auth">
          <input 
            v-model="email" 
            type="email" 
            placeholder="邮箱地址"
            class="auth-input"
          >
          <input 
            v-model="password" 
            type="password" 
            placeholder="密码"
            class="auth-input"
          >
          <div class="auth-buttons">
            <button 
              @click="signInWithEmail" 
              class="auth-btn secondary"
              :disabled="loading || !email || !password"
            >
              登录
            </button>
            <button 
              @click="signUpWithEmail" 
              class="auth-btn secondary"
              :disabled="loading || !email || !password"
            >
              注册
            </button>
          </div>
        </div>
      </div>
      
      <div v-else class="user-info">
        <div class="user-status">
          <div class="status-indicator online"></div>
          <span>已连接到云端</span>
        </div>
        <div v-if="lastSyncTime" class="sync-info">
          最后同步：{{ formatTime(lastSyncTime) }}
        </div>
        <div v-if="syncInProgress" class="sync-progress">
          正在同步数据...
        </div>
        <button @click="signOut" class="auth-btn danger">
          退出登录
        </button>
      </div>
      
      <div v-if="error" class="error-message">
        {{ error }}
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useDataStore } from '../stores/dataStore.js'
import authService from '../firebase/authService.js'

export default {
  name: 'Auth',
  setup() {
    const dataStore = useDataStore()
    const email = ref('')
    const password = ref('')
    const loading = ref(false)
    const error = ref('')

    const isLoggedIn = computed(() => dataStore.isOnline)
    const lastSyncTime = computed(() => dataStore.lastSyncTime)
    const syncInProgress = computed(() => dataStore.syncInProgress)

    const signInAnonymously = async () => {
      loading.value = true
      error.value = ''
      try {
        console.log('开始匿名登录...')
        const user = await authService.signInAnonymously()
        console.log('登录成功:', user)
      } catch (err) {
        console.error('登录失败详情:', err)
        error.value = `登录失败: ${err.message || '请检查网络连接和 Firebase 配置'}`
      } finally {
        loading.value = false
      }
    }

    const signInWithEmail = async () => {
      loading.value = true
      error.value = ''
      try {
        await authService.signInWithEmail(email.value, password.value)
      } catch (err) {
        error.value = '登录失败，请检查邮箱和密码'
        console.error(err)
      } finally {
        loading.value = false
      }
    }

    const signUpWithEmail = async () => {
      loading.value = true
      error.value = ''
      try {
        await authService.signUpWithEmail(email.value, password.value)
      } catch (err) {
        error.value = '注册失败，请重试'
        console.error(err)
      } finally {
        loading.value = false
      }
    }

    const signOut = async () => {
      try {
        await authService.signOut()
      } catch (err) {
        error.value = '退出失败'
        console.error(err)
      }
    }

    const formatTime = (timeString) => {
      const date = new Date(timeString)
      return date.toLocaleString('zh-CN')
    }

    onMounted(() => {
      // 初始化云端同步
      dataStore.initializeCloudSync()
    })

    return {
      email,
      password,
      loading,
      error,
      isLoggedIn,
      lastSyncTime,
      syncInProgress,
      signInAnonymously,
      signInWithEmail,
      signUpWithEmail,
      signOut,
      formatTime
    }
  }
}
</script>

<style scoped>
.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.auth-card {
  background: white;
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  max-width: 400px;
  width: 100%;
}

.auth-card h2 {
  text-align: center;
  margin-bottom: 10px;
  color: #333;
}

.auth-description {
  text-align: center;
  color: #666;
  margin-bottom: 30px;
  line-height: 1.5;
}

.auth-options {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.auth-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.auth-btn.primary {
  background: #4CAF50;
  color: white;
}

.auth-btn.primary:hover:not(:disabled) {
  background: #45a049;
  transform: translateY(-2px);
}

.auth-btn.secondary {
  background: #2196F3;
  color: white;
  flex: 1;
}

.auth-btn.secondary:hover:not(:disabled) {
  background: #1976D2;
}

.auth-btn.danger {
  background: #f44336;
  color: white;
  width: 100%;
}

.auth-btn.danger:hover {
  background: #d32f2f;
}

.auth-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.auth-note {
  text-align: center;
  margin: 10px 0;
  color: #666;
  font-style: italic;
}

.divider {
  text-align: center;
  position: relative;
  color: #999;
}

.divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: #ddd;
  z-index: 1;
}

.divider span {
  background: white;
  padding: 0 15px;
  position: relative;
  z-index: 2;
}

.email-auth {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.auth-input {
  padding: 12px;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.3s ease;
}

.auth-input:focus {
  outline: none;
  border-color: #2196F3;
}

.auth-buttons {
  display: flex;
  gap: 10px;
}

.user-info {
  text-align: center;
}

.user-status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 15px;
  font-weight: 500;
  color: #4CAF50;
}

.status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #4CAF50;
}

.sync-info {
  color: #666;
  font-size: 14px;
  margin-bottom: 10px;
}

.sync-progress {
  color: #2196F3;
  font-size: 14px;
  margin-bottom: 20px;
}

.error-message {
  background: #ffebee;
  color: #c62828;
  padding: 12px;
  border-radius: 8px;
  margin-top: 15px;
  text-align: center;
  font-size: 14px;
}

@media (max-width: 480px) {
  .auth-container {
    padding: 10px;
  }
  
  .auth-card {
    padding: 30px 20px;
  }
  
  .auth-buttons {
    flex-direction: column;
  }
}
</style>
