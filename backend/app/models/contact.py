# backend/app/models/contact.py
from .base import db, TimestampMixin

class ContactMessage(db.Model, TimestampMixin):
    __tablename__ = 'contact_messages'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), nullable=False, index=True)
    subject = db.Column(db.String(200))
    message = db.Column(db.Text, nullable=False)
    read = db.Column(db.Boolean, default=False)
    replied = db.Column(db.Boolean, default=False)
    reply_message = db.Column(db.Text)
    category = db.Column(db.String(50))  # general, booking, support, feedback
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'subject': self.subject,
            'message': self.message,
            'read': self.read,
            'replied': self.replied,
            'category': self.category,
            'created_at': self.created_at.isoformat()
        }