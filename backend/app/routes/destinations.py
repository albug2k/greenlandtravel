# backend/app/routes/destinations.py
from flask import Blueprint, request, jsonify
from app.models import Destination, Tour
from app.utils.decorators import paginate
from sqlalchemy import or_

destinations_bp = Blueprint('destinations', __name__)

@destinations_bp.route('/', methods=['GET'])
@paginate()
def get_destinations():
    query = Destination.query.filter_by(active=True)
    
    # Search filter
    search = request.args.get('search', '').strip()
    if search:
        query = query.filter(or_(
            Destination.title.ilike(f'%{search}%'),
            Destination.description.ilike(f'%{search}%'),
            Destination.location.ilike(f'%{search}%'),
            Destination.country.ilike(f'%{search}%')
        ))
    
    # Category filters
    continent = request.args.get('continent')
    if continent:
        query = query.filter_by(continent=continent)
    
    country = request.args.get('country')
    if country:
        query = query.filter_by(country=country)
    
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
        query = query.filter(Destination.base_price >= min_price)
    if max_price is not None:
        query = query.filter(Destination.base_price <= max_price)
    
    # Sort options
    sort_by = request.args.get('sort_by', 'created_at')
    sort_order = request.args.get('sort_order', 'desc')
    
    if sort_by == 'price':
        if sort_order == 'asc':
            query = query.order_by(Destination.base_price.asc())
        else:
            query = query.order_by(Destination.base_price.desc())
    elif sort_by == 'name':
        query = query.order_by(Destination.title.asc())
    else:
        if sort_order == 'asc':
            query = query.order_by(Destination.created_at.asc())
        else:
            query = query.order_by(Destination.created_at.desc())
    
    return query

@destinations_bp.route('/<int:destination_id>', methods=['GET'])
def get_destination(destination_id):
    destination = Destination.query.get_or_404(destination_id)
    
    # Increment view count
    destination.views += 1
    from app.models import db
    db.session.commit()
    
    # Get related tours
    tours = Tour.query.filter_by(
        destination_id=destination_id,
        available=True
    ).order_by(Tour.base_price.asc()).limit(5).all()
    
    destination_data = destination.to_dict()
    destination_data['tours'] = [t.to_dict() for t in tours]
    
    return jsonify({
        'success': True,
        'data': destination_data
    })

@destinations_bp.route('/slug/<slug>', methods=['GET'])
def get_destination_by_slug(slug):
    destination = Destination.query.filter_by(slug=slug).first_or_404()
    
    # Increment view count
    destination.views += 1
    from app.models import db
    db.session.commit()
    
    return jsonify({
        'success': True,
        'data': destination.to_dict()
    })

@destinations_bp.route('/featured', methods=['GET'])
def get_featured_destinations():
    destinations = Destination.query.filter_by(
        featured=True,
        active=True
    ).order_by(Destination.created_at.desc()).limit(8).all()
    
    return jsonify({
        'success': True,
        'data': [d.to_dict() for d in destinations]
    })

@destinations_bp.route('/popular', methods=['GET'])
def get_popular_destinations():
    destinations = Destination.query.filter_by(
        popular=True,
        active=True
    ).order_by(Destination.views.desc()).limit(6).all()
    
    return jsonify({
        'success': True,
        'data': [d.to_dict() for d in destinations]
    })

@destinations_bp.route('/continents', methods=['GET'])
def get_continents():
    continents = Destination.query.with_entities(
        Destination.continent
    ).filter(
        Destination.continent.isnot(None),
        Destination.active == True
    ).distinct().all()
    
    return jsonify({
        'success': True,
        'data': [c[0] for c in continents]
    })

@destinations_bp.route('/countries', methods=['GET'])
def get_countries():
    countries = Destination.query.with_entities(
        Destination.country
    ).filter(
        Destination.country.isnot(None),
        Destination.active == True
    ).distinct().all()
    
    return jsonify({
        'success': True,
        'data': [c[0] for c in countries]
    })