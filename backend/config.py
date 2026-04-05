# backend/app/config.py
import os
from datetime import timedelta


def _fix_db_url(url: str) -> str:
    """
    Render (and Heroku) provide PostgreSQL URLs starting with 'postgres://'
    but SQLAlchemy 1.4+ requires 'postgresql://'.
    This function fixes that automatically.
    """
    if url and url.startswith('postgres://'):
        return url.replace('postgres://', 'postgresql://', 1)
    return url


class Config:
    # ── Core ──────────────────────────────────────────────────────────────────
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-change-in-production')

    # ── Database ──────────────────────────────────────────────────────────────
    _raw_db_url = os.environ.get('DATABASE_URL', 'sqlite:///glttravel.db')
    SQLALCHEMY_DATABASE_URI      = _fix_db_url(_raw_db_url)
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS    = {
        'pool_pre_ping': True,
        'pool_recycle':  280,
    }

    # ── JWT ───────────────────────────────────────────────────────────────────
    JWT_SECRET_KEY            = os.environ.get('JWT_SECRET_KEY', 'jwt-secret-change-me')
    JWT_ACCESS_TOKEN_EXPIRES  = timedelta(hours=int(os.environ.get('JWT_ACCESS_TOKEN_EXPIRES', 24)))
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)

    # ── Mail ──────────────────────────────────────────────────────────────────
    MAIL_SERVER         = os.environ.get('MAIL_SERVER',         'smtp.gmail.com')
    MAIL_PORT           = int(os.environ.get('MAIL_PORT',        587))
    MAIL_USE_TLS        = os.environ.get('MAIL_USE_TLS',        'True') == 'True'
    MAIL_USERNAME       = os.environ.get('MAIL_USERNAME',       '')
    MAIL_PASSWORD       = os.environ.get('MAIL_PASSWORD',       '')
    MAIL_DEFAULT_SENDER = os.environ.get('MAIL_DEFAULT_SENDER', '')

    # ── Stripe ────────────────────────────────────────────────────────────────
    STRIPE_SECRET_KEY     = os.environ.get('STRIPE_SECRET_KEY',     '')
    STRIPE_WEBHOOK_SECRET = os.environ.get('STRIPE_WEBHOOK_SECRET', '')

    # ── Frontend URL ──────────────────────────────────────────────────────────
    FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:8080')


class DevelopmentConfig(Config):
    DEBUG = True


class ProductionConfig(Config):
    DEBUG                   = False
    SESSION_COOKIE_SECURE   = True
    SESSION_COOKIE_HTTPONLY = True
    REMEMBER_COOKIE_SECURE  = True