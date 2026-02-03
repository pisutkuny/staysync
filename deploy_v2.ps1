$ErrorActionPreference = "Stop"

Write-Host "Starting Deployment..."
git add .
try {
    git commit -m "feat: Final invoice layout and Excel export"
} catch {
    Write-Host "Nothing to commit or commit failed, proceeding to push..."
}
git push origin master
Write-Host "Deployment Complete!"
