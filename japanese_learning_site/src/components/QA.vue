<template>
  <div class="qa">
    <div class="header">
      <h2>❓ {{ dataStore.currentLanguageName }}问答管理</h2>
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
          placeholder="请输入答案（支持长文本，会自动换行）"
          class="form-textarea answer-textarea"
          rows="4"
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
        <!-- 编辑表单 - 显示在对应的问答项内部 -->
        <div v-if="showEditForm && editingQA.id === qa.id" class="edit-form-inline">
          <h3>编辑问答</h3>
          <div class="form-group">
            <label>问题：</label>
            <textarea 
              v-model="editingQA.question" 
              placeholder="请输入问题"
              class="form-textarea"
              rows="3"
            ></textarea>
          </div>
          <div class="form-group">
            <label>答案：</label>
            <textarea 
              v-model="editingQA.answer" 
              placeholder="请输入答案（支持长文本，会自动换行）"
              class="form-textarea answer-textarea"
              rows="4"
            ></textarea>
          </div>
          <div class="form-actions">
            <button @click="saveEdit" class="save-btn" :disabled="!canSaveEdit">
              保存
            </button>
            <button @click="cancelEdit" class="cancel-btn">
              取消
            </button>
          </div>
        </div>
        
        <!-- 正常显示内容 -->
        <template v-else>
          <div class="qa-content">
            <div class="qa-question">
              <span class="qa-label">Q:</span>
              <div class="question-content">{{ qa.question }}</div>
            </div>
            <div class="qa-answer">
              <span class="qa-label">A:</span>
              <div class="answer-content">{{ qa.answer }}</div>
            </div>
            <div class="qa-date">{{ formatDate(qa.createdAt) }}</div>
          </div>
          <div class="qa-actions">
            <button @click="playAudio(qa)" class="speech-btn" :disabled="isPlaying">
              {{ isPlaying ? '🔊' : '🔊' }}
            </button>
            <button @click="editQA(qa)" class="edit-btn">
              ✏️
            </button>
            <button @click="deleteQA(qa.id)" class="delete-btn">
              🗑️
            </button>
          </div>
        </template>
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
    const showEditForm = ref(false)
    const newQA = ref({
      question: '',
      answer: ''
    })
    const editingQA = ref({
      id: '',
      question: '',
      answer: ''
    })
    const isPlaying = ref(false)

    const canSave = computed(() => {
      return newQA.value.question.trim() && newQA.value.answer.trim()
    })

    const canSaveEdit = computed(() => {
      return editingQA.value.question.trim() && editingQA.value.answer.trim()
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

    const editQA = (qa) => {
      editingQA.value = {
        id: qa.id,
        question: qa.question,
        answer: qa.answer
      }
      showEditForm.value = true
      showAddForm.value = false
    }

    const saveEdit = async () => {
      if (canSaveEdit.value) {
        try {
          await dataStore.updateQA(editingQA.value.id, {
            question: editingQA.value.question.trim(),
            answer: editingQA.value.answer.trim()
          })
          showEditForm.value = false
          editingQA.value = { id: '', question: '', answer: '' }
        } catch (error) {
          alert(`更新失败：${error.message}`)
        }
      }
    }

    const cancelEdit = () => {
      showEditForm.value = false
      editingQA.value = { id: '', question: '', answer: '' }
    }

    const playAudio = async (qa) => {
      if (isPlaying.value) return
      
      try {
        isPlaying.value = true
        
        // 播放问题和答案
        const textToSpeak = `${qa.question} ${qa.answer}`
        
        if (!textToSpeak.trim()) {
          alert('没有可播放的内容')
          return
        }

        // 使用Web Speech API
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(textToSpeak)
          
          // 根据当前学习语言设置语音
          const languageCode = dataStore.currentLanguage
          utterance.lang = languageCode === 'ja' ? 'ja-JP' : 
                          languageCode === 'en' ? 'en-US' : 
                          languageCode === 'ko' ? 'ko-KR' : 
                          languageCode === 'hi' ? 'hi-IN' : 'zh-CN'
          
          utterance.rate = 0.7
          utterance.pitch = 1
          utterance.volume = 1
          
          utterance.onend = () => {
            isPlaying.value = false
          }
          
          utterance.onerror = () => {
            isPlaying.value = false
            alert('语音播放失败，请检查浏览器设置')
          }
          
          speechSynthesis.speak(utterance)
        } else {
          alert('您的浏览器不支持语音播放功能')
          isPlaying.value = false
        }
      } catch (error) {
        console.error('语音播放错误:', error)
        isPlaying.value = false
        alert('语音播放失败')
      }
    }

    const deleteQA = (id) => {
      if (confirm('确定要删除这个问答吗？')) {
        dataStore.deleteQA(id)
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
      showEditForm,
      newQA,
      editingQA,
      isPlaying,
      canSave,
      canSaveEdit,
      addQA,
      cancelAdd,
      editQA,
      saveEdit,
      cancelEdit,
      playAudio,
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

.edit-form-inline {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 12px;
  border: 2px solid #667eea;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
}

.edit-form-inline h3 {
  color: #333;
  margin-bottom: 1rem;
  font-size: 1.2rem;
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
  max-width: 100%;
  box-sizing: border-box;
  padding: 0.8rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s;
  resize: vertical;
  font-family: inherit;
}

.answer-textarea {
  min-height: 120px;
  line-height: 1.6;
  background: #f8f9fa;
  border-left: 3px solid #667eea;
}

.answer-textarea:focus {
  border-color: #667eea;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
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
  line-height: 1.6;
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
}

.question-content {
  flex: 1;
  word-wrap: break-word;
  word-break: break-word;
  white-space: pre-wrap;
  line-height: 1.6;
  padding: 0.5rem;
  background: #fff;
  border-radius: 6px;
  border-left: 3px solid #28a745;
  font-weight: 500;
}

.qa-answer {
  color: #666;
  margin-bottom: 0.5rem;
  line-height: 1.6;
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
}

.answer-content {
  flex: 1;
  word-wrap: break-word;
  word-break: break-word;
  white-space: pre-wrap;
  line-height: 1.6;
  padding: 0.5rem;
  background: #f8f9fa;
  border-radius: 6px;
  border-left: 3px solid #667eea;
  font-size: 0.95rem;
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

.qa-actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}

.speech-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 0.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.speech-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.speech-btn:disabled {
  background: #cbd5e0;
  cursor: not-allowed;
  box-shadow: none;
  transform: none;
}

.edit-btn {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
  border: none;
  padding: 0.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(245, 87, 108, 0.3);
}

.edit-btn:hover {
  background: linear-gradient(135deg, #f5576c 0%, #f093fb 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(245, 87, 108, 0.4);
}

.delete-btn {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
  color: white;
  border: none;
  padding: 0.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(250, 112, 154, 0.3);
}

.delete-btn:hover {
  background: linear-gradient(135deg, #fee140 0%, #fa709a 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(250, 112, 154, 0.4);
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
  
  .qa-actions {
    align-self: flex-end;
    flex-direction: row;
  }
  
  .qa-question,
  .qa-answer {
    flex-direction: column;
    align-items: stretch;
    gap: 0.3rem;
  }
  
  .question-content,
  .answer-content {
    margin-left: 0;
    margin-top: 0.3rem;
  }
  
  .answer-textarea {
    min-height: 100px;
  }
}
</style>
