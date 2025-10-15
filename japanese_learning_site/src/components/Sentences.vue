<template>
  <div class="sentences">
    <div class="header">
      <h2>💬 内在感觉--句子向</h2>
      <button @click="showAddForm = !showAddForm" class="add-btn">
        {{ showAddForm ? '取消' : '添加句子' }}
      </button>
    </div>

    <!-- 添加句子表单 -->
    <div v-if="showAddForm" class="add-form">
      <div class="form-group">
        <label>日语句子：</label>
        <textarea 
          v-model="newSentence.japanese" 
          placeholder="请输入日语句子"
          class="form-textarea"
          rows="3"
        ></textarea>
      </div>
      <div class="form-group">
        <label>对应内在感觉：</label>
        <textarea 
          v-model="newSentence.chinese" 
          placeholder="请输入对应的中文翻译 or 内在感觉描述"
          class="form-textarea"
          rows="3"
        ></textarea>
      </div>
      <div class="form-group">
        <label>使用情境：</label>
        <textarea 
          v-model="newSentence.context" 
          placeholder="请描述这个句子的使用场景，比如：与朋友对话时、正式场合、购物时等"
          class="form-textarea"
          rows="3"
        ></textarea>
      </div>
      <div class="form-actions">
        <button @click="addSentence" class="save-btn" :disabled="!canSave">
          保存
        </button>
        <button @click="cancelAdd" class="cancel-btn">
          取消
        </button>
      </div>
    </div>

    <!-- 句子列表 -->
    <div class="sentences-list">
      <div v-if="dataStore.sentences.length === 0" class="empty-state">
        <div class="empty-icon">💬</div>
        <p>还没有添加任何句子</p>
        <p class="empty-hint">点击上方"添加句子"开始学习吧！</p>
      </div>

      <div v-else class="sentence-item" v-for="sentence in dataStore.sentences" :key="sentence.id">
        <div class="sentence-content">
          <div class="sentence-main">
            <div v-if="dataStore.showJapanese" class="sentence-japanese">{{ sentence.japanese }}</div>
            <div v-else class="sentence-chinese">{{ sentence.chinese }}</div>
          </div>
          <div class="sentence-secondary">
            <div v-if="dataStore.showJapanese" class="sentence-chinese">{{ sentence.chinese }}</div>
            <div v-else class="sentence-japanese">{{ sentence.japanese }}</div>
          </div>
          <div v-if="sentence.context" class="sentence-context">
            <span class="context-label">使用情境：</span>{{ sentence.context }}
          </div>
          <div class="sentence-date">{{ formatDate(sentence.createdAt) }}</div>
        </div>
        <button @click="deleteSentence(sentence.id)" class="delete-btn">
          🗑️
        </button>
      </div>
    </div>

    <!-- 统计信息 -->
    <div class="stats">
      <div class="stat-item">
        <span class="stat-label">总句子数：</span>
        <span class="stat-value">{{ dataStore.totalSentences }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { useDataStore } from '../stores/dataStore'

export default {
  name: 'Sentences',
  setup() {
    const dataStore = useDataStore()
    const showAddForm = ref(false)
    const newSentence = ref({
      japanese: '',
      chinese: '',
      context: ''
    })

    const canSave = computed(() => {
      return newSentence.value.japanese.trim() && newSentence.value.chinese.trim()
    })

    const addSentence = () => {
      if (canSave.value) {
        dataStore.addSentence({
          japanese: newSentence.value.japanese.trim(),
          chinese: newSentence.value.chinese.trim(),
          context: newSentence.value.context.trim()
        })
        newSentence.value = { japanese: '', chinese: '', context: '' }
        showAddForm.value = false
      }
    }

    const cancelAdd = () => {
      newSentence.value = { japanese: '', chinese: '', context: '' }
      showAddForm.value = false
    }

    const deleteSentence = (id) => {
      if (confirm('确定要删除这个句子吗？')) {
        dataStore.deleteSentence(id)
      }
    }

    const formatDate = (dateString) => {
      const date = new Date(dateString)
      return date.toLocaleDateString('zh-CN')
    }

    return {
      dataStore,
      showAddForm,
      newSentence,
      canSave,
      addSentence,
      cancelAdd,
      deleteSentence,
      formatDate
    }
  }
}
</script>

<style scoped>
.sentences {
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

.form-textarea {
  width: 100%;
  padding: 0.8rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s;
  resize: vertical;
  font-family: inherit;
}

.form-textarea:focus {
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

.sentences-list {
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

.sentence-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  margin-bottom: 1rem;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  transition: transform 0.2s;
}

.sentence-item:hover {
  transform: translateY(-2px);
}

.sentence-content {
  flex: 1;
  margin-right: 1rem;
}

.sentence-main .sentence-japanese,
.sentence-main .sentence-chinese {
  font-size: 1.3rem;
  font-weight: bold;
  color: #333;
  margin-bottom: 0.5rem;
  line-height: 1.4;
}

.sentence-secondary .sentence-japanese,
.sentence-secondary .sentence-chinese {
  color: #666;
  margin-bottom: 0.5rem;
  line-height: 1.4;
  font-size: 1rem;
}

.sentence-context {
  background: #f8f9fa;
  padding: 0.8rem;
  border-radius: 6px;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  line-height: 1.4;
  color: #555;
}

.context-label {
  font-weight: 600;
  color: #667eea;
}

.sentence-date {
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
  flex-shrink: 0;
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
  
  .sentence-item {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }
  
  .sentence-content {
    margin-right: 0;
  }
  
  .delete-btn {
    align-self: flex-end;
  }
}
</style>
