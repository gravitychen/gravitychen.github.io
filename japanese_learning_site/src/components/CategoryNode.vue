<template>
  <div class="category-node">
    <div 
      class="category-header" 
      @click="handleToggle"
      :class="{ 'has-children': category.children && category.children.length > 0 }"
    >
      <span class="fold-icon">
        {{ isExpanded ? '▼' : '▶' }}
      </span>
      <span v-if="!isEditing" class="category-name" @dblclick="startEdit">
        {{ category.name }}
      </span>
      <input
        v-else
        v-model="editName"
        @blur="saveEdit"
        @keyup.enter="saveEdit"
        @keyup.esc="cancelEdit"
        class="category-name-input"
        @click.stop
        ref="nameInput"
      />
      <span class="word-count">({{ wordCount }})</span>
      <div class="category-actions" @click.stop>
        <button 
          v-if="!isEditing"
          @click="startEdit" 
          class="action-btn edit-category-btn"
          title="编辑分类"
        >
          ✏️
        </button>
        <button 
          v-if="!isEditing"
          @click="addChild" 
          class="action-btn add-child-btn"
          title="添加子分类"
        >
          ➕
        </button>
        <button 
          v-if="!isEditing"
          @click="deleteCategory" 
          class="action-btn delete-category-btn"
          title="删除分类"
        >
          🗑️
        </button>
      </div>
    </div>
    
    <!-- 分类下的单词列表 -->
    <div 
      v-if="isExpanded" 
      class="category-content"
      @drop="handleDrop"
      @dragover.prevent
      @dragenter.prevent
    >
      <div 
        v-if="categoryWords.length === 0" 
        class="empty-category"
      >
        暂无单词，可以拖拽单词到这里
      </div>
      <div 
        v-for="word in categoryWords" 
        :key="word.id" 
        class="word-item"
        :draggable="true"
        @dragstart="handleDragStart(word, $event)"
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
          <button @click="$emit('play-audio', word)" class="speech-btn">🔊</button>
          <button @click="$emit('edit-word', word)" class="edit-btn">✏️</button>
          <button @click="$emit('delete-word', word.id)" class="delete-btn">🗑️</button>
        </div>
      </div>
      
      <!-- 子分类 -->
      <div v-if="category.children && category.children.length > 0" class="children-categories">
        <CategoryNode
          v-for="child in category.children"
          :key="child.id"
          :category="child"
          :path="[...path, category.name]"
          :words="words"
          :expanded-categories="expandedCategories"
          :editing-category="editingCategory"
          :dragged-word="draggedWord"
          @toggle="(path) => $emit('toggle', path)"
          @edit="(path) => $emit('edit', path)"
          @save-edit="(path, name) => $emit('save-edit', path, name)"
          @cancel-edit="$emit('cancel-edit')"
          @delete="(path) => $emit('delete', path)"
          @add-child="(path) => $emit('add-child', path)"
          @move-word="(wordId, categoryPath) => $emit('move-word', wordId, categoryPath)"
          @edit-word="(word) => $emit('edit-word', word)"
          @delete-word="(wordId) => $emit('delete-word', wordId)"
          @play-audio="(word) => $emit('play-audio', word)"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, nextTick, watch } from 'vue'
import { useDataStore } from '../stores/dataStore'

export default {
  name: 'CategoryNode',
  props: {
    category: {
      type: Object,
      required: true
    },
    path: {
      type: Array,
      default: () => []
    },
    words: {
      type: Object,
      required: true
    },
    expandedCategories: {
      type: Set,
      required: true
    },
    editingCategory: {
      type: Array,
      default: null
    },
    draggedWord: {
      type: Object,
      default: null
    }
  },
  emits: [
    'toggle',
    'edit',
    'save-edit',
    'cancel-edit',
    'delete',
    'add-child',
    'move-word',
    'edit-word',
    'delete-word',
    'play-audio'
  ],
  setup(props, { emit }) {
    const dataStore = useDataStore()
    const editName = ref('')
    const isEditing = ref(false)
    const nameInput = ref(null)

    // 当前分类的完整路径
    const currentPath = computed(() => {
      return [...props.path, props.category.name]
    })

    // 是否展开
    const isExpanded = computed(() => {
      return props.expandedCategories.has(currentPath.value.join('/'))
    })

    // 当前分类下的单词
    const categoryWords = computed(() => {
      const pathKey = currentPath.value.join('/')
      return props.words[pathKey] || []
    })

    // 单词数量（包括子分类的单词）
    const wordCount = computed(() => {
      let count = categoryWords.value.length
      if (props.category.children) {
        const countChildren = (children) => {
          children.forEach(child => {
            const childPath = [...currentPath.value, child.name]
            const childPathKey = childPath.join('/')
            count += (props.words[childPathKey] || []).length
            if (child.children) {
              countChildren(child.children)
            }
          })
        }
        countChildren(props.category.children)
      }
      return count
    })

    // 开始编辑
    const startEdit = () => {
      if (props.editingCategory && props.editingCategory.join('/') !== currentPath.value.join('/')) {
        return // 其他分类正在编辑
      }
      editName.value = props.category.name
      isEditing.value = true
      emit('edit', currentPath.value)
      nextTick(() => {
        if (nameInput.value) {
          nameInput.value.focus()
          nameInput.value.select()
        }
      })
    }

    // 保存编辑
    const saveEdit = () => {
      if (editName.value.trim() && editName.value.trim() !== props.category.name) {
        emit('save-edit', currentPath.value, editName.value.trim())
      }
      cancelEdit()
    }

    // 取消编辑
    const cancelEdit = () => {
      isEditing.value = false
      editName.value = ''
      emit('cancel-edit')
    }

    // 删除分类
    const deleteCategory = () => {
      emit('delete', currentPath.value)
    }

    // 添加子分类
    const addChild = () => {
      emit('add-child', currentPath.value)
    }

    // 处理展开/折叠
    const handleToggle = () => {
      emit('toggle', currentPath.value)
    }

    // 拖拽开始
    const handleDragStart = (word, event) => {
      event.dataTransfer.effectAllowed = 'move'
      event.dataTransfer.setData('wordId', word.id)
    }

    // 拖拽放置
    const handleDrop = (event) => {
      event.preventDefault()
      event.stopPropagation()
      const wordId = event.dataTransfer.getData('wordId')
      if (wordId) {
        emit('move-word', wordId, currentPath.value)
      }
    }

    // 监听编辑状态
    watch(() => props.editingCategory, (newVal) => {
      if (!newVal || newVal.join('/') !== currentPath.value.join('/')) {
        isEditing.value = false
        editName.value = ''
      }
    })

    return {
      dataStore,
      editName,
      isEditing,
      nameInput,
      currentPath,
      isExpanded,
      categoryWords,
      wordCount,
      startEdit,
      saveEdit,
      cancelEdit,
      deleteCategory,
      addChild,
      handleToggle,
      handleDragStart,
      handleDrop
    }
  }
}
</script>

<style scoped>
.category-node {
  margin-bottom: 0.5rem;
}

.category-header {
  padding: 0.8rem 1rem;
  background: #f8f9fa;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
  position: relative;
}

.category-header:hover {
  background: #e9ecef;
  border-color: #667eea;
}

.category-header.has-children {
  font-weight: 600;
}

.fold-icon {
  font-size: 0.8rem;
  color: #666;
  min-width: 20px;
  user-select: none;
}

.category-name {
  flex: 1;
  color: #333;
  font-weight: 500;
}

.category-name-input {
  flex: 1;
  padding: 0.3rem 0.5rem;
  border: 2px solid #667eea;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 500;
  background: white;
}

.word-count {
  color: #666;
  font-size: 0.85rem;
  margin-left: auto;
}

.category-actions {
  display: flex;
  gap: 0.3rem;
  margin-left: 0.5rem;
}

.action-btn {
  background: transparent;
  border: none;
  padding: 0.3rem 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
  opacity: 0.7;
}

.action-btn:hover {
  opacity: 1;
  background: rgba(102, 126, 234, 0.1);
}

.edit-category-btn:hover {
  color: #667eea;
}

.add-child-btn:hover {
  color: #28a745;
}

.delete-category-btn:hover {
  color: #dc3545;
}

.category-content {
  margin-left: 1.5rem;
  margin-top: 0.5rem;
  padding-left: 1rem;
  border-left: 2px solid #e0e0e0;
}

.empty-category {
  text-align: center;
  color: #999;
  padding: 1.5rem;
  border: 2px dashed #e0e0e0;
  border-radius: 8px;
  margin-bottom: 0.5rem;
  transition: all 0.2s;
}

.empty-category:hover {
  border-color: #667eea;
  background: #f0f4ff;
}

.word-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  background: #f8f9fa;
  padding: 0.8rem;
  border-radius: 6px;
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
  font-size: 1.1rem;
  font-weight: bold;
  color: #333;
  margin-bottom: 0.2rem;
}

.word-secondary .word-japanese,
.word-secondary .word-chinese {
  color: #666;
  margin-bottom: 0.2rem;
  font-size: 0.85rem;
}

.word-context {
  background: #e3f2fd;
  padding: 0.4rem;
  border-radius: 4px;
  margin-bottom: 0.2rem;
  font-size: 0.8rem;
  color: #555;
}

.context-label {
  font-weight: 600;
  color: #2196F3;
  margin-right: 0.3rem;
}

.word-mnemonic {
  background: #fff3cd;
  padding: 0.4rem;
  border-radius: 4px;
  margin-bottom: 0.2rem;
  font-size: 0.8rem;
  color: #856404;
}

.mnemonic-label {
  font-weight: 600;
  color: #ff9800;
  margin-right: 0.3rem;
}

.word-actions {
  display: flex;
  gap: 0.3rem;
  margin-left: 0.5rem;
}

.speech-btn,
.edit-btn,
.delete-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 0.4rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.2s;
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

.children-categories {
  margin-top: 0.5rem;
}

/* 移动端优化 */
@media (max-width: 480px) {
  .category-header {
    padding: 0.6rem 0.8rem;
    font-size: 0.9rem;
  }
  
  .category-content {
    margin-left: 1rem;
    padding-left: 0.5rem;
  }
  
  .word-item {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .word-actions {
    align-self: flex-end;
    margin-left: 0;
  }
  
  .category-actions {
    flex-direction: column;
    gap: 0.2rem;
  }
}
</style>

