<!-- 理解 Vue 模板结构
Vue 的模板（<template>）就像 HTML，但更灵活。在模板中，代码顺序决定显示顺序。 -->

<template>
  <div class="review">
    <div class="header">
      <h2>📚 复习中心</h2>
      <div class="progress-info">
        <span>今日复习进度: {{ completedCount }}/{{ totalToReview }}</span>
      </div>
    </div>

    <!-- 复习模式 -->
    <div v-if="reviewMode" class="review-mode">
      <div class="review-header">
        <h3>{{ getReviewTitle() }}</h3>
        <div class="review-progress">
          {{ currentIndex + 1 }}/{{ reviewItems.length }}
        </div>
      </div>

      <!-- 记忆模式切换按钮（问答复习和集中复习不显示） -->
      <div v-if="reviewType !== 'qa' && !isIncorrectReview" class="memory-mode-switch">
        <button 
          @click="memoryMode = 'dictionary'" 
          :class="['mode-btn', { active: memoryMode === 'dictionary' }]"
        >
          📖 词典记忆
        </button>
        <button 
          @click="memoryMode = 'scenario'" 
          :class="['mode-btn', { active: memoryMode === 'scenario' }]"
        >
          🎬 情景记忆
        </button>
      </div>

      <div class="review-content">
        <!-- 情景记忆模式：三步渐进式显示（适用于单词和句子，不适用于问答和集中复习） -->
        <template v-if="memoryMode === 'scenario' && reviewType !== 'qa' && !isIncorrectReview">
          <div class="review-item">
            <!-- 步骤1：显示中文 + 强调内在感觉 -->
            <div v-if="sentenceStep === 1" class="sentence-step">
              <div class="step-label">步骤 1/3</div>
              <div class="item-chinese">
                <template v-if="reviewType === 'words'">
                  {{ showJapanese ? getCurrentItem().chinese : getCurrentItem().japanese }}
                </template>
                <template v-else>
                  {{ getCurrentItem().chinese }}
                </template>
              </div>
              <div class="step-hint highlight-hint">
                💭 重要提示：不要只看文字！<br>
                <template v-if="reviewType === 'words'">
                  要主动联想到这个单词对应的内在感觉和含义，用心感受这个单词传达的意思。
                </template>
                <template v-else>
                  要主动联想到对应的内在感觉，用心感受这个句子传达的情感或意图。
                </template>
              </div>
            </div>

            <!-- 步骤2：显示使用场景 + 强调身临其境 -->
            <div v-if="sentenceStep === 2" class="sentence-step">
              <div class="step-label">步骤 2/3</div>
              <div class="item-context">
                <div class="context-label">📍 使用情境：</div>
                <div class="context-content">
                  <template v-if="reviewType === 'words'">
                    {{ getCurrentItem().context || '（未设置使用情境，可以想象这个单词在什么场景下使用）' }}
                  </template>
                  <template v-else>
                    {{ getCurrentItem().context || '（未设置使用情境）' }}
                  </template>
                </div>
              </div>
              <div class="step-hint highlight-hint">
                🎬 重要提示：忘掉刚才的文字！！！主动去联想这个场景！<br>
                要有身临其境感，想象自己在这个情境中，体会当时的感觉和情绪。学语言学的是语言，不是学翻译！
              </div>
            </div>

            <!-- 步骤3：显示答案 -->
            <div v-if="sentenceStep === 3" class="sentence-step">
              <div class="step-label">步骤 3/3</div>
              <div class="item-chinese">
                <template v-if="reviewType === 'words'">
                  {{ showJapanese ? getCurrentItem().chinese : getCurrentItem().japanese }}
                </template>
                <template v-else>
                  {{ getCurrentItem().chinese }}
                </template>
              </div>
              <div class="item-context" v-if="getCurrentItem().context">
                <div class="context-label">📍 使用情境：</div>
                <div class="context-content">{{ getCurrentItem().context }}</div>
              </div>
              <div class="item-answer">
                <div class="answer-label">
                  <template v-if="reviewType === 'words'">
                    {{ showJapanese ? '🇯🇵 ' + currentLanguageName + '单词：' : '🇨🇳 中文翻译：' }}
                  </template>
                  <template v-else>
                    🇯🇵 {{ currentLanguageName }}句子：
                  </template>
                </div>
                <div class="answer-content">
                  <template v-if="reviewType === 'words'">
                    {{ showJapanese ? getCurrentItem().japanese : getCurrentItem().chinese }}
                  </template>
                  <template v-else>
                    {{ getCurrentItem().japanese }}
                  </template>
                </div>
              </div>
            </div>
          </div>

          <div class="review-actions">
            <button 
              v-if="sentenceStep === 1" 
              @click="sentenceStep = 2" 
              class="show-answer-btn"
            >
              下一步：查看使用情境
            </button>
            
            <button 
              v-if="sentenceStep === 2" 
              @click="sentenceStep = 3" 
              class="show-answer-btn"
            >
              下一步：查看{{ reviewType === 'words' ? (showJapanese ? currentLanguageName + '单词' : '中文翻译') : (currentLanguageName + '句子') }}
            </button>
            
            <div v-if="sentenceStep === 3" class="answer-actions">
              <button @click="markCorrect" class="correct-btn">
                ✅ 记住了
              </button>
              <button @click="markIncorrect" class="incorrect-btn">
                ❌ 没记住
              </button>
              <button @click="markAsMastered" class="mastered-btn">
                ⭐ 移动到熟记区
              </button>
            </div>
          </div>
        </template>

        <!-- 词典记忆模式：简单显示答案（适用于单词、句子、问答和集中复习） -->
        <template v-else>
          <div class="review-item">
            <div class="item-question">
              <!-- 统一逻辑：根据项目类型显示（集中复习、熟记复习、普通复习都使用相同逻辑） -->
              <template v-if="getCurrentItem()._type === 'word' || reviewType === 'words'">
                {{ showJapanese ? getCurrentItem().japanese : getCurrentItem().chinese }}
              </template>
              <template v-else-if="getCurrentItem()._type === 'sentence' || reviewType === 'sentences'">
                {{ showJapanese ? getCurrentItem().chinese : getCurrentItem().japanese }}
              </template>
              <template v-else>
                {{ getCurrentItem().japanese || getCurrentItem().question }}
              </template>
            </div>
            <div v-if="showAnswer" class="item-answer">
              <!-- 统一逻辑：根据项目类型显示（集中复习、熟记复习、普通复习都使用相同逻辑） -->
              <template v-if="getCurrentItem()._type === 'word' || reviewType === 'words'">
                {{ showJapanese ? getCurrentItem().chinese : getCurrentItem().japanese }}
              </template>
              <template v-else-if="getCurrentItem()._type === 'sentence' || reviewType === 'sentences'">
                {{ showJapanese ? getCurrentItem().japanese : getCurrentItem().chinese }}
              </template>
              <template v-else>
                {{ getCurrentItem().chinese || getCurrentItem().answer }}
              </template>
            </div>
          </div>

          <div class="review-actions">
            <button 
              v-if="!showAnswer" 
              @click="showAnswer = true" 
              class="show-answer-btn"
            >
              显示答案
            </button>
            
            <div v-if="showAnswer" class="answer-actions">
              <button @click="markCorrect" class="correct-btn">
                ✅ 记住了
              </button>
              <button @click="markIncorrect" class="incorrect-btn">
                ❌ 没记住
              </button>
              <button @click="markAsMastered" class="mastered-btn">
                ⭐ 移动到熟记区
              </button>
            </div>
          </div>
        </template>
      </div>

      <div class="review-controls">
        <button @click="exitReview" class="exit-btn">
          退出复习
        </button>
      </div>
    </div>

    <!-- 复习完成 -->
    <div v-if="reviewCompleted" class="review-completed">
      <div class="completed-icon">🎉</div>
      <h3>复习完成！</h3>
      <p>恭喜你完成了今天的复习任务</p>
      <div class="completed-stats">
        <div class="completed-stat">
          <span class="stat-label">复习项目：</span>
          <span class="stat-value">{{ reviewItems.length }}</span>
        </div>
        <div class="completed-stat">
          <span class="stat-label">正确率：</span>
          <span class="stat-value">{{ Math.round((correctCount / reviewItems.length) * 100) }}%</span>
        </div>
      </div>
      <button @click="resetReview" class="restart-btn">
        重新开始
      </button>
    </div>

    <!-- 集中复习区 -->
    <div v-if="dataStore.totalIncorrectItems > 0" class="incorrect-review-section">
      <h3>🎯 集中复习 - 没记住的项目</h3>
      <div class="incorrect-stats">
        <div class="incorrect-stat-item">
          <span class="stat-number">{{ dataStore.incorrectWords.length }}</span>
          <span class="stat-label">个单词</span>
        </div>
        <div class="incorrect-stat-item">
          <span class="stat-number">{{ dataStore.incorrectSentences.length }}</span>
          <span class="stat-label">个句子</span>
        </div>
        <div class="incorrect-stat-item">
          <span class="stat-number">{{ dataStore.incorrectQA.length }}</span>
          <span class="stat-label">个问答</span>
        </div>
      </div>
      <button 
        @click="startIncorrectReview" 
        class="incorrect-review-btn"
      >
        <span class="btn-icon">🔥</span>
        <span class="btn-text">开始集中复习</span>
        <span class="btn-count">({{ dataStore.totalIncorrectItems }})</span>
      </button>
      <button 
        @click="clearIncorrectItems" 
        class="clear-incorrect-btn"
      >
        清除所有标记
      </button>
    </div>

    <!-- 熟记区 -->
    <div v-if="dataStore.totalMasteredItems > 0" class="mastered-review-section">
      <h3>⭐ 熟记区 - 已熟记的项目</h3>
      <div class="mastered-stats">
        <div class="mastered-stat-item">
          <span class="stat-number">{{ dataStore.masteredWords.length }}</span>
          <span class="stat-label">个单词</span>
        </div>
        <div class="mastered-stat-item">
          <span class="stat-number">{{ dataStore.masteredSentences.length }}</span>
          <span class="stat-label">个句子</span>
        </div>
        <div class="mastered-stat-item">
          <span class="stat-number">{{ dataStore.masteredQA.length }}</span>
          <span class="stat-label">个问答</span>
        </div>
      </div>
      <button 
        @click="startMasteredReview" 
        class="mastered-review-btn"
      >
        <span class="btn-icon">⭐</span>
        <span class="btn-text">开始熟记复习</span>
        <span class="btn-count">({{ dataStore.totalMasteredItems }})</span>
      </button>
      <button 
        @click="clearMasteredItems" 
        class="clear-mastered-btn"
      >
        清除所有标记
      </button>
    </div>

    <!-- 复习内容选择 -->
    <div class="review-options">
      <h3>选择复习内容</h3>
      <div class="option-buttons">
        <button 
          @click="startReview('words')" 
          class="option-btn"
          :disabled="dataStore.wordsToReview.length === 0"
        >
          <span class="btn-icon">📝</span>
          <span class="btn-text">复习单词</span>
          <span class="btn-count">({{ dataStore.wordsToReview.length }})</span>
        </button>
        
        <button 
          @click="startReview('sentences')" 
          class="option-btn"
          :disabled="dataStore.sentencesToReview.length === 0"
        >
          <span class="btn-icon">💬</span>
          <span class="btn-text">复习句子</span>
          <span class="btn-count">({{ dataStore.sentencesToReview.length }})</span>
        </button>
        
        <button 
          @click="startReview('qa')" 
          class="option-btn"
          :disabled="dataStore.qaToReview.length === 0"
        >
          <span class="btn-icon">❓</span>
          <span class="btn-text">复习问答</span>
          <span class="btn-count">({{ dataStore.qaToReview.length }})</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { useDataStore } from '../stores/dataStore'

// Vue 的 ref 是什么？
// 简单理解: ref 是 Vue 3 中用来创建响应式数据的工具。当数据改变时，界面会自动更新。
// 为什么需要 ref？
// Vue 需要知道哪些数据会变化，才能自动更新界面。用 ref() 包装后，Vue 会追踪这些数据。
// ❌ 普通变量 - Vue 不知道它变了
// let count = 0
// count = 1  // 界面不会更新
// // ✅ ref - Vue 知道它变了
// const count = ref(0)
// count.value = 1  // 界面会自动更新！
import { storeToRefs } from 'pinia'

export default {
  name: 'Review',
  setup() {
    const dataStore = useDataStore()
    // 使用 storeToRefs 确保响应式追踪
    const { showJapanese, currentLanguageName } = storeToRefs(dataStore)
    
    // 监听 showJapanese 的变化
    watch(showJapanese, (newVal, oldVal) => {
      console.log('[显示语言切换] showJapanese 变化:', {
        old: oldVal,
        new: newVal,
        reviewMode: reviewMode.value,
        currentIndex: currentIndex.value,
        currentItem: reviewItems.value[currentIndex.value],
        reviewItemsLength: reviewItems.value.length
      })
      // 强制触发响应式更新（通过重新赋值数组）
      if (reviewMode.value && reviewItems.value.length > 0) {
        // 创建一个新数组引用，触发 Vue 的响应式更新
        reviewItems.value = [...reviewItems.value]
        console.log('[显示语言切换] 已强制触发响应式更新')
      }
    })
    
    const reviewMode = ref(false)
    const reviewType = ref('')
    const reviewItems = ref([])
    const currentIndex = ref(0)
    const showAnswer = ref(false)
    const correctCount = ref(0)
    const reviewCompleted = ref(false)
    // 句子复习的步骤状态（1: 中文+提示, 2: 场景+提示, 3: 日语答案）
    const sentenceStep = ref(1)
    // 记忆模式：'dictionary'（词典记忆）或 'scenario'（情景记忆）
    const memoryMode = ref('dictionary')
    
    // 判断是否是集中复习模式（用于标题显示等）
    const isIncorrectReview = computed(() => {
      if (reviewItems.value.length === 0) return false
      const firstItem = reviewItems.value[0]
      return firstItem?._type !== undefined && !firstItem?._mastered
    })

    // 判断是否是熟记复习模式（用于标题显示等）
    const isMasteredReview = computed(() => {
      if (reviewItems.value.length === 0) return false
      const firstItem = reviewItems.value[0]
      return firstItem?._type !== undefined && firstItem?._mastered === true
    })

    const totalToReview = computed(() => {
      return dataStore.wordsToReview.length + 
             dataStore.sentencesToReview.length + 
             dataStore.qaToReview.length
    })

    const completedCount = computed(() => {
      return reviewItems.value.length - (reviewItems.value.length - currentIndex.value)
    })

    const startReview = (type) => {
      reviewType.value = type
      reviewItems.value = [...dataStore[`${type}ToReview`]]
      
      if (reviewItems.value.length === 0) {
        alert('没有需要复习的内容！')
        return
      }

      // 打乱顺序
      reviewItems.value.sort(() => Math.random() - 0.5)
      
      reviewMode.value = true
      currentIndex.value = 0
      showAnswer.value = false
      correctCount.value = 0
      reviewCompleted.value = false
      // 根据复习类型设置默认模式
      if (type === 'words') {
        memoryMode.value = 'dictionary' // 单词默认词典记忆
      } else if (type === 'sentences') {
        memoryMode.value = 'scenario' // 句子默认情景记忆
      } else if (type === 'qa') {
        memoryMode.value = 'dictionary' // 问答强制使用词典记忆
      }
      // 情景记忆模式重置到第一步
      sentenceStep.value = 1
    }

    // 开始集中复习（所有"没记住"的项目）
    const startIncorrectReview = () => {
      // 合并所有"没记住"的项目，确保没有 _mastered 标记
      const allIncorrect = [
        ...dataStore.incorrectWords.map(w => ({ ...w, _type: 'word', _mastered: false })),
        ...dataStore.incorrectSentences.map(s => ({ ...s, _type: 'sentence', _mastered: false })),
        ...dataStore.incorrectQA.map(q => ({ ...q, _type: 'qa', _mastered: false }))
      ]
      console.log('[开始集中复习]', {
        incorrectWords: dataStore.incorrectWords.length,
        incorrectSentences: dataStore.incorrectSentences.length,
        incorrectQA: dataStore.incorrectQA.length,
        allIncorrect: allIncorrect.length,
        firstItem: allIncorrect[0]
      })
      
      if (allIncorrect.length === 0) {
        alert('没有需要集中复习的内容！')
        return
      }

      // 打乱顺序
      allIncorrect.sort(() => Math.random() - 0.5)
      
      reviewItems.value = allIncorrect
      reviewMode.value = true
      currentIndex.value = 0
      showAnswer.value = false
      correctCount.value = 0
      reviewCompleted.value = false
      // 集中复习默认使用词典记忆模式
      memoryMode.value = 'dictionary'
      sentenceStep.value = 1
    }

    // 清除所有"没记住"的标记
    const clearIncorrectItems = async () => {
      if (confirm('确定要清除所有"没记住"的标记吗？')) {
        await dataStore.clearIncorrectItems()
        alert('已清除所有标记')
      }
    }

    const getCurrentItem = () => {
      return reviewItems.value[currentIndex.value] || {}
    }

    const getReviewTitle = () => {
      // 如果是集中复习模式
      if (reviewItems.value.length > 0 && reviewItems.value[0]._type) {
        return '集中复习 - 没记住的项目'
      }
      const titles = {
        words: '单词复习',
        sentences: '句子复习',
        qa: '问答复习'
      }
      return titles[reviewType.value] || '复习'
    }

    // 获取当前项目的类型（用于集中复习）
    const getCurrentItemType = () => {
      const item = getCurrentItem()
      if (item._type) {
        return item._type + 's' // 'word' -> 'words', 'sentence' -> 'sentences'
      }
      return reviewType.value
    }

    const markCorrect = async () => {
      correctCount.value++
      const item = getCurrentItem()
      // 判断是集中复习还是普通复习
      if (item._type) {
        // 集中复习模式：点击"记住了"才从集中复习区移除
        const itemType = item._type // 'word', 'sentence', 'qa'
        await dataStore.markAsReviewed(itemType, item.id, true) // true 表示从集中复习区移除
        
        // 从当前复习列表中移除该项目（因为已经从集中复习区移除了）
        reviewItems.value = reviewItems.value.filter(i => i.id !== item.id)
        
        // 如果列表为空，结束复习
        if (reviewItems.value.length === 0) {
          reviewCompleted.value = true
          reviewMode.value = false
          return
        }
        
        // 如果当前索引超出范围，调整索引（不移除项目后，索引可能不变，但列表变短了）
        if (currentIndex.value >= reviewItems.value.length) {
          currentIndex.value = reviewItems.value.length - 1
        }
        
        // 重置显示状态，显示下一个项目
        showAnswer.value = false
        if (memoryMode.value === 'scenario') {
          sentenceStep.value = 1
        }
        // 不需要调用 nextItem()，因为索引已经正确了
      } else {
        // 普通复习模式：标记为已复习，但不从集中复习区移除
        // 因为集中复习区的项目不会出现在普通复习区，所以这里不需要处理集中复习区
        await dataStore.markAsReviewed(reviewType.value.slice(0, -1), item.id, false) // false 表示不从集中复习区移除
        nextItem()
      }
    }

    const markIncorrect = async () => {
      const item = getCurrentItem()
      // 判断是集中复习还是普通复习
      if (item._type) {
        // 集中复习模式：保持标记为"没记住"，继续留在集中复习区
        // 不需要再次标记，因为已经在列表中
      } else {
        // 普通复习模式：将当前项目标记为"没记住"，添加到集中复习区
        const itemType = reviewType.value.slice(0, -1) // 'words' -> 'word', 'sentences' -> 'sentence'
        await dataStore.markAsIncorrect(itemType, item.id)
      }
      nextItem()
    }

    // 标记为"已熟记"（移动到熟记区）
    const markAsMastered = async () => {
      const item = getCurrentItem()
      // 判断是集中复习还是普通复习
      if (item._type) {
        // 集中复习模式：移动到熟记区，同时从集中复习区移除
        const itemType = item._type // 'word', 'sentence', 'qa'
        await dataStore.markAsMastered(itemType, item.id)
        
        // 从当前复习列表中移除该项目
        reviewItems.value = reviewItems.value.filter(i => i.id !== item.id)
        
        // 如果列表为空，结束复习
        if (reviewItems.value.length === 0) {
          reviewCompleted.value = true
          reviewMode.value = false
          return
        }
        
        // 如果当前索引超出范围，调整索引
        if (currentIndex.value >= reviewItems.value.length) {
          currentIndex.value = reviewItems.value.length - 1
        }
        
        // 重置显示状态
        showAnswer.value = false
        if (memoryMode.value === 'scenario') {
          sentenceStep.value = 1
        }
      } else {
        // 普通复习模式：移动到熟记区
        const itemType = reviewType.value.slice(0, -1) // 'words' -> 'word', 'sentences' -> 'sentence'
        await dataStore.markAsMastered(itemType, item.id)
        nextItem()
      }
    }

    // 开始熟记复习（所有"已熟记"的项目）
    const startMasteredReview = () => {
      // 合并所有"已熟记"的项目，添加 _mastered 标记
      const allMastered = [
        ...dataStore.masteredWords.map(w => ({ ...w, _type: 'word', _mastered: true })),
        ...dataStore.masteredSentences.map(s => ({ ...s, _type: 'sentence', _mastered: true })),
        ...dataStore.masteredQA.map(q => ({ ...q, _type: 'qa', _mastered: true }))
      ]
      
      if (allMastered.length === 0) {
        alert('没有需要熟记复习的内容！')
        return
      }

      // 打乱顺序
      allMastered.sort(() => Math.random() - 0.5)
      
      reviewItems.value = allMastered
      reviewMode.value = true
      currentIndex.value = 0
      showAnswer.value = false
      correctCount.value = 0
      reviewCompleted.value = false
      // 熟记复习默认使用词典记忆模式
      memoryMode.value = 'dictionary'
      sentenceStep.value = 1
    }

    // 清除所有"已熟记"的标记
    const clearMasteredItems = async () => {
      if (confirm('确定要清除所有"已熟记"的标记吗？')) {
        await dataStore.clearMasteredItems()
        alert('已清除所有标记')
      }
    }

    const nextItem = () => {
      if (currentIndex.value < reviewItems.value.length - 1) {
        currentIndex.value++
        showAnswer.value = false
        // 情景记忆模式重置到第一步
        if (memoryMode.value === 'scenario') {
          sentenceStep.value = 1
        }
      } else {
        reviewCompleted.value = true
        reviewMode.value = false
      }
    }

    const exitReview = () => {
      if (confirm('确定要退出复习吗？进度将不会保存。')) {
        reviewMode.value = false
        reviewCompleted.value = false
      }
    }

    const resetReview = () => {
      reviewCompleted.value = false
      reviewMode.value = false
      currentIndex.value = 0
      showAnswer.value = false
      correctCount.value = 0
    }

    return {
      dataStore,
      showJapanese, // 添加响应式的 showJapanese
      currentLanguageName, // 添加响应式的 currentLanguageName
      reviewMode,
      reviewType,
      reviewItems,
      currentIndex,
      showAnswer,
      correctCount,
      reviewCompleted,
      totalToReview,
      markAsMastered,
      startMasteredReview,
      clearMasteredItems,
      isIncorrectReview,
      isMasteredReview,
      completedCount,
      sentenceStep,
      memoryMode,
      startReview,
      startIncorrectReview,
      clearIncorrectItems,
      getCurrentItem,
      getReviewTitle,
      getCurrentItemType,
      markCorrect,
      markIncorrect,
      exitReview,
      resetReview
    }
  }
}
</script>

<style scoped>
.review {
  max-width: 600px;
  margin: 0 auto;
}

.header {
  text-align: center;
  margin-bottom: 1.5rem;
}

.header h2 {
  color: #333;
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}

.progress-info {
  color: #666;
  font-size: 0.9rem;
}

.review-stats {
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
}

.stat-number {
  font-size: 1.8rem;
  font-weight: bold;
  color: #667eea;
  margin-bottom: 0.5rem;
}

.stat-label {
  color: #666;
  font-size: 0.9rem;
}

.review-options {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.review-options h3 {
  margin-bottom: 1rem;
  color: #333;
}

.option-buttons {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.option-btn {
  display: flex;
  align-items: center;
  padding: 1.5rem;
  background: #f8f9fa;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
  text-align: left;
}

.option-btn:hover:not(:disabled) {
  background: #667eea;
  color: white;
  border-color: #667eea;
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.option-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 集中复习区域样式 */
.incorrect-review-section {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
  padding: 1.5rem;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);
}

.incorrect-review-section h3 {
  color: white;
  margin-bottom: 1rem;
  font-size: 1.3rem;
}

.incorrect-stats {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  justify-content: space-around;
}

.incorrect-stat-item {
  text-align: center;
  color: white;
}

.incorrect-stat-item .stat-number {
  display: block;
  font-size: 1.8rem;
  font-weight: bold;
  margin-bottom: 0.3rem;
}

.incorrect-stat-item .stat-label {
  font-size: 0.9rem;
  opacity: 0.9;
}

.incorrect-review-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1.2rem;
  background: white;
  color: #ff6b6b;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.3s;
  margin-bottom: 0.8rem;
}

.incorrect-review-btn:hover {
  background: #fff5f5;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 255, 255, 0.3);
}

.clear-incorrect-btn {
  width: 100%;
  padding: 0.8rem;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 2px solid white;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.clear-incorrect-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* 熟记区样式 */
.mastered-review-section {
  background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
  padding: 1.5rem;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  box-shadow: 0 4px 15px rgba(255, 215, 0, 0.3);
}

.mastered-review-section h3 {
  color: #333;
  margin-bottom: 1rem;
  font-size: 1.3rem;
  font-weight: 600;
}

.mastered-stats {
  display: flex;
  justify-content: space-around;
  margin-bottom: 1rem;
}

.mastered-stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
}

.mastered-stat-item .stat-number {
  font-size: 1.5rem;
  font-weight: bold;
  color: #333;
}

.mastered-stat-item .stat-label {
  font-size: 0.9rem;
  color: #666;
}

.mastered-review-btn {
  width: 100%;
  background: #333;
  color: white;
  border: none;
  padding: 1rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.mastered-review-btn:hover {
  background: #555;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.clear-mastered-btn {
  width: 100%;
  background: rgba(255, 255, 255, 0.3);
  color: #333;
  border: 2px solid rgba(255, 255, 255, 0.5);
  padding: 0.6rem;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.clear-mastered-btn:hover {
  background: rgba(255, 255, 255, 0.5);
  transform: translateY(-2px);
}

/* 移动到熟记区按钮样式 */
.mastered-btn {
  background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
  color: #333;
  border: none;
  padding: 0.8rem 1.2rem;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  flex: 1;
}

.mastered-btn:hover {
  background: linear-gradient(135deg, #ffed4e 0%, #ffd700 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 215, 0, 0.4);
}

.btn-icon {
  font-size: 1.5rem;
  margin-right: 1rem;
}

.btn-text {
  flex: 1;
  font-weight: 600;
}

.btn-count {
  color: #666;
  font-size: 0.9rem;
}

.review-mode {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e0e0e0;
}

.memory-mode-switch {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding: 0.5rem;
  background: #f8f9fa;
  border-radius: 12px;
}

.mode-btn {
  flex: 1;
  padding: 0.8rem 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  background: white;
  color: #666;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.mode-btn:hover {
  border-color: #667eea;
  color: #667eea;
  transform: translateY(-2px);
}

.mode-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-color: #667eea;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.review-header h3 {
  color: #333;
}

.review-progress {
  color: #666;
  font-weight: 600;
}

.review-content {
  margin-bottom: 1.5rem;
}

.review-item {
  background: #f8f9fa;
  padding: 2rem;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  text-align: center;
}

.review-item .item-answer {
  text-align: left;
}

.item-question {
  font-size: 1.5rem;
  font-weight: bold;
  color: #333;
  margin-bottom: 1rem;
  line-height: 1.4;
}

.item-answer {
  font-size: 1.2rem;
  color: #666;
  line-height: 1.6;              /* 增加行高，提高可读性 */
  word-wrap: break-word;          /* 允许长单词换行 */
  word-break: break-word;         /* 允许在单词内断行（防止溢出） */
  white-space: pre-wrap;          /* 🔑 关键：保留换行符并允许文本换行 */
  text-align: left;                /* 左对齐，更适合长文本阅读 */
  padding: 1rem;                   /* 增加内边距，提升视觉效果 */
  background: rgba(255, 255, 255, 0.5);  /* 添加背景色，区分答案区域 */
  border-radius: 8px;              /* 圆角美化 */
  border-left: 3px solid #667eea;  /* 左侧边框，视觉引导 */
}

/* 句子复习三步显示样式 */
.sentence-step {
  text-align: left;
}

.step-label {
  display: inline-block;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 0.4rem 1rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
}

.item-chinese {
  font-size: 1.5rem;
  font-weight: bold;
  color: #333;
  margin-bottom: 1.5rem;
  line-height: 1.6;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 8px;
  border-left: 4px solid #28a745;
}

.step-hint {
  margin-top: 1rem;
  padding: 1rem;
  border-radius: 8px;
  font-size: 0.95rem;
  line-height: 1.6;
}

.highlight-hint {
  background: linear-gradient(135deg, rgba(255, 193, 7, 0.15) 0%, rgba(255, 152, 0, 0.15) 100%);
  border-left: 4px solid #ffc107;
  color: #856404;
  font-weight: 500;
}

.item-context {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: rgba(102, 126, 234, 0.1);
  border-radius: 8px;
  border-left: 4px solid #667eea;
}

.context-label {
  font-weight: 600;
  color: #667eea;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.context-content {
  color: #333;
  line-height: 1.6;
  word-wrap: break-word;
  white-space: pre-wrap;
  font-size: 1rem;
}

.item-answer .answer-label {
  font-weight: 600;
  color: #667eea;
  margin-bottom: 0.5rem;
  font-size: 1rem;
}

.item-answer .answer-content {
  font-size: 1.3rem;
  font-weight: 600;
  color: #333;
  line-height: 1.6;
  word-wrap: break-word;
  white-space: pre-wrap;
}

.review-actions {
  text-align: center;
}

.show-answer-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s;
}

.show-answer-btn:hover {
  transform: translateY(-2px);
}

.answer-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  flex-wrap: wrap;
}

.correct-btn, .incorrect-btn, .mastered-btn {
  flex: 1;
  min-width: 0;
  padding: 1rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s;
}

.correct-btn {
  background: #28a745;
  color: white;
}

.incorrect-btn {
  background: #dc3545;
  color: white;
}

.correct-btn:hover, .incorrect-btn:hover, .mastered-btn:hover {
  transform: translateY(-2px);
}

.review-controls {
  text-align: center;
}

.exit-btn {
  background: #6c757d;
  color: white;
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s;
}

.exit-btn:hover {
  background: #5a6268;
}

.review-completed {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.completed-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.review-completed h3 {
  color: #333;
  margin-bottom: 0.5rem;
}

.review-completed p {
  color: #666;
  margin-bottom: 1.5rem;
}

.completed-stats {
  display: flex;
  justify-content: space-around;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.completed-stat {
  text-align: center;
}

.completed-stat .stat-label {
  display: block;
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 0.3rem;
}

.completed-stat .stat-value {
  color: #667eea;
  font-weight: bold;
  font-size: 1.2rem;
}

.restart-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s;
}

.restart-btn:hover {
  transform: translateY(-2px);
}

/* 移动端优化 */
@media (max-width: 480px) {
  .review-stats {
    grid-template-columns: 1fr;
  }
  
  .answer-actions {
    flex-direction: column;
  }
  
  .completed-stats {
    flex-direction: column;
    gap: 1rem;
  }
  
  .item-question {
    font-size: 1.3rem;
  }
  
  .item-answer {
    font-size: 1.1rem;
  }
}
</style>
