# GitHub Pages 部署说明

## 🚀 快速部署

### 方法1：使用部署脚本（推荐）

```bash
# 双击运行
deploy-to-github.bat
```

### 方法2：手动部署

```bash
# 1. 构建应用
npm run vue:build

# 2. 将 dist/ 文件夹内容复制到GitHub仓库
```

## 📁 部署步骤

### 1. 构建Vue应用

```bash
cd japanese_learning_site
npm run vue:build
```

### 2. 上传到GitHub

- 将 `dist/` 文件夹中的所有文件复制到你的GitHub仓库根目录
- 或者复制到 `docs/` 文件夹中

### 3. 启用GitHub Pages

1. 进入你的GitHub仓库
2. 点击 "Settings" 标签
3. 滚动到 "Pages" 部分
4. 选择源：
   - 如果文件在根目录：选择 "Deploy from a branch" → "main"
   - 如果文件在docs文件夹：选择 "Deploy from a branch" → "main /docs"

### 4. 访问网站

```
https://你的用户名.github.io/
```

## 🔧 开发模式外部访问

### 修改Vite配置

已修改 `vite.config.js` 允许外部访问：

```javascript
server: {
  host: '0.0.0.0', // 允许外部访问
  port: 3001
}
```

### 启动开发服务器

```bash
npm run vue:dev
```

### 访问地址

- 本地：http://localhost:3001
- 外部：http://你的IP地址:3001

## 📝 注意事项

### 1. 后端API问题

- 生产版本中，后端API可能无法访问
- 建议将后端功能改为纯前端实现
- 或者使用GitHub Actions部署后端

### 2. 数据持久化

- 生产版本使用localStorage
- 数据只保存在用户浏览器中
- 不会同步到服务器

### 3. 自定义域名

如果使用自定义域名：

1. 在仓库根目录创建 `CNAME` 文件
2. 内容为你的域名，如：`yourdomain.com`
3. 在域名服务商设置CNAME记录指向 `你的用户名.github.io`

## 🛠️ 故障排除

### 构建失败

```bash
# 清理缓存
rm -rf node_modules
rm package-lock.json
npm install
npm run vue:build
```

### 页面空白

1. 检查浏览器控制台错误
2. 确保所有文件都正确上传
3. 检查文件路径是否正确

### 样式问题

1. 确保CSS文件正确加载
2. 检查资源路径
3. 清除浏览器缓存

## 📊 性能优化

### 1. 启用Gzip压缩

在GitHub Pages设置中启用压缩

### 2. 使用CDN

可以配置CDN加速访问

### 3. 缓存策略

设置适当的缓存头

## 🔄 更新部署

每次更新后：

1. 运行 `npm run vue:build`
2. 将新的 `dist/` 内容上传到GitHub
3. GitHub Pages会自动更新（可能需要几分钟）

## 📱 移动端访问

网站已支持响应式设计，可以在手机浏览器中正常访问。

## 🎯 最终访问地址

部署完成后，你的日语学习网站将在以下地址可用：

```
https://你的GitHub用户名.github.io/
```

例如：`https://gravitychen.github.io/`
