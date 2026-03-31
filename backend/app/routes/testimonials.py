# backend/app/routes/testimonials.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import Testimonial, User
from app.utils.decorators import paginate
from sqlalchemy import func

testimonials_bp = Blueprint('testimonials', __name__)

@testimonials_bp.route('/', methods=['GET'])
@paginate()
def get_testimonials():
    query = Testimonial.query.filter_by(verified=True)
    
    # Filter by rating
    min_rating = request.args.get('min_rating', type=float)
    if min_rating:
        query = query.filter(Testimonial.rating >= min_rating)
    
    # Filter by destination
    destination = request.args.get('destination')
    if destination:
        query = query.filter_by(destination=destination)
    
    # Filter by package
    package = request.args.get('package')
    if package:
        query = query.filter_by(tour_package=package)
    
    # Featured filter
    featured = request.args.get('featured', '').lower() == 'true'
    if featured:
        query = query.filter_by(featured=True)
    
    # Sort options
    sort_by = request.args.get('sort_by', 'created_at')
    sort_order = request.args.get('sort_order', 'desc')
    
    if sort_by == 'rating':
        query = query.order_by(Testimonial.rating.desc())
    elif sort_by == 'random':
        query = query.order_by(func.random())
    else:
        if sort_order == 'asc':
            query = query.order_by(Testimonial.created_at.asc())
        else:
            query = query.order_by(Testimonial.created_at.desc())
    
    return query

@testimonials_bp.route('/', methods=['POST'])
@jwt_required()
def create_testimonial():
    user_id = get_jwt_identity()
    data = request.json
    
    # Check if user has already submitted a testimonial for this destination/package
    existing = Testimonial.query.filter_by(
        user_id=user_id,
        destination=data.get('destination'),
        tour_package=data.get('tour_package')
    ).first()
    
    if existing:
        return jsonify({
            'success': False,
            'error': 'You have already submitted a testimonial for this destination/package'
        }), 400
    
    testimonial = Testimonial(
        user_id=user_id,
        name=data['name'],
        role=data.get('role', ''),
        company=data.get('company', ''),
        content=data['content'],
        rating=data['rating'],
        destination=data.get('destination'),
        tour_package=data.get('tour_package'),
        verified=False  # Needs admin approval
    )
    
    from app import db
    db.session.add(testimonial)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': 'Testimonial submitted for review',
        'data': testimonial.to_dict()
    }), 201

@testimonials_bp.route('/featured', methods=['GET'])
def get_featured_testimonials():
    testimonials = Testimonial.query.filter_by(
        featured=True,
        verified=True
    ).order_by(Testimonial.rating.desc()).limit(6).all()
    
    return jsonify({
        'success': True,
        'data': [t.to_dict() for t in testimonials]
    }), 200

@testimonials_bp.route('/stats', methods=['GET'])
def get_testimonial_stats():
    from app import db
    
    # Calculate average rating
    avg_rating = db.session.query(
        func.avg(Testimonial.rating)
    ).filter(
        Testimonial.verified == True
    ).scalar() or 0
    
    # Count by rating
    rating_counts = db.session.query(
        Testimonial.rating,
        func.count(Testimonial.id)
    ).filter(
        Testimonial.verified == True
    ).group_by(Testimonial.rating).all()
    
    # Total count
    total_count = Testimonial.query.filter_by(verified=True).count()
    
    return jsonify({
        'success': True,
        'data': {
            'average_rating': round(avg_rating, 1),
            'total_count': total_count,
            'rating_distribution': [
                {'rating': rating, 'count': count}
                for rating, count in rating_counts
            ]
        }
    }), 200

@testimonials_bp.route('/<int:testimonial_id>/verify', methods=['PUT'])
@jwt_required()
def verify_testimonial(testimonial_id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user or not user.is_admin:
        return jsonify({'success': False, 'error': 'Unauthorized'}), 403
    
    testimonial = Testimonial.query.get_or_404(testimonial_id)
    testimonial.verified = True
    
    from app import db
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': 'Testimonial verified successfully'
    }), 200

@testimonials_bp.route('/<int:testimonial_id>/feature', methods=['PUT'])
@jwt_required()
def feature_testimonial(testimonial_id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user or not user.is_admin:
        return jsonify({'success': False, 'error': 'Unauthorized'}), 403
    
    testimonial = Testimonial.query.get_or_404(testimonial_id)
    
    if not testimonial.verified:
        return jsonify({
            'success': False,
            'error': 'Cannot feature unverified testimonial'
        }), 400
    
    testimonial.featured = not testimonial.featured
    
    from app import db
    db.session.commit()
    
    action = 'featured' if testimonial.featured else 'unfeatured'
    return jsonify({
        'success': True,
        'message': f'Testimonial {action} successfully'
    }), 200