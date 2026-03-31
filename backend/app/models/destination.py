# backend/app/models/destination.py
from .base import db, TimestampMixin

class Destination(db.Model, TimestampMixin):
    __tablename__ = 'destinations'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    slug = db.Column(db.String(200), unique=True, nullable=False, index=True)
    image_url = db.Column(db.String(500))
    thumbnail_url = db.Column(db.String(500))
    description = db.Column(db.Text, nullable=False)
    location = db.Column(db.String(200))
    country = db.Column(db.String(100))
    continent = db.Column(db.String(50))
    best_time = db.Column(db.String(100))
    avg_temp = db.Column(db.String(50))
    currency = db.Column(db.String(50))
    language = db.Column(db.String(100))
    visa_info = db.Column(db.Text)
    base_price = db.Column(db.Float, nullable=False, default=1999.00)
    featured = db.Column(db.Boolean, default=False)
    popular = db.Column(db.Boolean, default=False)
    active = db.Column(db.Boolean, default=True)
    views = db.Column(db.Integer, default=0)
    
    # Relationships
    highlights = db.relationship('DestinationHighlight', backref='destination', lazy=True, cascade='all, delete-orphan')
    gallery_images = db.relationship('DestinationGallery', backref='destination', lazy=True, cascade='all, delete-orphan')
    tours = db.relationship('Tour', backref='destination', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'slug': self.slug,
            'image_url': self.image_url,
            'thumbnail_url': self.thumbnail_url,
            'description': self.description,
            'location': self.location,
            'country': self.country,
            'continent': self.continent,
            'best_time': self.best_time,
            'avg_temp': self.avg_temp,
            'currency': self.currency,
            'language': self.language,
            'visa_info': self.visa_info,
            'base_price': self.base_price,
            'featured': self.featured,
            'popular': self.popular,
            'active': self.active,
            'views': self.views,
            'highlights': [h.to_dict() for h in self.highlights],
            'gallery': [img.to_dict() for img in self.gallery_images],
            'tours_count': len(self.tours)
        }

class DestinationHighlight(db.Model):
    __tablename__ = 'destination_highlights'
    
    id = db.Column(db.Integer, primary_key=True)
    destination_id = db.Column(db.Integer, db.ForeignKey('destinations.id'), nullable=False)
    text = db.Column(db.String(200), nullable=False)
    icon = db.Column(db.String(50))
    order = db.Column(db.Integer, default=0)
    
    def to_dict(self):
        return {
            'id': self.id,
            'text': self.text,
            'icon': self.icon
        }

class DestinationGallery(db.Model):
    __tablename__ = 'destination_gallery'
    
    id = db.Column(db.Integer, primary_key=True)
    destination_id = db.Column(db.Integer, db.ForeignKey('destinations.id'), nullable=False)
    image_url = db.Column(db.String(500), nullable=False)
    caption = db.Column(db.String(200))
    order = db.Column(db.Integer, default=0)
    
    def to_dict(self):
        return {
            'id': self.id,
            'image_url': self.image_url,
            'caption': self.caption
        }