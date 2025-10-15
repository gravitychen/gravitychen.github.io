@echo off
echo 🚀 简化部署日语学习网站到GitHub Pages...
echo.

echo 📦 构建项目...
npm run build
if %errorlevel% neq 0 (
    echo ❌ 构建失败！
    pause
    exit /b 1
)

echo ✅ 构建成功！文件已自动复制到主目录的 japanese_learning_site 文件夹
echo.
echo 📝 现在您可以：
echo    1. cd ..  (回到主目录)
echo    2. git add japanese_learning_site/
echo    3. git commit -m "更新日语学习网站"
echo    4. git push origin master
echo.
echo 🌐 部署后访问地址：https://gravitychen.github.io/japanese_learning_site/
echo.

pause