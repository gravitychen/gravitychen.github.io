<template>
  <div class="auth-container">
    <div class="auth-card">
      <h2>数据同步</h2>
      <p class="auth-description">
        登录后，你的学习数据将在所有设备间自动同步
      </p>
      
      <div v-if="!isLoggedIn" class="auth-options">
        <div class="google-auth">
          <button 
            @click="signInWithGoogle" 
            class="auth-btn google-btn"
            :disabled="loading"
          >
            <svg class="google-icon" viewBox="0 0 24 24" width="20" height="20">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {{ loading ? '登录中...' : '使用 Google 登录' }}
          </button>
        </div>
        <div class="auth-note">
          <small>💡 点击"使用 Google 登录"按钮后，会弹出 Google 登录窗口，请在弹出窗口中输入您的 Google 账号和密码</small>
        </div>
      </div>
      
      <div v-else class="user-info">
        <div class="user-status">
          <div class="status-indicator online"></div>
          <span>已连接到云端</span>
        </div>
        <div v-if="currentUserId" class="user-id-info">
          <span class="user-id-label">用户ID:</span>
          <span class="user-id-value">{{ currentUserId }}</span>
        </div>
        <div v-if="userEmail" class="user-email-info">
          <span class="user-email-label">邮箱:</span>
          <span class="user-email-value">{{ userEmail }}</span>
        </div>
        <div v-if="lastSyncTime" class="sync-info">
          最后同步：{{ formatTime(lastSyncTime) }}
        </div>
        <div v-if="syncInProgress" class="sync-progress">
          正在同步数据...
        </div>
        <div class="sync-controls">
          <button @click="manualSync" class="auth-btn secondary" :disabled="syncInProgress">
            {{ syncInProgress ? '同步中...' : '手动同步' }}
          </button>
          <div class="migration-section">
            <input 
              v-model="sourceUserId" 
              type="text" 
              placeholder="输入源用户ID (如: device_r271tk)"
              class="migration-input"
              :disabled="migrationInProgress"
            >
            <button 
              @click="copyUserData" 
              class="auth-btn warning" 
              :disabled="syncInProgress || migrationInProgress || !sourceUserId"
            >
              {{ migrationInProgress ? '迁移中...' : '数据迁移' }}
            </button>
          </div>
          <button @click="signOut" class="auth-btn danger">
            退出登录
          </button>
        </div>
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
    const loading = ref(false)
    const error = ref('')
    const sourceUserId = ref('')
    const migrationInProgress = ref(false)

    const isLoggedIn = computed(() => dataStore.isOnline)
    const lastSyncTime = computed(() => dataStore.lastSyncTime)
    const syncInProgress = computed(() => dataStore.syncInProgress)
    const currentUserId = computed(() => {
      const user = authService.getCurrentUser()
      return user?.uid || null
    })
    const userEmail = computed(() => {
      const user = authService.getCurrentUser()
      return user?.email || null
    })

    const signInWithGoogle = async () => {
      loading.value = true
      error.value = ''
      try {
        console.log('开始 Google 登录...')
        console.log('注意：将弹出 Google 登录窗口，请在弹出窗口中输入您的 Google 账号和密码')
        
        // 添加提示信息
        error.value = '正在打开 Google 登录窗口，请在弹出的窗口中输入您的 Google 账号和密码...'
        
        const user = await authService.signInWithGoogle()
        console.log('Google 登录成功:', user)
        error.value = '' // 登录成功后清除提示
      } catch (err) {
        console.error('Google 登录失败详情:', err)
        if (err.code === 'auth/popup-closed-by-user') {
          error.value = '❌ 登录窗口已关闭。请重新点击"使用 Google 登录"按钮，然后在弹出的窗口中输入您的 Google 账号和密码。'
        } else if (err.code === 'auth/popup-blocked') {
          error.value = '❌ 登录窗口被浏览器阻止。请：\n1. 允许此网站的弹出窗口\n2. 重新点击"使用 Google 登录"按钮\n3. 在弹出的窗口中输入您的 Google 账号和密码'
        } else if (err.code === 'auth/unauthorized-domain') {
          error.value = '❌ 未授权的域名。请检查 Firebase 配置中的授权域名设置。'
        } else {
          error.value = `❌ 登录失败: ${err.message || '请检查网络连接和 Firebase 配置'}\n\n如果未看到登录窗口，请检查浏览器是否阻止了弹出窗口。`
        }
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

    const manualSync = async () => {
      loading.value = true
      error.value = ''
      try {
        await dataStore.manualSync()
        console.log('手动同步成功')
      } catch (err) {
        error.value = `同步失败: ${err.message}`
        console.error('手动同步失败:', err)
      } finally {
        loading.value = false
      }
    }

    const copyUserData = async () => {
      if (!sourceUserId.value || sourceUserId.value.trim() === '') {
        error.value = '请输入源用户ID'
        return
      }

      migrationInProgress.value = true
      error.value = ''
      
      try {
        console.log('开始复制用户数据，源用户ID:', sourceUserId.value)
        const result = await dataStore.copyUserData(sourceUserId.value.trim())
        console.log('数据复制成功:', result)
        
        const successMsg = `数据迁移成功！\n\n` +
          `已复制:\n` +
          `- 单词: ${result.copied.words} 个\n` +
          `- 句子: ${result.copied.sentences} 个\n` +
          `- 问答: ${result.copied.qa} 个\n\n` +
          `源用户数据:\n` +
          `- 单词: ${result.source.words} 个\n` +
          `- 句子: ${result.source.sentences} 个\n` +
          `- 问答: ${result.source.qa} 个`
        
        if (result.copied.skipped.words > 0 || result.copied.skipped.sentences > 0 || result.copied.skipped.qa > 0) {
          error.value = successMsg + `\n\n跳过（可能重复）:\n` +
            `- 单词: ${result.copied.skipped.words} 个\n` +
            `- 句子: ${result.copied.skipped.sentences} 个\n` +
            `- 问答: ${result.copied.skipped.qa} 个`
        } else {
          error.value = successMsg
        }
        
        // 清空输入框
        sourceUserId.value = ''
      } catch (err) {
        error.value = `数据迁移失败: ${err.message}`
        console.error('数据迁移失败:', err)
      } finally {
        migrationInProgress.value = false
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
      loading,
      error,
      sourceUserId,
      migrationInProgress,
      isLoggedIn,
      lastSyncTime,
      syncInProgress,
      currentUserId,
      userEmail,
      signInWithGoogle,
      signOut,
      manualSync,
      copyUserData,
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

/* 当Auth组件在login-required-overlay中使用时，移除背景和最小高度 */
.login-required-overlay .auth-container {
  background: transparent;
  min-height: auto;
  padding: 0;
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

.google-btn {
  background: white;
  color: #333;
  border: 1px solid #dadce0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  width: 100%;
}

.google-btn:hover:not(:disabled) {
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  transform: translateY(-1px);
}

.google-icon {
  flex-shrink: 0;
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

.user-id-info,
.user-email-info {
  color: #666;
  font-size: 12px;
  margin-bottom: 8px;
  text-align: left;
  padding: 6px 12px;
  background: #f5f5f5;
  border-radius: 6px;
  word-break: break-all;
}

.user-id-label,
.user-email-label {
  font-weight: 500;
  color: #999;
  margin-right: 8px;
}

.user-id-value,
.user-email-value {
  color: #333;
  font-family: 'Courier New', monospace;
  font-size: 11px;
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
  text-align: left;
  font-size: 14px;
  white-space: pre-line;
  line-height: 1.6;
}

.error-message:empty {
  display: none;
}

.auto-login-status {
  text-align: center;
  padding: 20px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #4CAF50;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 15px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.auto-login-status p {
  margin: 10px 0;
  color: #333;
  font-weight: 500;
}

.sync-controls {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 15px;
}

.sync-controls .auth-btn {
  flex: 1;
}

.migration-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.migration-input {
  padding: 12px;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.3s ease;
  width: 100%;
  box-sizing: border-box;
}

.migration-input:focus {
  outline: none;
  border-color: #ff9800;
}

.migration-input:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
}

.auth-btn.warning {
  background: #ff9800;
  color: white;
}

.auth-btn.warning:hover {
  background: #f57c00;
}

.auto-login-status small {
  color: #666;
  font-size: 12px;
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
