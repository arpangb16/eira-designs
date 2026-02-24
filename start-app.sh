#!/bin/bash

# Eira Designs - Main Branch App Starter
# Starts the Next.js app from eira-designs-main (main branch)

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_DIR="$SCRIPT_DIR/nextjs_space"
PORT="${PORT:-3001}"

echo "Eira Designs - Main Branch"
echo "=========================="

# Ensure we're in the right place
if [ ! -f "$APP_DIR/package.json" ]; then
    echo "Error: nextjs_space/package.json not found"
    exit 1
fi

cd "$APP_DIR"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install --legacy-peer-deps
fi

echo "Starting Next.js dev server on port $PORT..."
echo "Open http://localhost:$PORT"
echo ""

npm run dev -- -p "$PORT"
