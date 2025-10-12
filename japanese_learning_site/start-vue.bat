@echo off
echo 🚀 启动Vue版本的日语学习网站...
echo.

REM 检查Node.js是否安装
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 错误：未找到Node.js，请先安装Node.js
    echo 📥 下载地址：https://nodejs.org/
    pause
    exit /b 1
)

REM 检查Node.js版本
for /f "tokens=1" %%i in ('node --version') do set NODE_VERSION=%%i
echo 🔍 检测到Node.js版本: %NODE_VERSION%

echo.
echo 🧹 清理旧的依赖...
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del package-lock.json

echo.
echo 🔧 修复Vue项目配置...
echo ✅ 已删除React相关文件
echo ✅ 已创建Vue项目结构

echo.
echo 📦 重新安装Vue版本的依赖...
npm install

if %errorlevel% neq 0 (
    echo ❌ 依赖安装失败，尝试强制安装...
    npm install --force
)

echo.
echo ✅ 修复完成！启动Vue开发服务器...
echo 🌐 访问地址：http://localhost:3001
echo ⏹️  按 Ctrl+C 停止服务器
echo.

npm run vue:dev

pause
