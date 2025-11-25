# Script Build & Package untuk Deploy ke cPanel
# Jalankan: .\build-deploy.ps1

Write-Host "🚀 VYL Bouquet - Build & Package Script" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# 1. Clean previous build
Write-Host "🧹 Cleaning previous build..." -ForegroundColor Yellow
if (Test-Path ".next") {
    Remove-Item -Recurse -Force .next
}
if (Test-Path "deploy") {
    Remove-Item -Recurse -Force deploy
}
if (Test-Path "vyl-bouquet-deploy.zip") {
    Remove-Item -Force vyl-bouquet-deploy.zip
}
Write-Host "✅ Clean completed" -ForegroundColor Green
Write-Host ""

# 2. Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ npm install failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Dependencies installed" -ForegroundColor Green
Write-Host ""

# 3. Build untuk production
Write-Host "🔨 Building for production (standalone mode)..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Build completed" -ForegroundColor Green
Write-Host ""

# 4. Cek folder standalone
if (-not (Test-Path ".next/standalone")) {
    Write-Host "❌ Standalone folder not found! Check next.config.js" -ForegroundColor Red
    exit 1
}

# 5. Create deployment folder
Write-Host "📁 Creating deployment package..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path deploy | Out-Null

# 6. Copy files
Write-Host "📋 Copying files..." -ForegroundColor Yellow

# Copy standalone build
Copy-Item -Recurse -Force .next/standalone/* deploy/

# Copy static assets
Copy-Item -Recurse -Force .next/static deploy/.next/

# Copy public folder
Copy-Item -Recurse -Force public deploy/

# Copy configuration files
Copy-Item -Force .env.production deploy/.env
Copy-Item -Force server.js deploy/
Copy-Item -Force ecosystem.config.js deploy/
Copy-Item -Force .htaccess deploy/
Copy-Item -Force package.json deploy/
Copy-Item -Force package-lock.json deploy/

# Create logs directory
New-Item -ItemType Directory -Force -Path deploy/logs | Out-Null

# Create uploads directory with proper structure
New-Item -ItemType Directory -Force -Path deploy/public/uploads/bouquets | Out-Null
New-Item -ItemType Directory -Force -Path deploy/public/uploads/orders | Out-Null

Write-Host "✅ Files copied" -ForegroundColor Green
Write-Host ""

# 7. Create .gitignore for deploy folder
@"
node_modules/
.env.local
.DS_Store
Thumbs.db
*.log
"@ | Out-File -FilePath deploy/.gitignore -Encoding UTF8

# 8. Compress untuk upload
Write-Host "🗜️  Compressing files..." -ForegroundColor Yellow
Compress-Archive -Path deploy\* -DestinationPath vyl-bouquet-deploy.zip -Force
Write-Host "✅ Compressed successfully" -ForegroundColor Green
Write-Host ""

# 9. Show results
Write-Host "========================================" -ForegroundColor Green
Write-Host "✅ BUILD & PACKAGE COMPLETED!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "📦 Deployment package: vyl-bouquet-deploy.zip" -ForegroundColor Cyan
$fileSize = (Get-Item vyl-bouquet-deploy.zip).Length / 1MB
Write-Host "📊 File size: $([math]::Round($fileSize, 2)) MB" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Yellow
Write-Host "1. Upload vyl-bouquet-deploy.zip to cPanel File Manager" -ForegroundColor White
Write-Host "2. Extract to public_html/" -ForegroundColor White
Write-Host "3. Setup Node.js App di cPanel" -ForegroundColor White
Write-Host "4. Configure environment variables" -ForegroundColor White
Write-Host "5. Run npm install di cPanel" -ForegroundColor White
Write-Host "6. Start aplikasi dengan PM2" -ForegroundColor White
Write-Host ""
Write-Host "📖 Full guide: DEPLOY_CPANEL.md" -ForegroundColor Cyan
Write-Host ""
