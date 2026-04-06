#!/usr/bin/env bash
# backend/build.sh
set -e

echo "==> Python version: $(python --version)"

echo "==> Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

echo "==> Setting up database..."

# Since this is a fresh PostgreSQL database on Render,
# drop any partial migration state and recreate cleanly
python << 'PYEOF'
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv()

from app import create_app, db

app = create_app()
with app.app_context():
    print("  --> Dropping all existing tables (fresh deploy)...")
    db.drop_all()
    print("  --> Creating all tables from models...")
    db.create_all()
    print("  --> Tables created successfully!")

    # Stamp alembic so it knows migrations are up to date
    from flask_migrate import stamp
    stamp()
    print("  --> Migration state stamped as current.")
PYEOF

echo "==> Build complete!"