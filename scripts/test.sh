#!/bin/bash
set -e

echo "📝 Running Sekha Obsidian Test Suite..."

TEST_TYPE=${1:-"all"}

case $TEST_TYPE in
  "lint")
    echo "🔍 Running ESLint..."
    eslint src/ tests/
    ;;
  "unit")
    echo "Running unit tests..."
    vitest run
    ;;
  "all"|*)
    echo "Running linting and all tests..."
    eslint src/ tests/
    vitest run --coverage
    ;;
esac

echo "✅ Tests complete!"