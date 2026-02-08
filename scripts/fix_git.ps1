Write-Host "🔧 Fixing git state..."
try {
    Stop-Process -Name "git" -Force -ErrorAction SilentlyContinue
    if (Test-Path .git\index.lock) { 
        Remove-Item .git\index.lock -Force 
        Write-Host "🔓 Removed stale index.lock"
    }
} catch {
    Write-Host "⚠️ Non-critical error during cleanup: $_"
}

Write-Host "📦 Committing changes..."
git add .
git commit -m "fix(resident): robust checkout logic to prevent vanishing residents"
git push origin master
Write-Host "✅ Done!"
