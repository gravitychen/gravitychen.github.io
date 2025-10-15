@echo off
echo 正在启动日语学习网站...
echo.
echo 请确保已安装 Node.js 和 npm
echo.
echo 清理旧的依赖包...
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del package-lock.json
echo.
echo 安装依赖包...
npm install
echo.
echo 启动开发服务器...
npm run dev
pause
