# Git操作指南

## 🎯 推荐操作流程

### 1. 初始化Git仓库（仅首次）
```bash
git init
git remote add origin https://github.com/你的用户名/你的仓库名.git
```

### 2. 添加必要文件
```bash
# 只添加源代码和配置文件
git add src/
git add *.json
git add *.js
git add *.html
git add *.md
git add *.bat
git add .gitignore
```

### 3. 提交更改
```bash
git commit -m "添加日语学习网站"
```

### 4. 推送到GitHub
```bash
git push -u origin main
```

## 🚫 不需要推送的文件

以下文件已被`.gitignore`忽略，不会推送到GitHub：

- `node_modules/` - 依赖包（太大，不需要）
- `dist/` - 构建输出（可以重新生成）
- `package-lock.json` - 锁定文件（可选）
- 各种临时文件和日志

## 🔧 使用Git操作助手

运行 `git-operations.bat` 可以交互式地执行Git操作：

1. **初始化Git仓库** - 首次设置
2. **添加文件到暂存区** - 选择要提交的文件
3. **提交更改** - 添加提交信息
4. **推送到GitHub** - 上传到云端
5. **查看状态** - 检查当前状态
6. **查看已添加的文件** - 确认要提交的文件
7. **完整流程** - 一键完成所有操作

## 📁 推荐的文件结构

```
japanese_learning_site/
├── src/                    # 源代码（推送）
├── package.json           # 项目配置（推送）
├── vite.config.js         # 构建配置（推送）
├── index.html             # 入口文件（推送）
├── *.md                   # 说明文档（推送）
├── *.bat                  # 脚本文件（推送）
├── .gitignore             # Git忽略文件（推送）
├── node_modules/           # 依赖包（不推送）
├── dist/                  # 构建输出（不推送）
└── package-lock.json      # 锁定文件（不推送）
```

## 🚀 快速操作

### 首次设置
```bash
# 1. 运行Git操作助手
git-operations.bat

# 2. 选择 "1. 初始化Git仓库"
# 3. 选择 "7. 完整流程"
```

### 日常更新
```bash
# 运行Git操作助手
git-operations.bat

# 选择 "7. 完整流程"
# 输入提交信息，如："更新日语学习功能"
```

## ⚠️ 注意事项

1. **不要推送大文件**：`node_modules/` 文件夹很大，不需要推送
2. **构建文件**：`dist/` 文件夹是构建输出，可以重新生成
3. **敏感信息**：不要推送包含密码或密钥的文件
4. **临时文件**：各种临时文件和日志不需要推送

## 🎯 最终结果

推送完成后，你的GitHub仓库将包含：
- 源代码文件
- 配置文件
- 说明文档
- 脚本文件

但不包含：
- 依赖包
- 构建输出
- 临时文件

这样既保持了仓库的整洁，又确保了所有必要的文件都在云端！
