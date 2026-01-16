<template>
  <div class="auth-container">
    <div class="auth-card">
      <div class="card-header">
        <div class="header-icon">☁️</div>
        <h2>数据同步</h2>
        <p class="auth-description">
          登录后，你的学习数据将在所有设备间自动同步
        </p>
      </div>
      
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
            <span>{{ loading ? '登录中...' : '使用 Google 登录' }}</span>
            <span v-if="loading" class="loading-dots">
              <span>.</span><span>.</span><span>.</span>
            </span>
          </button>
        </div>
        <div class="auth-note">
          <div class="note-icon">💡</div>
          <small>点击"使用 Google 登录"按钮后，会弹出 Google 登录窗口，请在弹出窗口中输入您的 Google 账号和密码</small>
        </div>
      </div>
      
      <div v-else class="user-info">
        <!-- 连接状态卡片 -->
        <div class="status-card">
          <div class="status-header">
            <div class="status-indicator-wrapper">
              <div class="status-indicator online" :class="{ 'pulsing': !syncInProgress }"></div>
              <span class="status-text">{{ syncInProgress ? '同步中...' : '已连接到云端' }}</span>
            </div>
            <div v-if="lastSyncTime" class="sync-time-badge">
              <span class="time-icon">🕐</span>
              <span>{{ formatTime(lastSyncTime) }}</span>
            </div>
          </div>
        </div>

        <!-- 用户信息卡片 -->
        <div class="info-cards">
          <div v-if="currentUserId && currentUserId !== '未设置'" class="info-card">
            <div class="info-icon">🆔</div>
            <div class="info-content">
              <div class="info-label">用户 ID</div>
              <div class="info-value">{{ currentUserId }}</div>
            </div>
            <button class="copy-btn" @click="copyToClipboard(currentUserId)" title="复制ID">
              📋
            </button>
          </div>
          
          <div v-if="userEmail" class="info-card">
            <div class="info-icon">📧</div>
            <div class="info-content">
              <div class="info-label">邮箱</div>
              <div class="info-value">{{ userEmail }}</div>
            </div>
          </div>
        </div>

        <!-- 操作按钮区域 -->
        <div class="action-section">
          <h3 class="section-title">操作</h3>
          <div class="action-buttons">
            <button 
              @click="manualSync" 
              class="action-btn sync-btn" 
              :disabled="syncInProgress"
            >
              <span class="btn-icon">{{ syncInProgress ? '⏳' : '🔄' }}</span>
              <span>{{ syncInProgress ? '同步中...' : '手动同步' }}</span>
            </button>
            
            <button 
              @click="signOut" 
              class="action-btn logout-btn"
            >
              <span class="btn-icon">🚪</span>
              <span>退出登录</span>
            </button>
          </div>
        </div>

        <!-- 数据迁移区域 -->
        <div class="migration-section">
          <h3 class="section-title">数据迁移</h3>
          <p class="section-desc">从其他用户ID迁移数据到当前账户</p>
          <div class="migration-input-group">
            <input 
              v-model="sourceUserId" 
              type="text" 
              placeholder="输入源用户ID（用于数据迁移）"
              class="migration-input"
              :disabled="migrationInProgress"
            >
            <button 
              @click="copyUserData" 
              class="migration-btn" 
              :disabled="syncInProgress || migrationInProgress || !sourceUserId"
            >
              <span v-if="!migrationInProgress">📥</span>
              <span v-else class="spinner"></span>
              <span>{{ migrationInProgress ? '迁移中...' : '开始迁移' }}</span>
            </button>
          </div>
        </div>
      </div>
      
      <div v-if="error" class="error-message">
        <div class="error-icon">⚠️</div>
        <div class="error-content">{{ error }}</div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useDataStore } from '../stores/dataStore.js'
import authService from '../firebase/authService.js'
import { getDataOwnerId } from '../utils/dataOwnerId.js'

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
    // 当前 dataOwnerId（不再显示 Firebase UID）
    const currentUserId = computed(() => {
      return getDataOwnerId() || '未设置'
    })
    const userEmail = computed(() => {
      const user = authService.getCurrentUser()
      return user?.email || null
    })

    const signInWithGoogle = async (retryCount = 0) => {
      loading.value = true
      error.value = ''
      try {
        console.log('开始 Google 登录...', retryCount > 0 ? `(重试 ${retryCount})` : '')
        console.log('注意：将弹出 Google 登录窗口，请在弹出窗口中输入您的 Google 账号和密码')
        
        // 添加提示信息
        if (retryCount === 0) {
          error.value = '正在打开 Google 登录窗口，请在弹出的窗口中输入您的 Google 账号和密码...'
        } else {
          error.value = `正在重试登录... (${retryCount}/2)`
        }
        
        const user = await authService.signInWithGoogle()
        console.log('Google 登录成功:', user)
        error.value = '' // 登录成功后清除提示
      } catch (err) {
        console.error('Google 登录失败详情:', err)
        
        // 处理 sessionStorage 错误，提供重试机制
        const isSessionStorageError = err.code === 'auth/session-storage-error' || 
                                      err.message?.includes('missing initial state') ||
                                      err.message?.includes('sessionStorage') ||
                                      err.code === 'auth/unauthorized-domain'
        
        if (isSessionStorageError && retryCount < 2) {
          // 如果是 sessionStorage 错误且未达到重试上限，等待后重试
          console.log(`检测到会话存储问题，${2 - retryCount} 秒后重试...`)
          error.value = `检测到会话存储问题，${2 - retryCount} 秒后自动重试...`
          await new Promise(resolve => setTimeout(resolve, 2000))
          return signInWithGoogle(retryCount + 1)
        }
        
        // 处理各种错误情况
        if (err.code === 'auth/popup-closed-by-user') {
          error.value = '❌ 登录窗口已关闭。请重新点击"使用 Google 登录"按钮，然后在弹出的窗口中输入您的 Google 账号和密码。'
        } else if (err.code === 'auth/popup-blocked') {
          error.value = '❌ 登录窗口被浏览器阻止。请：\n1. 允许此网站的弹出窗口\n2. 重新点击"使用 Google 登录"按钮\n3. 在弹出的窗口中输入您的 Google 账号和密码'
        } else if (err.code === 'auth/unauthorized-domain') {
          error.value = '❌ 未授权的域名。请检查 Firebase 配置中的授权域名设置。'
        } else if (isSessionStorageError) {
          // sessionStorage 相关错误（已重试但仍失败）
          error.value = '❌ 登录失败：浏览器会话存储问题。\n\n' +
            '可能的原因：\n' +
            '1. 浏览器阻止了会话存储访问（如隐私模式）\n' +
            '2. 多个 Google 账号切换时会话状态丢失\n' +
            '3. 浏览器安全设置限制\n\n' +
            '解决方案：\n' +
            '1. 刷新页面后重试（按 F5 或 Ctrl+R）\n' +
            '2. 关闭隐私模式或允许会话存储\n' +
            '3. 清除浏览器缓存和 Cookie 后重试\n' +
            '4. 尝试使用其他浏览器\n' +
            '5. 如果使用多个 Google 账号，请先退出其他账号'
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

    const copyToClipboard = async (text) => {
      try {
        await navigator.clipboard.writeText(text)
        error.value = '✅ 已复制到剪贴板！'
        setTimeout(() => {
          error.value = ''
        }, 2000)
      } catch (err) {
        error.value = '❌ 复制失败，请手动复制'
      }
    }

    onMounted(() => {
      // 初始化云端同步（基于 dataOwnerId）
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
      formatTime,
      copyToClipboard
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
  border-radius: 20px;
  padding: 0;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  width: 100%;
  display: flex;
  flex-direction: column;
  max-height: 100%;
  overflow: hidden;
}

.card-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 32px 32px 24px;
  text-align: center;
  color: white;
}

.header-icon {
  font-size: 48px;
  margin-bottom: 12px;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

.auth-card h2 {
  margin: 0 0 8px 0;
  color: white;
  font-size: 28px;
  font-weight: 700;
}

.auth-description {
  margin: 0;
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  line-height: 1.6;
}

.auth-options {
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.auth-btn {
  padding: 14px 24px;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.google-btn {
  background: white;
  color: #333;
  border: 2px solid #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  width: 100%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.google-btn:hover:not(:disabled) {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
  border-color: #4285F4;
}

.google-btn:active:not(:disabled) {
  transform: translateY(0);
}

.google-icon {
  flex-shrink: 0;
}

.loading-dots {
  display: inline-flex;
  gap: 2px;
  margin-left: 8px;
}

.loading-dots span {
  animation: dot-bounce 1.4s infinite ease-in-out;
}

.loading-dots span:nth-child(2) {
  animation-delay: 0.2s;
}

.loading-dots span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes dot-bounce {
  0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
  40% { transform: scale(1.2); opacity: 1; }
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
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 12px;
  border-left: 4px solid #ffc107;
  color: #666;
  font-size: 13px;
  line-height: 1.6;
}

.note-icon {
  font-size: 20px;
  flex-shrink: 0;
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
  padding: 32px;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
}

/* 状态卡片 */
.status-card {
  background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 24px;
  border: 2px solid #4caf50;
}

.status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.status-indicator-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}

.status-indicator {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #4caf50;
  box-shadow: 0 0 0 4px rgba(76, 175, 80, 0.2);
}

.status-indicator.pulsing {
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.7);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(76, 175, 80, 0);
  }
}

.status-text {
  font-weight: 600;
  color: #2e7d32;
  font-size: 16px;
}

.sync-time-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  background: white;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  color: #666;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.time-icon {
  font-size: 14px;
}

/* 信息卡片 */
.info-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}

.info-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 12px;
  border: 1px solid #e9ecef;
  transition: all 0.3s ease;
}

.info-card:hover {
  background: #f1f3f5;
  border-color: #667eea;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
}

.info-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.info-content {
  flex: 1;
  min-width: 0;
}

.info-label {
  font-size: 12px;
  color: #999;
  margin-bottom: 4px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-value {
  font-size: 14px;
  color: #333;
  font-family: 'Courier New', monospace;
  word-break: break-all;
  font-weight: 600;
}

.copy-btn {
  background: transparent;
  border: none;
  font-size: 18px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: all 0.2s ease;
  opacity: 0.6;
}

.copy-btn:hover {
  background: #e9ecef;
  opacity: 1;
  transform: scale(1.1);
}

/* 操作区域 */
.action-section {
  margin-bottom: 24px;
}

.section-title {
  font-size: 16px;
  font-weight: 700;
  color: #333;
  margin: 0 0 12px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-desc {
  font-size: 13px;
  color: #666;
  margin: 0 0 16px 0;
  line-height: 1.5;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 20px;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  width: 100%;
}

.sync-btn {
  background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
  color: white;
}

.sync-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(33, 150, 243, 0.4);
}

.logout-btn {
  background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%);
  color: white;
}

.logout-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(244, 67, 54, 0.4);
}

.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.btn-icon {
  font-size: 18px;
}

.error-message {
  margin: 0 32px 32px;
  background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%);
  color: #c62828;
  padding: 16px;
  border-radius: 12px;
  border-left: 4px solid #f44336;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  font-size: 14px;
  white-space: pre-line;
  line-height: 1.6;
  box-shadow: 0 2px 8px rgba(244, 67, 54, 0.15);
}

.error-message:empty {
  display: none;
}

.error-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.error-content {
  flex: 1;
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

/* 数据迁移区域 */
.migration-section {
  background: #fff9e6;
  border-radius: 16px;
  padding: 20px;
  border: 2px solid #ffc107;
}

.migration-input-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.migration-input {
  padding: 14px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  font-size: 14px;
  transition: all 0.3s ease;
  width: 100%;
  box-sizing: border-box;
  background: white;
  font-family: 'Courier New', monospace;
}

.migration-input:focus {
  outline: none;
  border-color: #ff9800;
  box-shadow: 0 0 0 3px rgba(255, 152, 0, 0.1);
}

.migration-input:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
  opacity: 0.6;
}

.migration-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 20px;
  background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(255, 152, 0, 0.3);
  width: 100%;
}

.migration-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 152, 0, 0.4);
}

.migration-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.auto-login-status small {
  color: #666;
  font-size: 12px;
}

/* 移动端优化 */
@media (max-width: 480px) {
  .auth-container {
    padding: 10px;
  }
  
  .card-header {
    padding: 24px 20px 20px;
  }
  
  .user-info {
    padding: 20px;
  }
  
  .error-message {
    margin: 0 20px 20px;
  }
  
  .status-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .sync-time-badge {
    width: 100%;
    justify-content: center;
  }
  
  .action-btn {
    width: 100%;
  }
  
  .migration-btn {
    width: 100%;
  }
}
</style>
