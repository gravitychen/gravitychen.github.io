// Store 状态就像一个全局的“数据仓库”，存放整个应用需要共享的数据。
import { defineStore } from 'pinia'
import dataService from '../firebase/dataService.js'
import authService from '../firebase/authService.js'
import { defaultData } from '../data/defaultData.js'
import { getDataOwnerId } from '../utils/dataOwnerId.js'

// 常量定义
const SYNC_RETRY_DELAY = 1000
const MAX_SYNC_RETRIES = 3

export const useDataStore = defineStore('data', {
  state: () => ({
    words: [],
    sentences: [],
    qa: [],
    mathConcepts: [], // 数学概念数据（用于 MathTable 组件）
    reviewProgress: {},
    quizHistory: [],
    // 单词分类树结构：{ language: { id: string, name: string, children: [] } }
    wordCategories: {}, // 按语言存储分类树
    // 存储"没记住"的项目ID
    incorrectItems: {
      words: new Set(),
      sentences: new Set(),
      qa: new Set()
    },
    // 存储"已熟记"的项目ID
    masteredItems: {
      words: new Set(),
      sentences: new Set(),
      qa: new Set()
    },
    showJapanese: true,
    isOnline: false,
    syncInProgress: false,
    lastSyncTime: null,
    syncRetryCount: 0,
    // 新增多语言支持
    currentLanguage: 'ja', // 当前学习语言：ja(日语), en(英语), hi(印地语), ko(韩语), math(数学)
    supportedLanguages: [
      { code: 'ja', name: '日语', flag: '🇯🇵' },
      { code: 'en', name: '英语', flag: '🇺🇸' },
      { code: 'hi', name: '印地语', flag: '🇮🇳' },
      { code: 'ko', name: '韩语', flag: '🇰🇷' },
      { code: 'math', name: '数学', flag: '🔢' }
    ],
    // 语言代码到语音代码的映射表（支持世界前40%常用语言）
    languageToSpeechMap: {
      'zh': 'zh-CN',  // 中文
      'en': 'en-US',  // 英语
      'hi': 'hi-IN',  // 印地语
      'es': 'es-ES',  // 西班牙语
      'ar': 'ar-SA',  // 阿拉伯语
      'bn': 'bn-BD',  // 孟加拉语
      'fr': 'fr-FR',  // 法语
      'ru': 'ru-RU',  // 俄语
      'pt': 'pt-BR',  // 葡萄牙语
      'ja': 'ja-JP',  // 日语
      'de': 'de-DE',  // 德语
      'ko': 'ko-KR',  // 韩语
      'it': 'it-IT',  // 意大利语
      'tr': 'tr-TR',  // 土耳其语
      'vi': 'vi-VN',  // 越南语
      'pl': 'pl-PL',  // 波兰语
      'nl': 'nl-NL',  // 荷兰语
      'th': 'th-TH',  // 泰语
      'id': 'id-ID',  // 印尼语
      'uk': 'uk-UA',  // 乌克兰语
      'cs': 'cs-CZ',  // 捷克语
      'ro': 'ro-RO',  // 罗马尼亚语
      'el': 'el-GR',  // 希腊语
      'hu': 'hu-HU',  // 匈牙利语
      'sv': 'sv-SE',  // 瑞典语
      'da': 'da-DK',  // 丹麦语
      'fi': 'fi-FI',  // 芬兰语
      'no': 'nb-NO',  // 挪威语
      'he': 'he-IL',  // 希伯来语
      'sk': 'sk-SK',  // 斯洛伐克语
      'hr': 'hr-HR',  // 克罗地亚语
      'bg': 'bg-BG',  // 保加利亚语
      'sr': 'sr-RS',  // 塞尔维亚语
      'sl': 'sl-SI',  // 斯洛文尼亚语
      'et': 'et-EE',  // 爱沙尼亚语
      'lv': 'lv-LV',  // 拉脱维亚语
      'lt': 'lt-LT'   // 立陶宛语
    }
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
    
    // 获取需要复习的内容（排除集中复习区的项目）
    wordsToReview: (state) => {
      const now = Date.now()
      const oneDayMs = 24 * 60 * 60 * 1000
      return state.words.filter(word => {
        // 如果项目在集中复习区，不显示在普通复习区
        if (state.reviewProgress[`incorrect_word_${word.id}`]) {
          return false
        }
        // 如果项目在熟记区，不显示在普通复习区
        if (state.reviewProgress[`mastered_word_${word.id}`]) {
          return false
        }
        const lastReview = state.reviewProgress[`word_${word.id}`]
        return !lastReview || (now - lastReview) >= oneDayMs
      })
    },
    
    sentencesToReview: (state) => {
      const now = Date.now()
      const oneDayMs = 24 * 60 * 60 * 1000
      return state.sentences.filter(sentence => {
        // 如果项目在集中复习区，不显示在普通复习区
        if (state.reviewProgress[`incorrect_sentence_${sentence.id}`]) {
          return false
        }
        // 如果项目在熟记区，不显示在普通复习区
        if (state.reviewProgress[`mastered_sentence_${sentence.id}`]) {
          return false
        }
        const lastReview = state.reviewProgress[`sentence_${sentence.id}`]
        return !lastReview || (now - lastReview) >= oneDayMs
      })
    },
    
    qaToReview: (state) => {
      const now = Date.now()
      const oneDayMs = 24 * 60 * 60 * 1000
      return state.qa.filter(qa => {
        // 如果项目在集中复习区，不显示在普通复习区
        if (state.reviewProgress[`incorrect_qa_${qa.id}`]) {
          return false
        }
        // 如果项目在熟记区，不显示在普通复习区
        if (state.reviewProgress[`mastered_qa_${qa.id}`]) {
          return false
        }
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
    
    // 获取"没记住"的项目列表（从 reviewProgress 中读取，排除熟记区的项目）
    incorrectWords: (state) => {
      return state.words.filter(word => {
        // 如果项目在熟记区，不显示在集中复习区
        if (state.reviewProgress[`mastered_word_${word.id}`]) {
          return false
        }
        return state.reviewProgress[`incorrect_word_${word.id}`] === true
      })
    },
    
    incorrectSentences: (state) => {
      return state.sentences.filter(sentence => {
        // 如果项目在熟记区，不显示在集中复习区
        if (state.reviewProgress[`mastered_sentence_${sentence.id}`]) {
          return false
        }
        return state.reviewProgress[`incorrect_sentence_${sentence.id}`] === true
      })
    },
    
    incorrectQA: (state) => {
      return state.qa.filter(qa => {
        // 如果项目在熟记区，不显示在集中复习区
        if (state.reviewProgress[`mastered_qa_${qa.id}`]) {
          return false
        }
        return state.reviewProgress[`incorrect_qa_${qa.id}`] === true
      })
    },
    
    // 获取所有"没记住"项目的总数（排除熟记区的项目）
    totalIncorrectItems: (state) => {
      const wordsCount = state.words.filter(w => {
        // 排除熟记区的项目
        if (state.reviewProgress[`mastered_word_${w.id}`]) {
          return false
        }
        return state.reviewProgress[`incorrect_word_${w.id}`] === true
      }).length
      const sentencesCount = state.sentences.filter(s => {
        // 排除熟记区的项目
        if (state.reviewProgress[`mastered_sentence_${s.id}`]) {
          return false
        }
        return state.reviewProgress[`incorrect_sentence_${s.id}`] === true
      }).length
      const qaCount = state.qa.filter(q => {
        // 排除熟记区的项目
        if (state.reviewProgress[`mastered_qa_${q.id}`]) {
          return false
        }
        return state.reviewProgress[`incorrect_qa_${q.id}`] === true
      }).length
      return wordsCount + sentencesCount + qaCount
    },
    
    // 获取"已熟记"的项目列表（从 reviewProgress 中读取）
    masteredWords: (state) => {
      return state.words.filter(word => state.reviewProgress[`mastered_word_${word.id}`] === true)
    },
    
    masteredSentences: (state) => {
      return state.sentences.filter(sentence => state.reviewProgress[`mastered_sentence_${sentence.id}`] === true)
    },
    
    masteredQA: (state) => {
      return state.qa.filter(qa => state.reviewProgress[`mastered_qa_${qa.id}`] === true)
    },
    
    // 获取所有"已熟记"项目的总数
    totalMasteredItems: (state) => {
      const wordsCount = state.words.filter(w => state.reviewProgress[`mastered_word_${w.id}`] === true).length
      const sentencesCount = state.sentences.filter(s => state.reviewProgress[`mastered_sentence_${s.id}`] === true).length
      const qaCount = state.qa.filter(q => state.reviewProgress[`mastered_qa_${q.id}`] === true).length
      return wordsCount + sentencesCount + qaCount
    },
    
    // 根据语言代码获取语音代码
    getSpeechCode: (state) => (languageCode) => {
      return state.languageToSpeechMap[languageCode] || 'zh-CN'
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

    // 自动检测并删除重复数据（静默执行，不显示提示）
    async autoRemoveDuplicates(skipAutoCheck = false) {
      if (!this.isOnline) {
        return // 离线时不执行
      }

      // 如果已经在执行自动检查，则跳过（防止递归）
      if (this._isAutoRemovingDuplicates) {
        return
      }

      this._isAutoRemovingDuplicates = true

      try {
        // 检测并删除重复单词
        const wordKeys = new Map() // 使用 Map 存储第一个出现的单词ID
        const wordsToDelete = []
        
        this.words.forEach((word) => {
          const key = `${word.japanese}|${word.chinese}`
          if (wordKeys.has(key)) {
            // 发现重复，标记为删除（保留第一个，删除后续的）
            wordsToDelete.push(word.id)
          } else {
            wordKeys.set(key, word.id)
          }
        })

        // 删除重复单词（直接调用 dataService，不触发自动检查）
        for (const wordId of wordsToDelete) {
          try {
            await dataService.deleteData('words', wordId, this.currentLanguage)
            console.log('🗑️ 自动删除重复单词:', wordId)
          } catch (error) {
            console.warn('自动删除重复单词失败:', error)
          }
        }

        // 检测并删除重复句子
        const sentenceKeys = new Map()
        const sentencesToDelete = []
        
        this.sentences.forEach((sentence) => {
          const key = `${sentence.japanese}|${sentence.chinese}`
          if (sentenceKeys.has(key)) {
            sentencesToDelete.push(sentence.id)
          } else {
            sentenceKeys.set(key, sentence.id)
          }
        })

        // 删除重复句子（直接调用 dataService，不触发自动检查）
        for (const sentenceId of sentencesToDelete) {
          try {
            await dataService.deleteData('sentences', sentenceId, this.currentLanguage)
            console.log('🗑️ 自动删除重复句子:', sentenceId)
          } catch (error) {
            console.warn('自动删除重复句子失败:', error)
          }
        }

        // 检测并删除重复问答
        const qaKeys = new Map()
        const qaToDelete = []
        
        this.qa.forEach((qa) => {
          const key = `${qa.question}|${qa.answer}`
          if (qaKeys.has(key)) {
            qaToDelete.push(qa.id)
          } else {
            qaKeys.set(key, qa.id)
          }
        })

        // 删除重复问答（直接调用 dataService，不触发自动检查）
        for (const qaId of qaToDelete) {
          try {
            await dataService.deleteData('qa', qaId, this.currentLanguage)
            console.log('🗑️ 自动删除重复问答:', qaId)
          } catch (error) {
            console.warn('自动删除重复问答失败:', error)
          }
        }

        if (wordsToDelete.length > 0 || sentencesToDelete.length > 0 || qaToDelete.length > 0) {
          console.log(`✅ 自动清理完成: 删除 ${wordsToDelete.length} 个重复单词, ${sentencesToDelete.length} 个重复句子, ${qaToDelete.length} 个重复问答`)
        }
      } catch (error) {
        console.warn('自动检测重复数据时出错:', error)
        // 静默失败，不影响主流程
      } finally {
        this._isAutoRemovingDuplicates = false
      }
    },


    // 初始化云端同步（基于 dataOwnerId，必须通过 Google 登录获得）
    async initializeCloudSync() {
      // 1. 从 localStorage 加载本地语言和复习进度
      this.loadLanguagesFromLocal()
      this.loadReviewProgressFromLocal()

      // 2. 检查是否有 dataOwnerId（必须通过 Google 登录获得）
      const ownerId = getDataOwnerId()
      if (!ownerId) {
        console.log('未找到 dataOwnerId，需要先进行 Google 登录')
        this.isOnline = false
        return
      }

      console.log('使用 dataOwnerId 作为云端用户ID:', ownerId)
      dataService.setUserId(ownerId)

      // 3. 标记为“已连接云端”（此处只表示可以访问 Firestore）
      this.isOnline = true

      // 4. 从云端同步并设置实时监听
      try {
        console.log('开始基于 dataOwnerId 的云端同步...')
        await this.syncFromCloud()
        this.setupRealtimeSync()
        console.log('云端同步完成，实时监听已启动')

        // 同步完成后，如无数据则初始化默认数据
        if (!this.hasInitialData) {
          console.log('检测到无数据，开始初始化默认数据...')
          await this.initializeDefaultData()
        }
      } catch (error) {
        console.error('云端同步失败:', error)
        // 即使同步失败，也尽量设置实时监听，避免完全不可用
        try {
          this.setupRealtimeSync()
        } catch (e) {
          console.error('设置实时监听失败:', e)
        }
      }
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
        // 数据更新后，确保恢复集中复习区和熟记区的数据
        this.restoreIncorrectItemsFromProgress()
        this.restoreMasteredItemsFromProgress()
      }, this.currentLanguage)

      // 监听句子变化
      dataService.listenToData('sentences', (sentences) => {
        console.log('句子数据更新:', sentences.length, '个')
        this.sentences = sentences || []
        // 数据更新后，确保恢复集中复习区和熟记区的数据
        this.restoreIncorrectItemsFromProgress()
        this.restoreMasteredItemsFromProgress()
      }, this.currentLanguage)

      // 监听问答变化
      dataService.listenToData('qa', (qa) => {
        console.log('问答数据更新:', qa.length, '个')
        this.qa = qa || []
        // 数据更新后，确保恢复集中复习区和熟记区的数据
        this.restoreIncorrectItemsFromProgress()
        this.restoreMasteredItemsFromProgress()
      }, this.currentLanguage)

      // 监听数学概念变化（独立于当前语言，保证 MathTable 可随时同步）
      dataService.listenToData('mathConcepts', (mathConcepts) => {
        console.log('数学概念数据更新:', mathConcepts.length, '个')
        this.mathConcepts = mathConcepts || []
      }, 'math')

      console.log('实时同步监听已设置')
    },

    // 优化的云端同步方法
    async syncFromCloud(retryCount = 0) {
      if (!this.isOnline) {
        console.log('未连接到云端，跳过同步')
        return
      }

      // 检查 dataService.userId 是否已设置
      const userId = dataService.userId
      console.log('同步前检查 - 当前 dataOwnerId:', userId)
      if (!userId) {
        console.error('同步失败：dataOwnerId 未设置')
        throw new Error('dataOwnerId 未设置，无法同步数据')
      }

      try {
        this.syncInProgress = true
        this.syncRetryCount = retryCount
        console.log(`开始从云端获取数据... (尝试 ${retryCount + 1}/${MAX_SYNC_RETRIES})`)
        console.log('同步用户ID:', userId)
        
        // 使用 Promise.allSettled 确保部分失败不影响其他数据
        const dataPromises = [
          dataService.getAllData('words', this.currentLanguage),
          dataService.getAllData('sentences', this.currentLanguage),
          dataService.getAllData('qa', this.currentLanguage)
        ]
        
        // 数学概念始终同步（独立于当前语言）
        dataPromises.push(dataService.getAllData('mathConcepts', 'math'))
        
        const results = await Promise.allSettled(dataPromises)

        const [wordsResult, sentencesResult, qaResult, mathConceptsResult] = results
        
        // 处理结果
        const words = wordsResult.status === 'fulfilled' ? wordsResult.value : []
        const sentences = sentencesResult.status === 'fulfilled' ? sentencesResult.value : []
        const qa = qaResult.status === 'fulfilled' ? qaResult.value : []
        const mathConcepts = mathConceptsResult && mathConceptsResult.status === 'fulfilled' ? mathConceptsResult.value : []

        // 记录失败的同步
        const failures = results.filter(r => r.status === 'rejected')
        if (failures.length > 0) {
          console.warn('部分数据同步失败:', failures.map(f => f.reason))
        }

        console.log('云端数据获取完成:', { 
          words: words.length, 
          sentences: sentences.length, 
          qa: qa.length,
          mathConcepts: mathConcepts ? mathConcepts.length : 0,
          failures: failures.length
        })

        // 更新本地数据
        this.words = words || []
        this.sentences = sentences || []
        this.qa = qa || []
        this.mathConcepts = mathConcepts || []

        // 从云端加载复习进度（包括集中复习区数据）
        await this.syncReviewProgressFromCloud()
        
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
        chinese: word.chinese,
        context: word.context || '', // 添加使用情境字段
        mnemonic: word.mnemonic || '' // 添加助记提示字段
      }
      
      try {
        console.log('添加单词到云端:', newWord)
        const cloudWord = await dataService.addData('words', newWord, this.currentLanguage)
        console.log('单词添加成功:', cloudWord)
        // 数据会通过实时监听自动更新，不需要手动添加到本地
        
        // 添加后自动检测并删除重复数据（异步执行，不阻塞）
        setTimeout(() => {
          this.autoRemoveDuplicates().catch(err => {
            console.warn('自动清理重复数据失败:', err)
          })
        }, 1000) // 延迟1秒，等待数据同步完成
        
        return cloudWord
      } catch (error) {
        console.error('同步单词到云端失败:', error)
        throw error
      }
    },

    async updateWord(id, wordData) {
      if (!this.isOnline) {
        throw new Error('需要网络连接才能更新数据')
      }

      try {
        console.log('更新单词:', id, wordData)
        await dataService.updateData('words', id, wordData, this.currentLanguage)
        console.log('单词更新成功')
        // 数据会通过实时监听自动更新
      } catch (error) {
        console.error('更新单词失败:', error)
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
        
        // 删除后自动检测并删除重复数据（异步执行，不阻塞）
        setTimeout(() => {
          this.autoRemoveDuplicates().catch(err => {
            console.warn('自动清理重复数据失败:', err)
          })
        }, 1000) // 延迟1秒，等待数据同步完成
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
        context: sentence.context || '', // 添加使用情境字段
        mnemonic: sentence.mnemonic || '' // 添加助记提示字段
      }
      
      try {
        console.log('添加句子到云端:', newSentence)
        const cloudSentence = await dataService.addData('sentences', newSentence, this.currentLanguage)
        console.log('句子添加成功:', cloudSentence)
        // 数据会通过实时监听自动更新
        
        // 添加后自动检测并删除重复数据（异步执行，不阻塞）
        setTimeout(() => {
          this.autoRemoveDuplicates().catch(err => {
            console.warn('自动清理重复数据失败:', err)
          })
        }, 1000) // 延迟1秒，等待数据同步完成
        
        return cloudSentence
      } catch (error) {
        console.error('同步句子到云端失败:', error)
        throw error
      }
    },

    async updateSentence(id, sentenceData) {
      if (!this.isOnline) {
        throw new Error('需要网络连接才能更新数据')
      }

      try {
        console.log('更新句子:', id, sentenceData)
        await dataService.updateData('sentences', id, sentenceData, this.currentLanguage)
        console.log('句子更新成功')
        // 数据会通过实时监听自动更新
      } catch (error) {
        console.error('更新句子失败:', error)
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
        
        // 删除后自动检测并删除重复数据（异步执行，不阻塞）
        setTimeout(() => {
          this.autoRemoveDuplicates().catch(err => {
            console.warn('自动清理重复数据失败:', err)
          })
        }, 1000) // 延迟1秒，等待数据同步完成
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
        
        // 添加后自动检测并删除重复数据（异步执行，不阻塞）
        setTimeout(() => {
          this.autoRemoveDuplicates().catch(err => {
            console.warn('自动清理重复数据失败:', err)
          })
        }, 1000) // 延迟1秒，等待数据同步完成
        
        return cloudQA
      } catch (error) {
        console.error('同步问答到云端失败:', error)
        throw error
      }
    },

    async updateQA(id, qaData) {
      if (!this.isOnline) {
        throw new Error('需要网络连接才能更新数据')
      }

      try {
        console.log('更新问答:', id, qaData)
        await dataService.updateData('qa', id, qaData, this.currentLanguage)
        console.log('问答更新成功')
        // 数据会通过实时监听自动更新
      } catch (error) {
        console.error('更新问答失败:', error)
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
        
        // 删除后自动检测并删除重复数据（异步执行，不阻塞）
        setTimeout(() => {
          this.autoRemoveDuplicates().catch(err => {
            console.warn('自动清理重复数据失败:', err)
          })
        }, 1000) // 延迟1秒，等待数据同步完成
      } catch (error) {
        console.error('从云端删除问答失败:', error)
        throw error
      }
    },


    // 复习进度管理
    async markAsReviewed(type, id, removeFromIncorrect = false) {
      const timestamp = new Date().toISOString()
      const key = `${type}_${id}`
      console.log(`[复习日志 ${timestamp}] markAsReviewed 开始:`, { type, id, removeFromIncorrect })
      
      this.reviewProgress[key] = Date.now()
      console.log(`[复习日志 ${timestamp}] 已更新复习时间:`, { key, timestamp: this.reviewProgress[key] })
      
      // 只有明确指定 removeFromIncorrect = true 时，才从集中复习区移除（永久记忆体）
      // 默认不移除，因为集中复习区是永久记忆体，只有用户明确点击"记住了"才移除
      if (removeFromIncorrect) {
        const incorrectKey = `incorrect_${type}_${id}`
        if (this.reviewProgress[incorrectKey] === true) {
          delete this.reviewProgress[incorrectKey]
          // 同步更新 incorrectItems Set（用于内存中的快速访问）
          const collectionKey = `${type}s`
          if (this.incorrectItems[collectionKey]) {
            this.incorrectItems[collectionKey].delete(id)
          }
          console.log(`[复习日志 ${timestamp}] ✅ 项目已从集中复习区移除:`, { type, id, incorrectKey })
        } else {
          console.log(`[复习日志 ${timestamp}] ⚠️ 项目不在集中复习区，无需移除:`, { type, id, incorrectKey })
        }
      } else {
        console.log(`[复习日志 ${timestamp}] ℹ️ 不移除集中复习区标记:`, { type, id })
      }
      
      // 保存到 localStorage 和云端以便持久化
      console.log(`[复习日志 ${timestamp}] 开始保存复习进度...`)
      await this.saveReviewProgressToLocal()
      console.log(`[复习日志 ${timestamp}] ✅ markAsReviewed 完成`)
    },
    
    // 标记为"没记住"（添加到集中复习区 - 永久记忆体）
    async markAsIncorrect(type, id) {
      const timestamp = new Date().toISOString()
      const incorrectKey = `incorrect_${type}_${id}`
      console.log(`[复习日志 ${timestamp}] 🔴 markAsIncorrect 开始:`, { type, id, incorrectKey })
      
      // 永久标记为"没记住"，直到用户明确点击"记住了"才会移除
      const wasAlreadyIncorrect = this.reviewProgress[incorrectKey] === true
      this.reviewProgress[incorrectKey] = true
      console.log(`[复习日志 ${timestamp}] 已标记为"没记住":`, { 
        incorrectKey, 
        value: this.reviewProgress[incorrectKey],
        wasAlreadyIncorrect 
      })
      
      // 同步更新 incorrectItems Set（用于内存中的快速访问）
      const collectionKey = `${type}s`
      if (this.incorrectItems[collectionKey]) {
        this.incorrectItems[collectionKey].add(id)
        console.log(`[复习日志 ${timestamp}] 已更新 incorrectItems Set:`, { 
          collectionKey, 
          size: this.incorrectItems[collectionKey].size 
        })
      }
      
      // 立即保存到 localStorage 和云端以便持久化（永久保存）
      console.log(`[复习日志 ${timestamp}] 开始保存到本地和云端...`)
      await this.saveReviewProgressToLocal()
      console.log(`[复习日志 ${timestamp}] ✅ 项目已添加到集中复习区（永久记忆体）:`, { type, id })
    },
    
    // 清除所有"没记住"的项目
    async clearIncorrectItems() {
      // 从 reviewProgress 中删除所有 incorrect_ 开头的键
      Object.keys(this.reviewProgress).forEach(key => {
        if (key.startsWith('incorrect_')) {
          delete this.reviewProgress[key]
        }
      })
      // 清空 incorrectItems Set
      this.incorrectItems.words.clear()
      this.incorrectItems.sentences.clear()
      this.incorrectItems.qa.clear()
      // 保存到 localStorage 和云端
      await this.saveReviewProgressToLocal()
    },

    // 标记为"已熟记"（添加到熟记区）
    async markAsMastered(type, id) {
      const timestamp = new Date().toISOString()
      const masteredKey = `mastered_${type}_${id}`
      console.log(`[熟记日志 ${timestamp}] ✅ markAsMastered 开始:`, { type, id, masteredKey })
      
      // 标记为"已熟记"
      this.reviewProgress[masteredKey] = true
      console.log(`[熟记日志 ${timestamp}] 已标记为"已熟记":`, { masteredKey })
      
      // 同步更新 masteredItems Set（用于内存中的快速访问）
      const collectionKey = `${type}s`
      if (this.masteredItems[collectionKey]) {
        this.masteredItems[collectionKey].add(id)
        console.log(`[熟记日志 ${timestamp}] 已更新 masteredItems Set:`, { 
          collectionKey, 
          size: this.masteredItems[collectionKey].size 
        })
      }
      
      // 如果项目在集中复习区，同时从集中复习区移除
      const incorrectKey = `incorrect_${type}_${id}`
      if (this.reviewProgress[incorrectKey] === true) {
        delete this.reviewProgress[incorrectKey]
        if (this.incorrectItems[collectionKey]) {
          this.incorrectItems[collectionKey].delete(id)
        }
        console.log(`[熟记日志 ${timestamp}] 同时从集中复习区移除`)
      }
      
      // 保存到 localStorage 和云端以便持久化
      await this.saveReviewProgressToLocal()
      console.log(`[熟记日志 ${timestamp}] ✅ 项目已添加到熟记区:`, { type, id })
    },
    
    // 从熟记区移除
    async removeFromMastered(type, id) {
      const timestamp = new Date().toISOString()
      const masteredKey = `mastered_${type}_${id}`
      console.log(`[熟记日志 ${timestamp}] 🔄 removeFromMastered 开始:`, { type, id, masteredKey })
      
      if (this.reviewProgress[masteredKey] === true) {
        delete this.reviewProgress[masteredKey]
        // 同步更新 masteredItems Set
        const collectionKey = `${type}s`
        if (this.masteredItems[collectionKey]) {
          this.masteredItems[collectionKey].delete(id)
        }
        console.log(`[熟记日志 ${timestamp}] ✅ 项目已从熟记区移除:`, { type, id })
      }
      
      // 保存到 localStorage 和云端
      await this.saveReviewProgressToLocal()
    },
    
    // 清除所有"已熟记"的项目
    async clearMasteredItems() {
      // 从 reviewProgress 中删除所有 mastered_ 开头的键
      Object.keys(this.reviewProgress).forEach(key => {
        if (key.startsWith('mastered_')) {
          delete this.reviewProgress[key]
        }
      })
      // 清空 masteredItems Set
      this.masteredItems.words.clear()
      this.masteredItems.sentences.clear()
      this.masteredItems.qa.clear()
      // 保存到 localStorage 和云端
      await this.saveReviewProgressToLocal()
    },
    
    // 保存复习进度到 localStorage 和云端
    async saveReviewProgressToLocal() {
      const timestamp = new Date().toISOString()
      const incorrectItemsCount = Object.keys(this.reviewProgress).filter(k => k.startsWith('incorrect_')).length
      const totalItemsCount = Object.keys(this.reviewProgress).length
      
      console.log(`[保存日志 ${timestamp}] 💾 saveReviewProgressToLocal 开始:`, {
        totalItems: totalItemsCount,
        incorrectItems: incorrectItemsCount,
        isOnline: this.isOnline
      })
      
      try {
        // 保存到 localStorage（如果可用）
        try {
          localStorage.setItem('reviewProgress', JSON.stringify(this.reviewProgress))
          console.log(`[保存日志 ${timestamp}] ✅ 已保存到 localStorage:`, {
            size: JSON.stringify(this.reviewProgress).length,
            items: totalItemsCount
          })
        } catch (localStorageError) {
          // localStorage 可能被禁用（如 Safari 无痕模式）
          console.warn(`[保存日志 ${timestamp}] ⚠️ localStorage 不可用，跳过本地保存:`, {
            error: localStorageError.message,
            reason: '可能是 Safari 无痕模式或安全设置'
          })
        }
        
        // 如果在线，同步到云端
        if (this.isOnline) {
          console.log(`[保存日志 ${timestamp}] 🌐 开始同步到 Firebase 云端...`)
          try {
            const startTime = Date.now()
            await dataService.saveReviewProgress(this.reviewProgress)
            const duration = Date.now() - startTime
            console.log(`[保存日志 ${timestamp}] ✅ 复习进度已同步到 Firebase 云端 (耗时: ${duration}ms):`, {
              totalItems: totalItemsCount,
              incorrectItems: incorrectItemsCount,
              dataSize: JSON.stringify(this.reviewProgress).length
            })
          } catch (error) {
            console.error(`[保存日志 ${timestamp}] ❌ 同步复习进度到 Firebase 云端失败:`, {
              error: error.message,
              stack: error.stack,
              totalItems: totalItemsCount,
              incorrectItems: incorrectItemsCount
            })
            // 即使云端同步失败，本地保存仍然成功
          }
        } else {
          console.log(`[保存日志 ${timestamp}] ⚠️ 设备未在线，跳过云端同步`)
        }
      } catch (error) {
        console.error(`[保存日志 ${timestamp}] ❌ 保存复习进度到本地存储失败:`, {
          error: error.message,
          stack: error.stack
        })
      }
      
      console.log(`[保存日志 ${timestamp}] 💾 saveReviewProgressToLocal 完成`)
    },
    
    // 从 localStorage 加载复习进度
    loadReviewProgressFromLocal() {
      try {
        // 检查 localStorage 是否可用
        let saved = null
        try {
          saved = localStorage.getItem('reviewProgress')
        } catch (localStorageError) {
          // localStorage 可能被禁用（如 Safari 无痕模式）
          console.warn('localStorage 不可用，跳过本地加载:', {
            error: localStorageError.message,
            reason: '可能是 Safari 无痕模式或安全设置，将完全依赖云端存储'
          })
          return
        }
        
        if (saved) {
          const parsed = JSON.parse(saved)
          
          // 提取内存中现有的集中复习区数据（永久记忆体）- 可能是本次会话中新添加的
          const existingIncorrectItems = {}
          Object.keys(this.reviewProgress).forEach(key => {
            if (key.startsWith('incorrect_')) {
              existingIncorrectItems[key] = this.reviewProgress[key]
            }
          })
          
          // 合并复习进度：
          // 1. 先加载本地存储的所有数据（包括集中复习区的永久数据）
          // 2. 然后覆盖为内存中现有的集中复习区数据（如果有更新，优先保留内存中的）
          this.reviewProgress = { 
            ...parsed,  // 先加载本地存储的数据（包括集中复习区的永久数据）
            ...existingIncorrectItems  // 然后覆盖为内存中现有的集中复习区数据（确保本次会话的新数据不丢失）
          }
          
          console.log('从 localStorage 加载复习进度:', Object.keys(parsed).length, '条记录')
          // 恢复 incorrectItems Set
          this.restoreIncorrectItemsFromProgress()
          // 恢复 masteredItems Set
          this.restoreMasteredItemsFromProgress()
          console.log('恢复集中复习区数据（永久记忆体）:', {
            words: this.incorrectItems.words.size,
            sentences: this.incorrectItems.sentences.size,
            qa: this.incorrectItems.qa.size
          })
          console.log('恢复熟记区数据:', {
            words: this.masteredItems.words.size,
            sentences: this.masteredItems.sentences.size,
            qa: this.masteredItems.qa.size
          })
        } else {
          console.log('localStorage 中没有复习进度数据')
        }
      } catch (error) {
        console.warn('从本地存储加载复习进度失败:', {
          error: error.message,
          stack: error.stack
        })
      }
    },
    
    // 从云端同步复习进度（合并本地和云端数据，优先保留集中复习区数据）
    async syncReviewProgressFromCloud() {
      const timestamp = new Date().toISOString()
      console.log(`[同步日志 ${timestamp}] 🔄 syncReviewProgressFromCloud 开始:`, { isOnline: this.isOnline })
      
      if (!this.isOnline) {
        // 如果不在线，只从本地加载
        console.log(`[同步日志 ${timestamp}] ⚠️ 设备未在线，只从本地加载`)
        this.loadReviewProgressFromLocal()
        return
      }
      
      try {
        // 1. 先加载本地数据
        console.log(`[同步日志 ${timestamp}] 📂 步骤1: 加载本地数据...`)
        const localBeforeCount = Object.keys(this.reviewProgress).length
        this.loadReviewProgressFromLocal()
        const localAfterCount = Object.keys(this.reviewProgress).length
        console.log(`[同步日志 ${timestamp}] ✅ 本地数据加载完成:`, {
          before: localBeforeCount,
          after: localAfterCount,
          localIncorrectItems: Object.keys(this.reviewProgress).filter(k => k.startsWith('incorrect_')).length
        })
        
        // 2. 从云端加载数据
        console.log(`[同步日志 ${timestamp}] 🌐 步骤2: 从 Firebase 云端加载数据...`)
        const cloudStartTime = Date.now()
        const cloudReviewProgress = await dataService.getReviewProgress()
        const cloudDuration = Date.now() - cloudStartTime
        const cloudCount = Object.keys(cloudReviewProgress).length
        console.log(`[同步日志 ${timestamp}] ✅ 云端数据加载完成 (耗时: ${cloudDuration}ms):`, {
          cloudItems: cloudCount,
          cloudIncorrectItems: Object.keys(cloudReviewProgress).filter(k => k.startsWith('incorrect_')).length
        })
        
        if (cloudCount > 0) {
          // 3. 提取本地和云端的集中复习区数据（永久记忆体）
          console.log(`[同步日志 ${timestamp}] 🔀 步骤3: 提取集中复习区数据...`)
          const localIncorrectItems = {}
          const cloudIncorrectItems = {}
          
          Object.keys(this.reviewProgress).forEach(key => {
            if (key.startsWith('incorrect_')) {
              localIncorrectItems[key] = this.reviewProgress[key]
            }
          })
          
          Object.keys(cloudReviewProgress).forEach(key => {
            if (key.startsWith('incorrect_')) {
              cloudIncorrectItems[key] = cloudReviewProgress[key]
            }
          })
          
          console.log(`[同步日志 ${timestamp}] 集中复习区数据统计:`, {
            localIncorrect: Object.keys(localIncorrectItems).length,
            cloudIncorrect: Object.keys(cloudIncorrectItems).length,
            localKeys: Object.keys(localIncorrectItems).slice(0, 5), // 只显示前5个
            cloudKeys: Object.keys(cloudIncorrectItems).slice(0, 5)
          })
          
          // 4. 合并复习进度：
          // - 先合并云端和本地的所有数据（云端优先，因为可能包含其他设备的数据）
          // - 然后合并集中复习区数据（合并本地和云端，确保不丢失任何"没记住"的项目）
          console.log(`[同步日志 ${timestamp}] 🔀 步骤4: 合并本地和云端数据...`)
          const mergedIncorrectItems = {
            ...cloudIncorrectItems,  // 先加载云端的集中复习区数据
            ...localIncorrectItems   // 然后覆盖为本地的集中复习区数据（确保本次会话的新数据不丢失）
          }
          
          const beforeMergeCount = Object.keys(this.reviewProgress).length
          this.reviewProgress = {
            ...cloudReviewProgress,  // 先加载云端的所有数据
            ...this.reviewProgress,  // 然后覆盖为本地数据（确保本地更新不丢失）
            ...mergedIncorrectItems  // 最后确保集中复习区数据完整（合并本地和云端）
          }
          const afterMergeCount = Object.keys(this.reviewProgress).length
          
          console.log(`[同步日志 ${timestamp}] ✅ 数据合并完成:`, {
            beforeMerge: beforeMergeCount,
            afterMerge: afterMergeCount,
            mergedIncorrectItems: Object.keys(mergedIncorrectItems).length
          })
          
          // 5. 保存合并后的数据到本地和云端
          console.log(`[同步日志 ${timestamp}] 💾 步骤5: 保存合并后的数据...`)
          await this.saveReviewProgressToLocal()
          
          // 6. 恢复 incorrectItems Set 和 masteredItems Set
          console.log(`[同步日志 ${timestamp}] 🔄 步骤6: 恢复 incorrectItems Set 和 masteredItems Set...`)
          this.restoreIncorrectItemsFromProgress()
          this.restoreMasteredItemsFromProgress()
          console.log(`[同步日志 ${timestamp}] ✅ 合并后的集中复习区数据（永久记忆体）:`, {
            words: this.incorrectItems.words.size,
            sentences: this.incorrectItems.sentences.size,
            qa: this.incorrectItems.qa.size,
            total: this.incorrectItems.words.size + this.incorrectItems.sentences.size + this.incorrectItems.qa.size
          })
          console.log(`[同步日志 ${timestamp}] ✅ 合并后的熟记区数据:`, {
            words: this.masteredItems.words.size,
            sentences: this.masteredItems.sentences.size,
            qa: this.masteredItems.qa.size,
            total: this.masteredItems.words.size + this.masteredItems.sentences.size + this.masteredItems.qa.size
          })
        } else {
          // 云端没有数据，只使用本地数据
          console.log(`[同步日志 ${timestamp}] ⚠️ 云端没有复习进度数据，使用本地数据`)
          this.restoreIncorrectItemsFromProgress()
          this.restoreMasteredItemsFromProgress()
          console.log(`[同步日志 ${timestamp}] ✅ 本地集中复习区数据:`, {
            words: this.incorrectItems.words.size,
            sentences: this.incorrectItems.sentences.size,
            qa: this.incorrectItems.qa.size
          })
          console.log(`[同步日志 ${timestamp}] ✅ 本地熟记区数据:`, {
            words: this.masteredItems.words.size,
            sentences: this.masteredItems.sentences.size,
            qa: this.masteredItems.qa.size
          })
        }
      } catch (error) {
        console.error(`[同步日志 ${timestamp}] ❌ 从云端同步复习进度失败，使用本地数据:`, {
          error: error.message,
          stack: error.stack
        })
        // 即使云端同步失败，也恢复本地数据
        this.restoreIncorrectItemsFromProgress()
        this.restoreMasteredItemsFromProgress()
      }
      
      console.log(`[同步日志 ${timestamp}] 🔄 syncReviewProgressFromCloud 完成`)
    },
    
    // 从 reviewProgress 恢复 incorrectItems Set
    restoreIncorrectItemsFromProgress() {
      this.incorrectItems.words.clear()
      this.incorrectItems.sentences.clear()
      this.incorrectItems.qa.clear()
      
      Object.keys(this.reviewProgress).forEach(key => {
        if (key.startsWith('incorrect_word_')) {
          const id = key.replace('incorrect_word_', '')
          this.incorrectItems.words.add(id)
        } else if (key.startsWith('incorrect_sentence_')) {
          const id = key.replace('incorrect_sentence_', '')
          this.incorrectItems.sentences.add(id)
        } else if (key.startsWith('incorrect_qa_')) {
          const id = key.replace('incorrect_qa_', '')
          this.incorrectItems.qa.add(id)
        }
      })
    },

    // 从 reviewProgress 恢复 masteredItems Set
    restoreMasteredItemsFromProgress() {
      this.masteredItems.words.clear()
      this.masteredItems.sentences.clear()
      this.masteredItems.qa.clear()
      
      Object.keys(this.reviewProgress).forEach(key => {
        if (key.startsWith('mastered_word_')) {
          const id = key.replace('mastered_word_', '')
          this.masteredItems.words.add(id)
        } else if (key.startsWith('mastered_sentence_')) {
          const id = key.replace('mastered_sentence_', '')
          this.masteredItems.sentences.add(id)
        } else if (key.startsWith('mastered_qa_')) {
          const id = key.replace('mastered_qa_', '')
          this.masteredItems.qa.add(id)
        }
      })
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

    // 添加新语言
    addLanguage(language) {
      // 检查语言代码是否已存在
      if (this.supportedLanguages.some(lang => lang.code === language.code)) {
        throw new Error(`语言代码 "${language.code}" 已存在`)
      }
      
      // 添加新语言
      this.supportedLanguages.push({
        code: language.code,
        name: language.name,
        flag: language.flag || '🌐'
      })
      
      // 保存到 localStorage
      this.saveLanguagesToLocal()
      
      console.log('添加新语言:', language)
    },

    // 删除语言
    removeLanguage(languageCode) {
      // 检查是否是当前使用的语言
      if (this.currentLanguage === languageCode) {
        // 如果删除的是当前语言，切换到第一个可用语言
        const remainingLanguages = this.supportedLanguages.filter(lang => lang.code !== languageCode)
        if (remainingLanguages.length > 0) {
          this.currentLanguage = remainingLanguages[0].code
          console.log('已切换到语言:', remainingLanguages[0].code)
        }
      }
      
      // 检查是否至少保留一个语言
      if (this.supportedLanguages.length <= 1) {
        throw new Error('至少需要保留一个语言')
      }
      
      // 删除语言
      this.supportedLanguages = this.supportedLanguages.filter(lang => lang.code !== languageCode)
      
      // 保存到 localStorage
      this.saveLanguagesToLocal()
      
      console.log('删除语言:', languageCode)
    },

    // 保存语言列表到 localStorage
    saveLanguagesToLocal() {
      try {
        localStorage.setItem('supportedLanguages', JSON.stringify(this.supportedLanguages))
        console.log('语言列表已保存到 localStorage')
      } catch (error) {
        console.warn('保存语言列表到 localStorage 失败:', error)
      }
    },

    // 从 localStorage 加载语言列表
    loadLanguagesFromLocal() {
      try {
        const saved = localStorage.getItem('supportedLanguages')
        if (saved) {
          const parsed = JSON.parse(saved)
          // 确保至少有一个语言
          if (parsed && parsed.length > 0) {
            this.supportedLanguages = parsed
            console.log('从 localStorage 加载语言列表:', parsed.length, '个语言')
          }
        }
      } catch (error) {
        console.warn('从 localStorage 加载语言列表失败:', error)
      }
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

    // 数学概念管理（用于 MathTable 组件）
    async addMathConcept(mathConcept) {
      if (!this.isOnline) {
        throw new Error('需要网络连接才能添加数据')
      }

      try {
        console.log('添加数学概念到云端:', mathConcept)
        const cloudConcept = await dataService.addData('mathConcepts', mathConcept, 'math')
        console.log('数学概念添加成功:', cloudConcept)
        // 数据会通过实时监听自动更新
        return cloudConcept
      } catch (error) {
        console.error('同步数学概念到云端失败:', error)
        throw error
      }
    },

    async updateMathConcept(id, mathConceptData) {
      if (!this.isOnline) {
        throw new Error('需要网络连接才能更新数据')
      }

      try {
        console.log('更新数学概念:', id, mathConceptData)
        await dataService.updateData('mathConcepts', id, mathConceptData, 'math')
        console.log('数学概念更新成功')
        // 数据会通过实时监听自动更新
      } catch (error) {
        console.error('更新数学概念失败:', error)
        throw error
      }
    },

    async deleteMathConcept(id) {
      if (!this.isOnline) {
        throw new Error('需要网络连接才能删除数据')
      }

      try {
        console.log('从云端删除数学概念:', id)
        await dataService.deleteData('mathConcepts', id, 'math')
        console.log('数学概念删除成功')
        // 数据会通过实时监听自动更新
      } catch (error) {
        console.error('从云端删除数学概念失败:', error)
        throw error
      }
    },

    // 单独同步数学概念（不依赖当前语言）
    async syncMathConceptsFromCloud() {
      if (!this.isOnline) {
        console.log('未连接到云端，跳过数学概念同步')
        return
      }

      try {
        const mathConcepts = await dataService.getAllData('mathConcepts', 'math')
        this.mathConcepts = mathConcepts || []
      } catch (error) {
        console.error('同步数学概念失败:', error)
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

    // 复制指定用户的所有数据到当前用户
    async copyUserData(sourceUserId) {
      if (!this.isOnline) {
        throw new Error('需要网络连接才能迁移数据')
      }

      if (!sourceUserId || sourceUserId.trim() === '') {
        throw new Error('请输入源用户ID')
      }

      console.log('开始复制用户数据...')
      console.log('源用户ID:', sourceUserId)
      
      try {
        const result = await dataService.copyUserData(sourceUserId.trim(), this.currentLanguage)
        console.log('数据复制完成:', result)
        
        // 复制完成后，重新同步数据
        await this.syncFromCloud()
        
        return result
      } catch (error) {
        console.error('复制数据失败:', error)
        throw error
      }
    },

    // 获取数据迁移信息（兼容旧接口）
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

    // 迁移现有单词，添加空的情景字段
    async migrateWordsAddContext() {
      if (!this.isOnline) {
        throw new Error('需要网络连接才能迁移数据')
      }

      console.log('开始迁移单词，添加情景字段...')
      try {
        let migratedCount = 0
        let skippedCount = 0

        for (const word of this.words) {
          // 如果单词没有 context 字段，或者 context 为 undefined/null，则添加空字符串
          if (word.context === undefined || word.context === null) {
            try {
              await dataService.updateData('words', word.id, {
                context: ''
              }, this.currentLanguage)
              migratedCount++
              console.log(`单词迁移成功: ${word.japanese} (ID: ${word.id})`)
            } catch (error) {
              console.warn(`单词迁移失败: ${word.japanese}`, error)
            }
          } else {
            skippedCount++
          }
        }

        console.log(`迁移完成: ${migratedCount} 个单词已更新, ${skippedCount} 个单词已跳过`)
        return {
          migrated: migratedCount,
          skipped: skippedCount,
          total: this.words.length
        }
      } catch (error) {
        console.error('迁移失败:', error)
        throw error
      }
    },

    // 导出当前数据为JSON（用于手动迁移）- 支持所有语言
    async exportCurrentData() {
      if (!this.isOnline) {
        throw new Error('需要网络连接才能导出数据')
      }

      console.log('导出所有语言的数据...')
      console.log('支持的语言列表:', this.supportedLanguages.map(l => `${l.name}(${l.code})`).join(', '))
      
      try {
        // 获取所有语言的数据
        const allLanguagesData = {}
        const languageStats = {}
        
        // 使用 Promise.allSettled 确保即使某个语言失败，其他语言也能继续
        const languagePromises = this.supportedLanguages.map(async (lang) => {
          try {
            console.log(`\n========== 开始导出 ${lang.name} (${lang.code}) ==========`)
            
            // 分别获取每个类型的数据，使用 Promise.allSettled 确保部分失败不影响其他
            const [wordsResult, sentencesResult, qaResult] = await Promise.allSettled([
              dataService.getAllData('words', lang.code),
              dataService.getAllData('sentences', lang.code),
              dataService.getAllData('qa', lang.code)
            ])
            
            const words = wordsResult.status === 'fulfilled' ? wordsResult.value : []
            const sentences = sentencesResult.status === 'fulfilled' ? sentencesResult.value : []
            const qa = qaResult.status === 'fulfilled' ? qaResult.value : []
            
            if (wordsResult.status === 'rejected') {
              console.warn(`获取 ${lang.name} 单词失败:`, wordsResult.reason)
            }
            if (sentencesResult.status === 'rejected') {
              console.warn(`获取 ${lang.name} 句子失败:`, sentencesResult.reason)
            }
            if (qaResult.status === 'rejected') {
              console.warn(`获取 ${lang.name} 问答失败:`, qaResult.reason)
            }
            
            allLanguagesData[lang.code] = {
              words: Array.isArray(words) ? words : [],
              sentences: Array.isArray(sentences) ? sentences : [],
              qa: Array.isArray(qa) ? qa : []
            }
            
            languageStats[lang.code] = {
              words: allLanguagesData[lang.code].words.length,
              sentences: allLanguagesData[lang.code].sentences.length,
              qa: allLanguagesData[lang.code].qa.length
            }
            
            console.log(`✅ ${lang.name} (${lang.code}) 导出完成:`, {
              words: languageStats[lang.code].words,
              sentences: languageStats[lang.code].sentences,
              qa: languageStats[lang.code].qa
            })
            console.log(`========== ${lang.name} 导出结束 ==========\n`)
            
            return { lang: lang.code, success: true, stats: languageStats[lang.code] }
          } catch (error) {
            console.error(`❌ 导出 ${lang.name} (${lang.code}) 时发生异常:`, error)
            console.error('错误详情:', {
              message: error.message,
              stack: error.stack,
              code: error.code
            })
            
            // 即使出错也包含该语言（空数据）
            allLanguagesData[lang.code] = {
              words: [],
              sentences: [],
              qa: []
            }
            languageStats[lang.code] = {
              words: 0,
              sentences: 0,
              qa: 0
            }
            
            return { lang: lang.code, success: false, error: error.message }
          }
        })
        
        // 等待所有语言的数据获取完成
        const results = await Promise.all(languagePromises)
        
        console.log('\n========== 所有语言导出汇总 ==========')
        results.forEach(result => {
          if (result.success) {
            console.log(`✅ ${result.lang}:`, result.stats)
          } else {
            console.log(`❌ ${result.lang}: 导出失败 - ${result.error}`)
          }
        })
        console.log('=====================================\n')
        
        // 验证所有语言是否都已包含
        console.log('验证导出数据:', {
          languagesCount: Object.keys(allLanguagesData).length,
          languagesKeys: Object.keys(allLanguagesData),
          expectedLanguages: this.supportedLanguages.map(l => l.code),
          allIncluded: this.supportedLanguages.every(l => allLanguagesData.hasOwnProperty(l.code))
        })
        
        // 从 reviewProgress 中分离出熟记区和集中复习区的数据
        const masteredItems = {
          words: [],
          sentences: [],
          qa: []
        }
        
        const incorrectItems = {
          words: [],
          sentences: [],
          qa: []
        }
        
        // 提取熟记区的项目（需要从所有语言中查找）
        Object.keys(this.reviewProgress).forEach(key => {
          if (key.startsWith('mastered_word_')) {
            const id = key.replace('mastered_word_', '')
            // 在所有语言中查找
            for (const langCode of Object.keys(allLanguagesData)) {
              const word = allLanguagesData[langCode].words.find(w => w.id === id)
              if (word) {
                masteredItems.words.push({
                  id: word.id,
                  language: langCode,
                  japanese: word.japanese,
                  chinese: word.chinese,
                  context: word.context || ''
                })
                break
              }
            }
          } else if (key.startsWith('mastered_sentence_')) {
            const id = key.replace('mastered_sentence_', '')
            for (const langCode of Object.keys(allLanguagesData)) {
              const sentence = allLanguagesData[langCode].sentences.find(s => s.id === id)
              if (sentence) {
                masteredItems.sentences.push({
                  id: sentence.id,
                  language: langCode,
                  japanese: sentence.japanese,
                  chinese: sentence.chinese,
                  context: sentence.context || ''
                })
                break
              }
            }
          } else if (key.startsWith('mastered_qa_')) {
            const id = key.replace('mastered_qa_', '')
            for (const langCode of Object.keys(allLanguagesData)) {
              const qa = allLanguagesData[langCode].qa.find(q => q.id === id)
              if (qa) {
                masteredItems.qa.push({
                  id: qa.id,
                  language: langCode,
                  question: qa.question,
                  answer: qa.answer
                })
                break
              }
            }
          }
        })
        
        // 提取集中复习区的项目
        Object.keys(this.reviewProgress).forEach(key => {
          if (key.startsWith('incorrect_word_')) {
            const id = key.replace('incorrect_word_', '')
            for (const langCode of Object.keys(allLanguagesData)) {
              const word = allLanguagesData[langCode].words.find(w => w.id === id)
              if (word) {
                incorrectItems.words.push({
                  id: word.id,
                  language: langCode,
                  japanese: word.japanese,
                  chinese: word.chinese,
                  context: word.context || ''
                })
                break
              }
            }
          } else if (key.startsWith('incorrect_sentence_')) {
            const id = key.replace('incorrect_sentence_', '')
            for (const langCode of Object.keys(allLanguagesData)) {
              const sentence = allLanguagesData[langCode].sentences.find(s => s.id === id)
              if (sentence) {
                incorrectItems.sentences.push({
                  id: sentence.id,
                  language: langCode,
                  japanese: sentence.japanese,
                  chinese: sentence.chinese,
                  context: sentence.context || ''
                })
                break
              }
            }
          } else if (key.startsWith('incorrect_qa_')) {
            const id = key.replace('incorrect_qa_', '')
            for (const langCode of Object.keys(allLanguagesData)) {
              const qa = allLanguagesData[langCode].qa.find(q => q.id === id)
              if (qa) {
                incorrectItems.qa.push({
                  id: qa.id,
                  language: langCode,
                  question: qa.question,
                  answer: qa.answer
                })
                break
              }
            }
          }
        })
        
        // 最终验证：确保所有支持的语言都在导出数据中
        const finalLanguagesData = {}
        for (const lang of this.supportedLanguages) {
          if (allLanguagesData[lang.code]) {
            finalLanguagesData[lang.code] = allLanguagesData[lang.code]
          } else {
            console.warn(`警告：语言 ${lang.code} 的数据未获取，使用空数据`)
            finalLanguagesData[lang.code] = {
              words: [],
              sentences: [],
              qa: []
            }
          }
        }
        
        // 导出所有语言的分类数据
        const categoriesData = {}
        for (const lang of this.supportedLanguages) {
          // 从 localStorage 或 state 中获取分类数据
          const localCategories = localStorage.getItem(`wordCategories_${lang.code}`)
          if (localCategories) {
            try {
              categoriesData[lang.code] = JSON.parse(localCategories)
            } catch (e) {
              console.warn(`解析 ${lang.code} 分类数据失败:`, e)
              categoriesData[lang.code] = this.wordCategories[lang.code] || []
            }
          } else {
            categoriesData[lang.code] = this.wordCategories[lang.code] || []
          }
        }
        
        const currentData = {
          // 所有语言的数据（确保包含所有支持的语言）
          languages: finalLanguagesData,
          // 所有语言的分类数据
          wordCategories: categoriesData,
          // 语言统计信息
          languageStats: languageStats,
          // 支持的语言列表
          supportedLanguages: this.supportedLanguages,
          reviewProgress: this.reviewProgress, // 完整的复习进度（包含所有时间戳和标记）
          // 熟记区数据（已熟记的项目）
          masteredItems: masteredItems,
          // 集中复习区数据（没记住的项目）
          incorrectItems: incorrectItems,
          exportTime: new Date().toISOString(),
          userId: authService.getUserId(),
          exportVersion: '3.1', // 版本号，用于标识支持分类数据的导出格式
          exportNote: '此导出包含所有语言的完整数据、分类树结构，以及分离的熟记区和集中复习区数据'
        }
        
        // 最终验证导出数据
        console.log('\n========== 最终导出数据验证 ==========')
        console.log('包含的语言:', Object.keys(currentData.languages))
        console.log('语言数据统计:', Object.keys(currentData.languages).map(lang => ({
          lang,
          words: currentData.languages[lang].words.length,
          sentences: currentData.languages[lang].sentences.length,
          qa: currentData.languages[lang].qa.length
        })))
        console.log('=====================================\n')
        
        const jsonData = JSON.stringify(currentData, null, 2)
        
        // 使用 TextEncoder 确保 UTF-8 编码，解决 iPad Chrome 上的字符编码问题
        const encoder = new TextEncoder()
        const utf8Data = encoder.encode(jsonData)
        
        // 创建下载链接，明确指定 UTF-8 编码
        const blob = new Blob([utf8Data], { type: 'application/json;charset=utf-8' })
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
      // 从 reviewProgress 中分离出熟记区和集中复习区的数据
      const masteredItems = {
        words: [],
        sentences: [],
        qa: []
      }
      
      const incorrectItems = {
        words: [],
        sentences: [],
        qa: []
      }
      
      // 提取熟记区的项目
      Object.keys(this.reviewProgress).forEach(key => {
        if (key.startsWith('mastered_word_')) {
          const id = key.replace('mastered_word_', '')
          const word = this.words.find(w => w.id === id)
          if (word) {
            masteredItems.words.push({
              id: word.id,
              japanese: word.japanese,
              chinese: word.chinese,
              context: word.context || ''
            })
          }
        } else if (key.startsWith('mastered_sentence_')) {
          const id = key.replace('mastered_sentence_', '')
          const sentence = this.sentences.find(s => s.id === id)
          if (sentence) {
            masteredItems.sentences.push({
              id: sentence.id,
              japanese: sentence.japanese,
              chinese: sentence.chinese,
              context: sentence.context || ''
            })
          }
        } else if (key.startsWith('mastered_qa_')) {
          const id = key.replace('mastered_qa_', '')
          const qa = this.qa.find(q => q.id === id)
          if (qa) {
            masteredItems.qa.push({
              id: qa.id,
              question: qa.question,
              answer: qa.answer
            })
          }
        }
      })
      
      // 提取集中复习区的项目
      Object.keys(this.reviewProgress).forEach(key => {
        if (key.startsWith('incorrect_word_')) {
          const id = key.replace('incorrect_word_', '')
          const word = this.words.find(w => w.id === id)
          if (word) {
            incorrectItems.words.push({
              id: word.id,
              japanese: word.japanese,
              chinese: word.chinese,
              context: word.context || ''
            })
          }
        } else if (key.startsWith('incorrect_sentence_')) {
          const id = key.replace('incorrect_sentence_', '')
          const sentence = this.sentences.find(s => s.id === id)
          if (sentence) {
            incorrectItems.sentences.push({
              id: sentence.id,
              japanese: sentence.japanese,
              chinese: sentence.chinese,
              context: sentence.context || ''
            })
          }
        } else if (key.startsWith('incorrect_qa_')) {
          const id = key.replace('incorrect_qa_', '')
          const qa = this.qa.find(q => q.id === id)
          if (qa) {
            incorrectItems.qa.push({
              id: qa.id,
              question: qa.question,
              answer: qa.answer
            })
          }
        }
      })
      
      // 导出当前语言的分类数据
      const currentLangCategories = this.wordCategories[this.currentLanguage] || []
      const localCategories = localStorage.getItem(`wordCategories_${this.currentLanguage}`)
      let categoriesToExport = currentLangCategories
      if (localCategories) {
        try {
          categoriesToExport = JSON.parse(localCategories)
        } catch (e) {
          console.warn('解析本地分类数据失败，使用 state 中的数据')
        }
      }
      
      const allData = {
        words: this.words,
        sentences: this.sentences,
        qa: this.qa,
        // 当前语言的分类数据
        wordCategories: {
          [this.currentLanguage]: categoriesToExport
        },
        reviewProgress: this.reviewProgress, // 完整的复习进度（包含所有时间戳和标记）
        // 熟记区数据（已熟记的项目）
        masteredItems: masteredItems,
        // 集中复习区数据（没记住的项目）
        incorrectItems: incorrectItems,
        quizHistory: this.quizHistory,
        exportDate: new Date().toISOString(),
        exportVersion: '2.1', // 版本号，用于标识支持分类数据的导出格式
        exportNote: '此导出包含完整的复习进度数据、分类树结构，以及分离的熟记区和集中复习区数据'
      }
      return JSON.stringify(allData, null, 2)
    },

    // 导入数据（支持所有语言）
    async importData(jsonData) {
      try {
        const data = JSON.parse(jsonData)
        
        // 检查用户是否已登录
        if (!this.isOnline) {
          throw new Error('需要登录后才能导入数据')
        }
        
        console.log('开始导入数据到云端...')
        
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
        
        // 检查是否是新格式（包含 languages 字段）
        if (data.languages && typeof data.languages === 'object') {
          // 新格式：支持多语言
          console.log('检测到多语言格式，开始导入所有语言的数据...')
          
          const importStats = {}
          
          // 导入每个语言的数据
          for (const langCode of Object.keys(data.languages)) {
            const langData = data.languages[langCode]
            importStats[langCode] = {
              words: 0,
              sentences: 0,
              qa: 0,
              skipped: { words: 0, sentences: 0, qa: 0 }
            }
            
            console.log(`导入 ${langCode} 语言的数据...`)
            
            // 导入单词
            if (langData.words && langData.words.length > 0) {
              const processedWords = processTimestamps(langData.words)
              for (const word of processedWords) {
                try {
                  // 临时切换语言以检查重复
                  const originalLang = this.currentLanguage
                  this.currentLanguage = langCode
                  const isDuplicate = this.isWordDuplicate(word)
                  this.currentLanguage = originalLang
                  
                  if (!isDuplicate) {
                    await dataService.addData('words', {
                      japanese: word.japanese,
                      chinese: word.chinese,
                      context: word.context || ''
                    }, langCode)
                    importStats[langCode].words++
                    console.log(`[${langCode}] 单词导入成功:`, word.japanese)
                  } else {
                    importStats[langCode].skipped.words++
                    console.log(`[${langCode}] 跳过重复单词:`, word.japanese)
                  }
                } catch (error) {
                  console.warn(`[${langCode}] 单词导入失败:`, word, error)
                }
              }
            }
            
            // 导入句子
            if (langData.sentences && langData.sentences.length > 0) {
              const processedSentences = processTimestamps(langData.sentences)
              for (const sentence of processedSentences) {
                try {
                  const originalLang = this.currentLanguage
                  this.currentLanguage = langCode
                  const isDuplicate = this.isSentenceDuplicate(sentence)
                  this.currentLanguage = originalLang
                  
                  if (!isDuplicate) {
                    await dataService.addData('sentences', {
                      japanese: sentence.japanese,
                      chinese: sentence.chinese,
                      context: sentence.context || ''
                    }, langCode)
                    importStats[langCode].sentences++
                    console.log(`[${langCode}] 句子导入成功:`, sentence.japanese)
                  } else {
                    importStats[langCode].skipped.sentences++
                    console.log(`[${langCode}] 跳过重复句子:`, sentence.japanese)
                  }
                } catch (error) {
                  console.warn(`[${langCode}] 句子导入失败:`, sentence, error)
                }
              }
            }
            
            // 导入问答
            if (langData.qa && langData.qa.length > 0) {
              const processedQA = processTimestamps(langData.qa)
              for (const qa of processedQA) {
                try {
                  const originalLang = this.currentLanguage
                  this.currentLanguage = langCode
                  const isDuplicate = this.isQADuplicate(qa)
                  this.currentLanguage = originalLang
                  
                  if (!isDuplicate) {
                    await dataService.addData('qa', {
                      question: qa.question,
                      answer: qa.answer
                    }, langCode)
                    importStats[langCode].qa++
                    console.log(`[${langCode}] 问答导入成功:`, qa.question)
                  } else {
                    importStats[langCode].skipped.qa++
                    console.log(`[${langCode}] 跳过重复问答:`, qa.question)
                  }
                } catch (error) {
                  console.warn(`[${langCode}] 问答导入失败:`, qa, error)
                }
              }
            }
            
            console.log(`${langCode} 语言导入完成:`, importStats[langCode])
          }
          
          // 导入分类数据
          if (data.wordCategories && typeof data.wordCategories === 'object') {
            console.log('检测到分类数据，开始导入所有语言的分类...')
            for (const langCode of Object.keys(data.wordCategories)) {
              try {
                const categories = data.wordCategories[langCode]
                if (Array.isArray(categories)) {
                  // 保存分类数据到 state 和 localStorage
                  this.wordCategories[langCode] = categories
                  localStorage.setItem(`wordCategories_${langCode}`, JSON.stringify(categories))
                  
                  // 如果在线，同步到云端
                  if (this.isOnline) {
                    await this.saveCategoriesToCloud(langCode)
                  }
                  
                  console.log(`✅ ${langCode} 分类导入成功:`, categories.length, '个分类')
                }
              } catch (error) {
                console.warn(`导入 ${langCode} 分类失败:`, error)
              }
            }
          } else {
            console.log('未检测到分类数据，跳过分类导入')
          }
          
          console.log('所有语言数据导入完成，统计:', importStats)
        } else {
          // 旧格式：单语言数据（向后兼容）
          console.log('检测到单语言格式，导入到当前语言:', this.currentLanguage)
          const targetLanguage = data.currentLanguage || this.currentLanguage
          
          // 导入单词数据
          if (data.words && data.words.length > 0) {
            console.log('导入单词数据:', data.words.length, '个')
            const processedWords = processTimestamps(data.words)
            
            for (const word of processedWords) {
              try {
                const wordLanguage = word.language || targetLanguage
                if (!this.isWordDuplicate(word)) {
                  await dataService.addData('words', {
                    japanese: word.japanese,
                    chinese: word.chinese,
                    context: word.context || ''
                  }, wordLanguage)
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
            
            for (const sentence of processedSentences) {
              try {
                const sentenceLanguage = sentence.language || targetLanguage
                if (!this.isSentenceDuplicate(sentence)) {
                  await dataService.addData('sentences', {
                    japanese: sentence.japanese,
                    chinese: sentence.chinese,
                    context: sentence.context || ''
                  }, sentenceLanguage)
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
            
            for (const qa of processedQA) {
              try {
                const qaLanguage = qa.language || targetLanguage
                if (!this.isQADuplicate(qa)) {
                  await dataService.addData('qa', {
                    question: qa.question,
                    answer: qa.answer
                  }, qaLanguage)
                  console.log('问答导入成功:', qa.question)
                } else {
                  console.log('跳过重复问答:', qa.question)
                }
              } catch (error) {
                console.warn('问答导入失败:', qa, error)
              }
            }
          }
          
          // 导入分类数据（旧格式也支持）
          if (data.wordCategories && typeof data.wordCategories === 'object') {
            console.log('检测到分类数据，开始导入分类...')
            for (const langCode of Object.keys(data.wordCategories)) {
              try {
                const categories = data.wordCategories[langCode]
                if (Array.isArray(categories)) {
                  // 保存分类数据到 state 和 localStorage
                  this.wordCategories[langCode] = categories
                  localStorage.setItem(`wordCategories_${langCode}`, JSON.stringify(categories))
                  
                  // 如果在线，同步到云端
                  if (this.isOnline) {
                    await this.saveCategoriesToCloud(langCode)
                  }
                  
                  console.log(`✅ ${langCode} 分类导入成功:`, categories.length, '个分类')
                }
              } catch (error) {
                console.warn(`导入 ${langCode} 分类失败:`, error)
              }
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
        return true
      } catch (error) {
        console.error('导入数据失败:', error)
        throw error
      }
    },

    // 分类管理方法
    // 初始化分类树（如果不存在）
    initCategoryTree(language) {
      if (!this.wordCategories[language]) {
        this.wordCategories[language] = []
      }
    },

    // 获取分类树
    getCategoryTree(language) {
      this.initCategoryTree(language)
      return this.wordCategories[language] || []
    },

    // 添加分类
    addCategory(language, parentPath, categoryName) {
      this.initCategoryTree(language)
      const newCategory = {
        id: `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: categoryName,
        children: []
      }

      if (!parentPath || parentPath.length === 0) {
        // 根分类
        this.wordCategories[language].push(newCategory)
      } else {
        // 找到父分类并添加
        const parent = this.findCategoryByPath(language, parentPath)
        if (parent) {
          parent.children.push(newCategory)
        } else {
          throw new Error('找不到父分类')
        }
      }

      // 保存到云端
      this.saveCategoriesToCloud(language)
      return newCategory
    },

    // 根据路径查找分类
    findCategoryByPath(language, path) {
      this.initCategoryTree(language)
      if (!path || path.length === 0) {
        return null
      }

      let current = this.wordCategories[language]
      for (let i = 0; i < path.length; i++) {
        const categoryName = path[i]
        const found = current.find(cat => cat.name === categoryName)
        if (!found) {
          return null
        }
        if (i === path.length - 1) {
          return found
        }
        current = found.children
      }
      return null
    },

    // 更新分类名称
    async updateCategoryName(language, categoryPath, newName) {
      const category = this.findCategoryByPath(language, categoryPath)
      if (category) {
        const oldName = category.name
        category.name = newName
        
        // 同时更新所有使用该分类路径的单词
        const updatePromises = []
        this.words.forEach(word => {
          if (word.categoryPath && word.categoryPath.length >= categoryPath.length) {
            let match = true
            for (let i = 0; i < categoryPath.length; i++) {
              if (word.categoryPath[i] !== categoryPath[i]) {
                match = false
                break
              }
            }
            if (match) {
              // 更新路径中对应的分类名称
              const newPath = [...word.categoryPath]
              newPath[categoryPath.length - 1] = newName
              updatePromises.push(this.updateWord(word.id, { categoryPath: newPath }))
            }
          }
        })
        
        // 等待所有单词更新完成
        await Promise.all(updatePromises)
        await this.saveCategoriesToCloud(language)
      }
    },

    // 删除分类
    deleteCategory(language, categoryPath) {
      if (categoryPath.length === 0) {
        throw new Error('不能删除根分类')
      }

      const parentPath = categoryPath.slice(0, -1)
      const categoryName = categoryPath[categoryPath.length - 1]
      const parent = parentPath.length === 0 
        ? { children: this.wordCategories[language] }
        : this.findCategoryByPath(language, parentPath)

      if (parent && parent.children) {
        const index = parent.children.findIndex(cat => cat.name === categoryName)
        if (index !== -1) {
          parent.children.splice(index, 1)
          // 将属于该分类的单词移到未分类
          this.words.forEach(word => {
            if (word.categoryPath && this.isPathPrefix(word.categoryPath, categoryPath)) {
              this.updateWord(word.id, { categoryPath: [] })
            }
          })
          this.saveCategoriesToCloud(language)
        }
      }
    },

    // 检查路径前缀
    isPathPrefix(path, prefix) {
      if (path.length < prefix.length) return false
      for (let i = 0; i < prefix.length; i++) {
        if (path[i] !== prefix[i]) return false
      }
      return true
    },

    // 保存分类到云端
    async saveCategoriesToCloud(language) {
      // 总是保存到 localStorage 作为备份
      localStorage.setItem(`wordCategories_${language}`, JSON.stringify(this.wordCategories[language] || []))
      
      if (!this.isOnline) {
        return
      }

      try {
        // 使用 setDoc 直接保存到特殊集合
        const { doc, setDoc } = await import('firebase/firestore')
        const { db } = await import('../firebase/config.js')
        const categoryDocRef = doc(db, `users/${getDataOwnerId()}/wordCategories/${language}`)
        await setDoc(categoryDocRef, {
          categories: this.wordCategories[language] || [],
          updatedAt: new Date()
        }, { merge: true })
      } catch (error) {
        console.error('保存分类到云端失败:', error)
      }
    },

    // 从云端加载分类
    async loadCategoriesFromCloud(language) {
      // 先从 localStorage 加载（快速响应）
      const localData = localStorage.getItem(`wordCategories_${language}`)
      if (localData) {
        try {
          this.wordCategories[language] = JSON.parse(localData)
        } catch (e) {
          console.error('解析本地分类数据失败:', e)
        }
      }
      
      if (!this.isOnline) {
        return
      }

      try {
        // 从云端加载
        const { doc, getDoc } = await import('firebase/firestore')
        const { db } = await import('../firebase/config.js')
        const categoryDocRef = doc(db, `users/${getDataOwnerId()}/wordCategories/${language}`)
        const docSnap = await getDoc(categoryDocRef)
        if (docSnap.exists()) {
          const data = docSnap.data()
          if (data && data.categories) {
            this.wordCategories[language] = data.categories
            // 更新 localStorage
            localStorage.setItem(`wordCategories_${language}`, JSON.stringify(data.categories))
          }
        }
      } catch (error) {
        console.error('从云端加载分类失败:', error)
      }
    },

    // 移动单词到新分类
    async moveWordToCategory(wordId, newCategoryPath) {
      if (!this.isOnline) {
        throw new Error('需要网络连接才能更新数据')
      }

      try {
        await this.updateWord(wordId, { categoryPath: newCategoryPath || [] })
      } catch (error) {
        console.error('移动单词分类失败:', error)
        throw error
      }
    }
  }
})
