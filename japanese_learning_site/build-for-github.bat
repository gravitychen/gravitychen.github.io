@echo off
echo 🌐 构建日语学习网站用于GitHub Pages子文件夹部署
echo.

echo 📦 正在构建Vue应用...
npm run vue:build

if %errorlevel% neq 0 (
    echo ❌ 构建失败，请检查错误信息
    pause
    exit /b 1
)

echo.
echo ✅ 构建成功！
echo.
echo 📁 构建文件位置：dist/
echo.
echo 📋 下一步操作：
echo 1. 打开 dist/ 文件夹
echo 2. 在GitHub仓库中创建 japanese-learning/ 文件夹
echo 3. 将 dist/ 中的所有文件复制到 japanese-learning/ 文件夹
echo 4. 提交并推送到GitHub
echo.
echo 🌐 访问地址：https://你的用户名.github.io/japanese-learning/
echo.

echo 按任意键打开dist文件夹...
pause

REM 打开dist文件夹
start dist

echo.
echo 🎉 部署完成！请按照上述步骤上传到GitHub的japanese-learning子文件夹
