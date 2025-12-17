import { 
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged 
} from 'firebase/auth'
import { auth } from './config.js'
import dataService from './dataService.js'
import { setDataOwnerId, getDataOwnerId } from '../utils/dataOwnerId.js'

class AuthService {
  constructor() {
    this.currentUser = null
    this.authStateListeners = []
    this.isInitialized = false
    this.googleProvider = new GoogleAuthProvider()
    
    // 设置认证状态监听
    this.setupAuthStateListener()
  }

  // 添加认证状态监听器
  onAuthStateChange(callback) {
    this.authStateListeners.push(callback)
    // 如果已经有用户登录，立即调用回调
    if (this.currentUser) {
      callback(this.currentUser)
    }
  }

  // 通知所有监听器认证状态变化
  notifyAuthStateChange(user) {
    this.authStateListeners.forEach(callback => callback(user))
  }

  // 使用 Google 登录
  async signInWithGoogle() {
    try {
      const result = await signInWithPopup(auth, this.googleProvider)
      console.log('Google 登录成功:', result.user)
      console.log('用户UID:', result.user.uid)
      console.log('用户邮箱:', result.user.email)
      console.log('用户显示名称:', result.user.displayName)
      
      this.currentUser = result.user
      // 使用 Firebase UID 作为数据存储的用户ID，并同步为 dataOwnerId
      const userId = result.user.uid
      console.log('设置数据服务用户ID:', userId)
      dataService.setUserId(userId)
      // 将本地 dataOwnerId 绑定为 Google UID，便于后续无登录访问同一份数据
      const beforeOwnerId = getDataOwnerId()
      const ok = setDataOwnerId(userId)
      console.log('同步 dataOwnerId 为 Google UID:', {
        beforeOwnerId,
        newOwnerId: userId,
        saved: ok
      })
      
      // 验证用户ID是否设置成功
      const verifyUserId = dataService.userId
      console.log('验证：数据服务当前用户ID:', verifyUserId)
      
      this.notifyAuthStateChange(result.user)
      return result.user
    } catch (error) {
      console.error('Google 登录失败:', error)
      throw error
    }
  }

  // 监听Firebase认证状态变化
  setupAuthStateListener() {
    onAuthStateChanged(auth, (user) => {
      console.log('Firebase认证状态变化:', user ? '已登录' : '未登录')
      
      if (user) {
        // 用户已登录，更新状态
        console.log('用户信息:', {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          providerId: user.providerId
        })
        
        this.currentUser = user
        // 使用 Firebase UID 作为数据存储的用户ID，并同步为 dataOwnerId
        const userId = user.uid
        console.log('设置数据服务用户ID（从认证状态监听）:', userId)
        dataService.setUserId(userId)
        // 将本地 dataOwnerId 绑定为 Google UID，便于后续无登录访问同一份数据
        const beforeOwnerId = getDataOwnerId()
        const ok = setDataOwnerId(userId)
        console.log('同步 dataOwnerId 为 Google UID（从认证状态监听）:', {
          beforeOwnerId,
          newOwnerId: userId,
          saved: ok
        })
        
        // 验证用户ID是否设置成功
        const verifyUserId = dataService.userId
        console.log('验证：数据服务当前用户ID（从认证状态监听）:', verifyUserId)
        
        this.notifyAuthStateChange(user)
      } else {
        // 用户未登录
        console.log('用户已登出，清除数据服务用户ID')
        this.currentUser = null
        dataService.setUserId(null)
        dataService.stopAllListeners()
        this.notifyAuthStateChange(null)
      }
    })
  }

  // 获取当前用户
  getCurrentUser() {
    return this.currentUser
  }

  // 检查是否已登录
  isLoggedIn() {
    return !!this.currentUser
  }

  // 获取当前用户ID（Firebase UID）
  getUserId() {
    return this.currentUser?.uid || null
  }

  // 手动登出
  async signOut() {
    try {
      await signOut(auth)
      this.currentUser = null
      dataService.setUserId(null)
      dataService.stopAllListeners()
      this.notifyAuthStateChange(null)
      console.log('已退出登录')
    } catch (error) {
      console.error('登出失败:', error)
      throw error
    }
  }
}

export default new AuthService()
