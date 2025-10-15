@echo off
echo 🚀 开始部署日语学习网站到GitHub Pages...
echo.

echo 📦 构建项目...
npm run build
if %errorlevel% neq 0 (
    echo ❌ 构建失败！
    pause
    exit /b 1
)

echo ✅ 构建成功！
echo.

echo 📁 构建输出目录：dist/
echo 📋 生成的文件：
dir dist /b

echo.
echo 📝 接下来的步骤：
echo 1. 将 dist 文件夹中的所有文件复制到你的GitHub仓库
echo 2. 提交并推送到GitHub
echo 3. 在GitHub仓库设置中启用Pages
echo 4. 访问 https://你的用户名.github.io/japanese_learning_site/
echo.

echo 🎯 快速Git命令：
echo git add .
echo git commit -m "部署日语学习网站"
echo git push origin main
echo.

pause
