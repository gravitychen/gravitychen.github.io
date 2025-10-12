@echo off
echo 🔧 Git操作助手
echo.

echo 请选择操作：
echo 1. 初始化Git仓库
echo 2. 添加文件到暂存区
echo 3. 提交更改
echo 4. 推送到GitHub
echo 5. 查看状态
echo 6. 查看已添加的文件
echo 7. 完整流程（添加+提交+推送）
echo.

set /p choice=请输入选择 (1-7): 

if "%choice%"=="1" goto init
if "%choice%"=="2" goto add
if "%choice%"=="3" goto commit
if "%choice%"=="4" goto push
if "%choice%"=="5" goto status
if "%choice%"=="6" goto show_added
if "%choice%"=="7" goto full_flow
goto end

:init
echo.
echo 🔧 初始化Git仓库...
git init
git remote add origin https://github.com/你的用户名/你的仓库名.git
echo ✅ Git仓库初始化完成
goto end

:add
echo.
echo 📁 添加文件到暂存区...
echo 正在添加源代码文件...
git add src/
git add *.json
git add *.js
git add *.html
git add *.md
git add *.bat
git add .gitignore
echo ✅ 文件已添加到暂存区
goto end

:commit
echo.
set /p message=请输入提交信息: 
git commit -m "%message%"
echo ✅ 提交完成
goto end

:push
echo.
echo 🚀 推送到GitHub...
git push -u origin main
echo ✅ 推送完成
goto end

:status
echo.
echo 📊 Git状态：
git status
goto end

:show_added
echo.
echo 📁 已添加到暂存区的文件：
git diff --cached --name-only
goto end

:full_flow
echo.
echo 🚀 完整流程：添加+提交+推送
echo.
echo 📁 添加文件到暂存区...
git add src/
git add *.json
git add *.js
git add *.html
git add *.md
git add *.bat
git add .gitignore
echo ✅ 文件已添加
echo.
set /p message=请输入提交信息: 
git commit -m "%message%"
echo ✅ 提交完成
echo.
echo 🚀 推送到GitHub...
git push -u origin main
echo ✅ 推送完成
goto end

:end
echo.
echo 按任意键退出...
pause
