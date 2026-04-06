#!/usr/bin/env bash
# backend/build.sh
# Render runs this as the Build Command: bash build.sh
set -e  # exit immediately if any command fails

echo "==> Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

echo "==> Running database migrations..."
# Use 'python -m flask' to ensure we use the venv's flask
# Set FLASK_APP explicitly to point at the factory function
FLASK_APP=wsgi:application python -m flask db upgrade

echo "==> Build complete!"