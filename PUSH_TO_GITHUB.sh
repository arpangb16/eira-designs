#!/bin/bash

# Script to push Eira Designs to GitHub
# Repository: https://github.com/arpangb16/eira-designs

echo "========================================"
echo "🚀 Pushing to GitHub"
echo "========================================"
echo ""

# Navigate to project directory
cd /home/ubuntu/apparel_design_manager

# Check if we're in the right directory
if [ ! -d ".git" ]; then
    echo "❌ Error: Not in a git repository"
    exit 1
fi

echo "📍 Current directory: $(pwd)"
echo ""

# Show current branch and status
echo "📊 Git status:"
git status
echo ""

# Check if origin is already added
if git remote | grep -q "^origin$"; then
    echo "✅ Remote 'origin' already exists"
    echo "   Remote URL: $(git remote get-url origin)"
else
    echo "➕ Adding remote 'origin'"
    git remote add origin https://github.com/arpangb16/eira-designs.git
    echo "✅ Remote added"
fi
echo ""

# Get current branch
CURRENT_BRANCH=$(git branch --show-current)

if [ -z "$CURRENT_BRANCH" ]; then
    echo "⚠️  You're in a detached HEAD state"
    echo "   Checking out master branch..."
    git checkout master 2>/dev/null || git checkout -b master
    CURRENT_BRANCH="master"
fi

echo "📌 Current branch: $CURRENT_BRANCH"
echo ""

# Rename to main if on master
if [ "$CURRENT_BRANCH" = "master" ]; then
    echo "🔄 Renaming branch from 'master' to 'main'"
    git branch -M main
    CURRENT_BRANCH="main"
    echo "✅ Branch renamed to 'main'"
    echo ""
fi

# Show what will be pushed
echo "📦 Commits to be pushed:"
git log --oneline -10
echo ""

# Push to GitHub
echo "🚀 Pushing to GitHub..."
echo "   You will be prompted for your GitHub credentials:"
echo "   - Username: Your GitHub username (arpangb16)"
echo "   - Password: Your Personal Access Token (NOT your GitHub password)"
echo ""
echo "   Get a token at: https://github.com/settings/tokens"
echo ""

git push -u origin $CURRENT_BRANCH

if [ $? -eq 0 ]; then
    echo ""
    echo "========================================"
    echo "✅ Successfully pushed to GitHub!"
    echo "========================================"
    echo ""
    echo "🌐 Your repository: https://github.com/arpangb16/eira-designs"
    echo ""
    echo "🎉 All done! Your code is now on GitHub."
else
    echo ""
    echo "========================================"
    echo "❌ Push failed"
    echo "========================================"
    echo ""
    echo "💡 Common issues:"
    echo "   1. Invalid credentials - Use a Personal Access Token, not your password"
    echo "   2. No internet connection"
    echo "   3. Repository doesn't exist or you don't have access"
    echo ""
    echo "📚 Get help: https://docs.github.com/en/authentication"
fi
