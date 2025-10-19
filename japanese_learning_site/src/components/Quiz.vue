<template>
  <div class="quiz">
    <div class="header">
      <h2>🎯 {{ dataStore.currentLanguageName }}考试</h2>
      <p>测试你的{{ dataStore.currentLanguageName }}学习成果</p>
    </div>

    <!-- 考试设置 -->
    <div v-if="!quizStarted && !quizCompleted" class="quiz-setup">
      <div class="setup-card">
        <h3>考试设置</h3>
        
        <div class="setup-options">
          <div class="option-group">
            <label>考试类型：</label>
            <div class="radio-group">
              <label class="radio-item">
                <input 
                  type="radio" 
                  v-model="quizSettings.type" 
                  value="mixed"
                />
                混合考试（单词+句子+问答）
              </label>
              <label class="radio-item">
                <input 
                  type="radio" 
                  v-model="quizSettings.type" 
                  value="words"
                />
                单词考试
              </label>
              <label class="radio-item">
                <input 
                  type="radio" 
                  v-model="quizSettings.type" 
                  value="sentences"
                />
                句子考试
              </label>
              <label class="radio-item">
                <input 
                  type="radio" 
                  v-model="quizSettings.type" 
                  value="qa"
                />
                问答考试
              </label>
            </div>
          </div>

          <div class="option-group">
            <label>题目数量：</label>
            <select v-model="quizSettings.count" class="count-select">
              <option value="5">5题</option>
              <option value="10">10题</option>
              <option value="15">15题</option>
              <option value="20">20题</option>
            </select>
          </div>

          <div class="option-group">
            <label>答题模式：</label>
            <div class="radio-group">
              <label class="radio-item">
                <input 
                  type="radio" 
                  v-model="quizSettings.mode" 
                  value="choice"
                />
                选择题
              </label>
              <label class="radio-item">
                <input 
                  type="radio" 
                  v-model="quizSettings.mode" 
                  value="input"
                />
                填空题
              </label>
            </div>
          </div>
        </div>

        <button @click="startQuiz" class="start-quiz-btn" :disabled="!canStartQuiz">
          开始考试
        </button>
      </div>
    </div>

    <!-- 考试进行中 -->
    <div v-if="quizStarted && !quizCompleted" class="quiz-active">
      <div class="quiz-header">
        <div class="quiz-progress">
          <div class="progress-bar">
            <div 
              class="progress-fill" 
              :style="{ width: (currentQuestionIndex / quizQuestions.length) * 100 + '%' }"
            ></div>
          </div>
          <div class="progress-text">
            {{ currentQuestionIndex + 1 }}/{{ quizQuestions.length }}
          </div>
        </div>
      </div>

      <div class="question-card">
        <div class="question-content">
          <div class="question-text">
            {{ currentQuestion.question }}
          </div>
          
          <!-- 选择题模式 -->
          <div v-if="quizSettings.mode === 'choice'" class="choices">
            <button 
              v-for="(choice, index) in currentQuestion.choices" 
              :key="index"
              @click="selectAnswer(choice)"
              class="choice-btn"
              :class="{ 'selected': selectedAnswer === choice }"
            >
              {{ String.fromCharCode(65 + index) }}. {{ choice }}
            </button>
          </div>

          <!-- 填空题模式 -->
          <div v-if="quizSettings.mode === 'input'" class="input-answer">
            <input 
              v-model="inputAnswer"
              type="text"
              placeholder="请输入你的答案"
              class="answer-input"
              @keyup.enter="submitAnswer"
            />
          </div>
        </div>

        <div class="question-actions">
          <button 
            @click="submitAnswer" 
            class="submit-btn"
            :disabled="!hasAnswer"
          >
            提交答案
          </button>
        </div>
      </div>
    </div>

    <!-- 考试结果 -->
    <div v-if="quizCompleted" class="quiz-results">
      <div class="results-header">
        <div class="results-icon">🎉</div>
        <h3>考试完成！</h3>
      </div>

      <div class="results-stats">
        <div class="stat-item">
          <div class="stat-label">总题数</div>
          <div class="stat-value">{{ quizQuestions.length }}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">正确数</div>
          <div class="stat-value correct">{{ correctAnswers }}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">错误数</div>
          <div class="stat-value incorrect">{{ wrongAnswers }}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">正确率</div>
          <div class="stat-value" :class="getScoreClass()">
            {{ Math.round((correctAnswers / quizQuestions.length) * 100) }}%
          </div>
        </div>
      </div>

      <div class="results-actions">
        <button @click="restartQuiz" class="restart-btn">
          重新考试
        </button>
        <button @click="viewDetails" class="details-btn">
          查看详情
        </button>
      </div>

      <!-- 详细结果 -->
      <div v-if="showDetails" class="quiz-details">
        <h4>答题详情</h4>
        <div class="details-list">
          <div 
            v-for="(result, index) in quizResults" 
            :key="index"
            class="detail-item"
            :class="{ 'correct': result.isCorrect, 'incorrect': !result.isCorrect }"
          >
            <div class="detail-question">
              <strong>第{{ index + 1 }}题：</strong>{{ result.question }}
            </div>
            <div class="detail-answer">
              <span class="label">你的答案：</span>{{ result.userAnswer }}
            </div>
            <div class="detail-correct">
              <span class="label">正确答案：</span>{{ result.correctAnswer }}
            </div>
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
  name: 'Quiz',
  setup() {
    const dataStore = useDataStore()
    const quizStarted = ref(false)
    const quizCompleted = ref(false)
    const showDetails = ref(false)
    
    const quizSettings = ref({
      type: 'mixed',
      count: 10,
      mode: 'choice'
    })

    const quizQuestions = ref([])
    const currentQuestionIndex = ref(0)
    const selectedAnswer = ref('')
    const inputAnswer = ref('')
    const quizResults = ref([])
    const correctAnswers = ref(0)
    const wrongAnswers = ref(0)

    const canStartQuiz = computed(() => {
      const hasWords = dataStore.words.length > 0
      const hasSentences = dataStore.sentences.length > 0
      const hasQA = dataStore.qa.length > 0
      
      if (quizSettings.value.type === 'mixed') {
        return hasWords || hasSentences || hasQA
      } else if (quizSettings.value.type === 'words') {
        return hasWords
      } else if (quizSettings.value.type === 'sentences') {
        return hasSentences
      } else if (quizSettings.value.type === 'qa') {
        return hasQA
      }
      return false
    })

    const currentQuestion = computed(() => {
      return quizQuestions.value[currentQuestionIndex.value] || {}
    })

    const hasAnswer = computed(() => {
      if (quizSettings.value.mode === 'choice') {
        return selectedAnswer.value !== ''
      } else {
        return inputAnswer.value.trim() !== ''
      }
    })

    const startQuiz = () => {
      // 生成题目
      generateQuestions()
      
      if (quizQuestions.value.length === 0) {
        alert('没有足够的内容进行考试！')
        return
      }

      quizStarted.value = true
      quizCompleted.value = false
      currentQuestionIndex.value = 0
      selectedAnswer.value = ''
      inputAnswer.value = ''
      quizResults.value = []
      correctAnswers.value = 0
      wrongAnswers.value = 0
      showDetails.value = false
    }

    const generateQuestions = () => {
      const questions = []
      const count = parseInt(quizSettings.value.count)
      
      if (quizSettings.value.type === 'mixed') {
        const allItems = [
          ...dataStore.words.map(item => ({ ...item, type: 'word' })),
          ...dataStore.sentences.map(item => ({ ...item, type: 'sentence' })),
          ...dataStore.qa.map(item => ({ ...item, type: 'qa' }))
        ]
        
        // 随机选择题目
        const shuffled = allItems.sort(() => Math.random() - 0.5)
        const selected = shuffled.slice(0, Math.min(count, allItems.length))
        
        selected.forEach(item => {
          if (quizSettings.value.mode === 'choice') {
            questions.push(generateChoiceQuestion(item))
          } else {
            questions.push(generateInputQuestion(item))
          }
        })
      } else {
        const items = dataStore[quizSettings.value.type]
        const shuffled = items.sort(() => Math.random() - 0.5)
        const selected = shuffled.slice(0, Math.min(count, items.length))
        
        selected.forEach(item => {
          if (quizSettings.value.mode === 'choice') {
            questions.push(generateChoiceQuestion(item))
          } else {
            questions.push(generateInputQuestion(item))
          }
        })
      }
      
      quizQuestions.value = questions
    }

    const generateChoiceQuestion = (item) => {
      const question = {
        id: item.id,
        type: item.type,
        question: item.japanese || item.question,
        correctAnswer: item.chinese || item.answer,
        choices: []
      }

      // 生成错误选项
      const wrongChoices = []
      if (item.type === 'word') {
        const otherWords = dataStore.words.filter(w => w.id !== item.id)
        const shuffled = otherWords.sort(() => Math.random() - 0.5)
        wrongChoices.push(...shuffled.slice(0, 3).map(w => w.chinese))
      } else if (item.type === 'sentence') {
        const otherSentences = dataStore.sentences.filter(s => s.id !== item.id)
        const shuffled = otherSentences.sort(() => Math.random() - 0.5)
        wrongChoices.push(...shuffled.slice(0, 3).map(s => s.chinese))
      } else if (item.type === 'qa') {
        const otherQA = dataStore.qa.filter(q => q.id !== item.id)
        const shuffled = otherQA.sort(() => Math.random() - 0.5)
        wrongChoices.push(...shuffled.slice(0, 3).map(q => q.answer))
      }

      // 组合所有选项并打乱
      question.choices = [question.correctAnswer, ...wrongChoices.slice(0, 3)]
      question.choices.sort(() => Math.random() - 0.5)

      return question
    }

    const generateInputQuestion = (item) => {
      return {
        id: item.id,
        type: item.type,
        question: item.japanese || item.question,
        correctAnswer: item.chinese || item.answer
      }
    }

    const selectAnswer = (answer) => {
      selectedAnswer.value = answer
    }

    const submitAnswer = () => {
      if (!hasAnswer.value) return

      const userAnswer = quizSettings.value.mode === 'choice' ? selectedAnswer.value : inputAnswer.value.trim()
      const isCorrect = userAnswer === currentQuestion.value.correctAnswer

      quizResults.value.push({
        question: currentQuestion.value.question,
        userAnswer: userAnswer,
        correctAnswer: currentQuestion.value.correctAnswer,
        isCorrect: isCorrect
      })

      if (isCorrect) {
        correctAnswers.value++
      } else {
        wrongAnswers.value++
      }

      // 下一题或结束考试
      if (currentQuestionIndex.value < quizQuestions.value.length - 1) {
        currentQuestionIndex.value++
        selectedAnswer.value = ''
        inputAnswer.value = ''
      } else {
        finishQuiz()
      }
    }

    const finishQuiz = () => {
      quizStarted.value = false
      quizCompleted.value = true
      
      // 保存考试结果
      dataStore.addQuizResult({
        type: quizSettings.value.type,
        mode: quizSettings.value.mode,
        totalQuestions: quizQuestions.value.length,
        correctAnswers: correctAnswers.value,
        wrongAnswers: wrongAnswers.value,
        score: Math.round((correctAnswers.value / quizQuestions.value.length) * 100)
      })
    }

    const restartQuiz = () => {
      quizCompleted.value = false
      quizStarted.value = false
      showDetails.value = false
    }

    const viewDetails = () => {
      showDetails.value = !showDetails.value
    }

    const getScoreClass = () => {
      const score = Math.round((correctAnswers.value / quizQuestions.value.length) * 100)
      if (score >= 80) return 'excellent'
      if (score >= 60) return 'good'
      return 'poor'
    }

    return {
      dataStore,
      quizStarted,
      quizCompleted,
      showDetails,
      quizSettings,
      quizQuestions,
      currentQuestionIndex,
      selectedAnswer,
      inputAnswer,
      quizResults,
      correctAnswers,
      wrongAnswers,
      canStartQuiz,
      currentQuestion,
      hasAnswer,
      startQuiz,
      selectAnswer,
      submitAnswer,
      restartQuiz,
      viewDetails,
      getScoreClass
    }
  }
}
</script>

<style scoped>
.quiz {
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

.header p {
  color: #666;
}

.quiz-setup {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.setup-card h3 {
  margin-bottom: 1.5rem;
  color: #333;
}

.setup-options {
  margin-bottom: 1.5rem;
}

.option-group {
  margin-bottom: 1.5rem;
}

.option-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #333;
  font-weight: 600;
}

.radio-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.radio-item {
  display: flex;
  align-items: center;
  padding: 0.5rem;
  background: #f8f9fa;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.radio-item:hover {
  background: #e9ecef;
}

.radio-item input {
  margin-right: 0.5rem;
}

.count-select {
  width: 100%;
  padding: 0.8rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  background: white;
}

.start-quiz-btn {
  width: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s;
}

.start-quiz-btn:hover:not(:disabled) {
  transform: translateY(-2px);
}

.start-quiz-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.quiz-active {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.quiz-header {
  margin-bottom: 1.5rem;
}

.quiz-progress {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  transition: width 0.3s;
}

.progress-text {
  color: #666;
  font-weight: 600;
  white-space: nowrap;
}

.question-card {
  text-align: center;
}

.question-content {
  margin-bottom: 1.5rem;
}

.question-text {
  font-size: 1.3rem;
  font-weight: bold;
  color: #333;
  margin-bottom: 1.5rem;
  line-height: 1.4;
}

.choices {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.choice-btn {
  padding: 1rem;
  background: #f8f9fa;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  text-align: left;
}

.choice-btn:hover {
  background: #e9ecef;
  border-color: #667eea;
}

.choice-btn.selected {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

.input-answer {
  margin-bottom: 1rem;
}

.answer-input {
  width: 100%;
  padding: 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  text-align: center;
}

.answer-input:focus {
  outline: none;
  border-color: #667eea;
}

.question-actions {
  text-align: center;
}

.submit-btn {
  background: #28a745;
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s;
}

.submit-btn:hover:not(:disabled) {
  background: #218838;
}

.submit-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.quiz-results {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.results-header {
  text-align: center;
  margin-bottom: 1.5rem;
}

.results-icon {
  font-size: 3rem;
  margin-bottom: 0.5rem;
}

.results-header h3 {
  color: #333;
}

.results-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-item {
  text-align: center;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.stat-label {
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 0.3rem;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: #333;
}

.stat-value.correct {
  color: #28a745;
}

.stat-value.incorrect {
  color: #dc3545;
}

.stat-value.excellent {
  color: #28a745;
}

.stat-value.good {
  color: #ffc107;
}

.stat-value.poor {
  color: #dc3545;
}

.results-actions {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.restart-btn, .details-btn {
  flex: 1;
  padding: 1rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s;
}

.restart-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.details-btn {
  background: #6c757d;
  color: white;
}

.restart-btn:hover, .details-btn:hover {
  transform: translateY(-2px);
}

.quiz-details {
  border-top: 1px solid #e0e0e0;
  padding-top: 1.5rem;
}

.quiz-details h4 {
  margin-bottom: 1rem;
  color: #333;
}

.details-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.detail-item {
  padding: 1rem;
  border-radius: 8px;
  border-left: 4px solid;
}

.detail-item.correct {
  background: #d4edda;
  border-color: #28a745;
}

.detail-item.incorrect {
  background: #f8d7da;
  border-color: #dc3545;
}

.detail-question {
  font-weight: bold;
  margin-bottom: 0.5rem;
  color: #333;
}

.detail-answer, .detail-correct {
  margin-bottom: 0.3rem;
  color: #666;
}

.detail-answer .label, .detail-correct .label {
  font-weight: 600;
  color: #333;
}

/* 移动端优化 */
@media (max-width: 480px) {
  .results-stats {
    grid-template-columns: 1fr;
  }
  
  .results-actions {
    flex-direction: column;
  }
  
  .radio-group {
    gap: 0.3rem;
  }
  
  .question-text {
    font-size: 1.2rem;
  }
}
</style>
