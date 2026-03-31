# backend/app/models/destination.py
from .base import db, TimestampMixin

class Package(db.Model, TimestampMixin):
    __tablename__ = 'packages'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    slug = db.Column(db.String(200), unique=True, nullable=False, index=True)
    image_url = db.Column(db.String(500))
    description = db.Column(db.Text)
    duration = db.Column(db.String(100))
    group_size = db.Column(db.String(100))
    base_price = db.Column(db.Float, nullable=False)
    discount_price = db.Column(db.Float)
    rating = db.Column(db.Float, default=0.0)
    reviews_count = db.Column(db.Integer, default=0)
    featured = db.Column(db.Boolean, default=False)
    popular = db.Column(db.Boolean, default=False)
    category = db.Column(db.String(50))  # romance, adventure, family, luxury
    difficulty = db.Column(db.String(20))
    season = db.Column(db.String(50))
    destinations = db.Column(db.String(500))  # Comma-separated destination IDs
    tags = db.Column(db.String(500))  # Comma-separated tags
    
    # Relationships
    features = db.relationship('PackageFeature', backref='package', lazy=True, cascade='all, delete-orphan')
    itinerary_items = db.relationship('PackageItinerary', backref='package', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'slug': self.slug,
            'image_url': self.image_url,
            'description': self.description,
            'duration': self.duration,
            'group_size': self.group_size,
            'base_price': self.base_price,
            'discount_price': self.discount_price,
            'rating': self.rating,
            'reviews': self.reviews_count,
            'featured': self.featured,
            'popular': self.popular,
            'category': self.category,
            'difficulty': self.difficulty,
            'season': self.season,
            'destinations': self.destinations.split(',') if self.destinations else [],
            'tags': self.tags.split(',') if self.tags else [],
            'features': [f.to_dict() for f in self.features],
            'itinerary': [item.to_dict() for item in self.itinerary_items]
        }

class PackageFeature(db.Model):
    __tablename__ = 'package_features'
    
    id = db.Column(db.Integer, primary_key=True)
    package_id = db.Column(db.Integer, db.ForeignKey('packages.id'), nullable=False)
    text = db.Column(db.String(200), nullable=False)
    icon = db.Column(db.String(50))
    
    def to_dict(self):
        return {
            'id': self.id,
            'text': self.text,
            'icon': self.icon
        }

class PackageItinerary(db.Model):
    __tablename__ = 'package_itinerary'
    
    id = db.Column(db.Integer, primary_key=True)
    package_id = db.Column(db.Integer, db.ForeignKey('packages.id'), nullable=False)
    day_number = db.Column(db.Integer, nullable=False)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    
    def to_dict(self):
        return {
            'day': self.day_number,
            'title': self.title,
            'description': self.description
        }