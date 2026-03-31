# backend/app/routes/blogs.py
from flask import Blueprint, request, jsonify
from app.models import Blog
from app.utils.decorators import paginate
from sqlalchemy import or_

blogs_bp = Blueprint('blogs', __name__)

@blogs_bp.route('/', methods=['GET'])
@paginate()
def get_blogs():
    query = Blog.query.filter_by(published=True)
    
    # Search filter
    search = request.args.get('search', '').strip()
    if search:
        query = query.filter(or_(
            Blog.title.ilike(f'%{search}%'),
            Blog.content.ilike(f'%{search}%'),
            Blog.excerpt.ilike(f'%{search}%'),
            Blog.author.ilike(f'%{search}%'),
            Blog.tags.ilike(f'%{search}%')
        ))
    
    # Category filter
    category = request.args.get('category')
    if category:
        query = query.filter_by(category=category)
    
    # Featured filter
    featured = request.args.get('featured', '').lower() == 'true'
    if featured:
        query = query.filter_by(featured=True)
    
    # Author filter
    author = request.args.get('author')
    if author:
        query = query.filter_by(author=author)
    
    # Sort options
    sort_by = request.args.get('sort_by', 'published_at')
    sort_order = request.args.get('sort_order', 'desc')
    
    if sort_by == 'views':
        query = query.order_by(Blog.views.desc())
    elif sort_by == 'title':
        query = query.order_by(Blog.title.asc())
    elif sort_by == 'random':
        from sqlalchemy import func
        query = query.order_by(func.random())
    else:
        if sort_order == 'asc':
            query = query.order_by(Blog.published_at.asc())
        else:
            query = query.order_by(Blog.published_at.desc())
    
    return query

@blogs_bp.route('/<int:blog_id>', methods=['GET'])
def get_blog(blog_id):
    blog = Blog.query.get_or_404(blog_id)
    
    if not blog.published:
        return jsonify({
            'success': False,
            'error': 'Blog post not found'
        }), 404
    
    # Increment view count
    blog.views += 1
    from app.models import db
    db.session.commit()
    
    # Get related blogs
    related_blogs = Blog.query.filter(
        Blog.id != blog_id,
        Blog.published == True,
        Blog.category == blog.category
    ).order_by(Blog.published_at.desc()).limit(3).all()
    
    blog_data = blog.to_dict()
    blog_data['related_blogs'] = [b.to_dict() for b in related_blogs]
    
    return jsonify({
        'success': True,
        'data': blog_data
    })

@blogs_bp.route('/slug/<slug>', methods=['GET'])
def get_blog_by_slug(slug):
    blog = Blog.query.filter_by(slug=slug).first_or_404()
    
    if not blog.published:
        return jsonify({
            'success': False,
            'error': 'Blog post not found'
        }), 404
    
    # Increment view count
    blog.views += 1
    from app.models import db
    db.session.commit()
    
    return jsonify({
        'success': True,
        'data': blog.to_dict()
    })

@blogs_bp.route('/featured', methods=['GET'])
def get_featured_blogs():
    blogs = Blog.query.filter_by(
        published=True,
        featured=True
    ).order_by(Blog.published_at.desc()).limit(4).all()
    
    return jsonify({
        'success': True,
        'data': [b.to_dict() for b in blogs]
    })

@blogs_bp.route('/latest', methods=['GET'])
def get_latest_blogs():
    blogs = Blog.query.filter_by(
        published=True
    ).order_by(Blog.published_at.desc()).limit(6).all()
    
    return jsonify({
        'success': True,
        'data': [b.to_dict() for b in blogs]
    })

@blogs_bp.route('/categories', methods=['GET'])
def get_blog_categories():
    categories = Blog.query.with_entities(
        Blog.category
    ).filter(
        Blog.category.isnot(None),
        Blog.published == True
    ).distinct().all()
    
    return jsonify({
        'success': True,
        'data': [c[0] for c in categories]
    })

@blogs_bp.route('/authors', methods=['GET'])
def get_blog_authors():
    authors = Blog.query.with_entities(
        Blog.author
    ).filter(
        Blog.author.isnot(None),
        Blog.published == True
    ).distinct().all()
    
    return jsonify({
        'success': True,
        'data': [a[0] for a in authors]
    })