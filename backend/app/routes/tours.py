from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.models import Tour
from app.utils.decorators import paginate
from sqlalchemy import or_

tours_bp = Blueprint('tours', __name__)

@tours_bp.route('/', methods=['GET'])
@paginate()
def get_tours():
    query = Tour.query.filter_by(available=True)
    
    # Search filter
    search = request.args.get('search', '').strip()
    if search:
        query = query.filter(or_(
            Tour.title.ilike(f'%{search}%'),
            Tour.description.ilike(f'%{search}%')
        ))
    
    # Destination filter
    destination_id = request.args.get('destination_id', type=int)
    if destination_id:
        query = query.filter_by(destination_id=destination_id)
    
    # Difficulty filter
    difficulty = request.args.get('difficulty')
    if difficulty:
        query = query.filter_by(difficulty=difficulty)
    
    # Season filter
    season = request.args.get('season')
    if season:
        query = query.filter_by(season=season)
    
    # Featured filter
    featured = request.args.get('featured', '').lower() == 'true'
    if featured:
        query = query.filter_by(featured=True)
    
    # Price filters
    min_price = request.args.get('min_price', type=float)
    max_price = request.args.get('max_price', type=float)
    if min_price is not None:
        query = query.filter(Tour.base_price >= min_price)
    if max_price is not None:
        query = query.filter(Tour.base_price <= max_price)
    
    # Sort options
    sort_by = request.args.get('sort_by', 'created_at')
    sort_order = request.args.get('sort_order', 'desc')
    
    if sort_by == 'price':
        if sort_order == 'asc':
            query = query.order_by(Tour.base_price.asc())
        else:
            query = query.order_by(Tour.base_price.desc())
    elif sort_by == 'rating':
        query = query.order_by(Tour.rating.desc())
    elif sort_by == 'duration':
        query = query.order_by(Tour.duration_days.desc())
    else:
        if sort_order == 'asc':
            query = query.order_by(Tour.created_at.asc())
        else:
            query = query.order_by(Tour.created_at.desc())
    
    return query

@tours_bp.route('/<int:tour_id>', methods=['GET'])
def get_tour(tour_id):
    tour = Tour.query.get_or_404(tour_id)
    
    if not tour.available:
        return jsonify({
            'success': False,
            'error': 'Tour is not available'
        }), 404
    
    return jsonify({
        'success': True,
        'data': tour.to_dict()
    }), 200

@tours_bp.route('/slug/<slug>', methods=['GET'])
def get_tour_by_slug(slug):
    tour = Tour.query.filter_by(slug=slug).first_or_404()
    
    if not tour.available:
        return jsonify({
            'success': False,
            'error': 'Tour is not available'
        }), 404
    
    return jsonify({
        'success': True,
        'data': tour.to_dict()
    }), 200

@tours_bp.route('/featured', methods=['GET'])
def get_featured_tours():
    tours = Tour.query.filter_by(
        featured=True,
        available=True
    ).order_by(Tour.rating.desc()).limit(6).all()
    
    return jsonify({
        'success': True,
        'data': [t.to_dict() for t in tours]
    }), 200

@tours_bp.route('/<int:tour_id>/similar', methods=['GET'])
def get_similar_tours(tour_id):
    tour = Tour.query.get_or_404(tour_id)
    
    similar_tours = Tour.query.filter(
        Tour.id != tour_id,
        Tour.destination_id == tour.destination_id,
        Tour.available == True
    ).order_by(Tour.rating.desc()).limit(3).all()
    
    return jsonify({
        'success': True,
        'data': [t.to_dict() for t in similar_tours]
    }), 200