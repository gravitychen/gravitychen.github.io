import { 
  signInAnonymously, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged 
} from 'firebase/auth'
import { auth } from './config.js'
import dataService from './dataService.js'

class AuthService {
  constructor() {
    this.currentUser = null
    this.authStateListeners = []
    
    // 监听认证状态变化
    onAuthStateChanged(auth, (user) => {
      this.currentUser = user
      if (user) {
        dataService.setUserId(user.uid)
        this.notifyAuthStateChange(user)
      } else {
        dataService.setUserId(null)
        dataService.stopAllListeners()
        this.notifyAuthStateChange(null)
      }
    })
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

  // 匿名登录（最简单的方式）
  async signInAnonymously() {
    try {
      const result = await signInAnonymously(auth)
      return result.user
    } catch (error) {
      console.error('匿名登录失败:', error)
      throw error
    }
  }

  // 邮箱密码登录
  async signInWithEmail(email, password) {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password)
      return result.user
    } catch (error) {
      console.error('邮箱登录失败:', error)
      throw error
    }
  }

  // 邮箱密码注册
  async signUpWithEmail(email, password) {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password)
      return result.user
    } catch (error) {
      console.error('邮箱注册失败:', error)
      throw error
    }
  }

  // 登出
  async signOut() {
    try {
      await signOut(auth)
    } catch (error) {
      console.error('登出失败:', error)
      throw error
    }
  }

  // 获取当前用户
  getCurrentUser() {
    return this.currentUser
  }

  // 检查是否已登录
  isLoggedIn() {
    return !!this.currentUser
  }
}

export default new AuthService()
