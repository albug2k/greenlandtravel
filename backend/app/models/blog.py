# backend/app/models/blog.py
from .base import db, TimestampMixin

class Blog(db.Model, TimestampMixin):
    __tablename__ = 'blogs'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    slug = db.Column(db.String(200), unique=True, nullable=False, index=True)
    image_url = db.Column(db.String(500))
    thumbnail_url = db.Column(db.String(500))
    excerpt = db.Column(db.String(300))
    content = db.Column(db.Text, nullable=False)
    author = db.Column(db.String(100))
    author_avatar = db.Column(db.String(500))
    category = db.Column(db.String(50))
    read_time = db.Column(db.String(20))
    published_at = db.Column(db.DateTime, default=db.func.now())
    published = db.Column(db.Boolean, default=True)
    featured = db.Column(db.Boolean, default=False)
    views = db.Column(db.Integer, default=0)
    tags = db.Column(db.String(500))
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'slug': self.slug,
            'image_url': self.image_url,
            'thumbnail_url': self.thumbnail_url,
            'excerpt': self.excerpt,
            'content': self.content,
            'author': self.author,
            'author_avatar': self.author_avatar,
            'category': self.category,
            'read_time': self.read_time,
            'date': self.published_at.strftime('%b %d, %Y'),
            'published_at': self.published_at.isoformat(),
            'published': self.published,
            'featured': self.featured,
            'views': self.views,
            'tags': self.tags.split(',') if self.tags else []
        }