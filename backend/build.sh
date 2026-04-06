#!/usr/bin/env bash
# backend/build.sh
set -e

echo "==> Python version: $(python --version)"
echo "==> Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

echo "==> Running database migrations..."
python -m flask db upgrade

echo "==> Build complete!"