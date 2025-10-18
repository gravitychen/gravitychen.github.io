import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged 
} from 'firebase/auth'
import { auth } from './config.js'
import dataService from './dataService.js'
import deviceFingerprint from '../utils/deviceFingerprint.js'

class AuthService {
  constructor() {
    this.currentUser = null
    this.authStateListeners = []
    this.deviceUserId = null
    this.isInitialized = false
    
    // 延迟初始化
    setTimeout(() => this.initializeDeviceAuth(), 100)
  }

  // 初始化设备认证
  async initializeDeviceAuth() {
    if (this.isInitialized) return
    
    try {
      // 获取稳定的设备指纹
      const fingerprint = deviceFingerprint.generateFingerprint()
      this.deviceUserId = `device_${fingerprint}`
      
      console.log('设备指纹:', fingerprint)
      console.log('设备用户ID:', this.deviceUserId)
      
      // 尝试使用设备账户登录
      const result = await this.loginWithDevice()
      if (result) {
        console.log('设备认证成功')
      } else {
        console.log('设备认证失败，但系统继续运行')
      }
      
      this.isInitialized = true
    } catch (error) {
      console.error('设备认证初始化失败:', error)
      this.isInitialized = true // 即使失败也标记为已初始化，避免重复尝试
    }
  }

  // 使用设备账户登录
  async loginWithDevice() {
    try {
      const deviceEmail = `${this.deviceUserId}@device.local`
      const devicePassword = 'device123'
      
      console.log('尝试设备登录:', deviceEmail)
      
      try {
        // 尝试登录设备账户
        const result = await signInWithEmailAndPassword(auth, deviceEmail, devicePassword)
        console.log('设备登录成功')
        this.currentUser = result.user
        // 使用设备ID作为数据存储的用户ID，而不是Firebase UID
        dataService.setUserId(this.deviceUserId)
        this.notifyAuthStateChange(result.user)
        return result.user
      } catch (loginError) {
        console.log('设备账户不存在，尝试创建...', loginError.code)
        
        try {
          // 创建设备账户
          const result = await createUserWithEmailAndPassword(auth, deviceEmail, devicePassword)
          console.log('设备账户创建成功')
          
          // 注册设备
          deviceFingerprint.registerDevice(deviceEmail)
          
          this.currentUser = result.user
          // 使用设备ID作为数据存储的用户ID，而不是Firebase UID
          dataService.setUserId(this.deviceUserId)
          this.notifyAuthStateChange(result.user)
          return result.user
        } catch (createError) {
          console.error('创建设备账户失败:', createError)
          throw createError
        }
      }
    } catch (error) {
      console.error('设备登录失败:', error)
      // 不抛出错误，让系统继续运行
      return null
    }
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

  // 监听Firebase认证状态变化（防止自动登出）
  setupAuthStateListener() {
    onAuthStateChanged(auth, async (user) => {
      console.log('Firebase认证状态变化:', user ? '已登录' : '未登录')
      
      if (user) {
        // 用户已登录，更新状态
        this.currentUser = user
        // 使用设备ID作为数据存储的用户ID
        dataService.setUserId(this.deviceUserId)
        this.notifyAuthStateChange(user)
      } else {
        // 用户未登录，尝试重新登录
        console.log('检测到登出，尝试重新登录...')
        try {
          const result = await this.loginWithDevice()
          if (!result) {
            console.log('重新登录失败，保持未登录状态')
            this.currentUser = null
            dataService.setUserId(null)
            dataService.stopAllListeners()
            this.notifyAuthStateChange(null)
          }
        } catch (error) {
          console.error('重新登录失败:', error)
          this.currentUser = null
          dataService.setUserId(null)
          dataService.stopAllListeners()
          this.notifyAuthStateChange(null)
        }
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

  // 获取设备用户ID
  getDeviceUserId() {
    return this.deviceUserId
  }

  // 手动登出（清除设备信息）
  async signOut() {
    try {
      await signOut(auth)
      deviceFingerprint.clearDeviceRegistration()
      this.currentUser = null
      this.deviceUserId = null
      dataService.setUserId(null)
      dataService.stopAllListeners()
      this.notifyAuthStateChange(null)
    } catch (error) {
      console.error('登出失败:', error)
      throw error
    }
  }
}

export default new AuthService()
