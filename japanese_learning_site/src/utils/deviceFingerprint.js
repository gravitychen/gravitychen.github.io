// 设备指纹生成工具
export class DeviceFingerprint {
  constructor() {
    this.fingerprint = null
  }

  // 生成设备指纹
  generateFingerprint() {
    // 首先尝试从本地存储获取已保存的指纹
    const savedFingerprint = this._getSavedFingerprint()
    if (savedFingerprint) {
      this.fingerprint = savedFingerprint
      return this.fingerprint
    }

    // 如果本地没有保存的指纹，生成新的稳定指纹
    const components = [
      navigator.userAgent,
      `${screen.width}x${screen.height}`,
      navigator.language,
      navigator.platform,
      navigator.hardwareConcurrency || 'unknown',
      navigator.deviceMemory || 'unknown'
    ]
    
    this.fingerprint = this.hashString(components.join('|'))
    
    // 保存指纹到本地存储
    this._saveFingerprint(this.fingerprint)
    
    return this.fingerprint
  }

  // 获取保存的指纹
  _getSavedFingerprint() {
    try {
      return localStorage.getItem('device_fingerprint')
    } catch (e) {
      return null
    }
  }

  // 保存指纹
  _saveFingerprint(fingerprint) {
    try {
      localStorage.setItem('device_fingerprint', fingerprint)
    } catch (e) {
      console.warn('无法保存设备指纹:', e)
    }
  }

  // 获取设备信息（兼容旧接口）
  getDeviceInfo() {
    return {
      fingerprint: this.generateFingerprint()
    }
  }

  // 注册设备（兼容旧接口）
  registerDevice(email) {
    console.log('设备已注册:', email)
  }


  // 简单的哈希函数
  hashString(str) {
    let hash = 0
    if (str.length === 0) return hash.toString()
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // 转换为32位整数
    }
    
    return Math.abs(hash).toString(36)
  }

  // 获取设备信息摘要
  getDeviceInfo() {
    return {
      fingerprint: this.generateFingerprint(),
      userAgent: navigator.userAgent,
      screen: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      platform: navigator.platform,
      hardwareConcurrency: navigator.hardwareConcurrency,
      deviceMemory: navigator.deviceMemory,
      timestamp: new Date().toISOString()
    }
  }

  // 检查设备是否已注册
  isDeviceRegistered() {
    const fingerprint = this.generateFingerprint()
    const stored = localStorage.getItem(`device_${fingerprint}`)
    return !!stored
  }

  // 注册设备
  registerDevice(userId) {
    const fingerprint = this.generateFingerprint()
    const deviceInfo = this.getDeviceInfo()
    
    localStorage.setItem(`device_${fingerprint}`, JSON.stringify({
      userId,
      registeredAt: new Date().toISOString(),
      deviceInfo
    }))
    
    return fingerprint
  }

  // 获取设备关联的用户ID
  getDeviceUserId() {
    const fingerprint = this.generateFingerprint()
    const stored = localStorage.getItem(`device_${fingerprint}`)
    
    if (stored) {
      try {
        const data = JSON.parse(stored)
        return data.userId
      } catch (e) {
        console.error('解析设备信息失败:', e)
      }
    }
    
    return null
  }

  // 清除设备注册信息
  clearDeviceRegistration() {
    const fingerprint = this.generateFingerprint()
    localStorage.removeItem(`device_${fingerprint}`)
  }
}

export default new DeviceFingerprint()
