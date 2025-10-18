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
  getUserCollection(collectionName) {
    if (!this.deviceUserId) {
      throw new Error('用户未认证')
    }
    // 使用用户ID作为数据路径
    return collection(db, 'users', this.deviceUserId, collectionName)
  }

  // 添加数据
  async addData(collectionName, data) {
    const userCollection = this.getUserCollection(collectionName)
    const dataWithTimestamp = {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }
    const docRef = await addDoc(userCollection, dataWithTimestamp)
    return { id: docRef.id, ...dataWithTimestamp }
  }

  // 更新数据
  async updateData(collectionName, id, data) {
    const userCollection = this.getUserCollection(collectionName)
    const docRef = doc(userCollection, id)
    const dataWithTimestamp = {
      ...data,
      updatedAt: serverTimestamp()
    }
    await setDoc(docRef, dataWithTimestamp, { merge: true })
    return dataWithTimestamp
  }

  // 删除数据
  async deleteData(collectionName, id) {
    const userCollection = this.getUserCollection(collectionName)
    const docRef = doc(userCollection, id)
    await deleteDoc(docRef)
  }

  // 获取所有数据
  async getAllData(collectionName) {
    const userCollection = this.getUserCollection(collectionName)
    const q = query(userCollection, orderBy('createdAt', 'desc'))
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  }

  // 监听数据变化（实时同步）
  listenToData(collectionName, callback) {
    if (this.listeners.has(collectionName)) {
      this.listeners.get(collectionName)() // 取消之前的监听
    }

    const userCollection = this.getUserCollection(collectionName)
    const q = query(userCollection, orderBy('createdAt', 'desc'))
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      callback(data)
    })

    this.listeners.set(collectionName, unsubscribe)
    return unsubscribe
  }

  // 停止所有监听
  stopAllListeners() {
    this.listeners.forEach(unsubscribe => unsubscribe())
    this.listeners.clear()
  }

  // 批量导入数据（用于从本地存储迁移）
  async importData(collectionName, dataArray) {
    const userCollection = this.getUserCollection(collectionName)
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
