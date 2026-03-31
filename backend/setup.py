# backend/setup.py
#!/usr/bin/env python3
import os
import sys

# Add the current directory to the Python path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app import create_app, db
from app.models import *
from datetime import datetime, timedelta
import random

def init_database():
    """Initialize the database with tables and sample data"""
    
    app = create_app()
    
    with app.app_context():
        print("Creating database tables...")
        
        # Create all tables
        db.create_all()
        
        print("✓ Database tables created successfully!")
        
        # Check if we already have data
        if User.query.first():
            print("✓ Database already contains data. Skipping sample data creation.")
            return True
        
        print("Creating sample data...")
        
        # Create admin user
        admin = User(
            name="Admin User",
            email="admin@glttravel.com",
            phone="+1234567890",
            is_admin=True
        )
        admin.set_password("admin123")
        db.session.add(admin)
        
        # Create regular user
        user = User(
            name="John Doe",
            email="john@example.com",
            phone="+1987654321"
        )
        user.set_password("password123")
        db.session.add(user)
        
        db.session.commit()  # Commit users first to get IDs
        
        # Create destinations
        destinations_data = [
            {
                'title': 'Santorini, Greece',
                'slug': 'santorini-greece',
                'image_url': 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800',
                'description': 'Experience the magic of Santorini with its iconic blue-domed churches, stunning sunsets, and crystal-clear waters.',
                'location': 'Santorini',
                'country': 'Greece',
                'continent': 'Europe',
                'best_time': 'April to October',
                'avg_temp': '25°C / 77°F',
                'currency': 'Euro (€)',
                'language': 'Greek',
                'base_price': 2499.00,
                'featured': True,
                'popular': True,
            },
            {
                'title': 'Bali, Indonesia',
                'slug': 'bali-indonesia',
                'image_url': 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800',
                'description': 'Discover paradise with ancient temples, pristine beaches, and vibrant culture.',
                'location': 'Bali',
                'country': 'Indonesia',
                'continent': 'Asia',
                'best_time': 'April to October',
                'avg_temp': '27°C / 81°F',
                'currency': 'Indonesian Rupiah (IDR)',
                'language': 'Indonesian',
                'base_price': 1899.00,
                'featured': True,
                'popular': True,
            }
        ]
        
        destinations = []
        for dest_data in destinations_data:
            destination = Destination(
                title=dest_data['title'],
                slug=dest_data['slug'],
                image_url=dest_data['image_url'],
                description=dest_data['description'],
                location=dest_data['location'],
                country=dest_data['country'],
                continent=dest_data['continent'],
                best_time=dest_data['best_time'],
                avg_temp=dest_data['avg_temp'],
                currency=dest_data['currency'],
                language=dest_data['language'],
                base_price=dest_data['base_price'],
                featured=dest_data['featured'],
                popular=dest_data['popular']
            )
            db.session.add(destination)
        
        db.session.commit()  # Commit destinations
        
        # Get destination IDs after commit
        santorini = Destination.query.filter_by(slug='santorini-greece').first()
        bali = Destination.query.filter_by(slug='bali-indonesia').first()
        
        # Add highlights for destinations
        santorini_highlights = [
            'Iconic Oia sunset views',
            'Blue-domed churches',
            'Ancient Akrotiri ruins',
            'Black sand beaches',
            'Local wine tasting'
        ]
        
        for i, highlight in enumerate(santorini_highlights):
            dest_highlight = DestinationHighlight(
                destination_id=santorini.id,
                text=highlight,
                order=i
            )
            db.session.add(dest_highlight)
        
        bali_highlights = [
            'Tegallalang Rice Terraces',
            'Uluwatu Temple sunset',
            'Ubud art villages',
            'World-class surfing',
            'Traditional spa treatments'
        ]
        
        for i, highlight in enumerate(bali_highlights):
            dest_highlight = DestinationHighlight(
                destination_id=bali.id,
                text=highlight,
                order=i
            )
            db.session.add(dest_highlight)
        
        # Create packages
        packages_data = [
            {
                'title': 'Mediterranean Romance',
                'slug': 'mediterranean-romance',
                'image_url': 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800',
                'description': 'Experience the enchanting beauty of the Mediterranean.',
                'duration': '7 Days / 6 Nights',
                'group_size': '2-10 people',
                'base_price': 2499.00,
                'rating': 4.9,
                'reviews_count': 124,
                'featured': True,
                'popular': True,
                'category': 'romance',
            },
            {
                'title': 'Bali Island Explorer',
                'slug': 'bali-island-explorer',
                'image_url': 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800',
                'description': 'Discover paradise with ancient temples and pristine beaches.',
                'duration': '10 Days / 9 Nights',
                'group_size': '4-12 people',
                'base_price': 1899.00,
                'rating': 4.8,
                'reviews_count': 89,
                'featured': True,
                'popular': False,
                'category': 'adventure',
            }
        ]
        
        for pkg_data in packages_data:
            package = Package(
                title=pkg_data['title'],
                slug=pkg_data['slug'],
                image_url=pkg_data['image_url'],
                description=pkg_data['description'],
                duration=pkg_data['duration'],
                group_size=pkg_data['group_size'],
                base_price=pkg_data['base_price'],
                rating=pkg_data['rating'],
                reviews_count=pkg_data['reviews_count'],
                featured=pkg_data['featured'],
                popular=pkg_data.get('popular', False),
                category=pkg_data['category'],
            )
            db.session.add(package)
        
        db.session.commit()  # Commit packages
        
        # Create blogs
        blogs_data = [
            {
                'title': '10 Hidden Gems in Europe You Must Visit',
                'slug': 'hidden-gems-europe',
                'image_url': 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800',
                'excerpt': 'Discover off-the-beaten-path destinations.',
                'content': 'Europe is home to countless well-known destinations...',
                'author': 'Sarah Johnson',
                'category': 'Destinations',
                'read_time': '8 min read',
                'published': True,
                'featured': True,
            },
            {
                'title': 'Ultimate Packing Guide',
                'slug': 'ultimate-packing-guide',
                'image_url': 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800',
                'excerpt': 'Everything you need to know about packing smart.',
                'content': 'Packing for a long trip can be overwhelming...',
                'author': 'Mike Chen',
                'category': 'Travel Tips',
                'read_time': '6 min read',
                'published': True,
                'featured': True,
            }
        ]
        
        for blog_data in blogs_data:
            blog = Blog(
                title=blog_data['title'],
                slug=blog_data['slug'],
                image_url=blog_data['image_url'],
                excerpt=blog_data['excerpt'],
                content=blog_data['content'],
                author=blog_data['author'],
                category=blog_data['category'],
                read_time=blog_data['read_time'],
                published=blog_data['published'],
                featured=blog_data['featured'],
            )
            db.session.add(blog)
        
        # Create testimonials
        testimonials_data = [
            {
                'name': 'Emily Johnson',
                'content': 'The best travel experience of my life!',
                'rating': 5.0,
                'featured': True,
                'verified': True,
                'destination': 'Santorini, Greece',
            },
            {
                'name': 'Michael Chen',
                'content': 'Amazing photography opportunities and excellent guides.',
                'rating': 4.8,
                'featured': True,
                'verified': True,
                'destination': 'Bali, Indonesia',
            }
        ]
        
        for testimonial_data in testimonials_data:
            testimonial = Testimonial(**testimonial_data)
            db.session.add(testimonial)
        
        # Create gallery
        gallery_data = {
            'title': 'Santorini Sunset',
            'slug': 'santorini-sunset',
            'location': 'Santorini, Greece',
            'country': 'Greece',
            'category': 'Sunset',
            'description': 'The iconic blue domes of Santorini.',
            'featured': True
        }
        
        gallery = Gallery(**gallery_data)
        db.session.add(gallery)
        
        db.session.commit()  # Final commit
        
        print("✓ Sample data created successfully!")
        print("\n=== Login Credentials ===")
        print("Admin: admin@glttravel.com / admin123")
        print("User:  john@example.com / password123")
        print("\n=== API Endpoints ===")
        print("Home: http://localhost:5000/api/")
        print("Destinations: http://localhost:5000/api/destinations")
        print("\nStart server with: python run.py")
        
        return True

if __name__ == '__main__':
    try:
        init_database()
    except Exception as e:
        print(f"Error initializing database: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)