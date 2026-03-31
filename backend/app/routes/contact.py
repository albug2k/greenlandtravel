# backend/app/routes/contact.py
import os
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import ContactMessage, User
from app.utils.decorators import validate_json

contact_bp = Blueprint('contact', __name__)

# ── Optional: Flask-Mail for real email sending ───────────────────────────────
# Install: pip install Flask-Mail
# Add to your .env:
#   MAIL_SERVER=smtp.gmail.com
#   MAIL_PORT=587
#   MAIL_USE_TLS=True
#   MAIL_USERNAME=your@gmail.com
#   MAIL_PASSWORD=your_app_password
#   MAIL_DEFAULT_SENDER=your@gmail.com
#   ADMIN_EMAIL=admin@glttravel.com
#
# Then init in __init__.py:
#   from flask_mail import Mail
#   mail = Mail()
#   mail.init_app(app)
#
# Uncomment the mail block below once Flask-Mail is configured.

try:
    from flask_mail import Message as MailMessage
    from app import mail
    MAIL_ENABLED = True
except ImportError:
    MAIL_ENABLED = False


def _send_email(subject, recipient, body):
    """Send email if Flask-Mail is configured; silently skip otherwise."""
    if not MAIL_ENABLED:
        return
    try:
        msg = MailMessage(
            subject   = subject,
            recipients= [recipient],
            body      = body,
            sender    = os.environ.get('MAIL_DEFAULT_SENDER', 'no-reply@glttravel.com'),
        )
        mail.send(msg)
    except Exception as e:
        print(f"[mail] Failed to send email: {e}")


# ── Public: submit a contact form ─────────────────────────────────────────────

@contact_bp.route('/', methods=['POST'])
@validate_json({'name': str, 'email': str, 'message': str})
def create_contact_message():
    data = request.json

    contact = ContactMessage(
        name     = data['name'],
        email    = data['email'],
        subject  = data.get('subject', 'New Inquiry'),
        message  = data['message'],
        category = data.get('category', 'general'),
    )
    db.session.add(contact)
    db.session.commit()

    # Notify admin by email (optional)
    admin_email = os.environ.get('ADMIN_EMAIL', '')
    if admin_email:
        _send_email(
            subject   = f"[GLT Travel] New message from {data['name']}",
            recipient = admin_email,
            body      = (
                f"New contact message received:\n\n"
                f"Name:    {data['name']}\n"
                f"Email:   {data['email']}\n"
                f"Subject: {data.get('subject', 'N/A')}\n\n"
                f"Message:\n{data['message']}\n\n"
                f"Reply in your admin panel: /admin/messages"
            ),
        )

    return jsonify({
        'success': True,
        'message': 'Message sent successfully',
        'data':    contact.to_dict(),
    }), 201


# ── Admin: list all messages ───────────────────────────────────────────────────

@contact_bp.route('/', methods=['GET'])
@jwt_required()
def get_contact_messages():
    user_id = get_jwt_identity()
    user    = User.query.get(user_id)
    if not user or not user.is_admin:
        return jsonify({'success': False, 'error': 'Unauthorized'}), 403

    page      = request.args.get('page', 1, type=int)
    per_page  = request.args.get('per_page', 50, type=int)
    read      = request.args.get('read')        # 'true' | 'false'
    replied   = request.args.get('replied')     # 'true' | 'false'
    category  = request.args.get('category')

    query = ContactMessage.query
    if read is not None:
        query = query.filter_by(read=(read.lower() == 'true'))
    if replied is not None:
        query = query.filter_by(replied=(replied.lower() == 'true'))
    if category:
        query = query.filter_by(category=category)

    paginated = query.order_by(ContactMessage.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    unread_count = ContactMessage.query.filter_by(read=False).count()

    return jsonify({
        'success': True,
        'data': {
            'items':        [m.to_dict() for m in paginated.items],
            'total':        paginated.total,
            'page':         paginated.page,
            'pages':        paginated.pages,
            'unread_count': unread_count,
        }
    }), 200


# ── Admin: single message ──────────────────────────────────────────────────────

@contact_bp.route('/<int:message_id>', methods=['GET'])
@jwt_required()
def get_contact_message(message_id):
    user_id = get_jwt_identity()
    user    = User.query.get(user_id)
    if not user or not user.is_admin:
        return jsonify({'success': False, 'error': 'Unauthorized'}), 403

    message      = ContactMessage.query.get_or_404(message_id)
    message.read = True          # auto-mark as read on open
    db.session.commit()
    return jsonify({'success': True, 'data': message.to_dict()}), 200


# ── Admin: mark read / unread ─────────────────────────────────────────────────

@contact_bp.route('/<int:message_id>/mark-read', methods=['PUT'])
@jwt_required()
def mark_as_read(message_id):
    user_id = get_jwt_identity()
    user    = User.query.get(user_id)
    if not user or not user.is_admin:
        return jsonify({'success': False, 'error': 'Unauthorized'}), 403

    message      = ContactMessage.query.get_or_404(message_id)
    message.read = request.json.get('read', True) if request.is_json else True
    db.session.commit()
    return jsonify({'success': True, 'message': 'Updated'}), 200


# ── Admin: reply to message ────────────────────────────────────────────────────

@contact_bp.route('/<int:message_id>/reply', methods=['POST'])
@jwt_required()
@validate_json({'reply_message': str})
def reply_to_message(message_id):
    user_id = get_jwt_identity()
    user    = User.query.get(user_id)
    if not user or not user.is_admin:
        return jsonify({'success': False, 'error': 'Unauthorized'}), 403

    data           = request.json
    message        = ContactMessage.query.get_or_404(message_id)
    reply_text     = data['reply_message']

    message.replied       = True
    message.reply_message = reply_text
    message.read          = True
    db.session.commit()

    # Send reply email to the original sender
    _send_email(
        subject   = f"Re: {message.subject or 'Your inquiry'} — GLT Travel",
        recipient = message.email,
        body      = (
            f"Dear {message.name},\n\n"
            f"{reply_text}\n\n"
            f"---\n"
            f"GLT & Travel Support Team\n"
            f"Email: support@glttravel.com\n"
            f"Web:   http://localhost:8080\n\n"
            f"---- Original message ----\n"
            f"{message.message}"
        ),
    )

    return jsonify({
        'success': True,
        'message': 'Reply sent successfully',
        'data':    message.to_dict(),
    }), 200


# ── Admin: delete message ─────────────────────────────────────────────────────

@contact_bp.route('/<int:message_id>', methods=['DELETE'])
@jwt_required()
def delete_contact_message(message_id):
    user_id = get_jwt_identity()
    user    = User.query.get(user_id)
    if not user or not user.is_admin:
        return jsonify({'success': False, 'error': 'Unauthorized'}), 403

    message = ContactMessage.query.get_or_404(message_id)
    db.session.delete(message)
    db.session.commit()
    return jsonify({'success': True, 'message': 'Message deleted'}), 200