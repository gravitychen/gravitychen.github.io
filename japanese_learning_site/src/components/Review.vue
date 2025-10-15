<template>
  <div class="review">
    <div class="header">
      <h2>📚 复习中心</h2>
      <div class="progress-info">
        <span>今日复习进度: {{ completedCount }}/{{ totalToReview }}</span>
      </div>
    </div>

    <!-- 复习统计 -->
    <div class="review-stats">
      <div class="stat-card">
        <div class="stat-number">{{ dataStore.wordsToReview.length }}</div>
        <div class="stat-label">单词待复习</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">{{ dataStore.sentencesToReview.length }}</div>
        <div class="stat-label">句子待复习</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">{{ dataStore.qaToReview.length }}</div>
        <div class="stat-label">问答待复习</div>
      </div>
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

    <!-- 复习模式 -->
    <div v-if="reviewMode" class="review-mode">
      <div class="review-header">
        <h3>{{ getReviewTitle() }}</h3>
        <div class="review-progress">
          {{ currentIndex + 1 }}/{{ reviewItems.length }}
        </div>
      </div>

      <div class="review-content">
        <div class="review-item">
          <div class="item-question">
            {{ getCurrentItem().japanese || getCurrentItem().question }}
          </div>
          <div v-if="showAnswer" class="item-answer">
            {{ getCurrentItem().chinese || getCurrentItem().answer }}
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
          </div>
        </div>
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
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useDataStore } from '../stores/dataStore'

export default {
  name: 'Review',
  setup() {
    const dataStore = useDataStore()
    const reviewMode = ref(false)
    const reviewType = ref('')
    const reviewItems = ref([])
    const currentIndex = ref(0)
    const showAnswer = ref(false)
    const correctCount = ref(0)
    const reviewCompleted = ref(false)

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
    }

    const getCurrentItem = () => {
      return reviewItems.value[currentIndex.value] || {}
    }

    const getReviewTitle = () => {
      const titles = {
        words: '单词复习',
        sentences: '句子复习',
        qa: '问答复习'
      }
      return titles[reviewType.value] || '复习'
    }

    const markCorrect = () => {
      correctCount.value++
      dataStore.markAsReviewed(reviewType.value.slice(0, -1), getCurrentItem().id)
      nextItem()
    }

    const markIncorrect = () => {
      nextItem()
    }

    const nextItem = () => {
      if (currentIndex.value < reviewItems.value.length - 1) {
        currentIndex.value++
        showAnswer.value = false
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
      reviewMode,
      reviewType,
      reviewItems,
      currentIndex,
      showAnswer,
      correctCount,
      reviewCompleted,
      totalToReview,
      completedCount,
      startReview,
      getCurrentItem,
      getReviewTitle,
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
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e0e0e0;
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
  line-height: 1.4;
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
  gap: 1rem;
  justify-content: center;
}

.correct-btn, .incorrect-btn {
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

.correct-btn:hover, .incorrect-btn:hover {
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
