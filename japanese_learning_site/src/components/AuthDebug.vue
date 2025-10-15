<template>
  <div class="auth-debug">
    <h2>Firebase 连接调试</h2>
    
    <div class="debug-section">
      <h3>Firebase 配置检查</h3>
      <div class="config-info">
        <div>API Key: {{ config.apiKey ? '✅ 已配置' : '❌ 未配置' }}</div>
        <div>Project ID: {{ config.projectId ? '✅ 已配置' : '❌ 未配置' }}</div>
        <div>Auth Domain: {{ config.authDomain ? '✅ 已配置' : '❌ 未配置' }}</div>
      </div>
    </div>

    <div class="debug-section">
      <h3>连接测试</h3>
      <button @click="testConnection" :disabled="testing" class="test-btn">
        {{ testing ? '测试中...' : '测试连接' }}
      </button>
      <div v-if="connectionResult" class="result">
        {{ connectionResult }}
      </div>
    </div>

    <div class="debug-section">
      <h3>认证测试</h3>
      <button @click="testAuth" :disabled="testing" class="test-btn">
        {{ testing ? '测试中...' : '测试匿名登录' }}
      </button>
      <div v-if="authResult" class="result">
        {{ authResult }}
      </div>
    </div>

    <div class="debug-section">
      <h3>错误日志</h3>
      <div class="error-log">
        <div v-for="(error, index) in errors" :key="index" class="error-item">
          {{ error }}
        </div>
      </div>
    </div>

    <div class="debug-section">
      <h3>网络状态</h3>
      <div>在线状态: {{ navigator.onLine ? '✅ 在线' : '❌ 离线' }}</div>
      <div>用户代理: {{ navigator.userAgent }}</div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { auth, db } from '../firebase/config.js'
import { signInAnonymously } from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'

export default {
  name: 'AuthDebug',
  setup() {
    const config = ref({})
    const testing = ref(false)
    const connectionResult = ref('')
    const authResult = ref('')
    const errors = ref([])

    const addError = (error) => {
      errors.value.push(`${new Date().toLocaleTimeString()}: ${error}`)
    }

    const testConnection = async () => {
      testing.value = true
      connectionResult.value = ''
      
      try {
        // 测试 Firestore 连接
        const testDoc = doc(db, 'test', 'connection')
        await setDoc(testDoc, { 
          timestamp: new Date().toISOString(),
          message: '连接测试成功'
        })
        
        const docSnap = await getDoc(testDoc)
        if (docSnap.exists()) {
          connectionResult.value = '✅ Firestore 连接成功'
        } else {
          connectionResult.value = '❌ Firestore 连接失败'
        }
      } catch (error) {
        connectionResult.value = `❌ 连接失败: ${error.message}`
        addError(`连接测试失败: ${error.message}`)
      } finally {
        testing.value = false
      }
    }

    const testAuth = async () => {
      testing.value = true
      authResult.value = ''
      
      try {
        const result = await signInAnonymously(auth)
        authResult.value = `✅ 匿名登录成功: ${result.user.uid}`
      } catch (error) {
        authResult.value = `❌ 匿名登录失败: ${error.message}`
        addError(`认证失败: ${error.message}`)
      } finally {
        testing.value = false
      }
    }

    onMounted(() => {
      // 获取配置信息
      config.value = {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '从 config.js 读取',
        projectId: 'japanese-learning-sync',
        authDomain: 'japanese-learning-sync.firebaseapp.com'
      }

      // 监听全局错误
      window.addEventListener('error', (event) => {
        addError(`全局错误: ${event.error.message}`)
      })

      // 监听未处理的 Promise 拒绝
      window.addEventListener('unhandledrejection', (event) => {
        addError(`未处理的 Promise 拒绝: ${event.reason}`)
      })
    })

    return {
      config,
      testing,
      connectionResult,
      authResult,
      errors,
      testConnection,
      testAuth
    }
  }
}
</script>

<style scoped>
.auth-debug {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.debug-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.debug-section h3 {
  margin: 0 0 15px 0;
  color: #333;
  border-bottom: 2px solid #667eea;
  padding-bottom: 10px;
}

.config-info div {
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.test-btn {
  background: #667eea;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

.test-btn:hover:not(:disabled) {
  background: #5a6fd8;
  transform: translateY(-2px);
}

.test-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
}

.result {
  margin-top: 15px;
  padding: 10px;
  border-radius: 8px;
  font-weight: 500;
}

.result:contains('✅') {
  background: #e8f5e8;
  color: #2e7d32;
}

.result:contains('❌') {
  background: #ffebee;
  color: #c62828;
}

.error-log {
  max-height: 200px;
  overflow-y: auto;
  background: #f8f9fa;
  border-radius: 8px;
  padding: 10px;
}

.error-item {
  padding: 5px 0;
  border-bottom: 1px solid #e0e0e0;
  font-family: monospace;
  font-size: 0.9rem;
}

.error-item:last-child {
  border-bottom: none;
}
</style>
