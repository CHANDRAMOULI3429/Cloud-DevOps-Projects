# ============================================
# Start Backend Server (Local - PowerShell)
# ============================================

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendPath = Join-Path $scriptPath "..\backend"
Set-Location $backendPath

# Set environment variables
$env:DB_HOST = if ($env:DB_HOST) { $env:DB_HOST } else { "localhost" }
$env:DB_USER = if ($env:DB_USER) { $env:DB_USER } else { "cloudtrace" }
$env:DB_PASSWORD = if ($env:DB_PASSWORD) { $env:DB_PASSWORD } else { "password" }
$env:DB_NAME = if ($env:DB_NAME) { $env:DB_NAME } else { "cloudtrace" }
$env:PORT = if ($env:PORT) { $env:PORT } else { "3000" }

Write-Host "🚀 Starting CloudTrace Backend..." -ForegroundColor Cyan
Write-Host "📦 Database: $env:DB_HOST/$env:DB_NAME" -ForegroundColor Yellow
Write-Host "🌐 Port: $env:PORT" -ForegroundColor Yellow
Write-Host ""

npm start

