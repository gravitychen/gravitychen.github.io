<template>
  <div class="sync-test">
    <h2>数据同步测试</h2>
    
    <div class="test-section">
      <h3>连接状态</h3>
      <div class="status-info">
        <div class="status-item">
          <span>云端连接：</span>
          <span :class="dataStore.isOnline ? 'status-online' : 'status-offline'">
            {{ dataStore.isOnline ? '已连接' : '未连接' }}
          </span>
        </div>
        <div class="status-item">
          <span>同步状态：</span>
          <span :class="dataStore.syncInProgress ? 'status-syncing' : 'status-idle'">
            {{ dataStore.syncInProgress ? '同步中...' : '空闲' }}
          </span>
        </div>
        <div v-if="dataStore.lastSyncTime" class="status-item">
          <span>最后同步：</span>
          <span>{{ formatTime(dataStore.lastSyncTime) }}</span>
        </div>
      </div>
    </div>

    <div class="test-section">
      <h3>测试数据</h3>
      <div class="test-controls">
        <button @click="addTestSentence" class="test-btn" :disabled="!dataStore.isOnline">
          添加测试句子
        </button>
        <button @click="syncToCloud" class="test-btn" :disabled="!dataStore.isOnline">
          手动同步到云端
        </button>
        <button @click="syncFromCloud" class="test-btn" :disabled="!dataStore.isOnline">
          从云端同步
        </button>
      </div>
    </div>

    <div class="test-section">
      <h3>数据统计</h3>
      <div class="data-stats">
        <div class="stat-item">
          <span>单词数量：</span>
          <span>{{ dataStore.words.length }}</span>
        </div>
        <div class="stat-item">
          <span>句子数量：</span>
          <span>{{ dataStore.sentences.length }}</span>
        </div>
        <div class="stat-item">
          <span>问答数量：</span>
          <span>{{ dataStore.qa.length }}</span>
        </div>
      </div>
    </div>

    <div class="test-section">
      <h3>最近添加的句子</h3>
      <div v-if="recentSentences.length === 0" class="no-data">
        暂无数据
      </div>
      <div v-else class="sentence-list">
        <div 
          v-for="sentence in recentSentences" 
          :key="sentence.id" 
          class="sentence-item"
        >
          <div class="sentence-japanese">{{ sentence.japanese }}</div>
          <div class="sentence-chinese">{{ sentence.chinese }}</div>
          <div v-if="sentence.context" class="sentence-context">{{ sentence.context }}</div>
          <div class="sentence-time">{{ formatTime(sentence.createdAt) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'
import { useDataStore } from '../stores/dataStore.js'

export default {
  name: 'SyncTest',
  setup() {
    const dataStore = useDataStore()

    const recentSentences = computed(() => {
      return dataStore.sentences
        .slice()
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5)
    })

    const addTestSentence = async () => {
      const testSentence = {
        japanese: `测试句子 ${Date.now()}`,
        chinese: `这是测试句子 ${new Date().toLocaleTimeString()}`,
        context: '同步测试'
      }
      await dataStore.addSentence(testSentence)
    }

    const syncToCloud = async () => {
      await dataStore.syncToCloud()
    }

    const syncFromCloud = async () => {
      await dataStore.syncFromCloud()
    }

    const formatTime = (timeString) => {
      const date = new Date(timeString)
      return date.toLocaleString('zh-CN')
    }

    return {
      dataStore,
      recentSentences,
      addTestSentence,
      syncToCloud,
      syncFromCloud,
      formatTime
    }
  }
}
</script>

<style scoped>
.sync-test {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.test-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.test-section h3 {
  margin: 0 0 15px 0;
  color: #333;
  border-bottom: 2px solid #667eea;
  padding-bottom: 10px;
}

.status-info {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.status-item:last-child {
  border-bottom: none;
}

.status-online {
  color: #4CAF50;
  font-weight: 600;
}

.status-offline {
  color: #f44336;
  font-weight: 600;
}

.status-syncing {
  color: #2196F3;
  font-weight: 600;
}

.status-idle {
  color: #666;
}

.test-controls {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.test-btn {
  background: #667eea;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

.test-btn:hover:not(:disabled) {
  background: #5a6fd8;
  transform: translateY(-2px);
}

.test-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
}

.data-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.stat-item {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 500;
}

.no-data {
  text-align: center;
  color: #666;
  padding: 40px;
  font-style: italic;
}

.sentence-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.sentence-item {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  border-left: 4px solid #667eea;
}

.sentence-japanese {
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 5px;
}

.sentence-chinese {
  color: #666;
  margin-bottom: 5px;
}

.sentence-context {
  color: #999;
  font-size: 0.9rem;
  font-style: italic;
  margin-bottom: 5px;
}

.sentence-time {
  color: #999;
  font-size: 0.8rem;
}

@media (max-width: 480px) {
  .sync-test {
    padding: 10px;
  }
  
  .test-controls {
    flex-direction: column;
  }
  
  .data-stats {
    grid-template-columns: 1fr;
  }
}
</style>
