#!/bin/bash

# Quick test script for the CLI tool
# Run this to verify everything works before publishing

echo "🧪 Testing chess-helper CLI installation..."
echo ""

# Check if npm link has been run
if ! command -v chess-helper &> /dev/null; then
    echo "❌ chess-helper command not found"
    echo ""
    echo "Running 'npm link' to install locally..."
    npm link
    echo ""
fi

# Test version command
echo "1️⃣ Testing --version:"
chess-helper --version
echo ""

# Test help command
echo "2️⃣ Testing --help:"
chess-helper --help
echo ""

echo "✅ Basic tests passed!"
echo ""
echo "To test interactively, run: chess-helper"
echo "To unlink, run: npm unlink -g chess-helper"
