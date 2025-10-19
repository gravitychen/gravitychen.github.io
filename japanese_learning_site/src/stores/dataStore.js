import { defineStore } from 'pinia'
import dataService from '../firebase/dataService.js'
import authService from '../firebase/authService.js'
import { defaultData } from '../data/defaultData.js'

// 常量定义
const SYNC_RETRY_DELAY = 1000
const MAX_SYNC_RETRIES = 3

export const useDataStore = defineStore('data', {
  state: () => ({
    words: [],
    sentences: [],
    qa: [],
    reviewProgress: {},
    quizHistory: [],
    showJapanese: true,
    isOnline: false,
    syncInProgress: false,
    lastSyncTime: null,
    syncRetryCount: 0,
    // 新增多语言支持
    currentLanguage: 'ja', // 当前学习语言：ja(日语), en(英语), hi(印地语), ko(韩语)
    supportedLanguages: [
      { code: 'ja', name: '日语', flag: '🇯🇵' },
      { code: 'en', name: '英语', flag: '🇺🇸' },
      { code: 'hi', name: '印地语', flag: '🇮🇳' },
      { code: 'ko', name: '韩语', flag: '🇰🇷' }
    ]
  }),

  getters: {
    // 检查是否已初始化数据
    hasInitialData: (state) => {
      return state.words.length > 0 || state.sentences.length > 0 || state.qa.length > 0
    },
    
    // 统计数据
    totalWords: (state) => state.words.length,
    totalSentences: (state) => state.sentences.length,
    totalQA: (state) => state.qa.length,
    
    // 获取需要复习的内容
    wordsToReview: (state) => {
      const now = Date.now()
      const oneDayMs = 24 * 60 * 60 * 1000
      return state.words.filter(word => {
        const lastReview = state.reviewProgress[`word_${word.id}`]
        return !lastReview || (now - lastReview) >= oneDayMs
      })
    },
    
    sentencesToReview: (state) => {
      const now = Date.now()
      const oneDayMs = 24 * 60 * 60 * 1000
      return state.sentences.filter(sentence => {
        const lastReview = state.reviewProgress[`sentence_${sentence.id}`]
        return !lastReview || (now - lastReview) >= oneDayMs
      })
    },
    
    qaToReview: (state) => {
      const now = Date.now()
      const oneDayMs = 24 * 60 * 60 * 1000
      return state.qa.filter(qa => {
        const lastReview = state.reviewProgress[`qa_${qa.id}`]
        return !lastReview || (now - lastReview) >= oneDayMs
      })
    },
    
    // 获取当前语言信息
    currentLanguageInfo: (state) => {
      return state.supportedLanguages.find(lang => lang.code === state.currentLanguage)
    },
    
    // 获取当前语言的显示名称
    currentLanguageName: (state) => {
      const lang = state.supportedLanguages.find(lang => lang.code === state.currentLanguage)
      return lang ? lang.name : '未知语言'
    },
    
  },

  actions: {
    // 优化的重复检测方法
    isWordDuplicate(newWord) {
      const key = `${newWord.japanese}|${newWord.chinese}`
      return this.words.some(word => 
        `${word.japanese}|${word.chinese}` === key
      )
    },

    isSentenceDuplicate(newSentence) {
      const key = `${newSentence.japanese}|${newSentence.chinese}`
      return this.sentences.some(sentence => 
        `${sentence.japanese}|${sentence.chinese}` === key
      )
    },

    isQADuplicate(newQA) {
      const key = `${newQA.question}|${newQA.answer}`
      return this.qa.some(qa => 
        `${qa.question}|${qa.answer}` === key
      )
    },


    // 初始化云端同步
    async initializeCloudSync() {
      // 设置认证状态监听器
      authService.setupAuthStateListener()
      
      // 监听认证状态变化
      authService.onAuthStateChange(async (user) => {
        console.log('认证状态变化:', user ? '已登录' : '未登录')
        if (user) {
          this.isOnline = true
          console.log('开始云端同步...')
          try {
            await this.syncFromCloud()
            this.setupRealtimeSync()
            console.log('云端同步完成，实时监听已启动')
            
            // 同步完成后，检查是否需要初始化默认数据
            if (!this.hasInitialData) {
              console.log('检测到无数据，开始初始化默认数据...')
              await this.initializeDefaultData()
            }
          } catch (error) {
            console.error('云端同步失败:', error)
            // 即使同步失败，也设置实时监听
            this.setupRealtimeSync()
          }
        } else {
          this.isOnline = false
          console.log('设备未认证，停止云端同步')
        }
      })

      // 等待设备认证初始化完成
      const checkAuthStatus = async () => {
        if (authService.isLoggedIn()) {
          console.log('检测到已认证设备，立即开始同步...')
          this.isOnline = true
          try {
            await this.syncFromCloud()
            this.setupRealtimeSync()
            
            // 同步完成后，检查是否需要初始化默认数据
            if (!this.hasInitialData) {
              console.log('检测到无数据，开始初始化默认数据...')
              await this.initializeDefaultData()
            }
          } catch (error) {
            console.error('初始同步失败:', error)
            // 即使同步失败，也设置实时监听
            this.setupRealtimeSync()
          }
        } else {
          // 如果还未认证，等待一段时间后重试
          setTimeout(checkAuthStatus, 1000)
        }
      }
      
      // 开始检查认证状态
      checkAuthStatus()
    },

    // 设置实时同步
    setupRealtimeSync() {
      if (!this.isOnline) {
        console.log('未连接到云端，跳过实时同步设置')
        return
      }

      console.log('设置实时同步监听...')
      
      // 监听单词变化
      dataService.listenToData('words', (words) => {
        console.log('单词数据更新:', words.length, '个')
        this.words = words || []
      }, this.currentLanguage)

      // 监听句子变化
      dataService.listenToData('sentences', (sentences) => {
        console.log('句子数据更新:', sentences.length, '个')
        this.sentences = sentences || []
      }, this.currentLanguage)

      // 监听问答变化
      dataService.listenToData('qa', (qa) => {
        console.log('问答数据更新:', qa.length, '个')
        this.qa = qa || []
      }, this.currentLanguage)

      console.log('实时同步监听已设置')
    },

    // 优化的云端同步方法
    async syncFromCloud(retryCount = 0) {
      if (!this.isOnline) {
        console.log('未连接到云端，跳过同步')
        return
      }

      try {
        this.syncInProgress = true
        this.syncRetryCount = retryCount
        console.log(`开始从云端获取数据... (尝试 ${retryCount + 1}/${MAX_SYNC_RETRIES})`)
        
        // 使用 Promise.allSettled 确保部分失败不影响其他数据
        const results = await Promise.allSettled([
          dataService.getAllData('words', this.currentLanguage),
          dataService.getAllData('sentences', this.currentLanguage),
          dataService.getAllData('qa', this.currentLanguage)
        ])

        const [wordsResult, sentencesResult, qaResult] = results
        
        // 处理结果
        const words = wordsResult.status === 'fulfilled' ? wordsResult.value : []
        const sentences = sentencesResult.status === 'fulfilled' ? sentencesResult.value : []
        const qa = qaResult.status === 'fulfilled' ? qaResult.value : []

        // 记录失败的同步
        const failures = results.filter(r => r.status === 'rejected')
        if (failures.length > 0) {
          console.warn('部分数据同步失败:', failures.map(f => f.reason))
        }

        console.log('云端数据获取完成:', { 
          words: words.length, 
          sentences: sentences.length, 
          qa: qa.length,
          failures: failures.length
        })

        // 更新本地数据
        this.words = words || []
        this.sentences = sentences || []
        this.qa = qa || []

        this.lastSyncTime = new Date().toISOString()
        this.syncRetryCount = 0
        console.log('云端同步完成')
      } catch (error) {
        console.error('云端同步失败:', error)
        
        // 重试机制
        if (retryCount < MAX_SYNC_RETRIES - 1) {
          console.log(`同步失败，${SYNC_RETRY_DELAY}ms后重试...`)
          setTimeout(() => {
            this.syncFromCloud(retryCount + 1)
          }, SYNC_RETRY_DELAY * (retryCount + 1))
        } else {
          console.error('同步重试次数已达上限')
        }
      } finally {
        this.syncInProgress = false
      }
    },

    // 将本地数据上传到云端
    async syncToCloud() {
      if (!this.isOnline) return

      try {
        this.syncInProgress = true
        
        // 上传所有数据到云端
        await Promise.all([
          dataService.importData('words', this.words, this.currentLanguage),
          dataService.importData('sentences', this.sentences, this.currentLanguage),
          dataService.importData('qa', this.qa, this.currentLanguage)
        ])

        this.lastSyncTime = new Date().toISOString()
      } catch (error) {
        console.error('上传到云端失败:', error)
      } finally {
        this.syncInProgress = false
      }
    },

    // 单词管理
    async addWord(word) {
      if (!this.isOnline) {
        throw new Error('需要网络连接才能添加数据')
      }

      // 检查是否重复
      if (this.isWordDuplicate(word)) {
        throw new Error('该单词已存在，请勿重复添加')
      }

      const newWord = {
        japanese: word.japanese,
        chinese: word.chinese
      }
      
      try {
        console.log('添加单词到云端:', newWord)
        const cloudWord = await dataService.addData('words', newWord, this.currentLanguage)
        console.log('单词添加成功:', cloudWord)
        // 数据会通过实时监听自动更新，不需要手动添加到本地
        return cloudWord
      } catch (error) {
        console.error('同步单词到云端失败:', error)
        throw error
      }
    },

    async deleteWord(id) {
      if (!this.isOnline) {
        throw new Error('需要网络连接才能删除数据')
      }

      try {
        console.log('从云端删除单词:', id)
        await dataService.deleteData('words', id, this.currentLanguage)
        console.log('单词删除成功')
        // 数据会通过实时监听自动更新
      } catch (error) {
        console.error('从云端删除单词失败:', error)
        throw error
      }
    },


    // 句子管理
    async addSentence(sentence) {
      if (!this.isOnline) {
        throw new Error('需要网络连接才能添加数据')
      }

      // 检查是否重复
      if (this.isSentenceDuplicate(sentence)) {
        throw new Error('该句子已存在，请勿重复添加')
      }

      const newSentence = {
        japanese: sentence.japanese,
        chinese: sentence.chinese,
        context: sentence.context || '' // 添加使用情境字段
      }
      
      try {
        console.log('添加句子到云端:', newSentence)
        const cloudSentence = await dataService.addData('sentences', newSentence, this.currentLanguage)
        console.log('句子添加成功:', cloudSentence)
        // 数据会通过实时监听自动更新
        return cloudSentence
      } catch (error) {
        console.error('同步句子到云端失败:', error)
        throw error
      }
    },

    async deleteSentence(id) {
      if (!this.isOnline) {
        throw new Error('需要网络连接才能删除数据')
      }

      try {
        console.log('从云端删除句子:', id)
        await dataService.deleteData('sentences', id, this.currentLanguage)
        console.log('句子删除成功')
        // 数据会通过实时监听自动更新
      } catch (error) {
        console.error('从云端删除句子失败:', error)
        throw error
      }
    },


    // 问答管理
    async addQA(qa) {
      if (!this.isOnline) {
        throw new Error('需要网络连接才能添加数据')
      }

      // 检查是否重复
      if (this.isQADuplicate(qa)) {
        throw new Error('该问答已存在，请勿重复添加')
      }

      const newQA = {
        question: qa.question,
        answer: qa.answer
      }
      
      try {
        console.log('添加问答到云端:', newQA)
        const cloudQA = await dataService.addData('qa', newQA, this.currentLanguage)
        console.log('问答添加成功:', cloudQA)
        // 数据会通过实时监听自动更新
        return cloudQA
      } catch (error) {
        console.error('同步问答到云端失败:', error)
        throw error
      }
    },

    async deleteQA(id) {
      if (!this.isOnline) {
        throw new Error('需要网络连接才能删除数据')
      }

      try {
        console.log('从云端删除问答:', id)
        await dataService.deleteData('qa', id, this.currentLanguage)
        console.log('问答删除成功')
        // 数据会通过实时监听自动更新
      } catch (error) {
        console.error('从云端删除问答失败:', error)
        throw error
      }
    },


    // 复习进度管理
    markAsReviewed(type, id) {
      const key = `${type}_${id}`
      this.reviewProgress[key] = Date.now()
      // 复习进度通过云端同步
    },

    // 测验历史
    addQuizResult(result) {
      this.quizHistory.push({
        id: Date.now(),
        ...result,
        completedAt: new Date().toISOString()
      })
      // 测验历史通过云端同步
    },

    // 初始化默认数据
    async initializeDefaultData() {
      if (this.hasInitialData) return // 如果已有数据，不重复初始化
      
      // 确保用户已登录且在线
      if (!this.isOnline) {
        console.log('用户未登录，跳过默认数据初始化')
        return
      }

      console.log('开始初始化默认数据...')

      try {
        // 获取当前语言的默认数据
        const languageData = defaultData[this.currentLanguage]
        if (!languageData) {
          console.log('当前语言没有默认数据:', this.currentLanguage)
          return
        }

        // 添加默认单词
        if (languageData.words && languageData.words.length > 0) {
          console.log('导入默认单词:', languageData.words.length, '个')
          for (const word of languageData.words) {
            await this.addWord(word)
          }
        }

        // 添加默认句子
        if (languageData.sentences && languageData.sentences.length > 0) {
          console.log('导入默认句子:', languageData.sentences.length, '个')
          for (const sentence of languageData.sentences) {
            await this.addSentence(sentence)
          }
        }

        // 添加默认问答
        if (languageData.qa && languageData.qa.length > 0) {
          console.log('导入默认问答:', languageData.qa.length, '个')
          for (const qa of languageData.qa) {
            await this.addQA(qa)
          }
        }

        console.log('默认数据初始化完成')
      } catch (error) {
        console.error('默认数据初始化失败:', error)
      }
    },

    // 切换显示语言（保持原有功能）
    toggleLanguage() {
      this.showJapanese = !this.showJapanese
      // 语言设置通过云端同步
    },

    // 切换学习语言
    switchLanguage(languageCode) {
      if (this.supportedLanguages.some(lang => lang.code === languageCode)) {
        this.currentLanguage = languageCode
        console.log('切换学习语言到:', languageCode)
        // 停止当前监听
        dataService.stopAllListeners()
        // 重新加载当前语言的数据
        this.loadLanguageData()
      } else {
        console.error('不支持的语言代码:', languageCode)
      }
    },

    // 加载当前语言的数据
    async loadLanguageData() {
      if (!this.isOnline) {
        console.log('未连接到云端，跳过数据加载')
        return
      }

      try {
        console.log('加载语言数据:', this.currentLanguage)
        // 重新设置实时监听
        this.setupRealtimeSync()
        // 从云端同步数据
        await this.syncFromCloud()
      } catch (error) {
        console.error('加载语言数据失败:', error)
      }
    },

    // 手动同步数据（用于解决手机端同步问题）
    async manualSync() {
      if (!this.isOnline) {
        throw new Error('需要网络连接才能同步数据')
      }

      console.log('开始手动同步...')
      try {
        await this.syncFromCloud()
        console.log('手动同步完成')
        return true
      } catch (error) {
        console.error('手动同步失败:', error)
        throw error
      }
    },

    // 获取数据迁移信息
    async getMigrationInfo() {
      if (!this.isOnline) {
        throw new Error('需要网络连接才能获取迁移信息')
      }

      console.log('获取数据迁移信息...')
      try {
        const migrationInfo = await dataService.manualDataMigration()
        console.log('迁移信息获取完成')
        return migrationInfo
      } catch (error) {
        console.error('获取迁移信息失败:', error)
        throw error
      }
    },

    // 导出当前数据为JSON（用于手动迁移）
    async exportCurrentData() {
      if (!this.isOnline) {
        throw new Error('需要网络连接才能导出数据')
      }

      console.log('导出当前数据...')
      try {
        const currentData = {
          words: this.words,
          sentences: this.sentences,
          qa: this.qa,
          exportTime: new Date().toISOString(),
          userId: authService.getCurrentUser()?.uid
        }
        
        const jsonData = JSON.stringify(currentData, null, 2)
        
        // 创建下载链接
        const blob = new Blob([jsonData], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `japanese-learning-data-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        
        console.log('数据导出完成')
        return true
      } catch (error) {
        console.error('数据导出失败:', error)
        throw error
      }
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
    async importData(jsonData) {
      try {
        const data = JSON.parse(jsonData)
        
        // 检查用户是否已登录
        if (!this.isOnline) {
          throw new Error('需要登录后才能导入数据')
        }
        
        console.log('开始导入数据到云端...')
        console.log('当前语言:', this.currentLanguage)
        console.log('数据统计:', {
          words: data.words?.length || 0,
          sentences: data.sentences?.length || 0,
          qa: data.qa?.length || 0
        })
        
        // 处理时间戳格式转换
        const processTimestamps = (items) => {
          return items.map(item => {
            const processed = { ...item }
            
            // 处理 createdAt 时间戳
            if (processed.createdAt && typeof processed.createdAt === 'object' && processed.createdAt.type === 'firestore/timestamp/1.0') {
              processed.createdAt = new Date(processed.createdAt.seconds * 1000).toISOString()
            }
            
            // 处理 updatedAt 时间戳
            if (processed.updatedAt && typeof processed.updatedAt === 'object' && processed.updatedAt.type === 'firestore/timestamp/1.0') {
              processed.updatedAt = new Date(processed.updatedAt.seconds * 1000).toISOString()
            }
            
            return processed
          })
        }
        
        // 导入单词数据
        if (data.words && data.words.length > 0) {
          console.log('导入单词数据:', data.words.length, '个')
          const processedWords = processTimestamps(data.words)
          
          // 批量上传到云端
          for (const word of processedWords) {
            try {
              // 检查是否重复
              if (!this.isWordDuplicate(word)) {
                await dataService.addData('words', {
                  japanese: word.japanese,
                  chinese: word.chinese
                }, this.currentLanguage)
                console.log('单词导入成功:', word.japanese)
              } else {
                console.log('跳过重复单词:', word.japanese)
              }
            } catch (error) {
              console.warn('单词导入失败:', word, error)
            }
          }
        }
        
        // 导入句子数据
        if (data.sentences && data.sentences.length > 0) {
          console.log('导入句子数据:', data.sentences.length, '个')
          const processedSentences = processTimestamps(data.sentences)
          
          // 批量上传到云端
          for (const sentence of processedSentences) {
            try {
              // 检查是否重复
              if (!this.isSentenceDuplicate(sentence)) {
                await dataService.addData('sentences', {
                  japanese: sentence.japanese,
                  chinese: sentence.chinese,
                  context: sentence.context || ''
                }, this.currentLanguage)
                console.log('句子导入成功:', sentence.japanese)
              } else {
                console.log('跳过重复句子:', sentence.japanese)
              }
            } catch (error) {
              console.warn('句子导入失败:', sentence, error)
            }
          }
        }
        
        // 导入问答数据
        if (data.qa && data.qa.length > 0) {
          console.log('导入问答数据:', data.qa.length, '个')
          const processedQA = processTimestamps(data.qa)
          
          // 批量上传到云端
          for (const qa of processedQA) {
            try {
              // 检查是否重复
              if (!this.isQADuplicate(qa)) {
                await dataService.addData('qa', {
                  question: qa.question,
                  answer: qa.answer
                }, this.currentLanguage)
                console.log('问答导入成功:', qa.question)
              } else {
                console.log('跳过重复问答:', qa.question)
              }
            } catch (error) {
              console.warn('问答导入失败:', qa, error)
            }
          }
        }
        
        // 导入复习进度（本地存储）
        if (data.reviewProgress) {
          this.reviewProgress = { ...this.reviewProgress, ...data.reviewProgress }
        }
        
        // 导入测验历史（本地存储）
        if (data.quizHistory) {
          this.quizHistory = [...this.quizHistory, ...data.quizHistory]
        }
        
        console.log('数据导入完成')
        console.log('导入统计:', {
          words: data.words?.length || 0,
          sentences: data.sentences?.length || 0,
          qa: data.qa?.length || 0,
          language: this.currentLanguage
        })
        return true
      } catch (error) {
        console.error('导入数据失败:', error)
        throw error
      }
    }
  }
})
