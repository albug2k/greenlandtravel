from flask import Blueprint, jsonify
from app.models import Destination, Package, Blog, Testimonial, Gallery
from sqlalchemy import func

home_bp = Blueprint('home', __name__)

@home_bp.route('/', methods=['GET'])
def get_home_data():
    """Get data for homepage"""
    
    # Featured destinations
    featured_destinations = Destination.query.filter_by(
        featured=True, active=True
    ).order_by(func.random()).limit(4).all()
    
    # Popular packages
    popular_packages = Package.query.filter_by(
        featured=True, popular=True
    ).order_by(func.random()).limit(3).all()
    
    # Latest blogs
    latest_blogs = Blog.query.filter_by(
        published=True
    ).order_by(Blog.published_at.desc()).limit(4).all()
    
    # Featured testimonials
    featured_testimonials = Testimonial.query.filter_by(
        featured=True, verified=True
    ).order_by(func.random()).limit(6).all()
    
    # Featured gallery images
    featured_gallery = Gallery.query.filter_by(
        featured=True
    ).order_by(func.random()).limit(6).all()
    
    # Statistics
    stats = {
        'destinations_count': Destination.query.filter_by(active=True).count(),
        'tours_count': 125,  # Would query from tours table
        'happy_customers': 10000,
        'years_experience': 15
    }
    
    return jsonify({
        'success': True,
        'data': {
            'featured_destinations': [d.to_dict() for d in featured_destinations],
            'popular_packages': [p.to_dict() for p in popular_packages],
            'latest_blogs': [b.to_dict() for b in latest_blogs],
            'testimonials': [t.to_dict() for t in featured_testimonials],
            'gallery': [g.to_dict() for g in featured_gallery],
            'stats': stats
        }
    })