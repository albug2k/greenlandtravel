# backend/app/models/tour.py
from .base import db, TimestampMixin

class Tour(db.Model, TimestampMixin):
    __tablename__ = 'tours'
    
    id = db.Column(db.Integer, primary_key=True)
    destination_id = db.Column(db.Integer, db.ForeignKey('destinations.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    slug = db.Column(db.String(200), unique=True, nullable=False, index=True)
    description = db.Column(db.Text)
    duration_days = db.Column(db.Integer, nullable=False)
    duration_nights = db.Column(db.Integer, nullable=False)
    base_price = db.Column(db.Float, nullable=False)
    discount_price = db.Column(db.Float)
    group_size_min = db.Column(db.Integer, default=1)
    group_size_max = db.Column(db.Integer, default=10)
    rating = db.Column(db.Float, default=0.0)
    reviews_count = db.Column(db.Integer, default=0)
    featured = db.Column(db.Boolean, default=False)
    available = db.Column(db.Boolean, default=True)
    difficulty = db.Column(db.String(20))  # easy, moderate, challenging
    season = db.Column(db.String(50))  # summer, winter, all-year
    
    # Relationships
    itinerary_items = db.relationship('TourItinerary', backref='tour', lazy=True, cascade='all, delete-orphan')
    inclusions = db.relationship('TourInclusion', backref='tour', lazy=True, cascade='all, delete-orphan')
    exclusions = db.relationship('TourExclusion', backref='tour', lazy=True, cascade='all, delete-orphan')
    bookings = db.relationship('Booking', backref='tour', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'destination_id': self.destination_id,
            'title': self.title,
            'slug': self.slug,
            'description': self.description,
            'duration': f"{self.duration_days} Days / {self.duration_nights} Nights",
            'duration_days': self.duration_days,
            'duration_nights': self.duration_nights,
            'base_price': self.base_price,
            'discount_price': self.discount_price,
            'group_size': f"{self.group_size_min}-{self.group_size_max} people",
            'rating': self.rating,
            'reviews': self.reviews_count,
            'featured': self.featured,
            'available': self.available,
            'difficulty': self.difficulty,
            'season': self.season,
            'itinerary': [item.to_dict() for item in self.itinerary_items],
            'included': [item.to_dict() for item in self.inclusions],
            'not_included': [item.to_dict() for item in self.exclusions]
        }

class TourItinerary(db.Model):
    __tablename__ = 'tour_itinerary'
    
    id = db.Column(db.Integer, primary_key=True)
    tour_id = db.Column(db.Integer, db.ForeignKey('tours.id'), nullable=False)
    day_number = db.Column(db.Integer, nullable=False)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    accommodation = db.Column(db.String(200))
    meals = db.Column(db.String(100))  # B, L, D, etc.
    order = db.Column(db.Integer, default=0)
    
    def to_dict(self):
        return {
            'day': self.day_number,
            'title': self.title,
            'description': self.description,
            'accommodation': self.accommodation,
            'meals': self.meals
        }

class TourInclusion(db.Model):
    __tablename__ = 'tour_inclusions'
    
    id = db.Column(db.Integer, primary_key=True)
    tour_id = db.Column(db.Integer, db.ForeignKey('tours.id'), nullable=False)
    text = db.Column(db.String(200), nullable=False)
    icon = db.Column(db.String(50))
    
    def to_dict(self):
        return {
            'id': self.id,
            'text': self.text,
            'icon': self.icon
        }

class TourExclusion(db.Model):
    __tablename__ = 'tour_exclusions'
    
    id = db.Column(db.Integer, primary_key=True)
    tour_id = db.Column(db.Integer, db.ForeignKey('tours.id'), nullable=False)
    text = db.Column(db.String(200), nullable=False)
    
    def to_dict(self):
        return {
            'id': self.id,
            'text': self.text
        }