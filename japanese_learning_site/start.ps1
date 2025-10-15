Write-Host "正在启动日语学习网站..." -ForegroundColor Green
Write-Host ""
Write-Host "请确保已安装 Node.js 和 npm" -ForegroundColor Yellow
Write-Host ""

Write-Host "清理旧的依赖包..." -ForegroundColor Blue
if (Test-Path "node_modules") {
    Remove-Item -Recurse -Force "node_modules" -ErrorAction SilentlyContinue
}
if (Test-Path "package-lock.json") {
    Remove-Item -Force "package-lock.json" -ErrorAction SilentlyContinue
}
Write-Host ""

Write-Host "安装依赖包..." -ForegroundColor Blue
npm install
Write-Host ""

Write-Host "启动开发服务器..." -ForegroundColor Green
npm run dev

Read-Host "按任意键退出"
