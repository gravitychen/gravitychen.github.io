import { 
  collection, 
  doc, 
  getDocs, 
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
    this.deviceUserId = null
    this.listeners = new Map()
  }

  // 设置设备用户ID
  setUserId(deviceUserId) {
    this.deviceUserId = deviceUserId
    console.log('设置设备用户ID:', deviceUserId)
  }

  // 获取用户数据集合引用
  getUserCollection(collectionName, languageCode = null) {
    if (!this.deviceUserId) {
      throw new Error('用户未认证')
    }
    // 如果指定了语言代码，使用多语言数据结构
    if (languageCode) {
      return collection(db, 'users', this.deviceUserId, 'languages', languageCode, collectionName)
    }
    // 使用用户ID作为数据路径（保持向后兼容）
    return collection(db, 'users', this.deviceUserId, collectionName)
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

  // 手动数据迁移（需要用户在Firebase控制台手动操作）
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
