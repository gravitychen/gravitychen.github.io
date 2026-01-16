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
      // 在登录前，尝试清除可能的旧状态，避免 sessionStorage 冲突
      // 这有助于解决多账号切换时的 sessionStorage 问题
      try {
        // 清除可能存在的旧认证状态
        if (typeof sessionStorage !== 'undefined') {
          // 只清除 Firebase 相关的 sessionStorage，保留其他数据
          const keysToRemove = []
          for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i)
            if (key && (key.includes('firebase') || key.includes('auth'))) {
              keysToRemove.push(key)
            }
          }
          keysToRemove.forEach(key => sessionStorage.removeItem(key))
        }
      } catch (e) {
        // sessionStorage 可能不可用（如隐私模式），忽略错误
        console.warn('无法访问 sessionStorage，继续登录流程:', e)
      }
      
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
      
      // 处理特定的 sessionStorage 错误
      if (error.code === 'auth/unauthorized-domain' || 
          error.message?.includes('missing initial state') ||
          error.message?.includes('sessionStorage')) {
        // 这是一个 sessionStorage 相关错误，提供更友好的错误信息
        const friendlyError = new Error(
          '登录失败：浏览器会话存储问题。\n\n' +
          '可能的原因：\n' +
          '1. 浏览器阻止了会话存储访问（如隐私模式）\n' +
          '2. 多个 Google 账号切换时会话状态丢失\n' +
          '3. 浏览器安全设置限制\n\n' +
          '解决方案：\n' +
          '1. 关闭隐私模式或允许会话存储\n' +
          '2. 清除浏览器缓存后重试\n' +
          '3. 尝试使用其他浏览器\n' +
          '4. 等待几秒后重试'
        )
        friendlyError.code = error.code || 'auth/session-storage-error'
        friendlyError.originalError = error
        throw friendlyError
      }
      
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
        // 用户未登录 - 但需要检查是否有 dataOwnerId（可能是手机端认证状态检测延迟）
        const existingOwnerId = getDataOwnerId()
        if (existingOwnerId) {
          // 如果有 dataOwnerId，说明用户之前已经登录过，可能是手机端认证状态检测延迟
          // 保留用户ID，不要清除，等待 Firebase 认证状态恢复
          console.log('Firebase认证状态为未登录，但检测到 dataOwnerId，保留用户ID:', existingOwnerId)
          console.log('这可能是手机端认证状态检测延迟，等待 Firebase 认证状态恢复')
          // 确保 dataService 的用户ID与 dataOwnerId 一致
          if (dataService.userId !== existingOwnerId) {
            console.log('恢复 dataService 用户ID:', existingOwnerId)
            dataService.setUserId(existingOwnerId)
          }
          // 不通知认证状态变化，保持当前状态
          return
        }
        
        // 确实没有 dataOwnerId，说明用户真的未登录
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
      // 清除 dataOwnerId，确保完全登出
      setDataOwnerId(null)
      this.notifyAuthStateChange(null)
      console.log('已退出登录')
    } catch (error) {
      console.error('登出失败:', error)
      throw error
    }
  }
}

export default new AuthService()
