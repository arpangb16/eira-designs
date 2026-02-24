#!/bin/bash

# 🎉 Eira Designs - Localhost Restart Script 🚀
# This script stops any running Next.js dev server and starts a fresh one!

echo "🎊 Stopping any running Next.js servers..."

# Kill any process running on port 3000 (default Next.js port)
lsof -ti:3000 | xargs kill -9 2>/dev/null || echo "✨ No process found on port 3000"

# Also kill any node processes that might be running Next.js
pkill -f "next dev" 2>/dev/null || echo "✨ No Next.js dev processes found"

# Wait a moment for processes to fully terminate
sleep 2

echo "🎈 Navigating to project directory..."
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
if [ -d "$SCRIPT_DIR/nextjs_space" ]; then
  cd "$SCRIPT_DIR/nextjs_space" || exit 1
elif [ -d "$SCRIPT_DIR/apparel_design_manager/nextjs_space" ]; then
  cd "$SCRIPT_DIR/apparel_design_manager/nextjs_space" || exit 1
else
  echo "❌ Could not find nextjs_space directory"
  exit 1
fi

# Check if node_modules exists, if not, install dependencies
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    echo "💡 Using --legacy-peer-deps to resolve dependency conflicts..."
    npm install --legacy-peer-deps
fi

echo "🚀 Starting Next.js dev server..."
echo "💫 Server will be available at http://localhost:3000"
echo ""

# Start the dev server
npm run dev





