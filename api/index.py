# api/index.py
# Vercel serverless entry point for Flask backend.
# Vercel looks for a file at api/index.py and calls the 'app' variable.

import sys
import os

# Add backend directory to path so 'app' package is importable
backend_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'backend')
sys.path.insert(0, backend_dir)

from dotenv import load_dotenv
load_dotenv(os.path.join(backend_dir, '.env'))

from app import create_app

# Vercel requires the variable to be named 'app'
app = create_app()

# Vercel calls this directly as a serverless function
if __name__ == '__main__':
    app.run()