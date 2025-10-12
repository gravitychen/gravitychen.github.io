@echo off
echo 🚀 部署Vue应用到GitHub Pages...
echo.

REM 检查Node.js是否安装
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 错误：未找到Node.js，请先安装Node.js
    echo 📥 下载地址：https://nodejs.org/
    pause
    exit /b 1
)

echo 📦 构建Vue应用...
npm run vue:build

if %errorlevel% neq 0 (
    echo ❌ 构建失败
    pause
    exit /b 1
)

echo.
echo ✅ 构建完成！生成的文件在 dist/ 文件夹中
echo.
echo 📋 部署步骤：
echo 1. 将 dist/ 文件夹中的所有文件复制到你的GitHub仓库根目录
echo 2. 或者将文件复制到 docs/ 文件夹中
echo 3. 在GitHub仓库设置中启用GitHub Pages
echo 4. 选择源为 "main branch" 或 "docs folder"
echo.
echo 🌐 访问地址：https://你的用户名.github.io/
echo.

echo 📁 构建文件位置：
dir dist

echo.
echo 按任意键继续...
pause
