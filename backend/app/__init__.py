# backend/app/__init__.py
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from dotenv import load_dotenv
import os

load_dotenv()

# Initialize extensions without app
db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()

def create_app(config_class='app.config.Config'):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize extensions with app
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Register blueprints
    from app.routes import (
        home_bp, auth_bp, destinations_bp, tours_bp,
        packages_bp, blogs_bp, gallery_bp, bookings_bp,
        contact_bp, testimonials_bp, admin_bp
    )
    from app.routes.payments import payments_bp   # ← new

    app.register_blueprint(home_bp,         url_prefix='/api')
    app.register_blueprint(auth_bp,         url_prefix='/api/auth')
    app.register_blueprint(destinations_bp, url_prefix='/api/destinations')
    app.register_blueprint(tours_bp,        url_prefix='/api/tours')
    app.register_blueprint(packages_bp,     url_prefix='/api/packages')
    app.register_blueprint(blogs_bp,        url_prefix='/api/blogs')
    app.register_blueprint(gallery_bp,      url_prefix='/api/gallery')
    app.register_blueprint(bookings_bp,     url_prefix='/api/bookings')
    app.register_blueprint(contact_bp,      url_prefix='/api/contact')
    app.register_blueprint(testimonials_bp, url_prefix='/api/testimonials')
    app.register_blueprint(admin_bp,        url_prefix='/api/admin')
    app.register_blueprint(payments_bp,     url_prefix='/api/payments')  # ← new

    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return {'success': False, 'error': 'Not found'}, 404

    @app.errorhandler(500)
    def internal_error(error):
        db.session.rollback()
        return {'success': False, 'error': 'Internal server error'}, 500

    return app