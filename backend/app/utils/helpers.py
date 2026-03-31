import random
import string
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
import json

def generate_booking_reference() -> str:
    """Generate a unique booking reference"""
    timestamp = datetime.now().strftime('%y%m%d')
    random_chars = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    return f"GLT-{timestamp}-{random_chars}"

def calculate_price(
    destination: str,
    guests: int,
    tour_id: Optional[int] = None,
    package_id: Optional[int] = None,
    travel_date: Optional[str] = None
) -> Dict[str, Any]:
    """Calculate booking price based on destination, guests, and optional tour/package"""
    
    from app.models import Destination as DestModel, Tour, Package, db
    
    base_price = 1999.00  # Default base price
    
    # Try to find destination in database
    destination_obj = DestModel.query.filter(
        DestModel.title.ilike(f'%{destination}%')
    ).first()
    
    if destination_obj:
        base_price = destination_obj.base_price
    else:
        # Fallback to hardcoded prices for common destinations
        destination_lower = destination.lower()
        if 'santorini' in destination_lower or 'greece' in destination_lower:
            base_price = 2499.00
        elif 'bali' in destination_lower or 'indonesia' in destination_lower:
            base_price = 1899.00
        elif 'kenya' in destination_lower or 'safari' in destination_lower:
            base_price = 3299.00
        elif 'switzerland' in destination_lower or 'alps' in destination_lower:
            base_price = 2899.00
        elif 'paris' in destination_lower or 'france' in destination_lower:
            base_price = 2299.00
        elif 'maldives' in destination_lower:
            base_price = 3499.00
        elif 'dubai' in destination_lower or 'uae' in destination_lower:
            base_price = 2799.00
        elif 'iceland' in destination_lower:
            base_price = 2999.00
    
    # Apply tour/package pricing if specified
    if tour_id:
        tour = Tour.query.get(tour_id)
        if tour and tour.available:
            base_price = tour.base_price
            if tour.discount_price and tour.discount_price < base_price:
                base_price = tour.discount_price
    
    if package_id:
        package = Package.query.get(package_id)
        if package:
            base_price = package.base_price
            if package.discount_price and package.discount_price < base_price:
                base_price = package.discount_price
    
    # Apply seasonal pricing
    if travel_date:
        try:
            travel_dt = datetime.strptime(travel_date, '%Y-%m-%d')
            month = travel_dt.month
            
            # Peak season multipliers (customize as needed)
            if month in [6, 7, 8, 12]:  # Summer and December holidays
                base_price *= 1.2  # 20% increase
            elif month in [1, 2, 9, 10]:  # Shoulder season
                base_price *= 1.1  # 10% increase
            # Off-season (no multiplier)
        except ValueError:
            pass  # Use base price if date is invalid
    
    total_price = base_price * guests
    
    return {
        'success': True,
        'base_price': round(base_price, 2),
        'guests': guests,
        'total_price': round(total_price, 2),
        'currency': 'USD'
    }

def format_date(date_string: str, input_format: str = '%Y-%m-%d', output_format: str = '%b %d, %Y') -> str:
    """Format date string from one format to another"""
    try:
        date_obj = datetime.strptime(date_string, input_format)
        return date_obj.strftime(output_format)
    except (ValueError, TypeError):
        return date_string

def get_time_ago(date_string: str) -> str:
    """Get human-readable time ago string"""
    try:
        if isinstance(date_string, str):
            date_obj = datetime.fromisoformat(date_string.replace('Z', '+00:00'))
        else:
            date_obj = date_string
        
        now = datetime.utcnow()
        diff = now - date_obj
        
        if diff.days > 365:
            years = diff.days // 365
            return f"{years} year{'s' if years > 1 else ''} ago"
        elif diff.days > 30:
            months = diff.days // 30
            return f"{months} month{'s' if months > 1 else ''} ago"
        elif diff.days > 0:
            return f"{diff.days} day{'s' if diff.days > 1 else ''} ago"
        elif diff.seconds > 3600:
            hours = diff.seconds // 3600
            return f"{hours} hour{'s' if hours > 1 else ''} ago"
        elif diff.seconds > 60:
            minutes = diff.seconds // 60
            return f"{minutes} minute{'s' if minutes > 1 else ''} ago"
        else:
            return "just now"
    except (ValueError, TypeError):
        return "recently"

def validate_credit_card(card_number: str, expiry_month: int, expiry_year: int, cvv: str) -> Dict[str, Any]:
    """Validate credit card information"""
    errors = []
    
    # Validate card number (Luhn algorithm)
    try:
        digits = [int(d) for d in card_number if d.isdigit()]
        if len(digits) < 13 or len(digits) > 19:
            errors.append("Invalid card number length")
        
        # Luhn algorithm check
        checksum = 0
        is_second = False
        
        for d in reversed(digits):
            if is_second:
                d = d * 2
                if d > 9:
                    d = d - 9
            checksum += d
            is_second = not is_second
        
        if checksum % 10 != 0:
            errors.append("Invalid card number")
    except ValueError:
        errors.append("Invalid card number format")
    
    # Validate expiry date
    current_year = datetime.now().year % 100
    current_month = datetime.now().month
    
    if expiry_year < current_year or (expiry_year == current_year and expiry_month < current_month):
        errors.append("Card has expired")
    
    if expiry_month < 1 or expiry_month > 12:
        errors.append("Invalid expiry month")
    
    if expiry_year < current_year or expiry_year > current_year + 20:
        errors.append("Invalid expiry year")
    
    # Validate CVV
    if not cvv.isdigit() or len(cvv) not in [3, 4]:
        errors.append("Invalid CVV")
    
    return {
        'is_valid': len(errors) == 0,
        'errors': errors,
        'card_type': detect_card_type(card_number) if not errors else None
    }

def detect_card_type(card_number: str) -> str:
    """Detect credit card type from number"""
    card_number = ''.join(filter(str.isdigit, card_number))
    
    if not card_number:
        return "Unknown"
    
    # American Express
    if card_number.startswith('34') or card_number.startswith('37'):
        return "American Express"
    
    # Visa
    if card_number.startswith('4'):
        return "Visa"
    
    # Mastercard
    if 51 <= int(card_number[:2]) <= 55 or 2221 <= int(card_number[:4]) <= 2720:
        return "Mastercard"
    
    # Discover
    if card_number.startswith(('6011', '65', '644', '645', '646', '647', '648', '649')) or \
       (622126 <= int(card_number[:6]) <= 622925):
        return "Discover"
    
    return "Unknown"

def format_currency(amount: float, currency: str = 'USD') -> str:
    """Format currency amount"""
    currency_symbols = {
        'USD': '$',
        'EUR': '€',
        'GBP': '£',
        'JPY': '¥',
        'CAD': 'C$',
        'AUD': 'A$',
        'INR': '₹'
    }
    
    symbol = currency_symbols.get(currency, currency)
    
    # Format with commas for thousands
    formatted = f"{amount:,.2f}"
    
    return f"{symbol}{formatted}"

def sanitize_input(data: Any) -> Any:
    """Sanitize user input to prevent XSS attacks"""
    if isinstance(data, str):
        # Remove potentially dangerous characters
        return data.replace('<', '&lt;').replace('>', '&gt;').replace('"', '&quot;').replace("'", '&#x27;')
    elif isinstance(data, dict):
        return {k: sanitize_input(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [sanitize_input(item) for item in data]
    else:
        return data

def generate_pagination_links(
    current_page: int,
    total_pages: int,
    base_url: str,
    per_page: int = None,
    **filters
) -> Dict[str, str]:
    """Generate pagination links for API responses"""
    links = {
        'first': None,
        'last': None,
        'prev': None,
        'next': None,
        'self': None
    }
    
    # Build query parameters
    params = []
    if per_page:
        params.append(f"per_page={per_page}")
    
    for key, value in filters.items():
        if value is not None:
            params.append(f"{key}={value}")
    
    query_string = '&'.join(params)
    if query_string:
        query_string = f"?{query_string}"
    
    links['self'] = f"{base_url}{query_string}&page={current_page}"
    
    if current_page > 1:
        links['first'] = f"{base_url}{query_string}&page=1"
        links['prev'] = f"{base_url}{query_string}&page={current_page - 1}"
    
    if current_page < total_pages:
        links['next'] = f"{base_url}{query_string}&page={current_page + 1}"
        links['last'] = f"{base_url}{query_string}&page={total_pages}"
    
    return links

def calculate_discount(original_price: float, discount_percent: float) -> Dict[str, float]:
    """Calculate discounted price"""
    if discount_percent < 0 or discount_percent > 100:
        raise ValueError("Discount percentage must be between 0 and 100")
    
    discount_amount = original_price * (discount_percent / 100)
    final_price = original_price - discount_amount
    
    return {
        'original_price': round(original_price, 2),
        'discount_percent': discount_percent,
        'discount_amount': round(discount_amount, 2),
        'final_price': round(final_price, 2)
    }

def validate_email_domain(email: str, allowed_domains: list = None) -> bool:
    """Validate email domain"""
    if allowed_domains is None:
        allowed_domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com']
    
    try:
        domain = email.split('@')[1]
        return domain in allowed_domains
    except (IndexError, AttributeError):
        return False

def generate_secure_password(length: int = 12) -> str:
    """Generate a secure random password"""
    if length < 8:
        raise ValueError("Password length must be at least 8 characters")
    
    # Character sets
    lowercase = string.ascii_lowercase
    uppercase = string.ascii_uppercase
    digits = string.digits
    special = '!@#$%^&*()_+-=[]{}|;:,.<>?'
    
    # Ensure at least one character from each set
    password = [
        random.choice(lowercase),
        random.choice(uppercase),
        random.choice(digits),
        random.choice(special)
    ]
    
    # Fill the rest with random characters from all sets
    all_chars = lowercase + uppercase + digits + special
    password += [random.choice(all_chars) for _ in range(length - 4)]
    
    # Shuffle the password
    random.shuffle(password)
    
    return ''.join(password)