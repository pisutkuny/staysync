$ErrorActionPreference = "Stop"

Write-Host "Starting Full Deployment..."
git add .
try {
    git commit -m "feat: Final invoice layout and system updates"
}
catch {
    Write-Host "Nothing to commit or commit failed"
}
git push origin master
Write-Host "Full Deployment Complete"
