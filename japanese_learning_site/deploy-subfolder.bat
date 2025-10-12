@echo off
echo 🌐 部署日语学习网站到GitHub Pages子文件夹
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
echo 📋 部署步骤：
echo.
echo 1️⃣ 在GitHub仓库中创建 japanese-learning/ 文件夹
echo    - 进入你的GitHub仓库
echo    - 点击 "Create new file"
echo    - 输入 japanese-learning/index.html
echo    - 保存空文件（这会创建文件夹）
echo.
echo 2️⃣ 上传构建文件
echo    - 打开 dist/ 文件夹
echo    - 选择所有文件
echo    - 在GitHub中进入 japanese-learning/ 文件夹
echo    - 点击 "Upload files"
echo    - 拖拽所有文件到上传区域
echo    - 提交更改
echo.
echo 🌐 访问地址：https://你的用户名.github.io/japanese-learning/
echo.

echo 按任意键打开dist文件夹...
pause

REM 打开dist文件夹
start dist

echo.
echo 🎉 构建完成！请按照上述步骤上传到GitHub
echo 📖 详细说明请查看：子文件夹部署说明.md
