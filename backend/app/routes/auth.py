from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity
from app import db
from app.models import User
from app.utils.decorators import validate_json
from app.utils.validators import validate_email, validate_password
import datetime

# Define the blueprint
auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
@validate_json({'name': str, 'email': str, 'password': str})
def register():
    data = request.json
    
    # Validate email
    if not validate_email(data['email']):
        return jsonify({'success': False, 'error': 'Invalid email address'}), 400
    
    # Validate password
    password_error = validate_password(data['password'])
    if password_error:
        return jsonify({'success': False, 'error': password_error}), 400
    
    # Check if user exists
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'success': False, 'error': 'Email already registered'}), 409
    
    # Create user
    user = User(
        name=data['name'],
        email=data['email'],
        phone=data.get('phone', '')
    )
    user.set_password(data['password'])
    
    db.session.add(user)
    db.session.commit()
    
    # Create tokens
    access_token = create_access_token(
        identity=user.id,
        additional_claims={'is_admin': user.is_admin}
    )
    refresh_token = create_refresh_token(identity=user.id)
    
    return jsonify({
        'success': True,
        'message': 'User registered successfully',
        'access_token': access_token,
        'refresh_token': refresh_token,
        'user': user.to_dict()
    }), 201

@auth_bp.route('/login', methods=['POST'])
@validate_json({'email': str, 'password': str})
def login():
    data = request.json
    
    user = User.query.filter_by(email=data['email'], is_active=True).first()
    
    if not user or not user.check_password(data['password']):
        return jsonify({'success': False, 'error': 'Invalid email or password'}), 401
    
    # Create tokens
    access_token = create_access_token(
        identity=user.id,
        additional_claims={'is_admin': user.is_admin}
    )
    refresh_token = create_refresh_token(identity=user.id)
    
    return jsonify({
        'success': True,
        'message': 'Login successful',
        'access_token': access_token,
        'refresh_token': refresh_token,
        'user': user.to_dict()
    }), 200

@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    current_user = get_jwt_identity()
    user = User.query.get(current_user)
    
    if not user:
        return jsonify({'success': False, 'error': 'User not found'}), 404
    
    new_token = create_access_token(
        identity=user.id,
        additional_claims={'is_admin': user.is_admin}
    )
    return jsonify({'success': True, 'access_token': new_token}), 200

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    user_id = get_jwt_identity()
    user = User.query.get_or_404(user_id)
    return jsonify({'success': True, 'data': user.to_dict()}), 200

@auth_bp.route('/update-profile', methods=['PUT'])
@jwt_required()
@validate_json({'name': str, 'phone': str}, optional=True)
def update_profile():
    user_id = get_jwt_identity()
    user = User.query.get_or_404(user_id)
    data = request.json
    
    if 'name' in data:
        user.name = data['name']
    if 'phone' in data:
        user.phone = data['phone']
    
    db.session.commit()
    return jsonify({
        'success': True,
        'message': 'Profile updated successfully',
        'data': user.to_dict()
    }), 200

@auth_bp.route('/change-password', methods=['PUT'])
@jwt_required()
@validate_json({'current_password': str, 'new_password': str})
def change_password():
    user_id = get_jwt_identity()
    user = User.query.get_or_404(user_id)
    data = request.json
    
    if not user.check_password(data['current_password']):
        return jsonify({'success': False, 'error': 'Current password is incorrect'}), 400
    
    password_error = validate_password(data['new_password'])
    if password_error:
        return jsonify({'success': False, 'error': password_error}), 400
    
    user.set_password(data['new_password'])
    db.session.commit()
    
    return jsonify({'success': True, 'message': 'Password changed successfully'}), 200