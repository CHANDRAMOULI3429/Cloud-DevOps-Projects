#!/bin/bash

# ============================================
# Start Backend Server (Local)
# ============================================

cd "$(dirname "$0")/../backend"

# Set environment variables
export DB_HOST=${DB_HOST:-localhost}
export DB_USER=${DB_USER:-cloudtrace}
export DB_PASSWORD=${DB_PASSWORD:-password}
export DB_NAME=${DB_NAME:-cloudtrace}
export PORT=${PORT:-3000}

echo "🚀 Starting CloudTrace Backend..."
echo "📦 Database: $DB_HOST/$DB_NAME"
echo "🌐 Port: $PORT"
echo ""

npm start

