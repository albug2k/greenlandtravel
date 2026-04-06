#!/usr/bin/env bash
# backend/build.sh
set -e
 
echo "==> Python version: $(python --version)"
 
echo "==> Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt
 
echo "==> Setting up database..."
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
PYEOF
 
echo "==> Build complete!"
