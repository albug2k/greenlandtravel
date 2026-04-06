#!/usr/bin/env bash
# backend/build.sh
set -e

echo "==> Python version: $(python --version)"

echo "==> Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

echo "==> Running database migrations..."
# If migrations folder doesn't exist, initialise it first
if [ ! -d "migrations" ]; then
    echo "  --> No migrations folder found, running flask db init..."
    python -m flask db init
    python -m flask db migrate -m "Initial migration"
fi

python -m flask db upgrade

echo "==> Build complete!"