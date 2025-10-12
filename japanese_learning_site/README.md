# 日语学习网站 - Vue版本

## 🚀 快速启动

### Windows用户
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

## 📁 项目结构

```
japanese_learning_site/
├── src/                    # Vue源码
│   ├── components/         # Vue组件
│   ├── App.vue            # 主应用
│   └── *.vue              # 页面组件
├── database/              # 数据库文件
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
- Vite构建工具
- 响应式设计
- localStorage数据持久化

## 📚 详细说明

查看 `Vue启动说明.md` 获取完整的使用指南。

## 🔧 开发命令

```bash
# 开发模式
npm run vue:dev

# 构建生产版本
npm run vue:build

# 预览构建结果
npm run vue:preview
```

## 🎨 特色功能

- 现代化Vue 3架构
- 响应式数据管理
- 组件化设计
- 移动端适配