# backend/wsgi.py
# This is the entry point PythonAnywhere uses to run your Flask app.

import sys
import os

# Add your project directory to the Python path
# On PythonAnywhere this will be: /home/YOUR_USERNAME/greenlandtour/backend
project_home = os.path.dirname(os.path.abspath(__file__))
if project_home not in sys.path:
    sys.path.insert(0, project_home)

# Load environment variables from .env file
from dotenv import load_dotenv
load_dotenv(os.path.join(project_home, '.env'))

# Import and create the Flask app
from app import create_app

application = create_app()   # PythonAnywhere looks for "application"

if __name__ == '__main__':
    application.run()