# backend/app/routes/payments.py
import os
import stripe
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import User, Booking

stripe.api_key = os.environ.get("STRIPE_SECRET_KEY")  # sk_test_... from your .env

payments_bp = Blueprint('payments', __name__)


@payments_bp.route('/create-intent', methods=['POST'])
@jwt_required()
def create_payment_intent():
    """
    Creates a Stripe PaymentIntent and returns its client_secret.
    Called by the frontend PaymentModal after stripe.createPaymentMethod() succeeds.

    Expected JSON body:
    {
        "amount":         150000,           # in cents  (e.g. $1500.00 → 150000)
        "currency":       "usd",            # optional, defaults to "usd"
        "payment_method": "pm_xxxxx",       # paymentMethod.id from Stripe.js
        "destination":    "Paris, France",  # for metadata / booking lookup
        "guests":         "2",
        "customer_name":  "John Doe",
        "booking_id":     42               # optional — link to a Booking record
    }

    Returns:
    {
        "client_secret": "pi_xxx_secret_yyy"
    }
    """
    user_id = get_jwt_identity()
    user    = User.query.get_or_404(user_id)
    data    = request.json or {}

    amount   = data.get('amount')
    currency = data.get('currency', 'usd')
    pm_id    = data.get('payment_method')

    # ── Basic validation ──────────────────────────────────────────────────────
    if not amount or not pm_id:
        return jsonify({'success': False, 'error': 'amount and payment_method are required'}), 400

    if not isinstance(amount, int) or amount <= 0:
        return jsonify({'success': False, 'error': 'amount must be a positive integer (cents)'}), 400

    try:
        # ── Create & immediately confirm the PaymentIntent ────────────────────
        intent = stripe.PaymentIntent.create(
            amount               = amount,
            currency             = currency,
            payment_method       = pm_id,
            confirmation_method  = 'manual',
            confirm              = True,
            # Return URL required for 3D-Secure redirects
            return_url           = os.environ.get('FRONTEND_URL', 'http://localhost:8080'),
            metadata={
                'user_id':       user_id,
                'user_email':    user.email,
                'destination':   data.get('destination', ''),
                'guests':        data.get('guests', ''),
                'customer_name': data.get('customer_name', user.name),
            },
        )

        # ── Optionally record payment status on the Booking ───────────────────
        booking_id = data.get('booking_id')
        if booking_id:
            booking = Booking.query.filter_by(id=booking_id, user_id=user_id).first()
            if booking:
                if intent.status == 'succeeded':
                    booking.payment_status = 'paid'
                elif intent.status in ('requires_action', 'requires_source_action'):
                    booking.payment_status = 'partially_paid'
                db.session.commit()

        return jsonify({
            'success':       True,
            'client_secret': intent.client_secret,
            'status':        intent.status,
        }), 200

    except stripe.error.CardError as e:
        # Declined card — safe to show the message to the user
        return jsonify({'success': False, 'error': e.user_message}), 402

    except stripe.error.InvalidRequestError as e:
        return jsonify({'success': False, 'error': str(e)}), 400

    except stripe.error.AuthenticationError:
        return jsonify({'success': False, 'error': 'Stripe authentication failed. Check your secret key.'}), 500

    except stripe.error.StripeError as e:
        return jsonify({'success': False, 'error': 'Payment service error. Please try again.'}), 500


@payments_bp.route('/webhook', methods=['POST'])
def stripe_webhook():
    """
    Stripe sends POST events here for async payment confirmations (3DS, etc.).
    Set this URL in your Stripe Dashboard → Developers → Webhooks:
      https://yourdomain.com/api/payments/webhook

    To test locally:
      stripe listen --forward-to localhost:5000/api/payments/webhook
    """
    payload    = request.get_data(as_text=True)
    sig_header = request.headers.get('Stripe-Signature', '')
    webhook_secret = os.environ.get('STRIPE_WEBHOOK_SECRET', '')

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
    except ValueError:
        return jsonify({'error': 'Invalid payload'}), 400
    except stripe.error.SignatureVerificationError:
        return jsonify({'error': 'Invalid signature'}), 400

    # ── Handle events ─────────────────────────────────────────────────────────
    if event['type'] == 'payment_intent.succeeded':
        pi = event['data']['object']
        _handle_payment_succeeded(pi)

    elif event['type'] == 'payment_intent.payment_failed':
        pi = event['data']['object']
        _handle_payment_failed(pi)

    return jsonify({'received': True}), 200


# ── Private helpers ────────────────────────────────────────────────────────────

def _handle_payment_succeeded(payment_intent):
    """Mark the linked Booking as paid when Stripe confirms the charge."""
    booking_id = payment_intent.get('metadata', {}).get('booking_id')
    if not booking_id:
        return
    booking = Booking.query.get(int(booking_id))
    if booking:
        booking.payment_status = 'paid'
        booking.status         = 'confirmed'
        db.session.commit()


def _handle_payment_failed(payment_intent):
    """Optionally log or flag the booking when a payment fails."""
    booking_id = payment_intent.get('metadata', {}).get('booking_id')
    if not booking_id:
        return
    booking = Booking.query.get(int(booking_id))
    if booking:
        booking.payment_status = 'pending'   # reset so user can retry
        db.session.commit()