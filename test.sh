#!/usr/bin/env bash
set -e

echo "========================================="
echo "   NyayaTrack Automated Test Suite"
echo "========================================="

echo "[1/2] Running Python Backend & Security Unit Tests..."
PYTHONPATH=backend python3 -m unittest discover -s tests -p "test_*.py"

echo "[2/2] Running Frontend Integration & Accessibility Tests..."
cd frontend && npm test

echo "========================================="
echo "   All Tests Passed Successfully (100%)"
echo "========================================="
