# backend/app/models/__init__.py
from .base import db, TimestampMixin
from .user import User
from .destination import Destination, DestinationHighlight, DestinationGallery
from .tour import Tour, TourItinerary, TourInclusion, TourExclusion
from .blog import Blog
from .gallery import Gallery, GalleryImage
from .booking import Booking, Payment
from .contact import ContactMessage
from .testimonial import Testimonial
from .package import Package, PackageFeature, PackageItinerary

__all__ = [
    'db',
    'TimestampMixin',
    'User',
    'Destination',
    'DestinationHighlight',
    'DestinationGallery',
    'Tour',
    'TourItinerary',
    'TourInclusion',
    'TourExclusion',
    'Blog',
    'Gallery',
    'GalleryImage',
    'Booking',
    'Payment',
    'ContactMessage',
    'Testimonial',
    'Package',
    'PackageFeature',
    'PackageItinerary',
]