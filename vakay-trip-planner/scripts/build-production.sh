#!/bin/bash

echo "🚀 Starting production build process..."

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf .next
rm -rf out

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --only=production

# Run linting
echo "🔍 Running linting..."
npm run lint

# Run tests
echo "🧪 Running tests..."
npm run test

# Build the application
echo "🏗️ Building application..."
npm run build

# Check build output
if [ -d ".next" ]; then
    echo "✅ Build successful! Production files are in .next directory"
    echo "📊 Build size:"
    du -sh .next
else
    echo "❌ Build failed!"
    exit 1
fi

echo "🎉 Production build completed successfully!"
