from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import User, Destination, Package, Blog, Gallery, Booking
from app.utils.decorators import admin_required
from sqlalchemy import func
from app.utils.decorators import admin_required, validate_json

admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/stats', methods=['GET'])
@admin_required
def get_stats():
    stats = {
        'users': User.query.count(),
        'destinations': Destination.query.count(),
        'packages': Package.query.count(),
        'blogs': Blog.query.count(),
        'gallery_items': Gallery.query.count(),
        'bookings': Booking.query.count(),
        'recent_bookings': [b.to_dict() for b in Booking.query.order_by(
            Booking.created_at.desc()
        ).limit(10).all()]
    }
    return jsonify({'success': True, 'data': stats}), 200


# ── Users ─────────────────────────────────────────────────────────────────────

@admin_bp.route('/users', methods=['GET'])
@admin_required
def get_users():
    users = User.query.order_by(User.created_at.desc()).all()
    return jsonify({
        'success': True,
        'data': [user.to_dict() for user in users]
    }), 200

@admin_bp.route('/users/<int:user_id>', methods=['PUT'])
@admin_required
def update_user(user_id):
    data = request.json or {}
    user = User.query.get_or_404(user_id)

    if 'name'      in data: user.name      = data['name']
    if 'phone'     in data: user.phone     = data['phone']
    if 'is_active' in data: user.is_active = data['is_active']
    if 'is_admin'  in data: user.is_admin  = data['is_admin']
    if 'avatar_url'in data: user.avatar_url= data['avatar_url']

    # Allow admin to update email (check uniqueness first)
    if 'email' in data and data['email'] != user.email:
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'success': False, 'error': 'Email already in use'}), 409
        user.email = data['email']

    # Allow admin to reset a user's password
    if 'password' in data and data['password']:
        user.set_password(data['password'])

    db.session.commit()
    # Return full user dict including is_active
    user_dict = user.to_dict()
    user_dict['is_active'] = user.is_active
    return jsonify({
        'success': True,
        'message': 'User updated successfully',
        'data': user_dict
    }), 200

@admin_bp.route('/users/<int:user_id>', methods=['DELETE'])
@admin_required
def delete_user(user_id):
    current_user_id = get_jwt_identity()
    if int(current_user_id) == user_id:
        return jsonify({'success': False, 'error': 'You cannot delete your own account'}), 400

    user = User.query.get_or_404(user_id)
    db.session.delete(user)
    db.session.commit()
    return jsonify({'success': True, 'message': 'User deleted successfully'}), 200


# ── Destinations ──────────────────────────────────────────────────────────────

@admin_bp.route('/destinations', methods=['GET'])
@admin_required
def get_all_destinations():
    """Admin-only: returns ALL destinations regardless of active status."""
    page     = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 200, type=int)
    search   = request.args.get('search', '').strip()

    query = Destination.query  # NO active=True filter — admin sees everything

    if search:
        query = query.filter(
            db.or_(
                Destination.title.ilike(f'%{search}%'),
                Destination.location.ilike(f'%{search}%'),
                Destination.country.ilike(f'%{search}%'),
            )
        )

    paginated = query.order_by(Destination.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    return jsonify({
        'success': True,
        'data': {
            'items': [d.to_dict() for d in paginated.items],
            'total': paginated.total,
            'page':  paginated.page,
            'pages': paginated.pages,
        }
    }), 200

@admin_bp.route('/destinations', methods=['POST'])
@admin_required
@validate_json({'title': str, 'description': str, 'location': str})
def create_destination():
    data = request.json
    destination = Destination(
        title       = data['title'],
        slug        = data.get('slug', data['title'].lower().replace(' ', '-')),
        description = data['description'],
        location    = data['location'],
        country     = data.get('country', ''),
        continent   = data.get('continent', ''),
        best_time   = data.get('best_time', ''),
        avg_temp    = data.get('avg_temp', ''),
        currency    = data.get('currency', ''),
        language    = data.get('language', ''),
        base_price  = data.get('base_price', 1999.00),
        featured    = data.get('featured', False),
        popular     = data.get('popular', False),
        active      = data.get('active', True),
    )
    db.session.add(destination)
    db.session.commit()
    return jsonify({
        'success': True,
        'message': 'Destination created successfully',
        'data': destination.to_dict()
    }), 201

@admin_bp.route('/destinations/<int:destination_id>', methods=['PUT'])
@admin_required
def update_destination(destination_id):
    data        = request.json
    destination = Destination.query.get_or_404(destination_id)
    updatable   = [
        'title', 'description', 'location', 'country', 'continent',
        'best_time', 'avg_temp', 'currency', 'language', 'base_price',
        'featured', 'popular', 'active',
    ]
    for field in updatable:
        if field in data:
            setattr(destination, field, data[field])
    db.session.commit()
    return jsonify({
        'success': True,
        'message': 'Destination updated successfully',
        'data': destination.to_dict()
    }), 200

@admin_bp.route('/destinations/<int:destination_id>', methods=['DELETE'])
@admin_required
def delete_destination(destination_id):
    destination        = Destination.query.get_or_404(destination_id)
    destination.active = False   # soft-delete
    db.session.commit()
    return jsonify({'success': True, 'message': 'Destination deactivated successfully'}), 200


# ── Blogs ─────────────────────────────────────────────────────────────────────

@admin_bp.route('/blogs', methods=['GET'])
@admin_required
def get_all_blogs():
    """Admin-only: returns ALL blogs regardless of published status."""
    page     = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 200, type=int)
    search   = request.args.get('search', '').strip()

    query = Blog.query  # NO published=True filter — admin sees drafts too

    if search:
        query = query.filter(
            db.or_(
                Blog.title.ilike(f'%{search}%'),
                Blog.author.ilike(f'%{search}%'),
            )
        )

    paginated = query.order_by(Blog.published_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    return jsonify({
        'success': True,
        'data': {
            'items': [b.to_dict() for b in paginated.items],
            'total': paginated.total,
            'page':  paginated.page,
            'pages': paginated.pages,
        }
    }), 200

@admin_bp.route('/blogs', methods=['POST'])
@admin_required
@validate_json({'title': str, 'content': str})
def create_blog():
    data = request.json
    blog = Blog(
        title     = data['title'],
        slug      = data.get('slug', data['title'].lower().replace(' ', '-')),
        excerpt   = data.get('excerpt', data['content'][:200] + '...'),
        content   = data['content'],
        author    = data.get('author', ''),
        category  = data.get('category', ''),
        read_time = data.get('read_time', '5 min read'),
        published = data.get('published', True),
        featured  = data.get('featured', False),
        tags      = data.get('tags', ''),
    )
    db.session.add(blog)
    db.session.commit()
    return jsonify({
        'success': True,
        'message': 'Blog created successfully',
        'data': blog.to_dict()
    }), 201

@admin_bp.route('/blogs/<int:blog_id>', methods=['PUT'])
@admin_required
def update_blog(blog_id):
    data      = request.json
    blog      = Blog.query.get_or_404(blog_id)
    updatable = [
        'title', 'excerpt', 'content', 'author', 'category',
        'read_time', 'image_url', 'published', 'featured', 'tags',
    ]
    for field in updatable:
        if field in data:
            setattr(blog, field, data[field])
    db.session.commit()
    return jsonify({
        'success': True,
        'message': 'Blog updated successfully',
        'data': blog.to_dict()
    }), 200

@admin_bp.route('/blogs/<int:blog_id>', methods=['DELETE'])
@admin_required
def delete_blog(blog_id):
    blog = Blog.query.get_or_404(blog_id)
    db.session.delete(blog)
    db.session.commit()
    return jsonify({'success': True, 'message': 'Blog deleted successfully'}), 200


# ── Gallery ───────────────────────────────────────────────────────────────────

@admin_bp.route('/gallery', methods=['GET'])
@admin_required
def get_all_gallery():
    """Admin-only: returns ALL gallery items."""
    page     = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 200, type=int)
    search   = request.args.get('search', '').strip()

    query = Gallery.query

    if search:
        query = query.filter(
            db.or_(
                Gallery.title.ilike(f'%{search}%'),
                Gallery.location.ilike(f'%{search}%'),
                Gallery.country.ilike(f'%{search}%'),
            )
        )

    paginated = query.order_by(Gallery.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    return jsonify({
        'success': True,
        'data': {
            'items': [g.to_dict() for g in paginated.items],
            'total': paginated.total,
            'page':  paginated.page,
            'pages': paginated.pages,
        }
    }), 200

@admin_bp.route('/gallery', methods=['POST'])
@admin_required
def create_gallery():
    data    = request.json
    gallery = Gallery(
        title       = data.get('title', ''),
        slug        = data.get('slug', data.get('title', '').lower().replace(' ', '-')),
        description = data.get('description', ''),
        location    = data.get('location', ''),
        country     = data.get('country', ''),
        category    = data.get('category', ''),
        featured    = data.get('featured', False),
    )
    db.session.add(gallery)
    db.session.commit()
    return jsonify({
        'success': True,
        'message': 'Gallery item created successfully',
        'data': gallery.to_dict()
    }), 201

@admin_bp.route('/gallery/<int:gallery_id>', methods=['PUT'])
@admin_required
def update_gallery(gallery_id):
    data      = request.json
    gallery   = Gallery.query.get_or_404(gallery_id)
    updatable = ['title', 'description', 'location', 'country', 'category', 'featured']
    for field in updatable:
        if field in data:
            setattr(gallery, field, data[field])
    db.session.commit()
    return jsonify({
        'success': True,
        'message': 'Gallery item updated successfully',
        'data': gallery.to_dict()
    }), 200

@admin_bp.route('/gallery/<int:gallery_id>', methods=['DELETE'])
@admin_required
def delete_gallery(gallery_id):
    gallery = Gallery.query.get_or_404(gallery_id)
    db.session.delete(gallery)
    db.session.commit()
    return jsonify({'success': True, 'message': 'Gallery item deleted successfully'}), 200


# ── Packages ──────────────────────────────────────────────────────────────────

@admin_bp.route('/packages', methods=['POST'])
@admin_required
@validate_json({'title': str, 'description': str})
def create_package():
    data    = request.json
    package = Package(
        title          = data['title'],
        slug           = data.get('slug', data['title'].lower().replace(' ', '-')),
        description    = data['description'],
        duration       = data.get('duration', ''),
        group_size     = data.get('group_size', ''),
        base_price     = data.get('base_price', 1999.00),
        discount_price = data.get('discount_price'),
        rating         = data.get('rating', 0.0),
        featured       = data.get('featured', False),
        popular        = data.get('popular', False),
        category       = data.get('category'),
        difficulty     = data.get('difficulty'),
        season         = data.get('season'),
    )
    db.session.add(package)
    db.session.commit()
    return jsonify({
        'success': True,
        'message': 'Package created successfully',
        'data': package.to_dict()
    }), 201

@admin_bp.route('/packages/<int:package_id>', methods=['PUT'])
@admin_required
def update_package(package_id):
    data    = request.json or {}
    package = Package.query.get_or_404(package_id)

    # Simple string/number fields — set directly
    simple_fields = [
        'title', 'description', 'duration', 'group_size',
        'base_price', 'discount_price', 'rating',
        'featured', 'popular', 'category', 'difficulty',
        'season', 'image_url',
    ]
    for field in simple_fields:
        if field in data:
            setattr(package, field, data[field])

    # 'destinations' and 'tags' are stored as comma-separated strings in SQLite,
    # NOT as Python lists. Convert any incoming list → CSV string.
    if 'destinations' in data:
        val = data['destinations']
        package.destinations = ','.join(val) if isinstance(val, list) else (val or '')

    if 'tags' in data:
        val = data['tags']
        package.tags = ','.join(val) if isinstance(val, list) else (val or '')

    # Regenerate slug if title changed and no explicit slug provided
    if 'title' in data and 'slug' not in data:
        package.slug = data['title'].lower().replace(' ', '-')

    db.session.commit()
    return jsonify({
        'success': True,
        'message': 'Package updated successfully',
        'data': package.to_dict()
    }), 200

@admin_bp.route('/packages/<int:package_id>', methods=['DELETE'])
@admin_required
def delete_package(package_id):
    package = Package.query.get_or_404(package_id)
    db.session.delete(package)
    db.session.commit()
    return jsonify({'success': True, 'message': 'Package deleted successfully'}), 200


# ── Bookings ──────────────────────────────────────────────────────────────────

@admin_bp.route('/bookings', methods=['GET'])
@admin_required
def get_all_bookings():
    status         = request.args.get('status')
    payment_status = request.args.get('payment_status')
    page           = request.args.get('page', 1, type=int)
    per_page       = request.args.get('per_page', 20, type=int)

    query = Booking.query
    if status:
        query = query.filter_by(status=status)
    if payment_status:
        query = query.filter_by(payment_status=payment_status)

    paginated = query.order_by(Booking.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    return jsonify({
        'success': True,
        'data': {
            'items':    [b.to_dict() for b in paginated.items],
            'total':    paginated.total,
            'page':     paginated.page,
            'per_page': paginated.per_page,
            'pages':    paginated.pages,
        }
    }), 200

@admin_bp.route('/bookings/<int:booking_id>/update-status', methods=['PUT'])
@admin_required
@validate_json({'status': str})
def update_booking_status(booking_id):
    data    = request.json
    booking = Booking.query.get_or_404(booking_id)

    valid_statuses = ['pending', 'confirmed', 'cancelled', 'completed']
    if data['status'] not in valid_statuses:
        return jsonify({
            'success': False,
            'error': f'Status must be one of: {", ".join(valid_statuses)}'
        }), 400

    booking.status = data['status']
    db.session.commit()
    return jsonify({
        'success': True,
        'message': 'Booking status updated successfully',
        'data': booking.to_dict()
    }), 200