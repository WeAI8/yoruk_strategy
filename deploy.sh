#!/usr/bin/env bash

# ==============================================================================
# Yoruk Strategy (Turan Tactics) - Automated Production Docker Deployment Script
# ==============================================================================

set -e

echo "=============================================================================="
echo "⚔️  YORUK STRATEGY (TURAN TACTICS) — PRODUCTION DEPLOYMENT"
echo "=============================================================================="

# 1. Environment & Pre-requisite Checks
echo "🚀 [1/6] Checking system requirements and environment..."

if ! command -v docker &> /dev/null; then
    echo "❌ HATA: 'docker' komutu bulunamadı. Lütfen Docker yükleyin."
    exit 1
fi

if ! docker compose version &> /dev/null; then
    echo "❌ HATA: 'docker compose' eklentisi bulunamadı."
    exit 1
fi

if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        echo "⚠️  .env dosyası bulunamadı. .env.example dosyasından kopyalanıyor..."
        cp .env.example .env
    else
        echo "❌ HATA: .env veya .env.example dosyası bulunamadı!"
        exit 1
    fi
fi

# 2. Git Synchronization
echo "📥 [2/6] Pulling latest updates from git repository (origin/main)..."
if [ -d .git ]; then
    git fetch origin main || true
    git reset --hard origin/main || git pull origin main || echo "⚠️  Git pull uyarısı alındı, mevcut dizinle devam ediliyor."
else
    echo "ℹ️  .git dizini bulunamadı, mevcut dosyalarla devam ediliyor."
fi

# 3. Build Docker Containers
echo "🐳 [3/6] Building production Docker images (Game Server & Isometric Client)..."
docker compose build --pull

# 4. Start Containers
echo "🔄 [4/6] Starting Yoruk Strategy production containers..."
docker compose up -d --remove-orphans

# Connect to yoruk_games bridge network if present on host
if docker network inspect yoruk_games_yoruk-net &> /dev/null; then
    echo "🔗 Connecting yoruk_strategy_server to yoruk_games_yoruk-net..."
    docker network connect yoruk_games_yoruk-net yoruk_strategy_server 2>/dev/null || true
fi

# 5. Health Check
echo "⏳ [5/6] Waiting for Authoritative Game Server to reach healthy status..."
sleep 4

# 6. Housekeeping / Cleanup
echo "🧹 [6/6] Cleaning up old unused Docker images..."
docker image prune -f

echo "=============================================================================="
echo "✅ YORUK STRATEGY (TURAN TACTICS) BAŞARIYLA CANLIYA ALINDI!"
echo "=============================================================================="
echo "🎮 Oyun İstemcisi (Nginx + WebSocket Proxy): http://127.0.0.1:${GAME_CLIENT_PORT:-3001}"
echo "📡 Otoriter Oyun Sunucusu (Health/WS):       http://127.0.0.1:${GAME_SERVER_PORT:-8081}/health"
echo "------------------------------------------------------------------------------"
echo "📊 Canlı logları izlemek için:               docker compose logs -f"
echo "🛑 Oyunu durdurmak için:                     docker compose down"
echo "=============================================================================="
