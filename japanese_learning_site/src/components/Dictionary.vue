<template>
  <div class="dictionary">
    <div class="header">
      <h2>📚 {{ dataStore.currentLanguageName }}字典系统</h2>
      <div class="header-actions">
        <button @click="showAddCategoryForm = !showAddCategoryForm" class="add-category-btn">
          {{ showAddCategoryForm ? '取消' : '添加分类' }}
        </button>
        <button @click="showAddWordForm = !showAddWordForm" class="add-word-btn">
          {{ showAddWordForm ? '取消' : '添加单词' }}
        </button>
      </div>
    </div>

    <!-- 添加分类表单 -->
    <div v-if="showAddCategoryForm" class="add-form">
      <h3>添加新分类</h3>
      <div class="form-group">
        <label>分类名称：</label>
        <input 
          v-model="newCategory.name" 
          type="text" 
          placeholder="例如：人体单词库"
          class="form-input"
        />
      </div>
      <div class="form-group">
        <label>父分类（可选）：</label>
        <select v-model="newCategory.parentPath" class="form-select">
          <option :value="null">根分类（顶级分类）</option>
          <option 
            v-for="path in allCategoryPaths" 
            :key="path.join('/')" 
            :value="path"
          >
            {{ path.join(' > ') }}
          </option>
        </select>
      </div>
      <div class="form-actions">
        <button @click="addCategory" class="save-btn" :disabled="!newCategory.name.trim()">
          保存
        </button>
        <button @click="cancelAddCategory" class="cancel-btn">
          取消
        </button>
      </div>
    </div>

    <!-- 添加单词表单 -->
    <div v-if="showAddWordForm" class="add-form">
      <h3>添加新单词</h3>
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
      <div class="form-group">
        <label>分类（可选）：</label>
        <select v-model="newWord.categoryPath" class="form-select">
          <option :value="null">未分类</option>
          <option 
            v-for="path in allCategoryPaths" 
            :key="path.join('/')" 
            :value="path"
          >
            {{ path.join(' > ') }}
          </option>
        </select>
      </div>
      <div class="form-group">
        <label>使用情境：</label>
        <textarea 
          v-model="newWord.context" 
          placeholder="请描述这个单词的使用场景（可选）"
          class="form-textarea"
          rows="3"
        ></textarea>
      </div>
      <div class="form-group">
        <label>助记提示：</label>
        <textarea 
          v-model="newWord.mnemonic" 
          placeholder="请输入助记提示（可选）"
          class="form-textarea"
          rows="3"
        ></textarea>
      </div>
      <div class="form-actions">
        <button @click="addWord" class="save-btn" :disabled="!canSaveWord">
          保存
        </button>
        <button @click="cancelAddWord" class="cancel-btn">
          取消
        </button>
      </div>
    </div>

    <!-- 分类树和单词列表 -->
    <div class="dictionary-content">
      <!-- 空状态提示 -->
      <div v-if="dataStore.words.length === 0 && categoryTree.length === 0" class="empty-state">
        <div class="empty-icon">📚</div>
        <h3>字典系统为空</h3>
        <p>开始创建你的分类体系吧！</p>
        <div class="empty-hints">
          <p>💡 提示：</p>
          <ul>
            <li>点击"添加分类"创建分类（如：人体单词库）</li>
            <li>点击"添加单词"添加单词到字典</li>
            <li>可以在分类中添加子分类，构建树状结构</li>
            <li>可以将单词拖拽到不同分类中</li>
          </ul>
        </div>
      </div>

      <!-- 主要内容区域：电脑端左右布局，手机端垂直布局 -->
      <div v-if="dataStore.words.length > 0 || categoryTree.length > 0" class="main-layout">
        <!-- 左侧：未分类单词 -->
        <div v-if="dataStore.words.length > 0" class="left-panel uncategorized-panel">
          <div class="category-section">
            <div class="category-header" @click="toggleUncategorized">
              <span class="fold-icon">{{ expandedCategories.has('uncategorized') ? '▼' : '▶' }}</span>
              <span class="category-name">未分类单词</span>
              <span class="word-count">({{ uncategorizedWords.length }})</span>
            </div>
            <div v-if="expandedCategories.has('uncategorized')" class="category-words">
              <div v-if="uncategorizedWords.length === 0" class="empty-category">
                暂无未分类单词
              </div>
              <div 
                v-for="word in uncategorizedWords" 
                :key="word.id" 
                class="word-item"
                :draggable="true"
                @dragstart="handleDragStart(word, $event)"
                @drop="handleDrop(word.id, [], $event)"
                @dragover.prevent
                @dragenter.prevent
              >
                <div class="word-content">
                  <div class="word-main">
                    <div v-if="dataStore.showJapanese" class="word-japanese">{{ word.japanese }}</div>
                    <div v-else class="word-chinese">{{ word.chinese }}</div>
                  </div>
                  <div class="word-secondary">
                    <div v-if="dataStore.showJapanese" class="word-chinese">{{ word.chinese }}</div>
                    <div v-else class="word-japanese">{{ word.japanese }}</div>
                  </div>
                  <div v-if="word.context" class="word-context">
                    <span class="context-label">使用情境：</span>{{ word.context }}
                  </div>
                  <div v-if="word.mnemonic" class="word-mnemonic">
                    <span class="mnemonic-label">助记提示：</span>{{ word.mnemonic }}
                  </div>
                </div>
                <div class="word-actions">
                  <button @click="playAudio(word)" class="speech-btn">🔊</button>
                  <button @click="editWord(word)" class="edit-btn">✏️</button>
                  <button @click="deleteWord(word.id)" class="delete-btn">🗑️</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧：分类树 -->
        <div class="right-panel categories-panel">
          <div v-if="categoryTree.length > 0" class="category-tree">
            <CategoryNode
              v-for="category in categoryTree"
              :key="category.id"
              :category="category"
              :path="[]"
              :words="wordsByCategoryPath"
              :expanded-categories="expandedCategories"
              :editing-category="editingCategory"
              :dragged-word="draggedWord"
              @toggle="toggleCategory"
              @edit="startEditCategory"
              @save-edit="saveEditCategory"
              @cancel-edit="cancelEditCategory"
              @delete="deleteCategoryConfirm"
              @add-child="showAddChildCategory"
              @move-word="moveWordToCategory"
              @edit-word="editWord"
              @delete-word="deleteWord"
              @play-audio="playAudio"
            />
          </div>
          
          <!-- 没有分类但有单词时的提示 -->
          <div v-if="categoryTree.length === 0 && dataStore.words.length > 0" class="no-category-hint">
            <div class="hint-content">
              <p>📁 还没有创建任何分类</p>
              <p>点击"添加分类"开始组织你的单词吧！</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 编辑单词表单 -->
    <div v-if="showEditForm && editingWord.id" class="edit-form-modal" @click="cancelEdit">
      <div class="edit-form-content" @click.stop>
        <h3>编辑单词</h3>
        <div class="form-group">
          <label>{{ dataStore.currentLanguageName }}单词：</label>
          <input 
            v-model="editingWord.japanese" 
            type="text" 
            class="form-input"
          />
        </div>
        <div class="form-group">
          <label>中文翻译：</label>
          <input 
            v-model="editingWord.chinese" 
            type="text" 
            class="form-input"
          />
        </div>
        <div class="form-group">
          <label>分类：</label>
          <select v-model="editingWord.categoryPath" class="form-select">
            <option :value="null">未分类</option>
            <option 
              v-for="path in allCategoryPaths" 
              :key="path.join('/')" 
              :value="path"
            >
              {{ path.join(' > ') }}
            </option>
          </select>
        </div>
        <div class="form-group">
          <label>使用情境：</label>
          <textarea 
            v-model="editingWord.context" 
            class="form-textarea"
            rows="3"
          ></textarea>
        </div>
        <div class="form-group">
          <label>助记提示：</label>
          <textarea 
            v-model="editingWord.mnemonic" 
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
    </div>

    <!-- 添加子分类对话框 -->
    <div v-if="showAddChildForm" class="modal" @click="cancelAddChildCategory">
      <div class="modal-content" @click.stop>
        <h3>添加子分类</h3>
        <div class="form-group">
          <label>分类名称：</label>
          <input 
            v-model="newChildCategory.name" 
            type="text" 
            placeholder="例如：头部"
            class="form-input"
          />
        </div>
        <div class="form-actions">
          <button @click="addChildCategory" class="save-btn" :disabled="!newChildCategory.name.trim()">
            保存
          </button>
          <button @click="cancelAddChildCategory" class="cancel-btn">
            取消
          </button>
        </div>
      </div>
    </div>

    <!-- 统计信息 -->
    <div class="stats">
      <div class="stat-item">
        <span class="stat-label">总单词数：</span>
        <span class="stat-value">{{ dataStore.totalWords }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">分类数：</span>
        <span class="stat-value">{{ totalCategories }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { useDataStore } from '../stores/dataStore'
import CategoryNode from './CategoryNode.vue'

export default {
  name: 'Dictionary',
  components: {
    CategoryNode
  },
  setup() {
    const dataStore = useDataStore()
    const showAddCategoryForm = ref(false)
    const showAddWordForm = ref(false)
    const showEditForm = ref(false)
    const showAddChildForm = ref(false)
    const expandedCategories = ref(new Set(['uncategorized']))
    const editingCategory = ref(null)
    const draggedWord = ref(null)
    
    const newCategory = ref({
      name: '',
      parentPath: null
    })
    
    const newWord = ref({
      japanese: '',
      chinese: '',
      categoryPath: null,
      context: '',
      mnemonic: ''
    })
    
    const editingWord = ref({
      id: '',
      japanese: '',
      chinese: '',
      categoryPath: null,
      context: '',
      mnemonic: ''
    })
    
    const newChildCategory = ref({
      name: '',
      parentPath: null
    })

    // 获取分类树
    const categoryTree = computed(() => {
      try {
        return dataStore.getCategoryTree(dataStore.currentLanguage) || []
      } catch (error) {
        console.error('获取分类树失败:', error)
        return []
      }
    })

    // 获取所有分类路径
    const allCategoryPaths = computed(() => {
      const paths = []
      const traverse = (categories, currentPath = []) => {
        categories.forEach(cat => {
          const path = [...currentPath, cat.name]
          paths.push(path)
          if (cat.children && cat.children.length > 0) {
            traverse(cat.children, path)
          }
        })
      }
      traverse(categoryTree.value)
      return paths
    })

    // 按分类路径组织单词
    const wordsByCategoryPath = computed(() => {
      const result = {}
      try {
        (dataStore.words || []).forEach(word => {
          const pathKey = (word.categoryPath && Array.isArray(word.categoryPath) && word.categoryPath.length > 0) 
            ? word.categoryPath.join('/') 
            : 'uncategorized'
          if (!result[pathKey]) {
            result[pathKey] = []
          }
          result[pathKey].push(word)
        })
      } catch (error) {
        console.error('组织单词失败:', error)
      }
      return result
    })

    // 未分类单词
    const uncategorizedWords = computed(() => {
      try {
        return (dataStore.words || []).filter(word => 
          !word.categoryPath || 
          !Array.isArray(word.categoryPath) || 
          word.categoryPath.length === 0
        )
      } catch (error) {
        console.error('获取未分类单词失败:', error)
        return []
      }
    })

    // 总分类数
    const totalCategories = computed(() => {
      try {
        const count = (categories) => {
          if (!Array.isArray(categories)) return 0
          let total = categories.length
          categories.forEach(cat => {
            if (cat.children && Array.isArray(cat.children) && cat.children.length > 0) {
              total += count(cat.children)
            }
          })
          return total
        }
        return count(categoryTree.value)
      } catch (error) {
        console.error('计算分类数失败:', error)
        return 0
      }
    })

    const canSaveWord = computed(() => {
      return newWord.value.japanese.trim() && newWord.value.chinese.trim()
    })

    const canSaveEdit = computed(() => {
      return editingWord.value.japanese.trim() && editingWord.value.chinese.trim()
    })

    // 切换未分类单词的展开/折叠
    const toggleUncategorized = () => {
      if (expandedCategories.value.has('uncategorized')) {
        expandedCategories.value.delete('uncategorized')
      } else {
        expandedCategories.value.add('uncategorized')
      }
    }

    // 切换分类的展开/折叠
    const toggleCategory = (path) => {
      const pathKey = path.join('/')
      if (expandedCategories.value.has(pathKey)) {
        expandedCategories.value.delete(pathKey)
      } else {
        expandedCategories.value.add(pathKey)
      }
    }

    // 添加分类
    const addCategory = async () => {
      if (!newCategory.value.name.trim()) return
      
      try {
        dataStore.addCategory(
          dataStore.currentLanguage,
          newCategory.value.parentPath || [],
          newCategory.value.name.trim()
        )
        cancelAddCategory()
      } catch (error) {
        alert(`添加分类失败：${error.message}`)
      }
    }

    const cancelAddCategory = () => {
      showAddCategoryForm.value = false
      newCategory.value = { name: '', parentPath: null }
    }

    // 添加单词
    const addWord = async () => {
      if (!canSaveWord.value) return
      
      try {
        await dataStore.addWord({
          japanese: newWord.value.japanese.trim(),
          chinese: newWord.value.chinese.trim(),
          categoryPath: newWord.value.categoryPath || [],
          context: newWord.value.context.trim(),
          mnemonic: newWord.value.mnemonic.trim()
        })
        cancelAddWord()
      } catch (error) {
        alert(`添加单词失败：${error.message}`)
      }
    }

    const cancelAddWord = () => {
      showAddWordForm.value = false
      newWord.value = {
        japanese: '',
        chinese: '',
        categoryPath: null,
        context: '',
        mnemonic: ''
      }
    }

    // 编辑单词
    const editWord = (word) => {
      editingWord.value = {
        id: word.id,
        japanese: word.japanese,
        chinese: word.chinese,
        categoryPath: word.categoryPath || null,
        context: word.context || '',
        mnemonic: word.mnemonic || ''
      }
      showEditForm.value = true
    }

    const saveEdit = async () => {
      if (!canSaveEdit.value) return
      
      try {
        await dataStore.updateWord(editingWord.value.id, {
          japanese: editingWord.value.japanese.trim(),
          chinese: editingWord.value.chinese.trim(),
          categoryPath: editingWord.value.categoryPath || [],
          context: editingWord.value.context.trim(),
          mnemonic: editingWord.value.mnemonic.trim()
        })
        cancelEdit()
      } catch (error) {
        alert(`更新失败：${error.message}`)
      }
    }

    const cancelEdit = () => {
      showEditForm.value = false
      editingWord.value = {
        id: '',
        japanese: '',
        chinese: '',
        categoryPath: null,
        context: '',
        mnemonic: ''
      }
    }

    // 删除单词
    const deleteWord = (id) => {
      if (confirm('确定要删除这个单词吗？')) {
        dataStore.deleteWord(id)
      }
    }

    // 编辑分类
    const startEditCategory = (path) => {
      editingCategory.value = path
    }

    const saveEditCategory = async (path, newName) => {
      try {
        await dataStore.updateCategoryName(dataStore.currentLanguage, path, newName)
        editingCategory.value = null
      } catch (error) {
        alert(`更新分类失败：${error.message}`)
      }
    }

    const cancelEditCategory = () => {
      editingCategory.value = null
    }

    // 删除分类
    const deleteCategoryConfirm = (path) => {
      if (confirm('确定要删除这个分类吗？分类下的单词将移到未分类。')) {
        try {
          dataStore.deleteCategory(dataStore.currentLanguage, path)
        } catch (error) {
          alert(`删除分类失败：${error.message}`)
        }
      }
    }

    // 添加子分类
    const showAddChildCategory = (path) => {
      newChildCategory.value = {
        name: '',
        parentPath: path
      }
      showAddChildForm.value = true
    }

    const addChildCategory = () => {
      if (!newChildCategory.value.name.trim()) return
      
      try {
        dataStore.addCategory(
          dataStore.currentLanguage,
          newChildCategory.value.parentPath,
          newChildCategory.value.name.trim()
        )
        cancelAddChildCategory()
      } catch (error) {
        alert(`添加分类失败：${error.message}`)
      }
    }

    const cancelAddChildCategory = () => {
      showAddChildForm.value = false
      newChildCategory.value = { name: '', parentPath: null }
    }

    // 移动单词到分类
    const moveWordToCategory = async (wordId, categoryPath) => {
      try {
        await dataStore.moveWordToCategory(wordId, categoryPath)
      } catch (error) {
        alert(`移动单词失败：${error.message}`)
      }
    }

    // 拖拽处理
    const handleDragStart = (word, event) => {
      draggedWord.value = word
      event.dataTransfer.effectAllowed = 'move'
      event.dataTransfer.setData('wordId', word.id)
    }

    // 拖拽放置
    const handleDrop = (wordId, categoryPath, event) => {
      event.preventDefault()
      const draggedWordId = event.dataTransfer.getData('wordId') || wordId
      if (draggedWordId) {
        moveWordToCategory(draggedWordId, categoryPath)
      }
    }

    // 播放音频
    const playAudio = async (word) => {
      try {
        const textToSpeak = dataStore.showJapanese ? word.japanese : word.chinese
        
        if (!textToSpeak.trim()) {
          alert('没有可播放的内容')
          return
        }

        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(textToSpeak)
          utterance.lang = dataStore.getSpeechCode(dataStore.currentLanguage)
          utterance.rate = 0.8
          utterance.pitch = 1
          utterance.volume = 1
          
          speechSynthesis.speak(utterance)
        } else {
          alert('您的浏览器不支持语音播放功能')
        }
      } catch (error) {
        console.error('语音播放错误:', error)
        alert('语音播放失败')
      }
    }

    // 加载分类数据
    onMounted(async () => {
      await dataStore.loadCategoriesFromCloud(dataStore.currentLanguage)
    })

    // 监听语言切换
    watch(() => dataStore.currentLanguage, async (newLang) => {
      if (newLang) {
        await dataStore.loadCategoriesFromCloud(newLang)
      }
    }, { immediate: false })

    return {
      dataStore,
      showAddCategoryForm,
      showAddWordForm,
      showEditForm,
      showAddChildForm,
      expandedCategories,
      editingCategory,
      draggedWord,
      newCategory,
      newWord,
      editingWord,
      newChildCategory,
      categoryTree,
      allCategoryPaths,
      wordsByCategoryPath,
      uncategorizedWords,
      totalCategories,
      canSaveWord,
      canSaveEdit,
      toggleUncategorized,
      toggleCategory,
      addCategory,
      cancelAddCategory,
      addWord,
      cancelAddWord,
      editWord,
      saveEdit,
      cancelEdit,
      deleteWord,
      startEditCategory,
      saveEditCategory,
      cancelEditCategory,
      deleteCategoryConfirm,
      showAddChildCategory,
      addChildCategory,
      cancelAddChildCategory,
      moveWordToCategory,
      handleDragStart,
      handleDrop,
      playAudio
    }
  }
}
</script>

<style scoped>
.dictionary {
  max-width: 800px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.header h2 {
  color: #333;
  font-size: 1.5rem;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.add-category-btn,
.add-word-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s;
}

.add-category-btn:hover,
.add-word-btn:hover {
  transform: translateY(-2px);
}

.add-form {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.add-form h3 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: #333;
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

.form-input,
.form-select,
.form-textarea {
  width: 100%;
  padding: 0.8rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s;
  box-sizing: border-box;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: #667eea;
}

.form-textarea {
  resize: vertical;
  font-family: inherit;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
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

.dictionary-content {
  margin-bottom: 1.5rem;
}

/* 主要内容布局：电脑端左右分布，手机端垂直分布 */
.main-layout {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* 左侧面板：未分类单词 */
.left-panel {
  flex: 1;
}

/* 右侧面板：分类树 */
.right-panel {
  flex: 1;
}

/* 电脑端：左右布局 */
@media (min-width: 768px) {
  .main-layout {
    flex-direction: row;
    gap: 1.5rem;
    align-items: flex-start;
  }

  .left-panel {
    flex: 0 0 45%;
    max-width: 45%;
    position: sticky;
    top: 1rem;
    max-height: calc(100vh - 200px);
    overflow-y: auto;
  }

  .right-panel {
    flex: 0 0 55%;
    max-width: 55%;
  }

  .uncategorized-panel .category-section {
    height: 100%;
  }

  .uncategorized-panel .category-words {
    max-height: calc(100vh - 300px);
    overflow-y: auto;
  }
}

.empty-state {
  background: white;
  padding: 3rem 2rem;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  margin-bottom: 1.5rem;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.empty-state h3 {
  color: #333;
  margin-bottom: 0.5rem;
  font-size: 1.5rem;
}

.empty-state > p {
  color: #666;
  margin-bottom: 1.5rem;
  font-size: 1rem;
}

.empty-hints {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 8px;
  text-align: left;
  max-width: 500px;
  margin: 0 auto;
}

.empty-hints > p {
  font-weight: 600;
  color: #667eea;
  margin-bottom: 0.5rem;
}

.empty-hints ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.empty-hints li {
  padding: 0.5rem 0;
  color: #555;
  line-height: 1.6;
}

.no-category-hint {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  margin-top: 1rem;
  text-align: center;
}

.hint-content {
  color: #666;
}

.hint-content p {
  margin: 0.5rem 0;
  font-size: 1rem;
}

.category-section {
  background: white;
  border-radius: 12px;
  margin-bottom: 1rem;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* 电脑端：左侧面板的category-section不需要margin-bottom */
@media (min-width: 768px) {
  .left-panel .category-section {
    margin-bottom: 0;
    height: 100%;
  }
}

.category-header {
  padding: 1rem 1.5rem;
  background: #f8f9fa;
  border-bottom: 1px solid #e0e0e0;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.2s;
}

.category-header:hover {
  background: #e9ecef;
}

.fold-icon {
  font-size: 0.8rem;
  color: #666;
  min-width: 20px;
}

.category-name {
  font-weight: 600;
  color: #333;
  flex: 1;
}

.word-count {
  color: #666;
  font-size: 0.9rem;
}

.category-words {
  padding: 1rem;
}

.empty-category {
  text-align: center;
  color: #999;
  padding: 2rem;
}

.word-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 0.5rem;
  transition: transform 0.2s;
  cursor: move;
}

.word-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.word-content {
  flex: 1;
}

.word-main .word-japanese,
.word-main .word-chinese {
  font-size: 1.2rem;
  font-weight: bold;
  color: #333;
  margin-bottom: 0.3rem;
}

.word-secondary .word-japanese,
.word-secondary .word-chinese {
  color: #666;
  margin-bottom: 0.3rem;
  font-size: 0.9rem;
}

.word-context {
  background: #e3f2fd;
  padding: 0.5rem;
  border-radius: 4px;
  margin-bottom: 0.3rem;
  font-size: 0.85rem;
  color: #555;
}

.context-label {
  font-weight: 600;
  color: #2196F3;
  margin-right: 0.3rem;
}

.word-mnemonic {
  background: #fff3cd;
  padding: 0.5rem;
  border-radius: 4px;
  margin-bottom: 0.3rem;
  font-size: 0.85rem;
  color: #856404;
}

.mnemonic-label {
  font-weight: 600;
  color: #ff9800;
  margin-right: 0.3rem;
}

.word-actions {
  display: flex;
  gap: 0.5rem;
  margin-left: 1rem;
}

.speech-btn,
.edit-btn,
.delete-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 0.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s;
}

.speech-btn:hover {
  background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
}

.edit-btn {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.edit-btn:hover {
  background: linear-gradient(135deg, #f5576c 0%, #f093fb 100%);
}

.delete-btn {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
}

.delete-btn:hover {
  background: linear-gradient(135deg, #fee140 0%, #fa709a 100%);
}

.category-tree {
  background: white;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

/* 滚动条样式优化 */
.left-panel .category-words::-webkit-scrollbar,
.right-panel .category-tree::-webkit-scrollbar {
  width: 8px;
}

.left-panel .category-words::-webkit-scrollbar-track,
.right-panel .category-tree::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}

.left-panel .category-words::-webkit-scrollbar-thumb,
.right-panel .category-tree::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 10px;
}

.left-panel .category-words::-webkit-scrollbar-thumb:hover,
.right-panel .category-tree::-webkit-scrollbar-thumb:hover {
  background: #555;
}

.edit-form-modal,
.modal {
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

.edit-form-content,
.modal-content {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

.edit-form-content h3,
.modal-content h3 {
  margin-top: 0;
  margin-bottom: 1.5rem;
  color: #333;
}

.stats {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  display: flex;
  gap: 2rem;
}

.stat-item {
  display: flex;
  gap: 0.5rem;
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
    align-items: stretch;
  }
  
  .header-actions {
    flex-direction: column;
  }
  
  .word-item {
    flex-direction: column;
    gap: 1rem;
  }
  
  .word-actions {
    align-self: flex-end;
    margin-left: 0;
  }
  
  .stats {
    flex-direction: column;
    gap: 1rem;
  }
}
</style>

