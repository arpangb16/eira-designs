#!/bin/bash

echo "Testing local upload functionality..."
echo ""

# Check if directories exist
if [ -d "public/uploads" ]; then
  echo "✓ Upload directories exist"
else
  echo "✗ Upload directories missing - creating..."
  mkdir -p public/uploads/public
  echo "✓ Created upload directories"
fi

# Check environment variables
echo ""
echo "Environment check:"
if [ -z "$AWS_BUCKET_NAME" ]; then
  echo "✓ AWS_BUCKET_NAME not set - will use local storage"
else
  echo "⚠ AWS_BUCKET_NAME is set: $AWS_BUCKET_NAME"
fi

# Check if .env file exists and what it contains
if [ -f ".env.local" ]; then
  echo ""
  echo ".env.local contents (AWS related):"
  grep -i "AWS" .env.local 2>/dev/null || echo "  No AWS variables found"
fi

if [ -f ".env" ]; then
  echo ""
  echo ".env contents (AWS related):"
  grep -i "AWS" .env 2>/dev/null || echo "  No AWS variables found"
fi

echo ""
echo "Test complete. If AWS_BUCKET_NAME is not set, uploads should use local storage."

