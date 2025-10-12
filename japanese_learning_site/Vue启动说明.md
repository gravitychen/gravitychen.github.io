# 日语学习网站 - Vue版本

## 🚀 快速启动

### Windows用户（推荐）
```bash
# 双击运行
start-vue.bat
```

### 手动启动
```bash
# 安装依赖
npm install

# 启动Vue开发服务器
npm run vue:dev
```

访问：http://localhost:3001

## 📁 Vue项目结构

```
japanese_learning_site/
├── src/                    # Vue源码
│   ├── components/         # Vue组件
│   │   ├── TabNavigation.vue
│   │   ├── DailyReview.vue
│   │   ├── ScenarioLearning.vue
│   │   ├── QAHistory.vue
│   │   ├── LearningProgress.vue
│   │   └── modals/         # 模态框组件
│   ├── App.vue            # 主应用组件
│   ├── main.js            # 入口文件
│   └── style.css          # 全局样式
├── index.html             # HTML模板
├── vite.config.js         # Vite配置
├── package.json           # 项目配置
└── start-vue.bat          # Vue启动脚本
```

## 🎯 主要功能

- **每日复习** - 智能生成复习内容
- **情境学习** - 多情境日语学习
- **问答记录** - 学习问题管理
- **学习进度** - 数据统计和可视化

## 🛠️ 技术栈

- Vue 3 + Composition API
- Vite 构建工具
- 响应式设计
- localStorage数据持久化

## 📚 详细说明

### Vue组件特点
- 使用Composition API
- 响应式数据管理
- 组件化架构
- 单文件组件(.vue)

### 数据管理
- 使用Vue 3的响应式系统
- localStorage持久化
- 组件间数据共享

### 样式系统
- Scoped CSS
- 响应式设计
- 现代化UI

## 🚀 开发命令

```bash
# 开发模式
npm run vue:dev

# 构建生产版本
npm run vue:build

# 预览构建结果
npm run vue:preview
```

## 📱 响应式设计

- 移动端优先设计
- 平板和桌面端适配
- 触摸友好的交互

## 🎨 设计特色

- 现代化渐变背景
- 卡片式布局
- 流畅的动画效果
- 直观的用户界面

## 🔧 开发注意事项

1. **组件通信**: 使用props和emit
2. **状态管理**: 使用Vue 3响应式系统
3. **样式隔离**: 使用scoped CSS
4. **性能优化**: 使用computed和watch

## 📦 部署

### 构建生产版本
```bash
npm run vue:build
```

### 部署到服务器
1. 将`dist`文件夹上传到服务器
2. 配置Web服务器（Nginx/Apache）
3. 设置API代理到后端服务器

## 🔍 调试技巧

1. 使用Vue DevTools
2. 查看浏览器控制台
3. 检查localStorage数据
4. 使用网络面板查看API请求

## 📋 版本兼容性

| Node.js版本 | Vue版本 | Vite版本 | 状态 |
|-------------|---------|----------|------|
| 20.12.0     | 3.3.0   | 4.5.0    | ✅ 兼容 |
| 20.19+      | 3.3.0   | 5.x      | ✅ 兼容 |
| 22.12+      | 3.3.0   | 5.x      | ✅ 兼容 |

## 🚀 快速开始

1. **克隆项目**
2. **运行启动脚本**: `start-vue.bat`
3. **访问应用**: http://localhost:3001
4. **开始学习日语**！

## 📚 学习资源

- [Vue 3官方文档](https://vuejs.org/)
- [Vite文档](https://vitejs.dev/)
- [Composition API指南](https://vuejs.org/guide/composition-api/)
- [Vue DevTools](https://devtools.vuejs.org/)
