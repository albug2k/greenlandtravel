# backend/app/models/booking.py
from .base import db, TimestampMixin
import uuid

class Booking(db.Model, TimestampMixin):
    __tablename__ = 'bookings'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    tour_id = db.Column(db.Integer, db.ForeignKey('tours.id'))
    package_id = db.Column(db.Integer, db.ForeignKey('packages.id'))
    destination = db.Column(db.String(200), nullable=False)
    travel_date = db.Column(db.Date, nullable=False)
    return_date = db.Column(db.Date)
    guests = db.Column(db.Integer, nullable=False)
    special_requests = db.Column(db.Text)
    status = db.Column(db.String(20), default='pending', index=True)  # pending, confirmed, cancelled, completed
    payment_status = db.Column(db.String(20), default='pending')  # pending, paid, partially_paid, refunded
    total_price = db.Column(db.Float, nullable=False)
    booking_reference = db.Column(db.String(50), unique=True, index=True, default=lambda: f"GLT-{uuid.uuid4().hex[:8].upper()}")
    
    # Relationships
    payments = db.relationship('Payment', backref='booking', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'booking_reference': self.booking_reference,
            'user_id': self.user_id,
            'tour_id': self.tour_id,
            'package_id': self.package_id,
            'destination': self.destination,
            'travel_date': self.travel_date.strftime('%Y-%m-%d') if self.travel_date else None,
            'return_date': self.return_date.strftime('%Y-%m-%d') if self.return_date else None,
            'guests': self.guests,
            'special_requests': self.special_requests,
            'status': self.status,
            'payment_status': self.payment_status,
            'total_price': self.total_price,
            'created_at': self.created_at.isoformat()
        }

class Payment(db.Model, TimestampMixin):
    __tablename__ = 'payments'
    
    id = db.Column(db.Integer, primary_key=True)
    booking_id = db.Column(db.Integer, db.ForeignKey('bookings.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    payment_method = db.Column(db.String(50))  # credit_card, paypal, stripe, bank_transfer
    transaction_id = db.Column(db.String(100), unique=True, index=True)
    status = db.Column(db.String(20), default='pending')  # pending, completed, failed, refunded
    currency = db.Column(db.String(3), default='USD')
    payment_details = db.Column(db.JSON)  # Store payment gateway response
    
    def to_dict(self):
        return {
            'id': self.id,
            'booking_id': self.booking_id,
            'amount': self.amount,
            'payment_method': self.payment_method,
            'transaction_id': self.transaction_id,
            'status': self.status,
            'currency': self.currency,
            'created_at': self.created_at.isoformat()
        }