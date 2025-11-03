<template>
  <div class="sentences">
    <div class="header">
      <h2>💬 {{ dataStore.currentLanguageName }}内在感觉--句子向</h2>
      <button @click="showAddForm = !showAddForm" class="add-btn">
        {{ showAddForm ? '取消' : '添加句子' }}
      </button>
    </div>

    <!-- 编辑句子表单 -->
    <div v-if="showEditForm" class="edit-form">
      <h3>编辑句子</h3>
      <div class="form-group">
        <label>{{ dataStore.currentLanguageName }}句子：</label>
        <textarea 
          v-model="editingSentence.japanese" 
          :placeholder="`请输入${dataStore.currentLanguageName}句子`"
          class="form-textarea"
          rows="3"
        ></textarea>
      </div>
      <div class="form-group">
        <label>对应内在感觉：</label>
        <textarea 
          v-model="editingSentence.chinese" 
          placeholder="请输入对应的中文翻译 or 内在感觉描述"
          class="form-textarea"
          rows="3"
        ></textarea>
      </div>
      <div class="form-group">
        <label>使用情境：</label>
        <textarea 
          v-model="editingSentence.context" 
          placeholder="请描述这个句子的使用场景，比如：与朋友对话时、正式场合、购物时等"
          class="form-textarea"
          rows="3"
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

    <!-- 添加句子表单 -->
    <div v-if="showAddForm" class="add-form">
      <div class="form-group">
        <label>{{ dataStore.currentLanguageName }}句子：</label>
        <textarea 
          v-model="newSentence.japanese" 
          :placeholder="`请输入${dataStore.currentLanguageName}句子`"
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
        <div class="sentence-actions">
          <button @click="playAudio(sentence)" class="speech-btn" :disabled="isPlaying">
            {{ isPlaying ? '🔊' : '🔊' }}
          </button>
          <button @click="editSentence(sentence)" class="edit-btn">
            ✏️
          </button>
          <button @click="deleteSentence(sentence.id)" class="delete-btn">
            🗑️
          </button>
        </div>
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
    const showEditForm = ref(false)
    const newSentence = ref({
      japanese: '',
      chinese: '',
      context: ''
    })
    const editingSentence = ref({
      id: '',
      japanese: '',
      chinese: '',
      context: ''
    })
    const isPlaying = ref(false)

    const canSave = computed(() => {
      return newSentence.value.japanese.trim() && newSentence.value.chinese.trim()
    })

    const canSaveEdit = computed(() => {
      return editingSentence.value.japanese.trim() && editingSentence.value.chinese.trim()
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

    const editSentence = (sentence) => {
      editingSentence.value = {
        id: sentence.id,
        japanese: sentence.japanese,
        chinese: sentence.chinese,
        context: sentence.context || ''
      }
      showEditForm.value = true
      showAddForm.value = false
    }

    const saveEdit = async () => {
      if (canSaveEdit.value) {
        try {
          await dataStore.updateSentence(editingSentence.value.id, {
            japanese: editingSentence.value.japanese.trim(),
            chinese: editingSentence.value.chinese.trim(),
            context: editingSentence.value.context.trim()
          })
          showEditForm.value = false
          editingSentence.value = { id: '', japanese: '', chinese: '', context: '' }
        } catch (error) {
          alert(`更新失败：${error.message}`)
        }
      }
    }

    const cancelEdit = () => {
      showEditForm.value = false
      editingSentence.value = { id: '', japanese: '', chinese: '', context: '' }
    }

    const playAudio = async (sentence) => {
      if (isPlaying.value) return
      
      try {
        isPlaying.value = true
        
        // 获取要播放的文本（根据当前显示的语言）
        const textToSpeak = dataStore.showJapanese ? sentence.japanese : sentence.chinese
        
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

    const deleteSentence = (id) => {
      if (confirm('确定要删除这个句子吗？')) {
        dataStore.deleteSentence(id)
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
      newSentence,
      editingSentence,
      isPlaying,
      canSave,
      canSaveEdit,
      addSentence,
      cancelAdd,
      editSentence,
      saveEdit,
      cancelEdit,
      playAudio,
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

.add-form,
.edit-form {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.edit-form h3 {
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

.sentence-actions {
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
  
  .sentence-item {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }
  
  .sentence-content {
    margin-right: 0;
  }
  
  .sentence-actions {
    align-self: flex-end;
    flex-direction: row;
  }
}
</style>
