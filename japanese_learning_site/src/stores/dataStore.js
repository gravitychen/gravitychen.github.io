import { defineStore } from 'pinia'

export const useDataStore = defineStore('data', {
  state: () => ({
    words: JSON.parse(localStorage.getItem('japanese_words') || '[]'),
    sentences: JSON.parse(localStorage.getItem('japanese_sentences') || '[]'),
    qa: JSON.parse(localStorage.getItem('japanese_qa') || '[]'),
    reviewProgress: JSON.parse(localStorage.getItem('review_progress') || '{}'),
    quizHistory: JSON.parse(localStorage.getItem('quiz_history') || '[]'),
    showJapanese: JSON.parse(localStorage.getItem('show_japanese') || 'true') // 默认显示日文
  }),

  getters: {
    // 检查是否已初始化示例数据
    hasInitialData: (state) => {
      return state.words.length > 0 || state.sentences.length > 0 || state.qa.length > 0
    },
    
    totalWords: (state) => state.words.length,
    totalSentences: (state) => state.sentences.length,
    totalQA: (state) => state.qa.length,
    
    // 获取需要复习的内容
    wordsToReview: (state) => {
      return state.words.filter(word => {
        const lastReview = state.reviewProgress[`word_${word.id}`]
        if (!lastReview) return true
        const daysSinceReview = (Date.now() - lastReview) / (1000 * 60 * 60 * 24)
        return daysSinceReview >= 1 // 1天后需要复习
      })
    },
    
    sentencesToReview: (state) => {
      return state.sentences.filter(sentence => {
        const lastReview = state.reviewProgress[`sentence_${sentence.id}`]
        if (!lastReview) return true
        const daysSinceReview = (Date.now() - lastReview) / (1000 * 60 * 60 * 24)
        return daysSinceReview >= 1
      })
    },
    
    qaToReview: (state) => {
      return state.qa.filter(qa => {
        const lastReview = state.reviewProgress[`qa_${qa.id}`]
        if (!lastReview) return true
        const daysSinceReview = (Date.now() - lastReview) / (1000 * 60 * 60 * 24)
        return daysSinceReview >= 1
      })
    }
  },

  actions: {
    // 单词管理
    addWord(word) {
      const newWord = {
        id: Date.now(),
        japanese: word.japanese,
        chinese: word.chinese,
        createdAt: new Date().toISOString()
      }
      this.words.push(newWord)
      this.saveWords()
    },

    deleteWord(id) {
      this.words = this.words.filter(word => word.id !== id)
      this.saveWords()
    },

    saveWords() {
      localStorage.setItem('japanese_words', JSON.stringify(this.words))
    },

    // 句子管理
    addSentence(sentence) {
      const newSentence = {
        id: Date.now(),
        japanese: sentence.japanese,
        chinese: sentence.chinese,
        context: sentence.context || '', // 添加使用情境字段
        createdAt: new Date().toISOString()
      }
      this.sentences.push(newSentence)
      this.saveSentences()
    },

    deleteSentence(id) {
      this.sentences = this.sentences.filter(sentence => sentence.id !== id)
      this.saveSentences()
    },

    saveSentences() {
      localStorage.setItem('japanese_sentences', JSON.stringify(this.sentences))
    },

    // 问答管理
    addQA(qa) {
      const newQA = {
        id: Date.now(),
        question: qa.question,
        answer: qa.answer,
        createdAt: new Date().toISOString()
      }
      this.qa.push(newQA)
      this.saveQA()
    },

    deleteQA(id) {
      this.qa = this.qa.filter(qa => qa.id !== id)
      this.saveQA()
    },

    saveQA() {
      localStorage.setItem('japanese_qa', JSON.stringify(this.qa))
    },

    // 复习进度管理
    markAsReviewed(type, id) {
      const key = `${type}_${id}`
      this.reviewProgress[key] = Date.now()
      localStorage.setItem('review_progress', JSON.stringify(this.reviewProgress))
    },

    // 测验历史
    addQuizResult(result) {
      this.quizHistory.push({
        id: Date.now(),
        ...result,
        completedAt: new Date().toISOString()
      })
      localStorage.setItem('quiz_history', JSON.stringify(this.quizHistory))
    },

    // 初始化示例数据
    initializeSampleData() {
      if (this.hasInitialData) return // 如果已有数据，不重复初始化

      // 添加示例单词
      const sampleWords = [
        { japanese: 'こんにちは', chinese: '你好' },
        { japanese: 'ありがとう', chinese: '谢谢' },
        { japanese: 'すみません', chinese: '对不起' },
        { japanese: 'はい', chinese: '是' },
        { japanese: 'いいえ', chinese: '不是' },
        { japanese: 'おはよう', chinese: '早上好' },
        { japanese: 'こんばんは', chinese: '晚上好' },
        { japanese: 'さようなら', chinese: '再见' }
      ]

      sampleWords.forEach(word => {
        this.addWord(word)
      })

      // 添加示例句子
      const sampleSentences = [
        { 
          japanese: 'それほどでもないけどね', 
          chinese: '也没有到那种程度啦～',
          context: '佐藤跟我对话时，我夸了她她回应我'
        }
      ]

      sampleSentences.forEach(sentence => {
        this.addSentence(sentence)
      })

      // 添加示例问答
      const sampleQA = [
        { question: '「こんにちは」是什么意思？', answer: '「こんにちは」是日语中"你好"的意思，用于白天问候。' },
        { question: '日语中"谢谢"怎么说？', answer: '日语中"谢谢"是「ありがとう」或「ありがとうございます」。' },
        { question: '「すみません」在什么情况下使用？', answer: '「すみません」用于道歉、引起注意或表示感谢，相当于"对不起"或"不好意思"。' },
        { question: '如何用日语自我介绍？', answer: '可以说「私は○○です」（我是○○），例如「私は学生です」（我是学生）。' },
        { question: '日语中如何询问时间？', answer: '可以说「今何時ですか？」（现在几点了？）或「時間は何時ですか？」（时间是几点？）。' }
      ]

      sampleQA.forEach(qa => {
        this.addQA(qa)
      })
    },

    // 切换显示语言
    toggleLanguage() {
      this.showJapanese = !this.showJapanese
      localStorage.setItem('show_japanese', JSON.stringify(this.showJapanese))
    },

    // 导出所有数据
    exportData() {
      const allData = {
        words: this.words,
        sentences: this.sentences,
        qa: this.qa,
        reviewProgress: this.reviewProgress,
        quizHistory: this.quizHistory,
        exportDate: new Date().toISOString()
      }
      return JSON.stringify(allData, null, 2)
    },

    // 导入数据
    importData(jsonData) {
      try {
        const data = JSON.parse(jsonData)
        if (data.words) this.words = data.words
        if (data.sentences) this.sentences = data.sentences
        if (data.qa) this.qa = data.qa
        if (data.reviewProgress) this.reviewProgress = data.reviewProgress
        if (data.quizHistory) this.quizHistory = data.quizHistory
        
        // 保存到本地存储
        this.saveWords()
        this.saveSentences()
        this.saveQA()
        localStorage.setItem('review_progress', JSON.stringify(this.reviewProgress))
        localStorage.setItem('quiz_history', JSON.stringify(this.quizHistory))
        
        return true
      } catch (error) {
        console.error('导入数据失败:', error)
        return false
      }
    }
  }
})
