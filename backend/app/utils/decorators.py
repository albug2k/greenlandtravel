from functools import wraps
from flask import request, jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt

def validate_json(schema, optional=False):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not request.is_json:
                return jsonify({'success': False, 'error': 'Request must be JSON'}), 400
            
            data = request.json
            for field, field_type in schema.items():
                if not optional and field not in data:
                    return jsonify({'success': False, 'error': f'Missing required field: {field}'}), 400
                
                if field in data and not isinstance(data[field], field_type):
                    return jsonify({'success': False, 'error': f'Field {field} must be {field_type.__name__}'}), 400
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def paginate(default_per_page=10, max_per_page=100):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            page = request.args.get('page', 1, type=int)
            per_page = min(request.args.get('per_page', default_per_page, type=int), max_per_page)
            
            query = f(*args, **kwargs)
            
            paginated = query.paginate(page=page, per_page=per_page, error_out=False)
            
            return jsonify({
                'success': True,
                'data': {
                    'items': [item.to_dict() for item in paginated.items],
                    'total': paginated.total,
                    'page': paginated.page,
                    'per_page': paginated.per_page,
                    'pages': paginated.pages,
                    'has_next': paginated.has_next,
                    'has_prev': paginated.has_prev
                }
            }), 200
        return decorated_function
    return decorator

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        verify_jwt_in_request()
        claims = get_jwt()
        
        if not claims.get('is_admin', False):
            return jsonify({'success': False, 'error': 'Admin access required'}), 403
        
        return f(*args, **kwargs)
    return decorated_function