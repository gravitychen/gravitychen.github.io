<template>
  <div id="app">
    <nav class="navbar">
      <div class="nav-brand">
        <h1>🇯🇵 日语学习助手</h1>
      </div>
      <button @click="toggleLanguage" class="language-toggle">
        {{ dataStore.showJapanese ? '🇯🇵' : '🇨🇳' }}
        {{ dataStore.showJapanese ? '日文' : '中文' }}
      </button>
    </nav>
    
    <main class="main-content">
      <router-view />
    </main>
    
    <nav class="bottom-nav">
      <router-link to="/" class="nav-item">
        <span class="nav-icon">🏠</span>
        <span class="nav-label">首页</span>
      </router-link>
      <router-link to="/words" class="nav-item">
        <span class="nav-icon">📝</span>
        <span class="nav-label">单词</span>
      </router-link>
      <router-link to="/sentences" class="nav-item">
        <span class="nav-icon">💬</span>
        <span class="nav-label">句子</span>
      </router-link>
      <router-link to="/qa" class="nav-item">
        <span class="nav-icon">❓</span>
        <span class="nav-label">问答</span>
      </router-link>
      <router-link to="/review" class="nav-item">
        <span class="nav-icon">📚</span>
        <span class="nav-label">复习</span>
      </router-link>
      <router-link to="/quiz" class="nav-item">
        <span class="nav-icon">🎯</span>
        <span class="nav-label">考试</span>
      </router-link>
    </nav>
  </div>
</template>

<script>
import { useDataStore } from './stores/dataStore'

export default {
  name: 'App',
  setup() {
    const dataStore = useDataStore()
    
    const toggleLanguage = () => {
      dataStore.toggleLanguage()
    }

    return {
      dataStore,
      toggleLanguage
    }
  }
}
</script>

<style>
#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.navbar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.nav-brand h1 {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
}

.language-toggle {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.3);
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.language-toggle:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
  transform: translateY(-1px);
}

.main-content {
  flex: 1;
  padding: 1rem;
  padding-bottom: 80px; /* 为底部导航留出空间 */
}

.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  border-top: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-around;
  padding: 0.5rem 0;
  box-shadow: 0 -2px 10px rgba(0,0,0,0.1);
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-decoration: none;
  color: #666;
  padding: 0.5rem;
  transition: color 0.3s;
  min-width: 60px;
}

.nav-item.router-link-active {
  color: #667eea;
}

.nav-icon {
  font-size: 1.2rem;
  margin-bottom: 0.2rem;
}

.nav-label {
  font-size: 0.7rem;
  font-weight: 500;
}

/* 移动端优化 */
@media (max-width: 480px) {
  .main-content {
    padding: 0.8rem;
  }
  
  .nav-brand h1 {
    font-size: 1.3rem;
  }
}
</style>
