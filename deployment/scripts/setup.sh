#!/bin/bash
set -e

echo "🎓 SAPFS Setup Script"
echo "====================="

# Check dependencies
command -v docker >/dev/null 2>&1 || { echo "Docker required but not installed."; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { echo "Docker Compose required."; exit 1; }

# Create .env files
if [ ! -f backend/.env ]; then
    cp backend/.env.example backend/.env
    echo "✅ Created backend/.env — PLEASE UPDATE SECRETS!"
fi

if [ ! -f frontend/.env ]; then
    cp frontend/.env.example frontend/.env
    echo "✅ Created frontend/.env"
fi

# Build and start
echo "🐳 Starting Docker containers..."
cd deployment/docker
docker-compose up -d --build

echo ""
echo "✅ SAPFS is running!"
echo "   Frontend:  http://localhost:3000"
echo "   API Docs:  http://localhost:8000/api/docs"
echo "   API:       http://localhost:8000/api/v1"
echo ""
echo "🔑 Demo Login:"
echo "   Admin:   admin@sapfs.edu / Admin@123"
echo "   Faculty: dr.sharma@sapfs.edu / Faculty@123"
echo "   Student: arjun.kumar@student.sapfs.edu / Student@123"
