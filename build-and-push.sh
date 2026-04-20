#!/bin/bash

# Build and push AbView images to GitHub Container Registry
# Usage: ./build-and-push.sh [tag]
# Default tag: latest

set -e

TAG=${1:-latest}
REGISTRY="ghcr.io/rxdy/abview"

echo "🚀 Building and pushing AbView images to GHCR"
echo "Tag: $TAG"
echo "Registry: $REGISTRY"
echo ""

# Build frontend image
echo "📦 Building frontend image..."
docker build --target frontend -t $REGISTRY/frontend:$TAG .

# Build backend image
echo "📦 Building backend image..."
docker build --target backend -t $REGISTRY/backend:$TAG .

# Push images
echo "⬆️ Pushing frontend image..."
docker push $REGISTRY/frontend:$TAG

echo "⬆️ Pushing backend image..."
docker push $REGISTRY/backend:$TAG

echo ""
echo "✅ Images pushed successfully!"
echo ""
echo "Frontend: $REGISTRY/frontend:$TAG"
echo "Backend:  $REGISTRY/backend:$TAG"
echo ""
echo "To deploy in production:"
echo "  docker-compose -f docker-compose.prod.yml up -d"