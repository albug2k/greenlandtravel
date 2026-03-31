# backend/app/routes/bookings.py

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
import uuid
from app import db
from app.models import Booking, Payment, Destination, Package, Tour
from app.utils.decorators import validate_json
from app.utils.helpers import generate_booking_reference, calculate_price


bookings_bp = Blueprint('bookings', __name__)


@bookings_bp.route('/', methods=['POST'])
@jwt_required()
@validate_json({
    'destination': str,
    'travel_date': str,
    'guests': int
})
def create_booking():
    user_id = get_jwt_identity()
    data = request.json
    
    try:
        travel_date = datetime.strptime(data['travel_date'], '%Y-%m-%d').date()
    except ValueError:
        return jsonify({'success': False, 'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
    
    # Check if travel date is in the future
    if travel_date < datetime.now().date():
        return jsonify({'success': False, 'error': 'Travel date must be in the future'}), 400
    
    # Calculate price
    result = calculate_price(
        destination=data['destination'],
        guests=data['guests'],
        tour_id=data.get('tour_id'),
        package_id=data.get('package_id')
    )
    
    if not result['success']:
        return jsonify(result), 400
    
    # Create booking
    booking = Booking(
        user_id=user_id,
        tour_id=data.get('tour_id'),
        package_id=data.get('package_id'),
        destination=data['destination'],
        travel_date=travel_date,
        return_date=datetime.strptime(data['return_date'], '%Y-%m-%d').date() if data.get('return_date') else None,
        guests=data['guests'],
        special_requests=data.get('special_requests', ''),
        total_price=result['total_price'],
        booking_reference=generate_booking_reference(),
        status='pending',
        payment_status='pending'
    )
    
    db.session.add(booking)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': 'Booking created successfully',
        'data': booking.to_dict()
    }), 201

@bookings_bp.route('/', methods=['GET'])
@jwt_required()
def get_user_bookings():
    user_id = get_jwt_identity()
    
    # Optional filters
    status = request.args.get('status')
    payment_status = request.args.get('payment_status')
    
    query = Booking.query.filter_by(user_id=user_id)
    
    if status:
        query = query.filter_by(status=status)
    if payment_status:
        query = query.filter_by(payment_status=payment_status)
    
    bookings = query.order_by(Booking.created_at.desc()).all()
    
    return jsonify({
        'success': True,
        'data': [booking.to_dict() for booking in bookings]
    }), 200

@bookings_bp.route('/<int:booking_id>', methods=['GET'])
@jwt_required()
def get_booking(booking_id):
    user_id = get_jwt_identity()
    
    booking = Booking.query.filter_by(id=booking_id, user_id=user_id).first_or_404()
    
    # Get related data if available
    booking_data = booking.to_dict()
    
    if booking.tour_id:
        tour = Tour.query.get(booking.tour_id)
        if tour:
            booking_data['tour'] = tour.to_dict()
    
    if booking.package_id:
        package = Package.query.get(booking.package_id)
        if package:
            booking_data['package'] = package.to_dict()
    
    # Get payment history
    payments = Payment.query.filter_by(booking_id=booking_id).all()
    booking_data['payments'] = [payment.to_dict() for payment in payments]
    
    return jsonify({
        'success': True,
        'data': booking_data
    }), 200

@bookings_bp.route('/<int:booking_id>/cancel', methods=['PUT'])
@jwt_required()
def cancel_booking(booking_id):
    user_id = get_jwt_identity()
    booking = Booking.query.filter_by(id=booking_id, user_id=user_id).first_or_404()
    
    if booking.status == 'cancelled':
        return jsonify({'success': False, 'error': 'Booking is already cancelled'}), 400
    
    # Check if cancellation is allowed (within 7 days of travel)
    days_until_travel = (booking.travel_date - datetime.now().date()).days
    if days_until_travel < 7:
        return jsonify({'success': False, 'error': 'Cannot cancel within 7 days of travel'}), 400
    
    booking.status = 'cancelled'
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': 'Booking cancelled successfully'
    }), 200

@bookings_bp.route('/<int:booking_id>/payments', methods=['POST'])
@jwt_required()
@validate_json({
    'amount': float,
    'payment_method': str
})
def create_payment(booking_id):
    user_id = get_jwt_identity()
    
    # Verify booking belongs to user
    booking = Booking.query.filter_by(id=booking_id, user_id=user_id).first_or_404()
    
    data = request.json
    
    # Check if payment amount is valid
    if data['amount'] <= 0:
        return jsonify({'success': False, 'error': 'Invalid payment amount'}), 400
    
    # Create payment record
    payment = Payment(
        booking_id=booking_id,
        user_id=user_id,
        amount=data['amount'],
        payment_method=data['payment_method'],
        transaction_id=f"TXN-{uuid.uuid4().hex[:12].upper()}",
        status='pending',
        currency='USD'
    )
    
    db.session.add(payment)
    
    # Update booking payment status
    if data['amount'] >= booking.total_price:
        booking.payment_status = 'paid'
    else:
        booking.payment_status = 'partially_paid'
    
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': 'Payment recorded successfully',
        'data': payment.to_dict()
    }), 201

@bookings_bp.route('/<int:booking_id>/payments', methods=['GET'])
@jwt_required()
def get_booking_payments(booking_id):
    user_id = get_jwt_identity()
    
    # Verify booking belongs to user
    booking = Booking.query.filter_by(id=booking_id, user_id=user_id).first_or_404()
    
    payments = Payment.query.filter_by(booking_id=booking_id).order_by(Payment.created_at.desc()).all()
    
    return jsonify({
        'success': True,
        'data': [payment.to_dict() for payment in payments]
    }), 200

@bookings_bp.route('/calculate-price', methods=['POST'])
@validate_json({'destination': str, 'guests': int})
def calculate_booking_price():
    data = request.json
    
    result = calculate_price(
        destination=data['destination'],
        guests=data['guests'],
        tour_id=data.get('tour_id'),
        package_id=data.get('package_id'),
        travel_date=data.get('travel_date')
    )
    
    if not result['success']:
        return jsonify(result), 400
    
    return jsonify(result), 200

@bookings_bp.route('/available-dates/<int:destination_id>', methods=['GET'])
def get_available_dates(destination_id):
    """Get available booking dates for a destination"""
    from datetime import datetime, timedelta
    
    # This is a simplified version - in production, you'd check against actual availability
    # For now, we'll just return dates in the next 90 days
    
    today = datetime.now().date()
    available_dates = []
    
    for i in range(1, 91):  # Next 90 days
        date = today + timedelta(days=i)
        # Skip weekends for demo purposes (customize as needed)
        if date.weekday() < 5:  # Monday to Friday
            available_dates.append(date.strftime('%Y-%m-%d'))
    
    return jsonify({
        'success': True,
        'data': {
            'destination_id': destination_id,
            'available_dates': available_dates,
            'next_available': available_dates[0] if available_dates else None
        }
    }), 200

@bookings_bp.route('/upcoming', methods=['GET'])
@jwt_required()
def get_upcoming_bookings():
    user_id = get_jwt_identity()
    
    today = datetime.now().date()
    
    # Get bookings with travel date in the future
    upcoming_bookings = Booking.query.filter(
        Booking.user_id == user_id,
        Booking.travel_date >= today,
        Booking.status.in_(['pending', 'confirmed'])
    ).order_by(Booking.travel_date.asc()).all()
    
    return jsonify({
        'success': True,
        'data': [booking.to_dict() for booking in upcoming_bookings]
    }), 200
    
