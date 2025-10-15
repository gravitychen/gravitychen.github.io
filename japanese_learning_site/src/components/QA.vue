<template>
  <div class="qa">
    <div class="header">
      <h2>❓ 问答管理</h2>
      <button @click="showAddForm = !showAddForm" class="add-btn">
        {{ showAddForm ? '取消' : '添加问答' }}
      </button>
    </div>

    <!-- 添加问答表单 -->
    <div v-if="showAddForm" class="add-form">
      <div class="form-group">
        <label>问题：</label>
        <textarea 
          v-model="newQA.question" 
          placeholder="请输入问题"
          class="form-textarea"
          rows="3"
        ></textarea>
      </div>
      <div class="form-group">
        <label>答案：</label>
        <textarea 
          v-model="newQA.answer" 
          placeholder="请输入答案"
          class="form-textarea"
          rows="3"
        ></textarea>
      </div>
      <div class="form-actions">
        <button @click="addQA" class="save-btn" :disabled="!canSave">
          保存
        </button>
        <button @click="cancelAdd" class="cancel-btn">
          取消
        </button>
      </div>
    </div>

    <!-- 问答列表 -->
    <div class="qa-list">
      <div v-if="dataStore.qa.length === 0" class="empty-state">
        <div class="empty-icon">❓</div>
        <p>还没有添加任何问答</p>
        <p class="empty-hint">点击上方"添加问答"开始学习吧！</p>
      </div>

      <div v-else class="qa-item" v-for="qa in dataStore.qa" :key="qa.id">
        <div class="qa-content">
          <div class="qa-question">
            <span class="qa-label">Q:</span>
            {{ qa.question }}
          </div>
          <div class="qa-answer">
            <span class="qa-label">A:</span>
            {{ qa.answer }}
          </div>
          <div class="qa-date">{{ formatDate(qa.createdAt) }}</div>
        </div>
        <button @click="deleteQA(qa.id)" class="delete-btn">
          🗑️
        </button>
      </div>
    </div>

    <!-- 统计信息 -->
    <div class="stats">
      <div class="stat-item">
        <span class="stat-label">总问答数：</span>
        <span class="stat-value">{{ dataStore.totalQA }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { useDataStore } from '../stores/dataStore'

export default {
  name: 'QA',
  setup() {
    const dataStore = useDataStore()
    const showAddForm = ref(false)
    const newQA = ref({
      question: '',
      answer: ''
    })

    const canSave = computed(() => {
      return newQA.value.question.trim() && newQA.value.answer.trim()
    })

    const addQA = () => {
      if (canSave.value) {
        dataStore.addQA({
          question: newQA.value.question.trim(),
          answer: newQA.value.answer.trim()
        })
        newQA.value = { question: '', answer: '' }
        showAddForm.value = false
      }
    }

    const cancelAdd = () => {
      newQA.value = { question: '', answer: '' }
      showAddForm.value = false
    }

    const deleteQA = (id) => {
      if (confirm('确定要删除这个问答吗？')) {
        dataStore.deleteQA(id)
      }
    }

    const formatDate = (dateString) => {
      const date = new Date(dateString)
      return date.toLocaleDateString('zh-CN')
    }

    return {
      dataStore,
      showAddForm,
      newQA,
      canSave,
      addQA,
      cancelAdd,
      deleteQA,
      formatDate
    }
  }
}
</script>

<style scoped>
.qa {
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

.qa-list {
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

.qa-item {
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

.qa-item:hover {
  transform: translateY(-2px);
}

.qa-content {
  flex: 1;
  margin-right: 1rem;
}

.qa-question {
  font-size: 1.1rem;
  color: #333;
  margin-bottom: 0.8rem;
  line-height: 1.4;
}

.qa-answer {
  color: #666;
  margin-bottom: 0.5rem;
  line-height: 1.4;
}

.qa-label {
  font-weight: bold;
  color: #667eea;
  margin-right: 0.5rem;
}

.qa-date {
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
  
  .qa-item {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }
  
  .qa-content {
    margin-right: 0;
  }
  
  .delete-btn {
    align-self: flex-end;
  }
}
</style>
