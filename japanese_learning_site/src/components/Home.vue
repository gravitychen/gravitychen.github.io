<template>
  <div class="home">
    <div class="welcome-card">
      <h2>欢迎使用{{ dataStore.currentLanguageName }}学习助手！</h2>
      <p v-if="!dataStore.hasInitialData">正在为你准备示例学习内容...</p>
      <p v-else>开始你的{{ dataStore.currentLanguageName }}学习之旅吧 🎌</p>
    </div>

    <!-- 语言切换快捷链接 -->
    <div class="language-shortcuts">
      <h3>🌍 快速切换语言</h3>
      <div class="language-buttons">
        <a href="/japanese" class="lang-btn japanese">
          <span class="lang-flag">🇯🇵</span>
          <span class="lang-name">日语</span>
        </a>
        <a href="/english" class="lang-btn english">
          <span class="lang-flag">🇺🇸</span>
          <span class="lang-name">英语</span>
        </a>
        <a href="/korean" class="lang-btn korean">
          <span class="lang-flag">🇰🇷</span>
          <span class="lang-name">韩语</span>
        </a>
        <a href="/hindi" class="lang-btn hindi">
          <span class="lang-flag">🇮🇳</span>
          <span class="lang-name">印地语</span>
        </a>
      </div>
    </div>


    <div class="stats-grid">
      <router-link to="/words" class="stat-card clickable">
        <div class="stat-number">{{ dataStore.totalWords }}</div>
        <div class="stat-label">单词</div>
        <div class="stat-hint">点击管理单词</div>
      </router-link>
      <router-link to="/sentences" class="stat-card clickable">
        <div class="stat-number">{{ dataStore.totalSentences }}</div>
        <div class="stat-label">句子</div>
        <div class="stat-hint">点击管理句子</div>
      </router-link>
      <router-link to="/qa" class="stat-card clickable">
        <div class="stat-number">{{ dataStore.totalQA }}</div>
        <div class="stat-label">问答</div>
        <div class="stat-hint">点击管理问答</div>
      </router-link>
    </div>

    <div class="review-section">
      <h3>📚 今日复习</h3>
      <div class="review-stats">
        <div class="review-item">
          <span class="review-count">{{ dataStore.wordsToReview.length }}</span>
          <span class="review-text">个单词待复习</span>
        </div>
        <div class="review-item">
          <span class="review-count">{{ dataStore.sentencesToReview.length }}</span>
          <span class="review-text">个句子待复习</span>
        </div>
        <div class="review-item">
          <span class="review-count">{{ dataStore.qaToReview.length }}</span>
          <span class="review-text">个问答待复习</span>
        </div>
      </div>
      
      <router-link to="/review" class="review-btn" v-if="hasItemsToReview">
        开始复习
      </router-link>
    </div>

    <div class="quick-actions">
      <h3>🚀 快速操作</h3>
      <div class="action-buttons">
        <router-link to="/words" class="action-btn">
          <span class="btn-icon">📝</span>
          <span class="btn-text">管理单词</span>
        </router-link>
        <router-link to="/sentences" class="action-btn">
          <span class="btn-icon">💬</span>
          <span class="btn-text">管理句子</span>
        </router-link>
        <router-link to="/qa" class="action-btn">
          <span class="btn-icon">❓</span>
          <span class="btn-text">管理问答</span>
        </router-link>
        <router-link to="/quiz" class="action-btn">
          <span class="btn-icon">🎯</span>
          <span class="btn-text">开始考试</span>
        </router-link>
      </div>
    </div>

    <!-- 数据管理 -->
    <div class="data-management">
      <h3>💾 数据管理</h3>
      <div class="data-actions">
        <button @click="exportData" class="data-btn export-btn">
          <span class="btn-icon">📤</span>
          <span class="btn-text">导出数据</span>
        </button>
        <button @click="showImportDialog = true" class="data-btn import-btn">
          <span class="btn-icon">📥</span>
          <span class="btn-text">导入数据</span>
        </button>
        <button @click="migrateWords" class="data-btn migrate-btn" :disabled="isMigrating">
          <span class="btn-icon">🔄</span>
          <span class="btn-text">{{ isMigrating ? '迁移中...' : '迁移单词' }}</span>
        </button>
      </div>
      
      <!-- 导入对话框 -->
      <div v-if="showImportDialog" class="import-dialog">
        <div class="dialog-content">
          <h4>导入数据</h4>
          <textarea 
            v-model="importData" 
            placeholder="请粘贴导出的JSON数据..."
            class="import-textarea"
            rows="8"
          ></textarea>
          <div class="dialog-actions">
            <button @click="importDataConfirm" class="confirm-btn" :disabled="!importData.trim()">
              确认导入
            </button>
            <button @click="showImportDialog = false" class="cancel-btn">
              取消
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useDataStore } from '../stores/dataStore'

export default {
  name: 'Home',
  setup() {
    const dataStore = useDataStore()
    const showImportDialog = ref(false)
    const importData = ref('')
    const isMigrating = ref(false)
    
    const hasItemsToReview = computed(() => {
      return dataStore.wordsToReview.length > 0 || 
             dataStore.sentencesToReview.length > 0 || 
             dataStore.qaToReview.length > 0
    })

    // 示例数据现在会在用户登录后自动初始化
    onMounted(() => {
      // 数据初始化已移至登录后的云端同步流程中
    })

    // 导出数据
    const exportData = () => {
      const data = dataStore.exportData()
      // 使用 TextEncoder 确保 UTF-8 编码，解决 iPad Chrome 上的字符编码问题
      const encoder = new TextEncoder()
      const utf8Data = encoder.encode(data)
      const blob = new Blob([utf8Data], { type: 'application/json;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `japanese-learning-data-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }

    // 导入数据
    const importDataConfirm = async () => {
      try {
        await dataStore.importData(importData.value)
        alert('数据导入成功！')
        showImportDialog.value = false
        importData.value = ''
        // 不需要刷新页面，数据会通过实时同步自动更新
      } catch (error) {
        alert(`数据导入失败：${error.message}`)
        console.error('导入失败:', error)
      }
    }

    // 迁移单词，添加情景字段
    const migrateWords = async () => {
      if (!confirm('确定要迁移所有单词吗？这将给没有情景字段的单词添加空的情景字段。')) {
        return
      }

      isMigrating.value = true
      try {
        const result = await dataStore.migrateWordsAddContext()
        alert(`迁移完成！\n已更新: ${result.migrated} 个单词\n已跳过: ${result.skipped} 个单词\n总计: ${result.total} 个单词`)
      } catch (error) {
        alert(`迁移失败：${error.message}`)
        console.error('迁移失败:', error)
      } finally {
        isMigrating.value = false
      }
    }


    return {
      dataStore,
      hasItemsToReview,
      showImportDialog,
      importData,
      isMigrating,
      exportData,
      importDataConfirm,
      migrateWords
    }
  }
}
</script>

<style scoped>
.home {
  max-width: 600px;
  margin: 0 auto;
}

.welcome-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 2rem;
  border-radius: 15px;
  text-align: center;
  margin-bottom: 1.5rem;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.welcome-card h2 {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-card {
  background: white;
  padding: 1.5rem 1rem;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  text-decoration: none;
  color: inherit;
  transition: all 0.3s ease;
}

.stat-card.clickable {
  cursor: pointer;
  border: 2px solid transparent;
}

.stat-card.clickable:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.2);
  border-color: #667eea;
}

.stat-card.clickable:hover .stat-number {
  color: #5a67d8;
}

.stat-number {
  font-size: 2rem;
  font-weight: bold;
  color: #667eea;
  margin-bottom: 0.5rem;
  transition: color 0.3s ease;
}

.stat-label {
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 0.3rem;
}

.stat-hint {
  color: #999;
  font-size: 0.8rem;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.stat-card.clickable:hover .stat-hint {
  opacity: 1;
}

.review-section {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.review-section h3 {
  margin-bottom: 1rem;
  color: #333;
}

.review-stats {
  margin-bottom: 1rem;
}

.review-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid #f0f0f0;
}

.review-item:last-child {
  border-bottom: none;
}

.review-count {
  font-size: 1.2rem;
  font-weight: bold;
  color: #667eea;
}

.review-text {
  color: #666;
}

.review-btn {
  display: block;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  text-decoration: none;
  padding: 1rem;
  border-radius: 8px;
  text-align: center;
  font-weight: 600;
  transition: transform 0.2s;
}

.review-btn:hover {
  transform: translateY(-2px);
}

.quick-actions {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.quick-actions h3 {
  margin-bottom: 1rem;
  color: #333;
}

.action-buttons {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1.5rem 1rem;
  background: #f8f9fa;
  border-radius: 12px;
  text-decoration: none;
  color: #333;
  transition: all 0.3s;
  border: 2px solid transparent;
}

.action-btn:hover {
  background: #667eea;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.btn-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.btn-text {
  font-weight: 600;
  font-size: 0.9rem;
}

/* 数据管理样式 */
.data-management {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.data-management h3 {
  margin-bottom: 1rem;
  color: #333;
}

.data-actions {
  display: flex;
  gap: 1rem;
}

.data-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  font-weight: 600;
}

.export-btn {
  background: #28a745;
  color: white;
}

.export-btn:hover {
  background: #218838;
  transform: translateY(-2px);
}

.import-btn {
  background: #17a2b8;
  color: white;
}

.import-btn:hover {
  background: #138496;
  transform: translateY(-2px);
}

.migrate-btn {
  background: #ffc107;
  color: #333;
}

.migrate-btn:hover:not(:disabled) {
  background: #e0a800;
  transform: translateY(-2px);
}

.migrate-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}


.import-dialog {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog-content {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}

.dialog-content h4 {
  margin-bottom: 1rem;
  color: #333;
}

.import-textarea {
  width: 100%;
  padding: 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 0.9rem;
  font-family: monospace;
  resize: vertical;
  margin-bottom: 1rem;
}

.import-textarea:focus {
  outline: none;
  border-color: #667eea;
}

.dialog-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.confirm-btn {
  background: #28a745;
  color: white;
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s;
}

.confirm-btn:hover:not(:disabled) {
  background: #218838;
}

.confirm-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.dialog-actions .cancel-btn {
  background: #6c757d;
  color: white;
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s;
}

.dialog-actions .cancel-btn:hover {
  background: #5a6268;
}

/* 移动端优化 */
@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .action-buttons {
    grid-template-columns: 1fr;
  }
  
  .data-actions {
    flex-direction: column;
  }
  
  .welcome-card {
    padding: 1.5rem;
  }
  
  .welcome-card h2 {
    font-size: 1.3rem;
  }
  
  .dialog-content {
    padding: 1.5rem;
    width: 95%;
  }
  
  .dialog-actions {
    flex-direction: column;
  }
}

/* 语言切换快捷链接样式 */
.language-shortcuts {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.language-shortcuts h3 {
  margin-bottom: 1rem;
  color: #333;
  text-align: center;
}

.language-buttons {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.lang-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  border-radius: 8px;
  text-decoration: none;
  color: #333;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.lang-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
}

.lang-btn.japanese {
  background: linear-gradient(135deg, #ff6b6b 0%, #ff8e8e 100%);
  color: white;
}

.lang-btn.english {
  background: linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%);
  color: white;
}

.lang-btn.korean {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.lang-btn.hindi {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
}

.lang-btn:hover {
  border-color: rgba(255, 255, 255, 0.3);
}

.lang-flag {
  font-size: 1.5rem;
}

.lang-name {
  font-weight: 600;
  font-size: 1rem;
}

/* 移动端语言按钮优化 */
@media (max-width: 480px) {
  .language-buttons {
    grid-template-columns: 1fr;
  }
  
  .lang-btn {
    padding: 0.8rem;
  }
  
  .lang-flag {
    font-size: 1.2rem;
  }
  
  .lang-name {
    font-size: 0.9rem;
  }
}
</style>
