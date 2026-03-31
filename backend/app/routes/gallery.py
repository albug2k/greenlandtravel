from flask import Blueprint, request, jsonify
from app.models import Gallery
from app.utils.decorators import paginate

gallery_bp = Blueprint('gallery', __name__)

@gallery_bp.route('/', methods=['GET'])
@paginate()
def get_gallery_items():
    query = Gallery.query
    
    # Search filter
    search = request.args.get('search', '').strip()
    if search:
        query = query.filter(or_(
            Gallery.title.ilike(f'%{search}%'),
            Gallery.description.ilike(f'%{search}%'),
            Gallery.location.ilike(f'%{search}%'),
            Gallery.country.ilike(f'%{search}%')
        ))
    
    # Category filter
    category = request.args.get('category')
    if category:
        query = query.filter_by(category=category)
    
    # Location filter
    location = request.args.get('location')
    if location:
        query = query.filter_by(location=location)
    
    # Country filter
    country = request.args.get('country')
    if country:
        query = query.filter_by(country=country)
    
    # Featured filter
    featured = request.args.get('featured', '').lower() == 'true'
    if featured:
        query = query.filter_by(featured=True)
    
    # Sort options
    sort_by = request.args.get('sort_by', 'created_at')
    sort_order = request.args.get('sort_order', 'desc')
    
    if sort_by == 'title':
        query = query.order_by(Gallery.title.asc())
    elif sort_by == 'random':
        from sqlalchemy import func
        query = query.order_by(func.random())
    else:
        if sort_order == 'asc':
            query = query.order_by(Gallery.created_at.asc())
        else:
            query = query.order_by(Gallery.created_at.desc())
    
    return query

@gallery_bp.route('/<int:gallery_id>', methods=['GET'])
def get_gallery_item(gallery_id):
    gallery = Gallery.query.get_or_404(gallery_id)
    return jsonify({
        'success': True,
        'data': gallery.to_dict()
    })

@gallery_bp.route('/slug/<slug>', methods=['GET'])
def get_gallery_by_slug(slug):
    gallery = Gallery.query.filter_by(slug=slug).first_or_404()
    return jsonify({
        'success': True,
        'data': gallery.to_dict()
    })

@gallery_bp.route('/featured', methods=['GET'])
def get_featured_gallery():
    gallery_items = Gallery.query.filter_by(
        featured=True
    ).order_by(Gallery.created_at.desc()).limit(12).all()
    
    return jsonify({
        'success': True,
        'data': [g.to_dict() for g in gallery_items]
    })

@gallery_bp.route('/categories', methods=['GET'])
def get_gallery_categories():
    categories = Gallery.query.with_entities(
        Gallery.category
    ).filter(
        Gallery.category.isnot(None)
    ).distinct().all()
    
    return jsonify({
        'success': True,
        'data': [c[0] for c in categories]
    })

@gallery_bp.route('/locations', methods=['GET'])
def get_gallery_locations():
    locations = Gallery.query.with_entities(
        Gallery.location
    ).filter(
        Gallery.location.isnot(None)
    ).distinct().all()
    
    return jsonify({
        'success': True,
        'data': [l[0] for l in locations]
    })