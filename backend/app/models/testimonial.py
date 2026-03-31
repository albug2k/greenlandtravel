# backend/app/models/testimonial.py
from .base import db, TimestampMixin

class Testimonial(db.Model, TimestampMixin):
    __tablename__ = 'testimonials'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))  # Add this line
    name = db.Column(db.String(100), nullable=False)
    role = db.Column(db.String(100))
    company = db.Column(db.String(100))
    content = db.Column(db.Text, nullable=False)
    rating = db.Column(db.Float, nullable=False)
    avatar_url = db.Column(db.String(500))
    featured = db.Column(db.Boolean, default=False)
    verified = db.Column(db.Boolean, default=True)
    destination = db.Column(db.String(200))
    tour_package = db.Column(db.String(200))
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'name': self.name,
            'role': self.role,
            'company': self.company,
            'content': self.content,
            'rating': self.rating,
            'avatar_url': self.avatar_url,
            'featured': self.featured,
            'verified': self.verified,
            'destination': self.destination,
            'tour_package': self.tour_package,
            'created_at': self.created_at.isoformat()
        }