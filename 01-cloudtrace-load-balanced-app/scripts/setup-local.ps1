# ============================================
# CloudTrace Local Setup Script (PowerShell)
# ============================================
# 
# PURPOSE: Automate local setup for testing on Windows
# 
# WHAT THIS SCRIPT DOES:
# 1. Checks prerequisites (Node.js, Docker)
# 2. Starts MariaDB in Docker
# 3. Creates database schema
# 4. Installs backend dependencies
# 5. Provides instructions for starting services
# ============================================

Write-Host "🚀 CloudTrace Local Setup" -ForegroundColor Cyan
Write-Host "==========================" -ForegroundColor Cyan
Write-Host ""

# ============================================
# CHECK PREREQUISITES
# ============================================

Write-Host "📋 Checking prerequisites..." -ForegroundColor Yellow

# Check Node.js
try {
    $nodeVersion = node -v
    Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Check Docker
$useDocker = $false
try {
    docker --version | Out-Null
    Write-Host "✅ Docker found" -ForegroundColor Green
    $useDocker = $true
} catch {
    Write-Host "⚠️  Docker not found. You'll need to install MariaDB manually." -ForegroundColor Yellow
}

Write-Host ""

# ============================================
# SETUP DATABASE
# ============================================

if ($useDocker) {
    Write-Host "🐳 Setting up MariaDB with Docker..." -ForegroundColor Yellow
    
    # Check if container already exists
    $containerExists = docker ps -a --format '{{.Names}}' | Select-String -Pattern "^cloudtrace-db$"
    $containerRunning = docker ps --format '{{.Names}}' | Select-String -Pattern "^cloudtrace-db$"
    
    if ($containerExists) {
        Write-Host "📦 Container 'cloudtrace-db' already exists" -ForegroundColor Cyan
        
        if ($containerRunning) {
            Write-Host "✅ Container is already running" -ForegroundColor Green
        } else {
            Write-Host "🔄 Starting existing container..." -ForegroundColor Yellow
            docker start cloudtrace-db
            Write-Host "⏳ Waiting for database to be ready..." -ForegroundColor Yellow
            Start-Sleep -Seconds 5
        }
    } else {
        Write-Host "🆕 Creating new MariaDB container..." -ForegroundColor Yellow
        docker run -d `
            --name cloudtrace-db `
            -e MYSQL_ROOT_PASSWORD=rootpassword `
            -e MYSQL_DATABASE=cloudtrace `
            -e MYSQL_USER=cloudtrace `
            -e MYSQL_PASSWORD=password `
            -p 3306:3306 `
            mariadb:latest
        
        Write-Host "⏳ Waiting for database to be ready..." -ForegroundColor Yellow
        Start-Sleep -Seconds 10
    }
    
    # Create schema
    Write-Host "📝 Creating database schema..." -ForegroundColor Yellow
    if (Test-Path "db\schema.sql") {
        Get-Content "db\schema.sql" | docker exec -i cloudtrace-db mysql -uroot -prootpassword cloudtrace
        Write-Host "✅ Schema created" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Schema file not found at db\schema.sql" -ForegroundColor Yellow
    }
    
} else {
    Write-Host "⚠️  Docker not available. Please set up MariaDB manually:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. Install MariaDB: https://mariadb.org/download/" -ForegroundColor Cyan
    Write-Host "2. Create database:" -ForegroundColor Cyan
    Write-Host "   mysql -u root -p" -ForegroundColor White
    Write-Host "   CREATE DATABASE cloudtrace;" -ForegroundColor White
    Write-Host "   CREATE USER 'cloudtrace'@'localhost' IDENTIFIED BY 'password';" -ForegroundColor White
    Write-Host "   GRANT ALL PRIVILEGES ON cloudtrace.* TO 'cloudtrace'@'localhost';" -ForegroundColor White
    Write-Host "   FLUSH PRIVILEGES;" -ForegroundColor White
    Write-Host "   EXIT;" -ForegroundColor White
    Write-Host "3. Create schema:" -ForegroundColor Cyan
    Write-Host "   mysql -u cloudtrace -ppassword cloudtrace < db\schema.sql" -ForegroundColor White
    Write-Host ""
}

# ============================================
# SETUP BACKEND
# ============================================

Write-Host ""
Write-Host "📦 Setting up backend..." -ForegroundColor Yellow

if (Test-Path "backend") {
    Push-Location backend
    
    if (Test-Path "package.json") {
        Write-Host "📥 Installing backend dependencies..." -ForegroundColor Yellow
        npm install
        Write-Host "✅ Backend dependencies installed" -ForegroundColor Green
    } else {
        Write-Host "⚠️  package.json not found in backend directory" -ForegroundColor Yellow
    }
    
    Pop-Location
} else {
    Write-Host "⚠️  Backend directory not found" -ForegroundColor Yellow
}

# ============================================
# SUMMARY
# ============================================

Write-Host ""
Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Start backend server:" -ForegroundColor Yellow
Write-Host "   cd backend" -ForegroundColor White
Write-Host "   `$env:DB_HOST='localhost'; `$env:DB_USER='cloudtrace'; `$env:DB_PASSWORD='password'; `$env:DB_NAME='cloudtrace'; npm start" -ForegroundColor White
Write-Host ""
Write-Host "2. Open frontend:" -ForegroundColor Yellow
Write-Host "   Option A: Open frontend\index.html in browser" -ForegroundColor White
Write-Host "   Option B: Use a local server:" -ForegroundColor White
Write-Host "     cd frontend" -ForegroundColor White
Write-Host "     python -m http.server 8080" -ForegroundColor White
Write-Host "     Then open http://localhost:8080" -ForegroundColor White
Write-Host ""
Write-Host "3. Configure frontend:" -ForegroundColor Yellow
Write-Host "   Set backend URL to: http://localhost:3000/api/request" -ForegroundColor White
Write-Host ""
Write-Host "4. Test:" -ForegroundColor Yellow
Write-Host "   Click 'Send Request' button in frontend" -ForegroundColor White
Write-Host "   Or test API directly:" -ForegroundColor White
Write-Host "   curl http://localhost:3000/api/request" -ForegroundColor White
Write-Host ""
Write-Host "🐳 To stop database:" -ForegroundColor Cyan
Write-Host "   docker stop cloudtrace-db" -ForegroundColor White
Write-Host ""
Write-Host "🐳 To remove database:" -ForegroundColor Cyan
Write-Host "   docker rm cloudtrace-db" -ForegroundColor White
Write-Host ""

