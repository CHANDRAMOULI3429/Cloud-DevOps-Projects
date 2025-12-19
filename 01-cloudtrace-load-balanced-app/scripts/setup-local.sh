#!/bin/bash

# ============================================
# CloudTrace Local Setup Script
# ============================================
# 
# PURPOSE: Automate local setup for testing
# 
# WHAT THIS SCRIPT DOES:
# 1. Checks prerequisites (Node.js, Docker)
# 2. Starts MariaDB in Docker
# 3. Creates database schema
# 4. Installs backend dependencies
# 5. Provides instructions for starting services
# ============================================

set -e  # Exit on error

echo "🚀 CloudTrace Local Setup"
echo "=========================="
echo ""

# ============================================
# CHECK PREREQUISITES
# ============================================

echo "📋 Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js from https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v)
echo "✅ Node.js found: $NODE_VERSION"

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "⚠️  Docker not found. You'll need to install MariaDB manually."
    USE_DOCKER=false
else
    echo "✅ Docker found"
    USE_DOCKER=true
fi

echo ""

# ============================================
# SETUP DATABASE
# ============================================

if [ "$USE_DOCKER" = true ]; then
    echo "🐳 Setting up MariaDB with Docker..."
    
    # Check if container already exists
    if docker ps -a --format '{{.Names}}' | grep -q "^cloudtrace-db$"; then
        echo "📦 Container 'cloudtrace-db' already exists"
        
        # Check if running
        if docker ps --format '{{.Names}}' | grep -q "^cloudtrace-db$"; then
            echo "✅ Container is already running"
        else
            echo "🔄 Starting existing container..."
            docker start cloudtrace-db
            echo "⏳ Waiting for database to be ready..."
            sleep 5
        fi
    else
        echo "🆕 Creating new MariaDB container..."
        docker run -d \
            --name cloudtrace-db \
            -e MYSQL_ROOT_PASSWORD=rootpassword \
            -e MYSQL_DATABASE=cloudtrace \
            -e MYSQL_USER=cloudtrace \
            -e MYSQL_PASSWORD=password \
            -p 3306:3306 \
            mariadb:latest
        
        echo "⏳ Waiting for database to be ready..."
        sleep 10
    fi
    
    # Create schema
    echo "📝 Creating database schema..."
    if [ -f "db/schema.sql" ]; then
        docker exec -i cloudtrace-db mysql -uroot -prootpassword cloudtrace < db/schema.sql
        echo "✅ Schema created"
    else
        echo "⚠️  Schema file not found at db/schema.sql"
    fi
    
else
    echo "⚠️  Docker not available. Please set up MariaDB manually:"
    echo ""
    echo "1. Install MariaDB: https://mariadb.org/download/"
    echo "2. Create database:"
    echo "   mysql -u root -p"
    echo "   CREATE DATABASE cloudtrace;"
    echo "   CREATE USER 'cloudtrace'@'localhost' IDENTIFIED BY 'password';"
    echo "   GRANT ALL PRIVILEGES ON cloudtrace.* TO 'cloudtrace'@'localhost';"
    echo "   FLUSH PRIVILEGES;"
    echo "   EXIT;"
    echo "3. Create schema:"
    echo "   mysql -u cloudtrace -ppassword cloudtrace < db/schema.sql"
    echo ""
fi

# ============================================
# SETUP BACKEND
# ============================================

echo ""
echo "📦 Setting up backend..."

if [ -d "backend" ]; then
    cd backend
    
    if [ -f "package.json" ]; then
        echo "📥 Installing backend dependencies..."
        npm install
        echo "✅ Backend dependencies installed"
    else
        echo "⚠️  package.json not found in backend directory"
    fi
    
    cd ..
else
    echo "⚠️  Backend directory not found"
fi

# ============================================
# SUMMARY
# ============================================

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo ""
echo "1. Start backend server:"
echo "   cd backend"
echo "   DB_HOST=localhost DB_USER=cloudtrace DB_PASSWORD=password DB_NAME=cloudtrace npm start"
echo ""
echo "2. Open frontend:"
echo "   Option A: Open frontend/index.html in browser"
echo "   Option B: Use a local server:"
echo "     cd frontend"
echo "     python -m http.server 8080"
echo "     Then open http://localhost:8080"
echo ""
echo "3. Configure frontend:"
echo "   Set backend URL to: http://localhost:3000/api/request"
echo ""
echo "4. Test:"
echo "   Click 'Send Request' button in frontend"
echo "   Or test API directly:"
echo "   curl http://localhost:3000/api/request"
echo ""
echo "🐳 To stop database:"
echo "   docker stop cloudtrace-db"
echo ""
echo "🐳 To remove database:"
echo "   docker rm cloudtrace-db"
echo ""

