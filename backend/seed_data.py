#!/usr/bin/env python3
import os
import sys
from datetime import date

# Ensure backend root is on path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app import create_app, db


def seed_database():
    app = create_app()

    with app.app_context():
        print("🌱 Seeding database...")

        # Import models ONLY after app context exists
        from app.models import (
            User,
            Destination, DestinationHighlight,
            Package,
            Tour,
            Blog,
            Testimonial,
            Booking, Payment,
            Gallery, GalleryImage,
            ContactMessage
        )

        # --------------------------------------------------
        # USERS
        # --------------------------------------------------
        if not User.query.first():
            users = [
                User(name="Admin User", email="admin@glttravel.com", is_admin=True),
                User(name="John Doe", email="john@example.com"),
                User(name="Emily Smith", email="emily@example.com"),
                User(name="Michael Chen", email="michael@example.com"),
                User(name="Sarah Johnson", email="sarah@example.com"),
                User(name="David Brown", email="david@example.com"),
                User(name="Sophia Wilson", email="sophia@example.com"),
            ]

            for u in users:
                u.set_password("password123")
                db.session.add(u)

            db.session.commit()
            print("✓ Users seeded")

        user_map = {u.email: u for u in User.query.all()}

        # --------------------------------------------------
        # DESTINATIONS
        # --------------------------------------------------
        if not Destination.query.first():
            destinations = [
                Destination(title="Santorini", slug="santorini-greece", description="Greek island", country="Greece", continent="Europe", base_price=2499),
                Destination(title="Bali", slug="bali-indonesia", description="Tropical paradise", country="Indonesia", continent="Asia", base_price=1899),
                Destination(title="Paris", slug="paris-france", description="City of lights", country="France", continent="Europe", base_price=2299),
                Destination(title="Rome", slug="rome-italy", description="Historic city", country="Italy", continent="Europe", base_price=2199),
                Destination(title="Dubai", slug="dubai-uae", description="Luxury city", country="UAE", continent="Asia", base_price=2599),
                Destination(title="Tokyo", slug="tokyo-japan", description="Tech & culture", country="Japan", continent="Asia", base_price=2799),
                Destination(title="Cape Town", slug="cape-town", description="Coastal beauty", country="South Africa", continent="Africa", base_price=2399),
            ]
            db.session.add_all(destinations)
            db.session.commit()
            print("✓ Destinations seeded")

        dest_map = {d.slug: d for d in Destination.query.all()}

        # --------------------------------------------------
        # DESTINATION HIGHLIGHTS
        # --------------------------------------------------
        if not DestinationHighlight.query.first():
            highlights = [
                ("santorini-greece", "Oia Sunset"),
                ("bali-indonesia", "Rice Terraces"),
                ("paris-france", "Eiffel Tower"),
                ("rome-italy", "Colosseum"),
                ("dubai-uae", "Burj Khalifa"),
                ("tokyo-japan", "Shibuya Crossing"),
                ("cape-town", "Table Mountain"),
            ]

            for slug, text in highlights:
                db.session.add(
                    DestinationHighlight(
                        destination_id=dest_map[slug].id,
                        text=text
                    )
                )

            db.session.commit()
            print("✓ Destination highlights seeded")

        # --------------------------------------------------
        # PACKAGES
        # --------------------------------------------------
        if not Package.query.first():
            packages = [
                Package(title="Mediterranean Romance", slug="med-romance", base_price=2499, category="romance"),
                Package(title="Bali Adventure", slug="bali-adventure", base_price=1899, category="adventure"),
                Package(title="Paris Explorer", slug="paris-explorer", base_price=1999, category="city"),
                Package(title="Rome Classics", slug="rome-classics", base_price=2099, category="culture"),
                Package(title="Dubai Luxury", slug="dubai-luxury", base_price=2999, category="luxury"),
                Package(title="Tokyo Discovery", slug="tokyo-discovery", base_price=2799, category="culture"),
                Package(title="Cape Safari", slug="cape-safari", base_price=2699, category="adventure"),
            ]
            db.session.add_all(packages)
            db.session.commit()
            print("✓ Packages seeded")

        # --------------------------------------------------
        # TOURS (SAFE: SLUG-BASED)
        # --------------------------------------------------
        if not Tour.query.first():
            required = [
                "santorini-greece",
                "bali-indonesia",
                "paris-france",
                "rome-italy",
                "dubai-uae",
                "tokyo-japan",
                "cape-town",
            ]

            missing = [s for s in required if s not in dest_map]
            if missing:
                raise RuntimeError(f"Missing destinations for tours: {missing}")

            tours = [
                Tour(destination_id=dest_map["santorini-greece"].id, title="Santorini Highlights", slug="santorini-highlights", duration_days=3, duration_nights=2, base_price=1299),
                Tour(destination_id=dest_map["bali-indonesia"].id, title="Bali Temples", slug="bali-temples", duration_days=4, duration_nights=3, base_price=1199),
                Tour(destination_id=dest_map["paris-france"].id, title="Paris Walk", slug="paris-walk", duration_days=2, duration_nights=1, base_price=899),
                Tour(destination_id=dest_map["rome-italy"].id, title="Rome Ruins", slug="rome-ruins", duration_days=2, duration_nights=1, base_price=999),
                Tour(destination_id=dest_map["dubai-uae"].id, title="Dubai City", slug="dubai-city", duration_days=1, duration_nights=0, base_price=799),
                Tour(destination_id=dest_map["tokyo-japan"].id, title="Tokyo Culture", slug="tokyo-culture", duration_days=3, duration_nights=2, base_price=1399),
                Tour(destination_id=dest_map["cape-town"].id, title="Cape Peninsula", slug="cape-peninsula", duration_days=2, duration_nights=1, base_price=1099),
            ]

            db.session.add_all(tours)
            db.session.commit()
            print("✓ Tours seeded")

        tour_map = {t.slug: t for t in Tour.query.all()}

        # --------------------------------------------------
        # BOOKINGS + PAYMENTS
        # --------------------------------------------------
        if not Booking.query.first():
            booking = Booking(
                user_id=user_map["john@example.com"].id,
                tour_id=tour_map["santorini-highlights"].id,
                destination="Santorini",
                travel_date=date(2026, 6, 1),
                guests=2,
                total_price=2598,
                status="confirmed"
            )
            db.session.add(booking)
            db.session.commit()

            payment = Payment(
                booking_id=booking.id,
                user_id=booking.user_id,
                amount=2598,
                payment_method="credit_card",
                status="completed"
            )
            db.session.add(payment)
            db.session.commit()
            print("✓ Booking & payment seeded")

        # --------------------------------------------------
        # BLOGS
        # --------------------------------------------------
        if not Blog.query.first():
            blogs = [
                Blog(title="Hidden Gems Europe", slug="hidden-europe", content="...", author="Sarah"),
                Blog(title="Packing Tips", slug="packing-tips", content="...", author="Mike"),
                Blog(title="Luxury Escapes", slug="luxury-escapes", content="...", author="Sophia"),
                Blog(title="Budget Travel", slug="budget-travel", content="...", author="David"),
                Blog(title="Adventure Trips", slug="adventure-trips", content="...", author="John"),
                Blog(title="Cultural Tours", slug="cultural-tours", content="...", author="Admin"),
                Blog(title="Beach Holidays", slug="beach-holidays", content="...", author="Emily"),
            ]
            db.session.add_all(blogs)
            db.session.commit()
            print("✓ Blogs seeded")

        # --------------------------------------------------
        # TESTIMONIALS
        # --------------------------------------------------
        if not Testimonial.query.first():
            testimonials = [
                Testimonial(user_id=user_map["john@example.com"].id, name="John Doe", content="Amazing trip!", rating=5),
                Testimonial(user_id=user_map["emily@example.com"].id, name="Emily Smith", content="Loved it!", rating=4.8),
                Testimonial(user_id=user_map["michael@example.com"].id, name="Michael Chen", content="Great guides", rating=4.7),
                Testimonial(user_id=user_map["sarah@example.com"].id, name="Sarah Johnson", content="Highly recommended", rating=5),
                Testimonial(user_id=user_map["david@example.com"].id, name="David Brown", content="Very organized", rating=4.6),
                Testimonial(user_id=user_map["sophia@example.com"].id, name="Sophia Wilson", content="Unforgettable", rating=5),
            ]
            db.session.add_all(testimonials)
            db.session.commit()
            print("✓ Testimonials seeded")

        print("\n🎉 Database seeding completed successfully!")


if __name__ == "__main__":
    seed_database()
