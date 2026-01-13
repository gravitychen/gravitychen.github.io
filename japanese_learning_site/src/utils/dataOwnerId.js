const STORAGE_KEY = 'dataOwnerId'

// 获取 dataOwnerId（必须通过 Google 登录获得，不会自动生成）
export function getDataOwnerId() {
  try {
    const existing = localStorage.getItem(STORAGE_KEY)
    return existing && existing.trim() ? existing.trim() : null
  } catch (e) {
    return null
  }
}

// 设置 dataOwnerId（通常由 Google 登录后的 UID 设置）
// 如果传入 null 或空字符串，会清除 dataOwnerId
export function setDataOwnerId(newId) {
  try {
    if (newId && newId.trim()) {
      localStorage.setItem(STORAGE_KEY, newId.trim())
      return true
    } else {
      // 清除 dataOwnerId
      localStorage.removeItem(STORAGE_KEY)
      return true
    }
  } catch (e) {
    // ignore
  }
  return false
}


