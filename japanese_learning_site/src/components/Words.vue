<template>
  <div class="words">
    <div class="header">
      <h2>📝 {{ dataStore.currentLanguageName }}单词管理</h2>
      <button @click="showAddForm = !showAddForm" class="add-btn">
        {{ showAddForm ? '取消' : '添加单词' }}
      </button>
    </div>

    <!-- 添加单词表单 -->
    <div v-if="showAddForm" class="add-form">
      <div class="form-group">
        <label>{{ dataStore.currentLanguageName }}单词：</label>
        <input 
          v-model="newWord.japanese" 
          type="text" 
          :placeholder="`请输入${dataStore.currentLanguageName}单词`"
          class="form-input"
        />
      </div>
      <div class="form-group">
        <label>中文翻译：</label>
        <input 
          v-model="newWord.chinese" 
          type="text" 
          placeholder="请输入中文翻译"
          class="form-input"
        />
      </div>
      <div class="form-actions">
        <button @click="addWord" class="save-btn" :disabled="!canSave">
          保存
        </button>
        <button @click="cancelAdd" class="cancel-btn">
          取消
        </button>
      </div>
    </div>

    <!-- 单词列表 -->
    <div class="words-list">
      <div v-if="dataStore.words.length === 0" class="empty-state">
        <div class="empty-icon">📝</div>
        <p>还没有添加任何单词</p>
        <p class="empty-hint">点击上方"添加单词"开始学习吧！</p>
      </div>

      <div v-else class="word-item" v-for="word in dataStore.words" :key="word.id">
        <div class="word-content">
          <div class="word-main">
            <div v-if="dataStore.showJapanese" class="word-japanese">{{ word.japanese }}</div>
            <div v-else class="word-chinese">{{ word.chinese }}</div>
          </div>
          <div class="word-secondary">
            <div v-if="dataStore.showJapanese" class="word-chinese">{{ word.chinese }}</div>
            <div v-else class="word-japanese">{{ word.japanese }}</div>
          </div>
          <div class="word-date">{{ formatDate(word.createdAt) }}</div>
        </div>
        <button @click="deleteWord(word.id)" class="delete-btn">
          🗑️
        </button>
      </div>
    </div>

    <!-- 统计信息 -->
    <div class="stats">
      <div class="stat-item">
        <span class="stat-label">总单词数：</span>
        <span class="stat-value">{{ dataStore.totalWords }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { useDataStore } from '../stores/dataStore'

export default {
  name: 'Words',
  setup() {
    const dataStore = useDataStore()
    const showAddForm = ref(false)
    const newWord = ref({
      japanese: '',
      chinese: ''
    })

    const canSave = computed(() => {
      return newWord.value.japanese.trim() && newWord.value.chinese.trim()
    })

    const addWord = () => {
      if (canSave.value) {
        dataStore.addWord({
          japanese: newWord.value.japanese.trim(),
          chinese: newWord.value.chinese.trim()
        })
        newWord.value = { japanese: '', chinese: '' }
        showAddForm.value = false
      }
    }

    const cancelAdd = () => {
      newWord.value = { japanese: '', chinese: '' }
      showAddForm.value = false
    }

    const deleteWord = (id) => {
      if (confirm('确定要删除这个单词吗？')) {
        dataStore.deleteWord(id)
      }
    }

    const formatDate = (dateInput) => {
      if (!dateInput) return '未知时间'
      
      try {
        let date
        
        // 处理Firebase Timestamp对象
        if (dateInput && typeof dateInput === 'object' && dateInput.seconds) {
          date = new Date(dateInput.seconds * 1000)
        } else if (typeof dateInput === 'string') {
          date = new Date(dateInput)
        } else if (dateInput instanceof Date) {
          date = dateInput
        } else {
          return '未知时间'
        }
        
        // 检查日期是否有效
        if (isNaN(date.getTime())) {
          return '未知时间'
        }
        
        return date.toLocaleDateString('zh-CN')
      } catch (error) {
        console.error('日期格式化错误:', error, dateInput)
        return '未知时间'
      }
    }

    return {
      dataStore,
      showAddForm,
      newWord,
      canSave,
      addWord,
      cancelAdd,
      deleteWord,
      formatDate
    }
  }
}
</script>

<style scoped>
.words {
  max-width: 600px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.header h2 {
  color: #333;
  font-size: 1.5rem;
}

.add-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s;
}

.add-btn:hover {
  transform: translateY(-2px);
}

.add-form {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #333;
  font-weight: 600;
}

.form-input {
  width: 100%;
  padding: 0.8rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.save-btn {
  background: #28a745;
  color: white;
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s;
}

.save-btn:hover:not(:disabled) {
  background: #218838;
}

.save-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.cancel-btn {
  background: #6c757d;
  color: white;
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s;
}

.cancel-btn:hover {
  background: #5a6268;
}

.words-list {
  margin-bottom: 1.5rem;
}

.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: #666;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.empty-hint {
  font-size: 0.9rem;
  color: #999;
}

.word-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  margin-bottom: 1rem;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  transition: transform 0.2s;
}

.word-item:hover {
  transform: translateY(-2px);
}

.word-content {
  flex: 1;
}

.word-main .word-japanese,
.word-main .word-chinese {
  font-size: 1.4rem;
  font-weight: bold;
  color: #333;
  margin-bottom: 0.3rem;
}

.word-secondary .word-japanese,
.word-secondary .word-chinese {
  color: #666;
  margin-bottom: 0.3rem;
  font-size: 1rem;
}

.word-date {
  font-size: 0.8rem;
  color: #999;
}

.delete-btn {
  background: #dc3545;
  color: white;
  border: none;
  padding: 0.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.3s;
}

.delete-btn:hover {
  background: #c82333;
}

.stats {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-label {
  color: #666;
  font-weight: 600;
}

.stat-value {
  color: #667eea;
  font-weight: bold;
  font-size: 1.2rem;
}

/* 移动端优化 */
@media (max-width: 480px) {
  .header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  
  .add-btn {
    text-align: center;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .word-item {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }
  
  .delete-btn {
    align-self: flex-end;
  }
}
</style>
