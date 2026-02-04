$ErrorActionPreference = "Stop"

Write-Host "Fixing Dependencies..."
npm install exceljs
git add package.json package-lock.json
try {
    git commit -m "fix: Add missing exceljs dependency"
}
catch {
    Write-Host "Commit skipped (nothing to commit)"
}
git push origin master
Write-Host "Done."
