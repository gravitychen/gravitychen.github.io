import { 
  collection, 
  doc, 
  getDocs, 
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

  // 设置当前用户ID
  setUserId(userId) {
    this.userId = userId
  }

  // 获取用户数据集合引用
  getUserCollection(collectionName) {
    if (!this.userId) {
      throw new Error('用户未登录')
    }
    return collection(db, 'users', this.userId, collectionName)
  }

  // 添加数据
  async addData(collectionName, data) {
    const userCollection = this.getUserCollection(collectionName)
    const docRef = doc(userCollection)
    const dataWithTimestamp = {
      ...data,
      id: docRef.id,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }
    await setDoc(docRef, dataWithTimestamp)
    return dataWithTimestamp
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
}

export default new DataService()
