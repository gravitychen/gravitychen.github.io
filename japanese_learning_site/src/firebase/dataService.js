import { 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  addDoc,
  setDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  onSnapshot,
  serverTimestamp 
} from 'firebase/firestore'
import { db } from './config.js'

class DataService {
  constructor() {
    this.userId = null
    this.listeners = new Map()
  }

  // 设置用户ID（Firebase UID）
  setUserId(userId) {
    const oldUserId = this.userId
    this.userId = userId
    console.log('数据服务 - 设置用户ID:', {
      oldUserId: oldUserId,
      newUserId: userId,
      changed: oldUserId !== userId
    })
    
    // 如果用户ID发生变化，停止所有监听
    if (oldUserId && oldUserId !== userId) {
      console.log('用户ID已变化，停止之前的监听')
      this.stopAllListeners()
    }
  }

  // 获取用户数据集合引用
  getUserCollection(collectionName, languageCode = null) {
    if (!this.userId) {
      console.error('尝试获取用户数据集合，但用户ID未设置')
      throw new Error('用户未认证')
    }
    
    let collectionPath
    // 如果指定了语言代码，使用多语言数据结构
    if (languageCode) {
      collectionPath = `users/${this.userId}/languages/${languageCode}/${collectionName}`
      console.log('获取用户数据集合（多语言）:', collectionPath)
      return collection(db, 'users', this.userId, 'languages', languageCode, collectionName)
    }
    // 使用用户ID作为数据路径（保持向后兼容）
    collectionPath = `users/${this.userId}/${collectionName}`
    console.log('获取用户数据集合:', collectionPath)
    return collection(db, 'users', this.userId, collectionName)
  }

  // 获取用户文档引用（用于保存单一数据，如 reviewProgress）
  // 注意：Firestore 路径必须是偶数段（集合/文档/集合/文档...）
  // 所以 reviewProgress 应该作为用户文档的一个字段，而不是子文档
  getUserDoc() {
    if (!this.userId) {
      throw new Error('用户未认证')
    }
    // 返回用户文档：users/{userId}
    return doc(db, 'users', this.userId)
  }

  // 添加数据
  async addData(collectionName, data, languageCode = null) {
    const userCollection = this.getUserCollection(collectionName, languageCode)
    const dataWithTimestamp = {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }
    const docRef = await addDoc(userCollection, dataWithTimestamp)
    return { id: docRef.id, ...dataWithTimestamp }
  }

  // 更新数据
  async updateData(collectionName, id, data, languageCode = null) {
    const userCollection = this.getUserCollection(collectionName, languageCode)
    const docRef = doc(userCollection, id)
    const dataWithTimestamp = {
      ...data,
      updatedAt: serverTimestamp()
    }
    await setDoc(docRef, dataWithTimestamp, { merge: true })
    return dataWithTimestamp
  }

  // 删除数据
  async deleteData(collectionName, id, languageCode = null) {
    const userCollection = this.getUserCollection(collectionName, languageCode)
    const docRef = doc(userCollection, id)
    await deleteDoc(docRef)
  }

  // 获取所有数据
  async getAllData(collectionName, languageCode = null) {
    const userCollection = this.getUserCollection(collectionName, languageCode)
    const q = query(userCollection, orderBy('createdAt', 'desc'))
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => {
      const data = doc.data()
      // 处理Firebase Timestamp对象
      if (data.createdAt && typeof data.createdAt === 'object' && data.createdAt.seconds) {
        data.createdAt = new Date(data.createdAt.seconds * 1000).toISOString()
      }
      if (data.updatedAt && typeof data.updatedAt === 'object' && data.updatedAt.seconds) {
        data.updatedAt = new Date(data.updatedAt.seconds * 1000).toISOString()
      }
      return {
        id: doc.id,
        ...data
      }
    })
  }

  // 监听数据变化（实时同步）
  listenToData(collectionName, callback, languageCode = null) {
    const listenerKey = languageCode ? `${collectionName}_${languageCode}` : collectionName
    
    if (this.listeners.has(listenerKey)) {
      this.listeners.get(listenerKey)() // 取消之前的监听
    }

    const userCollection = this.getUserCollection(collectionName, languageCode)
    const q = query(userCollection, orderBy('createdAt', 'desc'))
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const data = querySnapshot.docs.map(doc => {
        const docData = doc.data()
        // 处理Firebase Timestamp对象
        if (docData.createdAt && typeof docData.createdAt === 'object' && docData.createdAt.seconds) {
          docData.createdAt = new Date(docData.createdAt.seconds * 1000).toISOString()
        }
        if (docData.updatedAt && typeof docData.updatedAt === 'object' && docData.updatedAt.seconds) {
          docData.updatedAt = new Date(docData.updatedAt.seconds * 1000).toISOString()
        }
        return {
          id: doc.id,
          ...docData
        }
      })
      callback(data)
    })

    this.listeners.set(listenerKey, unsubscribe)
    return unsubscribe
  }

  // 停止所有监听
  stopAllListeners() {
    this.listeners.forEach(unsubscribe => unsubscribe())
    this.listeners.clear()
  }

  // 批量导入数据（用于从本地存储迁移）
  async importData(collectionName, dataArray, languageCode = null) {
    const userCollection = this.getUserCollection(collectionName, languageCode)
    const batch = []
    
    for (const data of dataArray) {
      const docRef = doc(userCollection)
      const dataWithTimestamp = {
        ...data,
        id: docRef.id,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }
      batch.push(setDoc(docRef, dataWithTimestamp))
    }
    
    await Promise.all(batch)
  }

  // 获取当前用户的所有数据（用于数据迁移）
  async getCurrentUserAllData(collectionName) {
    if (!this.userId) {
      throw new Error('用户未登录')
    }
    
    // 只获取当前用户的数据
    const userCollection = this.getUserCollection(collectionName)
    const querySnapshot = await getDocs(userCollection)
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  }

  // 保存复习进度到云端
  // reviewProgress 作为用户文档的一个字段存储
  async saveReviewProgress(reviewProgress) {
    const timestamp = new Date().toISOString()
    const incorrectItemsCount = Object.keys(reviewProgress).filter(k => k.startsWith('incorrect_')).length
    const totalItemsCount = Object.keys(reviewProgress).length
    
    console.log(`[Firebase日志 ${timestamp}] 💾 saveReviewProgress 开始:`, {
      userId: this.userId,
      totalItems: totalItemsCount,
      incorrectItems: incorrectItemsCount,
      dataSize: JSON.stringify(reviewProgress).length
    })
    
    if (!this.userId) {
      const error = new Error('用户未认证')
      console.error(`[Firebase日志 ${timestamp}] ❌ 保存失败:`, error.message)
      throw error
    }
    
    try {
      // 使用用户文档，将 reviewProgress 作为字段存储
      const userDocRef = this.getUserDoc()
      const startTime = Date.now()
      
      await setDoc(userDocRef, {
        reviewProgress: reviewProgress,
        updatedAt: serverTimestamp()
      }, { merge: true })
      
      const duration = Date.now() - startTime
      console.log(`[Firebase日志 ${timestamp}] ✅ 复习进度已保存到 Firebase (耗时: ${duration}ms):`, {
        path: `users/${this.userId}`,
        field: 'reviewProgress',
        totalItems: totalItemsCount,
        incorrectItems: incorrectItemsCount,
        dataSize: JSON.stringify(reviewProgress).length
      })
    } catch (error) {
      console.error(`[Firebase日志 ${timestamp}] ❌ 保存复习进度到 Firebase 失败:`, {
        error: error.message,
        code: error.code,
        stack: error.stack,
        userId: this.userId,
        totalItems: totalItemsCount,
        incorrectItems: incorrectItemsCount
      })
      throw error
    }
  }

  // 从云端加载复习进度
  // reviewProgress 作为用户文档的一个字段读取
  async getReviewProgress() {
    const timestamp = new Date().toISOString()
    console.log(`[Firebase日志 ${timestamp}] 📥 getReviewProgress 开始:`, {
      userId: this.userId
    })
    
    if (!this.userId) {
      console.warn(`[Firebase日志 ${timestamp}] ⚠️ 用户未认证，返回空数据`)
      return {}
    }
    
    try {
      // 读取用户文档，获取 reviewProgress 字段
      const userDocRef = this.getUserDoc()
      const startTime = Date.now()
      const docSnap = await getDoc(userDocRef)
      const duration = Date.now() - startTime
      
      if (docSnap.exists()) {
        const data = docSnap.data()
        const reviewProgress = data.reviewProgress || {}
        const totalItems = Object.keys(reviewProgress).length
        const incorrectItems = Object.keys(reviewProgress).filter(k => k.startsWith('incorrect_')).length
        
        console.log(`[Firebase日志 ${timestamp}] ✅ 从 Firebase 加载复习进度成功 (耗时: ${duration}ms):`, {
          path: `users/${this.userId}`,
          field: 'reviewProgress',
          totalItems: totalItems,
          incorrectItems: incorrectItems,
          dataSize: JSON.stringify(reviewProgress).length,
          updatedAt: data.updatedAt ? (data.updatedAt.seconds ? new Date(data.updatedAt.seconds * 1000).toISOString() : data.updatedAt) : 'N/A'
        })
        return reviewProgress
      } else {
        console.log(`[Firebase日志 ${timestamp}] ℹ️ Firebase 云端没有用户文档:`, {
          path: `users/${this.userId}`,
          duration: duration + 'ms'
        })
        return {}
      }
    } catch (error) {
      console.error(`[Firebase日志 ${timestamp}] ❌ 从 Firebase 加载复习进度失败:`, {
        error: error.message,
        code: error.code,
        stack: error.stack,
        userId: this.userId
      })
      return {}
    }
  }

  // 获取指定用户的所有数据（用于数据迁移）
  async getUserAllData(sourceUserId, collectionName, languageCode = null) {
    if (!sourceUserId) {
      throw new Error('源用户ID不能为空')
    }
    
    // 构建用户数据集合路径
    let userCollection
    if (languageCode) {
      userCollection = collection(db, 'users', sourceUserId, 'languages', languageCode, collectionName)
    } else {
      userCollection = collection(db, 'users', sourceUserId, collectionName)
    }
    
    const querySnapshot = await getDocs(userCollection)
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data()
      // 处理Firebase Timestamp对象
      if (data.createdAt && typeof data.createdAt === 'object' && data.createdAt.seconds) {
        data.createdAt = new Date(data.createdAt.seconds * 1000).toISOString()
      }
      if (data.updatedAt && typeof data.updatedAt === 'object' && data.updatedAt.seconds) {
        data.updatedAt = new Date(data.updatedAt.seconds * 1000).toISOString()
      }
      return {
        id: doc.id,
        ...data
      }
    })
  }

  // 获取指定用户的复习进度
  async getUserReviewProgress(sourceUserId) {
    if (!sourceUserId) {
      throw new Error('源用户ID不能为空')
    }
    
    try {
      const userDocRef = doc(db, 'users', sourceUserId)
      const docSnap = await getDoc(userDocRef)
      
      if (docSnap.exists()) {
        const data = docSnap.data()
        return data.reviewProgress || {}
      }
      return {}
    } catch (error) {
      console.error('获取源用户复习进度失败:', error)
      return {}
    }
  }

  // 复制指定用户的所有数据到当前用户
  async copyUserData(sourceUserId, currentLanguage = 'ja') {
    if (!this.userId) {
      throw new Error('用户未登录')
    }
    
    if (!sourceUserId) {
      throw new Error('源用户ID不能为空')
    }
    
    if (sourceUserId === this.userId) {
      throw new Error('不能复制自己的数据')
    }

    console.log('开始复制数据...')
    console.log('源用户ID:', sourceUserId)
    console.log('目标用户ID:', this.userId)
    console.log('当前语言:', currentLanguage)
    
    try {
      // 获取源用户的所有数据（包括所有语言）
      const supportedLanguages = ['ja', 'en', 'hi', 'ko']
      const allData = {
        words: [],
        sentences: [],
        qa: [],
        reviewProgress: {}
      }
      
      // 获取所有语言的数据
      for (const lang of supportedLanguages) {
        try {
          const [words, sentences, qa] = await Promise.all([
            this.getUserAllData(sourceUserId, 'words', lang),
            this.getUserAllData(sourceUserId, 'sentences', lang),
            this.getUserAllData(sourceUserId, 'qa', lang)
          ])
          
          allData.words.push(...words.map(w => ({ ...w, _sourceLang: lang })))
          allData.sentences.push(...sentences.map(s => ({ ...s, _sourceLang: lang })))
          allData.qa.push(...qa.map(q => ({ ...q, _sourceLang: lang })))
          
          console.log(`获取 ${lang} 语言数据:`, {
            words: words.length,
            sentences: sentences.length,
            qa: qa.length
          })
        } catch (error) {
          console.warn(`获取 ${lang} 语言数据失败:`, error)
        }
      }
      
      // 获取复习进度
      allData.reviewProgress = await this.getUserReviewProgress(sourceUserId)
      
      console.log('源用户数据统计:', {
        words: allData.words.length,
        sentences: allData.sentences.length,
        qa: allData.qa.length,
        reviewProgressKeys: Object.keys(allData.reviewProgress).length
      })
      
      // 复制数据到当前用户
      let copiedCount = {
        words: 0,
        sentences: 0,
        qa: 0,
        skipped: {
          words: 0,
          sentences: 0,
          qa: 0
        }
      }
      
      // 按语言分组复制数据
      const dataByLang = {
        words: {},
        sentences: {},
        qa: {}
      }
      
      // 按语言分组
      allData.words.forEach(word => {
        const lang = word._sourceLang || currentLanguage
        if (!dataByLang.words[lang]) {
          dataByLang.words[lang] = []
        }
        dataByLang.words[lang].push(word)
      })
      
      allData.sentences.forEach(sentence => {
        const lang = sentence._sourceLang || currentLanguage
        if (!dataByLang.sentences[lang]) {
          dataByLang.sentences[lang] = []
        }
        dataByLang.sentences[lang].push(sentence)
      })
      
      allData.qa.forEach(qa => {
        const lang = qa._sourceLang || currentLanguage
        if (!dataByLang.qa[lang]) {
          dataByLang.qa[lang] = []
        }
        dataByLang.qa[lang].push(qa)
      })
      
      // 复制每个语言的数据
      for (const lang of Object.keys(dataByLang.words)) {
        // 复制单词
        for (const word of dataByLang.words[lang]) {
          try {
            const { id, _sourceLang, ...wordData } = word
            await this.addData('words', wordData, lang)
            copiedCount.words++
          } catch (error) {
            console.warn('复制单词失败:', word, error)
            copiedCount.skipped.words++
          }
        }
        
        // 复制句子
        for (const sentence of dataByLang.sentences[lang] || []) {
          try {
            const { id, _sourceLang, ...sentenceData } = sentence
            await this.addData('sentences', sentenceData, lang)
            copiedCount.sentences++
          } catch (error) {
            console.warn('复制句子失败:', sentence, error)
            copiedCount.skipped.sentences++
          }
        }
        
        // 复制问答
        for (const qa of dataByLang.qa[lang] || []) {
          try {
            const { id, _sourceLang, ...qaData } = qa
            await this.addData('qa', qaData, lang)
            copiedCount.qa++
          } catch (error) {
            console.warn('复制问答失败:', qa, error)
            copiedCount.skipped.qa++
          }
        }
      }
      
      // 合并复习进度
      if (Object.keys(allData.reviewProgress).length > 0) {
        try {
          const currentReviewProgress = await this.getReviewProgress()
          const mergedReviewProgress = {
            ...allData.reviewProgress,
            ...currentReviewProgress // 当前用户的进度优先
          }
          await this.saveReviewProgress(mergedReviewProgress)
          console.log('复习进度已合并')
        } catch (error) {
          console.warn('合并复习进度失败:', error)
        }
      }
      
      console.log('数据复制完成:', copiedCount)
      return {
        success: true,
        copied: copiedCount,
        source: {
          userId: sourceUserId,
          words: allData.words.length,
          sentences: allData.sentences.length,
          qa: allData.qa.length
        }
      }
    } catch (error) {
      console.error('复制数据失败:', error)
      throw error
    }
  }

  // 手动数据迁移（兼容旧接口）
  async manualDataMigration() {
    if (!this.userId) {
      throw new Error('用户未登录')
    }

    console.log('开始手动数据迁移...')
    console.log('当前用户ID:', this.userId)
    
    try {
      // 获取当前用户的数据
      const [currentWords, currentSentences, currentQA] = await Promise.all([
        this.getCurrentUserAllData('words'),
        this.getCurrentUserAllData('sentences'),
        this.getCurrentUserAllData('qa')
      ])

      console.log('当前用户数据:', {
        words: currentWords.length,
        sentences: currentSentences.length,
        qa: currentQA.length
      })

      // 返回迁移说明
      const migrationInfo = {
        currentUserId: this.userId,
        currentData: {
          words: currentWords.length,
          sentences: currentSentences.length,
          qa: currentQA.length
        },
        instructions: [
          '1. 打开Firebase控制台',
          '2. 进入Firestore Database',
          '3. 找到其他用户ID的数据',
          '4. 手动复制数据到当前用户ID下',
          '5. 删除其他用户ID的数据'
        ]
      }

      console.log('数据迁移信息:', migrationInfo)
      return migrationInfo
    } catch (error) {
      console.error('数据迁移失败:', error)
      throw error
    }
  }
}

export default new DataService()
