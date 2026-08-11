#!/bin/bash
set -e

echo "🚀 Starting CineK Production Build & Deploy..."

# Variables
IMAGE_NAME="cinek"
CONTAINER_NAME="cinek"
MYSQL_CONTAINER="cinek-mysql"
REDIS_CONTAINER="cinek-redis"
COMPOSE_FILE="docker/docker-compose.prod.yml"

# Check if running in Gitea Actions or locally
if [ -n "$GITEA_RUNNER_ID" ] || [ -d ".gitea" ]; then
    echo "🤖 Running in Gitea Actions environment"
    WORK_DIR="/root/www/kr-phim"
else
    echo "🏠 Running locally or via SSH"
    # Try to detect project root
    if [ -d "docker" ]; then
        WORK_DIR="$(pwd)"
    else
        echo "❌ Cannot detect project directory"
        exit 1
    fi
fi

cd "$WORK_DIR"

echo "📦 Building production Docker image..."
docker build -t "$IMAGE_NAME:latest" -f docker/Dockerfile.prod ..
echo "✅ Image built successfully"

echo "🔄 Stopping old container..."
docker stop "$CONTAINER_NAME" 2>/dev/null || true
docker rm "$CONTAINER_NAME" 2>/dev/null || true

echo "🚀 Starting production stack..."
docker compose -f "$COMPOSE_FILE" up -d mysql redis

sleep 5

docker compose -f "$COMPOSE_FILE" up -d cinek

echo "⏳ Waiting for services to be ready..."
sleep 10

echo "📋 Checking container status..."
docker compose -f "$COMPOSE_FILE" ps

echo "🧹 Pruning old containers and images..."
docker system prune -f --volumes 2>/dev/null || true

echo "✅ Deploy complete!"
echo "🌐 Application should be available at http://localhost:3002"
echo ""
echo "Useful commands:"
echo "  docker logs -f $CONTAINER_NAME   # View logs"
echo "  docker compose -f $COMPOSE_FILE down  # Stop all"
echo "  docker compose -f $COMPOSE_FILE restart  # Restart"
