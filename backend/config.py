# backend/app/config.py
import os
from datetime import timedelta


def _fix_db_url(url: str) -> str:
    """
    1. Render provides 'postgres://' — SQLAlchemy needs 'postgresql://'
    2. Switch dialect to pg8000 (pure Python, works on all Python versions)
       'postgresql://...'  →  'postgresql+pg8000://...'
    """
    if not url:
        return url
    # Fix Render's postgres:// prefix
    if url.startswith('postgres://'):
        url = url.replace('postgres://', 'postgresql://', 1)
    # Switch to pg8000 driver if not already set and it's a postgres URL
    if url.startswith('postgresql://') and '+' not in url.split('://')[0]:
        url = url.replace('postgresql://', 'postgresql+pg8000://', 1)
    return url


class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-change-in-production')

    _raw_db_url = os.environ.get('DATABASE_URL', 'sqlite:///greenlandtour.db')
    SQLALCHEMY_DATABASE_URI       = _fix_db_url(_raw_db_url)
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS     = {
        'pool_pre_ping': True,
        'pool_recycle':  280,
    }

    JWT_SECRET_KEY            = os.environ.get('JWT_SECRET_KEY', 'jwt-secret-change-me')
    JWT_ACCESS_TOKEN_EXPIRES  = timedelta(hours=int(os.environ.get('JWT_ACCESS_TOKEN_EXPIRES', 24)))
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)

    MAIL_SERVER         = os.environ.get('MAIL_SERVER',         'smtp.gmail.com')
    MAIL_PORT           = int(os.environ.get('MAIL_PORT',        587))
    MAIL_USE_TLS        = os.environ.get('MAIL_USE_TLS',        'True') == 'True'
    MAIL_USERNAME       = os.environ.get('MAIL_USERNAME',       '')
    MAIL_PASSWORD       = os.environ.get('MAIL_PASSWORD',       '')
    MAIL_DEFAULT_SENDER = os.environ.get('MAIL_DEFAULT_SENDER', '')

    STRIPE_SECRET_KEY     = os.environ.get('STRIPE_SECRET_KEY',     '')
    STRIPE_WEBHOOK_SECRET = os.environ.get('STRIPE_WEBHOOK_SECRET', '')

    FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:8080')


class DevelopmentConfig(Config):
    DEBUG = True


class ProductionConfig(Config):
    DEBUG                   = False
    SESSION_COOKIE_SECURE   = True
    SESSION_COOKIE_HTTPONLY = True
    REMEMBER_COOKIE_SECURE  = True