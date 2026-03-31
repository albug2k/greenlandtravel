# backend/app/models/gallery.py
from .base import db, TimestampMixin

class Gallery(db.Model, TimestampMixin):
    __tablename__ = 'galleries'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    slug = db.Column(db.String(200), unique=True, nullable=False, index=True)
    location = db.Column(db.String(200))
    country = db.Column(db.String(100))
    category = db.Column(db.String(50))
    description = db.Column(db.Text)
    featured = db.Column(db.Boolean, default=False)
    
    # Relationships
    images = db.relationship('GalleryImage', backref='gallery', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'slug': self.slug,
            'location': self.location,
            'country': self.country,
            'category': self.category,
            'description': self.description,
            'featured': self.featured,
            'images': [img.to_dict() for img in self.images],
            'created_at': self.created_at.isoformat()
        }

class GalleryImage(db.Model):
    __tablename__ = 'gallery_images'
    
    id = db.Column(db.Integer, primary_key=True)
    gallery_id = db.Column(db.Integer, db.ForeignKey('galleries.id'), nullable=False)
    image_url = db.Column(db.String(500), nullable=False)
    caption = db.Column(db.String(200))
    order = db.Column(db.Integer, default=0)
    
    def to_dict(self):
        return {
            'id': self.id,
            'image_url': self.image_url,
            'caption': self.caption
        }