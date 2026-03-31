# backend/app/routes/packages.py
from flask import Blueprint, request, jsonify
from app.models import Package
from app.utils.decorators import paginate
from sqlalchemy import or_

packages_bp = Blueprint('packages', __name__)

@packages_bp.route('/', methods=['GET'])
@paginate()
def get_packages():
    query = Package.query
    
    # Search filter
    search = request.args.get('search', '').strip()
    if search:
        query = query.filter(or_(
            Package.title.ilike(f'%{search}%'),
            Package.description.ilike(f'%{search}%'),
            Package.tags.ilike(f'%{search}%')
        ))
    
    # Category filters
    category = request.args.get('category')
    if category:
        query = query.filter_by(category=category)
    
    difficulty = request.args.get('difficulty')
    if difficulty:
        query = query.filter_by(difficulty=difficulty)
    
    season = request.args.get('season')
    if season:
        query = query.filter_by(season=season)
    
    featured = request.args.get('featured', '').lower() == 'true'
    if featured:
        query = query.filter_by(featured=True)
    
    popular = request.args.get('popular', '').lower() == 'true'
    if popular:
        query = query.filter_by(popular=True)
    
    # Price filters
    min_price = request.args.get('min_price', type=float)
    max_price = request.args.get('max_price', type=float)
    if min_price is not None:
        query = query.filter(Package.base_price >= min_price)
    if max_price is not None:
        query = query.filter(Package.base_price <= max_price)
    
    # Duration filter
    min_days = request.args.get('min_days', type=int)
    max_days = request.args.get('max_days', type=int)
    
    # Sort options
    sort_by = request.args.get('sort_by', 'created_at')
    sort_order = request.args.get('sort_order', 'desc')
    
    if sort_by == 'price':
        if sort_order == 'asc':
            query = query.order_by(Package.base_price.asc())
        else:
            query = query.order_by(Package.base_price.desc())
    elif sort_by == 'rating':
        query = query.order_by(Package.rating.desc())
    elif sort_by == 'name':
        query = query.order_by(Package.title.asc())
    else:
        if sort_order == 'asc':
            query = query.order_by(Package.created_at.asc())
        else:
            query = query.order_by(Package.created_at.desc())
    
    return query

@packages_bp.route('/<int:package_id>', methods=['GET'])
def get_package(package_id):
    package = Package.query.get_or_404(package_id)
    
    # Parse destinations
    destinations_data = []
    if package.destinations:
        from app.models import Destination
        dest_ids = [int(d.strip()) for d in package.destinations.split(',') if d.strip()]
        if dest_ids:
            destinations = Destination.query.filter(
                Destination.id.in_(dest_ids)
            ).all()
            destinations_data = [d.to_dict() for d in destinations]
    
    package_data = package.to_dict()
    package_data['destinations_data'] = destinations_data
    
    return jsonify({
        'success': True,
        'data': package_data
    })

@packages_bp.route('/slug/<slug>', methods=['GET'])
def get_package_by_slug(slug):
    package = Package.query.filter_by(slug=slug).first_or_404()
    return jsonify({
        'success': True,
        'data': package.to_dict()
    })

@packages_bp.route('/featured', methods=['GET'])
def get_featured_packages():
    packages = Package.query.filter_by(
        featured=True
    ).order_by(Package.rating.desc()).limit(6).all()
    
    return jsonify({
        'success': True,
        'data': [p.to_dict() for p in packages]
    })

@packages_bp.route('/categories', methods=['GET'])
def get_package_categories():
    categories = Package.query.with_entities(
        Package.category
    ).filter(
        Package.category.isnot(None)
    ).distinct().all()
    
    return jsonify({
        'success': True,
        'data': [c[0] for c in categories]
    })