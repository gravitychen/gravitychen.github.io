<template>
  <div class="home">
    <div class="welcome-card">
      <h2>欢迎使用{{ dataStore.currentLanguageName }}学习助手！</h2>
      <p v-if="!dataStore.hasInitialData">正在为你准备示例学习内容...</p>
      <p v-else>开始你的{{ dataStore.currentLanguageName }}学习之旅吧 🎌</p>
    </div>

    <!-- 语言切换快捷链接 -->
    <div class="language-shortcuts">
      <div class="language-header">
        <h3>🌍 快速切换语言</h3>
        <button @click="showAddLanguageDialog = true" class="add-language-btn" title="添加语言">
          ➕
        </button>
      </div>
      <div class="language-buttons">
        <div 
          v-for="lang in dataStore.supportedLanguages" 
          :key="lang.code" 
          class="language-item"
        >
          <a 
            @click.prevent="switchToLanguage(lang.code)"
            href="#" 
            :class="['lang-btn', `lang-${lang.code}`]"
          >
            <span class="lang-flag">{{ lang.flag }}</span>
            <span class="lang-name">{{ lang.name }}</span>
          </a>
          <button 
            @click="confirmDeleteLanguage(lang)" 
            class="delete-language-btn" 
            :disabled="dataStore.supportedLanguages.length <= 1"
            :title="dataStore.supportedLanguages.length <= 1 ? '至少需要保留一个语言' : '删除语言'"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>

    <!-- 自定义确认对话框 -->
    <div v-if="showConfirmDialog" class="confirm-dialog" @click="handleDialogBackgroundClick">
      <div class="confirm-dialog-content" @click.stop>
        <h4>{{ confirmDialogTitle }}</h4>
        <p class="confirm-dialog-message">{{ confirmDialogMessage }}</p>
        <div class="confirm-dialog-actions">
          <button @click="handleConfirmCancel" class="confirm-cancel-btn">
            {{ confirmCancelText }}
          </button>
          <button @click="handleConfirmOk" class="confirm-ok-btn">
            {{ confirmOkText }}
          </button>
        </div>
      </div>
    </div>

    <!-- 添加语言对话框 -->
    <div v-if="showAddLanguageDialog" class="add-language-dialog" @click="showAddLanguageDialog = false">
      <div class="dialog-content" @click.stop>
        <h4>添加新语言</h4>
        <div class="form-group">
          <label>语言代码（如：fr, de, es）</label>
          <input 
            v-model="newLanguage.code" 
            type="text" 
            placeholder="例如：fr"
            class="form-input"
            maxlength="10"
          />
        </div>
        <div class="form-group">
          <label>语言名称（如：法语、德语、西班牙语）</label>
          <input 
            v-model="newLanguage.name" 
            type="text" 
            placeholder="例如：法语"
            class="form-input"
          />
        </div>
        <div class="form-group">
          <label>国旗/图标（emoji）</label>
          <input 
            v-model="newLanguage.flag" 
            type="text" 
            placeholder="例如：🇫🇷"
            class="form-input"
            maxlength="2"
          />
        </div>
        <div class="dialog-actions">
          <button @click="addLanguage" class="confirm-btn" :disabled="!newLanguage.code || !newLanguage.name">
            确认添加
          </button>
          <button @click="cancelAddLanguage" class="cancel-btn">
            取消
          </button>
        </div>
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
    const showAddLanguageDialog = ref(false)
    const newLanguage = ref({
      code: '',
      name: '',
      flag: '🌐'
    })
    
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

    // 添加语言
    const addLanguage = () => {
      try {
        dataStore.addLanguage({
          code: newLanguage.value.code.trim().toLowerCase(),
          name: newLanguage.value.name.trim(),
          flag: newLanguage.value.flag.trim() || '🌐'
        })
        alert('语言添加成功！')
        cancelAddLanguage()
      } catch (error) {
        alert(`添加失败：${error.message}`)
        console.error('添加语言失败:', error)
      }
    }

    // 取消添加语言
    const cancelAddLanguage = () => {
      showAddLanguageDialog.value = false
      newLanguage.value = {
        code: '',
        name: '',
        flag: '🌐'
      }
    }

    // 切换到指定语言
    const switchToLanguage = (languageCode) => {
      dataStore.switchLanguage(languageCode)
    }

    // 自定义确认对话框函数
    const showCustomConfirm = (title, message, okText = '确定', cancelText = '取消') => {
      return new Promise((resolve) => {
        confirmDialogTitle.value = title
        confirmDialogMessage.value = message
        confirmOkText.value = okText
        confirmCancelText.value = cancelText
        showConfirmDialog.value = true
        
        confirmCallback.value = (result) => {
          showConfirmDialog.value = false
          resolve(result)
        }
      })
    }

    // 处理确认对话框的确定按钮
    const handleConfirmOk = () => {
      if (confirmCallback.value) {
        confirmCallback.value(true)
      }
    }

    // 处理确认对话框的取消按钮
    const handleConfirmCancel = () => {
      if (confirmCallback.value) {
        confirmCallback.value(false)
      }
    }

    // 处理点击对话框背景
    const handleDialogBackgroundClick = () => {
      // 点击背景不关闭，必须点击按钮
    }

    // 确认删除语言（三次确认，使用自定义对话框）
    const confirmDeleteLanguage = async (lang) => {
      // 检查是否至少保留一个语言
      if (dataStore.supportedLanguages.length <= 1) {
        alert('至少需要保留一个语言！')
        return
      }

      // 第一次确认
      const message1 = `⚠️ 第一次确认\n\n确定要删除语言大区 "${lang.name}" (${lang.flag}) 吗？\n\n` +
        `删除后该语言的所有数据（单词、句子、问答）将无法访问！`
      
      const result1 = await showCustomConfirm('第一次确认', message1, '是的，我要删除', '取消')
      if (!result1) {
        return
      }

      // 第二次确认
      const message2 = `⚠️⚠️ 第二次确认\n\n你真的确定要删除 "${lang.name}" (${lang.flag}) 吗？\n\n` +
        `⚠️ 警告：此操作不可撤销！\n` +
        `该语言的所有学习数据将被永久删除！\n` +
        `如果当前正在使用该语言，将自动切换到其他语言。`
      
      const result2 = await showCustomConfirm('第二次确认', message2, '我确定要删除', '我再想想')
      if (!result2) {
        return
      }

      // 第三次确认
      const message3 = `⚠️⚠️⚠️ 最后一次确认\n\n` +
        `这是最后一次机会！\n\n` +
        `确定要永久删除语言大区 "${lang.name}" (${lang.flag}) 吗？\n\n` +
        `⚠️ 警告：删除后无法恢复！\n` +
        `所有该语言的数据将永久丢失！`
      
      const result3 = await showCustomConfirm('最后一次确认', message3, '永久删除', '取消删除')
      if (!result3) {
        return
      }

      // 三次确认都通过，执行删除
      try {
        dataStore.removeLanguage(lang.code)
        alert('语言删除成功！')
        
        // 如果删除的是当前语言，需要重新加载数据
        if (dataStore.currentLanguage === lang.code) {
          dataStore.loadLanguageData()
        }
      } catch (error) {
        alert(`删除失败：${error.message}`)
        console.error('删除语言失败:', error)
      }
    }


    return {
      dataStore,
      hasItemsToReview,
      showImportDialog,
      importData,
      isMigrating,
      showAddLanguageDialog,
      newLanguage,
      exportData,
      importDataConfirm,
      migrateWords,
      addLanguage,
      cancelAddLanguage,
      confirmDeleteLanguage,
      switchToLanguage,
      showConfirmDialog,
      confirmDialogTitle,
      confirmDialogMessage,
      confirmOkText,
      confirmCancelText,
      handleConfirmOk,
      handleConfirmCancel,
      handleDialogBackgroundClick
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

.language-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.language-shortcuts h3 {
  margin: 0;
  color: #333;
  text-align: center;
  flex: 1;
}

.add-language-btn {
  background: #28a745;
  color: white;
  border: none;
  padding: 0.5rem 0.8rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1.2rem;
  transition: all 0.3s;
  min-width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.add-language-btn:hover {
  background: #218838;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
}

.language-buttons {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.language-item {
  position: relative;
  display: flex;
  align-items: stretch;
  gap: 0.5rem;
}

.lang-btn {
  flex: 1;
  min-width: 0;
}

.delete-language-btn {
  background: #dc3545;
  color: white;
  border: none;
  padding: 0.4rem 0.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s;
  min-width: 40px;
  max-width: 40px;
  height: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  align-self: stretch;
}

.delete-language-btn:hover:not(:disabled) {
  background: #c82333;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(220, 53, 69, 0.3);
}

.delete-language-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #6c757d;
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

/* 默认语言按钮样式 */
.lang-btn {
  flex: 1;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

/* 特定语言的样式（保留原有样式） */
.lang-btn.lang-ja {
  background: linear-gradient(135deg, #ff6b6b 0%, #ff8e8e 100%);
}

.lang-btn.lang-en {
  background: linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%);
}

.lang-btn.lang-ko {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.lang-btn.lang-hi {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
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
    gap: 0.8rem;
  }
  
  .language-item {
    flex-direction: row;
    align-items: stretch;
    gap: 0.5rem;
  }
  
  .lang-btn {
    padding: 0.8rem;
    flex: 1;
    min-width: 0;
  }
  
  .lang-flag {
    font-size: 1.2rem;
  }
  
  .lang-name {
    font-size: 0.9rem;
  }

  .delete-language-btn {
    min-width: 45px;
    max-width: 45px;
    padding: 0.4rem;
    font-size: 1rem;
    align-self: stretch;
    height: auto;
  }
}

/* 添加语言对话框样式 */
.add-language-dialog {
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
  padding: 20px;
}

.add-language-dialog .dialog-content {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

.add-language-dialog h4 {
  margin-bottom: 1.5rem;
  color: #333;
  font-size: 1.3rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #666;
  font-weight: 500;
  font-size: 0.9rem;
}

.form-input {
  width: 100%;
  padding: 0.8rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
}

.add-language-dialog .dialog-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
}

.add-language-dialog .confirm-btn {
  background: #28a745;
  color: white;
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s;
}

.add-language-dialog .confirm-btn:hover:not(:disabled) {
  background: #218838;
}

.add-language-dialog .confirm-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.add-language-dialog .cancel-btn {
  background: #6c757d;
  color: white;
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s;
}

.add-language-dialog .cancel-btn:hover {
  background: #5a6268;
}

/* 自定义确认对话框样式 */
.confirm-dialog {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 20px;
  animation: fadeIn 0.3s ease;
}

.confirm-dialog-content {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  max-width: 500px;
  width: 100%;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease;
}

.confirm-dialog-content h4 {
  margin-bottom: 1rem;
  color: #333;
  font-size: 1.3rem;
  font-weight: 600;
}

.confirm-dialog-message {
  color: #666;
  line-height: 1.6;
  margin-bottom: 1.5rem;
  white-space: pre-line;
  font-size: 1rem;
}

.confirm-dialog-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.confirm-ok-btn {
  background: #dc3545;
  color: white;
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s;
  font-size: 1rem;
}

.confirm-ok-btn:hover {
  background: #c82333;
}

.confirm-cancel-btn {
  background: #6c757d;
  color: white;
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s;
  font-size: 1rem;
}

.confirm-cancel-btn:hover {
  background: #5a6268;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
</style>
