from .auth import auth_bp
from .destinations import destinations_bp
from .tours import tours_bp
from .packages import packages_bp
from .blogs import blogs_bp
from .gallery import gallery_bp
from .bookings import bookings_bp
from .contact import contact_bp
from .testimonials import testimonials_bp
from .home import home_bp
from .admin import admin_bp

__all__ = [
    'auth_bp',
    'destinations_bp',
    'tours_bp',
    'packages_bp',
    'blogs_bp',
    'gallery_bp',
    'bookings_bp',
    'contact_bp',
    'testimonials_bp',
    'home_bp',
    'admin_bp',
]