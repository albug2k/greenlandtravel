#!/usr/bin/env python3
import os
import sys
from datetime import datetime, timedelta
import random

# Add the current directory to the Python path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app import create_app, db
from app.models import *

def add_sample_data():
    """Add comprehensive sample data for presentation"""
    
    app = create_app()
    
    with app.app_context():
        print("Adding comprehensive sample data...")
        
        # Check if we already have some data
        dest_count = Destination.query.count()
        user_count = User.query.count()
        
        print(f"Current database has {dest_count} destinations and {user_count} users")
        
        # ============================================
        # 1. ADD MORE USERS (Tourists, Bloggers, etc.)
        # ============================================
        print("\n1. Adding more users...")
        
        additional_users = [
            {
                'name': 'Emma Rodriguez',
                'email': 'emma.rodriguez@example.com',
                'phone': '+1 (555) 234-5678',
                'is_admin': False,
                'password': 'emma123!'
            },
            {
                'name': 'David Chen',
                'email': 'david.chen@example.com',
                'phone': '+1 (555) 345-6789',
                'is_admin': False,
                'password': 'david123!'
            },
            {
                'name': 'Sophie Williams',
                'email': 'sophie.williams@example.com',
                'phone': '+44 20 7946 0958',
                'is_admin': False,
                'password': 'sophie123!'
            },
            {
                'name': 'Travel Blogger Pro',
                'email': 'blogger@wanderlust.com',
                'phone': '+1 (555) 987-6543',
                'is_admin': False,
                'password': 'blogger123!'
            }
        ]
        
        for user_data in additional_users:
            if not User.query.filter_by(email=user_data['email']).first():
                user = User(
                    name=user_data['name'],
                    email=user_data['email'],
                    phone=user_data['phone'],
                    is_admin=user_data['is_admin']
                )
                user.set_password(user_data['password'])
                db.session.add(user)
                print(f"  ✓ Added user: {user_data['name']}")
        
        db.session.commit()
        
        # ============================================
        # 2. ADD MORE DESTINATIONS
        # ============================================
        print("\n2. Adding more destinations...")
        
        new_destinations = [
            {
                'title': 'Paris, France',
                'slug': 'paris-france',
                'image_url': 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800',
                'description': 'The City of Lights awaits with iconic landmarks, world-class cuisine, and romantic ambiance. From the Eiffel Tower to charming Montmartre, Paris offers unforgettable experiences.',
                'location': 'Paris',
                'country': 'France',
                'continent': 'Europe',
                'best_time': 'April to June, September to October',
                'avg_temp': '15°C / 59°F',
                'currency': 'Euro (€)',
                'language': 'French',
                'visa_info': 'Schengen visa required for many countries',
                'base_price': 2299.00,
                'featured': True,
                'popular': True,
                'highlights': [
                    'Eiffel Tower views',
                    'Louvre Museum masterpieces',
                    'Seine River cruise',
                    'Notre-Dame Cathedral',
                    'Montmartre artists square',
                    'French cuisine tasting'
                ]
            },
            {
                'title': 'Kyoto, Japan',
                'slug': 'kyoto-japan',
                'image_url': 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800',
                'description': 'Experience traditional Japan with ancient temples, serene gardens, and geisha culture. Kyoto preserves Japan\'s cultural heritage while offering modern comforts.',
                'location': 'Kyoto',
                'country': 'Japan',
                'continent': 'Asia',
                'best_time': 'March to May, October to November',
                'avg_temp': '16°C / 61°F',
                'currency': 'Japanese Yen (¥)',
                'language': 'Japanese',
                'visa_info': 'Visa-free for many countries, 90 days',
                'base_price': 2799.00,
                'featured': True,
                'popular': False,
                'highlights': [
                    'Fushimi Inari Shrine gates',
                    'Kinkaku-ji Golden Pavilion',
                    'Arashiyama Bamboo Grove',
                    'Geisha district exploration',
                    'Traditional tea ceremony',
                    'Cherry blossom viewing'
                ]
            },
            {
                'title': 'New York City, USA',
                'slug': 'new-york-city-usa',
                'image_url': 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800',
                'description': 'The city that never sleeps offers iconic skyscrapers, Broadway shows, world-class museums, and diverse neighborhoods. Experience the energy of the Big Apple.',
                'location': 'New York City',
                'country': 'USA',
                'continent': 'North America',
                'best_time': 'April to June, September to November',
                'avg_temp': '13°C / 55°F',
                'currency': 'US Dollar ($)',
                'language': 'English',
                'visa_info': 'ESTA or visa required depending on country',
                'base_price': 1999.00,
                'featured': True,
                'popular': True,
                'highlights': [
                    'Statue of Liberty visit',
                    'Times Square excitement',
                    'Central Park exploration',
                    'Broadway show experience',
                    'Metropolitan Museum of Art',
                    'Empire State Building views'
                ]
            },
            {
                'title': 'Cape Town, South Africa',
                'slug': 'cape-town-south-africa',
                'image_url': 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800',
                'description': 'Where mountains meet the sea. Experience stunning natural beauty, vibrant culture, and adventure activities in South Africa\'s mother city.',
                'location': 'Cape Town',
                'country': 'South Africa',
                'continent': 'Africa',
                'best_time': 'March to May, September to November',
                'avg_temp': '18°C / 64°F',
                'currency': 'South African Rand (R)',
                'language': 'English, Afrikaans',
                'visa_info': 'Visa-free for many countries, 90 days',
                'base_price': 2199.00,
                'featured': True,
                'popular': False,
                'highlights': [
                    'Table Mountain cable car',
                    'Cape Point nature reserve',
                    'Penguin colony at Boulders Beach',
                    'Wine tasting in Stellenbosch',
                    'Robben Island tour',
                    'V&A Waterfront shopping'
                ]
            }
        ]
        
        for dest_data in new_destinations:
            if not Destination.query.filter_by(slug=dest_data['slug']).first():
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
                    visa_info=dest_data.get('visa_info', ''),
                    base_price=dest_data['base_price'],
                    featured=dest_data['featured'],
                    popular=dest_data['popular']
                )
                db.session.add(destination)
                db.session.flush()  # Get the ID
                
                # Add highlights
                for i, highlight in enumerate(dest_data['highlights']):
                    dest_highlight = DestinationHighlight(
                        destination_id=destination.id,
                        text=highlight,
                        order=i
                    )
                    db.session.add(dest_highlight)
                
                print(f"  ✓ Added destination: {dest_data['title']}")
        
        db.session.commit()
        
        # ============================================
        # 3. ADD MORE PACKAGES (FIXED - removed order field)
        # ============================================
        print("\n3. Adding more packages...")
        
        new_packages = [
            {
                'title': 'European Capitals Tour',
                'slug': 'european-capitals-tour',
                'image_url': 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800',
                'description': 'Experience the best of Europe with this comprehensive tour of three iconic capitals: Paris, Rome, and Amsterdam.',
                'duration': '14 Days / 13 Nights',
                'group_size': '8-20 people',
                'base_price': 4299.00,
                'discount_price': 3999.00,
                'rating': 4.8,
                'reviews_count': 78,
                'featured': True,
                'popular': True,
                'category': 'cultural',
                'difficulty': 'easy',
                'season': 'spring,fall',
                'features': [
                    'Guided tours of all major landmarks',
                    'High-speed train between cities',
                    'Luxury hotel accommodations',
                    'Daily breakfast and 5 dinners',
                    'Skip-the-line museum entries',
                    'Local expert guides'
                ]
            },
            {
                'title': 'Japanese Cultural Immersion',
                'slug': 'japanese-cultural-immersion',
                'image_url': 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800',
                'description': 'Deep dive into Japanese traditions with temple stays, tea ceremonies, and authentic cultural experiences across Tokyo, Kyoto, and Osaka.',
                'duration': '12 Days / 11 Nights',
                'group_size': '6-15 people',
                'base_price': 3899.00,
                'rating': 4.9,
                'reviews_count': 45,
                'featured': True,
                'popular': False,
                'category': 'cultural',
                'difficulty': 'moderate',
                'season': 'spring,fall',
                'features': [
                    'Traditional ryokan stay',
                    'Tea ceremony with master',
                    'Sushi making class',
                    'Bullet train experience',
                    'Geisha district tour',
                    'Onsen hot spring experience'
                ]
            },
            {
                'title': 'USA East Coast Adventure',
                'slug': 'usa-east-coast-adventure',
                'image_url': 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800',
                'description': 'From the bright lights of New York to the historic streets of Boston and Washington D.C., experience the diversity of America\'s East Coast.',
                'duration': '10 Days / 9 Nights',
                'group_size': '10-25 people',
                'base_price': 2999.00,
                'discount_price': 2699.00,
                'rating': 4.7,
                'reviews_count': 92,
                'featured': True,
                'popular': True,
                'category': 'city',
                'difficulty': 'easy',
                'season': 'all-year',
                'features': [
                    'Broadway show tickets',
                    'White House tour',
                    'Boston Freedom Trail',
                    'Niagara Falls day trip',
                    'All transportation included',
                    'Expert American history guides'
                ]
            },
            {
                'title': 'African Safari & Beach Combo',
                'slug': 'african-safari-beach-combo',
                'image_url': 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800',
                'description': 'The ultimate African experience combining wildlife safari adventures with relaxing beach time on the stunning coast of South Africa.',
                'duration': '15 Days / 14 Nights',
                'group_size': '4-12 people',
                'base_price': 5499.00,
                'rating': 5.0,
                'reviews_count': 34,
                'featured': True,
                'popular': True,
                'category': 'adventure',
                'difficulty': 'moderate',
                'season': 'summer',
                'features': [
                    'Big Five safari experience',
                    'Luxury tented camps',
                    'Cape Town city tour',
                    'Wine lands exploration',
                    'Beachfront resort stay',
                    'Private game drives'
                ]
            }
        ]
        
        for pkg_data in new_packages:
            if not Package.query.filter_by(slug=pkg_data['slug']).first():
                package = Package(
                    title=pkg_data['title'],
                    slug=pkg_data['slug'],
                    image_url=pkg_data['image_url'],
                    description=pkg_data['description'],
                    duration=pkg_data['duration'],
                    group_size=pkg_data['group_size'],
                    base_price=pkg_data['base_price'],
                    discount_price=pkg_data.get('discount_price'),
                    rating=pkg_data['rating'],
                    reviews_count=pkg_data['reviews_count'],
                    featured=pkg_data['featured'],
                    popular=pkg_data.get('popular', False),
                    category=pkg_data['category'],
                    difficulty=pkg_data['difficulty'],
                    season=pkg_data['season']
                )
                db.session.add(package)
                db.session.flush()
                
                # Add features (without order field)
                for feature_text in pkg_data['features']:
                    pkg_feature = PackageFeature(
                        package_id=package.id,
                        text=feature_text
                    )
                    db.session.add(pkg_feature)
                
                print(f"  ✓ Added package: {pkg_data['title']}")
        
        db.session.commit()
        
        # ============================================
        # 4. ADD MORE BLOGS
        # ============================================
        print("\n4. Adding more blogs...")
        
        new_blogs = [
            {
                'title': 'Top 10 Must-Visit Museums Around the World',
                'slug': 'top-museums-world',
                'image_url': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800',
                'excerpt': 'From ancient artifacts to modern masterpieces, discover the world\'s most incredible museums for art and history lovers.',
                'content': '## The Louvre, Paris\nHome to the Mona Lisa and Venus de Milo...\n\n## British Museum, London\nSee the Rosetta Stone and Egyptian mummies...\n\n## Metropolitan Museum, New York\nOne of the world\'s largest and finest art museums...',
                'author': 'Sarah Johnson',
                'category': 'Culture',
                'read_time': '10 min read',
                'published': True,
                'featured': True,
                'tags': 'museums,art,culture,travel'
            },
            {
                'title': 'Foodie Guide to Southeast Asia',
                'slug': 'foodie-guide-southeast-asia',
                'image_url': 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800',
                'excerpt': 'Your ultimate guide to the most delicious street food and culinary experiences across Thailand, Vietnam, and Malaysia.',
                'content': '## Bangkok Street Food\nPad Thai, Som Tum, Mango Sticky Rice...\n\n## Vietnamese Pho\nWhere to find the best bowls in Hanoi...\n\n## Malaysian Hawker Centers\nPenang\'s famous food streets...',
                'author': 'Michael Chen',
                'category': 'Food & Drink',
                'read_time': '8 min read',
                'published': True,
                'featured': True,
                'tags': 'food,asia,culinary,street-food'
            },
            {
                'title': 'Sustainable Travel: How to Reduce Your Carbon Footprint',
                'slug': 'sustainable-travel-guide',
                'image_url': 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800',
                'excerpt': 'Practical tips for eco-conscious travelers who want to explore the world while minimizing environmental impact.',
                'content': '## Choose Green Accommodations\nLook for eco-certified hotels...\n\n## Pack Light and Right\nReduce luggage weight to lower carbon emissions...\n\n## Support Local Communities\nChoose locally-owned businesses...',
                'author': 'Emma Rodriguez',
                'category': 'Sustainable Travel',
                'read_time': '7 min read',
                'published': True,
                'featured': True,
                'tags': 'sustainable,eco-travel,green,environment'
            },
            {
                'title': 'Photography Tips for Travelers',
                'slug': 'photography-tips-travelers',
                'image_url': 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800',
                'excerpt': 'Capture stunning travel photos with these expert tips on composition, lighting, and equipment for every type of traveler.',
                'content': '## Golden Hour Magic\nBest times to shoot for perfect lighting...\n\n## Rule of Thirds\nComposition techniques for better photos...\n\n## Essential Gear\nWhat to pack in your camera bag...',
                'author': 'David Chen',
                'category': 'Photography',
                'read_time': '9 min read',
                'published': True,
                'featured': False,
                'tags': 'photography,tips,travel-photos,camera'
            }
        ]
        
        for blog_data in new_blogs:
            if not Blog.query.filter_by(slug=blog_data['slug']).first():
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
                    tags=blog_data.get('tags', '')
                )
                db.session.add(blog)
                print(f"  ✓ Added blog: {blog_data['title']}")
        
        db.session.commit()
        
        # ============================================
        # 5. ADD MORE TESTIMONIALS
        # ============================================
        print("\n5. Adding more testimonials...")
        
        new_testimonials = [
            {
                'name': 'Robert Tanaka',
                'role': 'Business Executive',
                'company': 'Global Tech Inc.',
                'content': 'The European tour was perfectly organized. The guides were knowledgeable and the accommodations exceeded expectations. Will definitely book again!',
                'rating': 4.9,
                'featured': True,
                'verified': True,
                'destination': 'Paris, France',
                'tour_package': 'European Capitals Tour'
            },
            {
                'name': 'Lisa Wang',
                'role': 'University Professor',
                'company': 'Stanford University',
                'content': 'As a history professor, I was impressed by the depth of cultural immersion in Japan. The traditional experiences were authentic and well-coordinated.',
                'rating': 5.0,
                'featured': True,
                'verified': True,
                'destination': 'Kyoto, Japan',
                'tour_package': 'Japanese Cultural Immersion'
            },
            {
                'name': 'Marcus Johnson',
                'role': 'Photographer',
                'company': 'National Geographic',
                'content': 'The African safari provided incredible photographic opportunities. Our guide knew exactly where to find the wildlife at perfect times.',
                'rating': 4.8,
                'featured': True,
                'verified': True,
                'destination': 'Cape Town, South Africa',
                'tour_package': 'African Safari & Beach Combo'
            },
            {
                'name': 'Olivia Parker',
                'role': 'Travel Influencer',
                'company': 'Wander With Me',
                'content': 'I\'ve been on many tours, but the USA East Coast Adventure stands out for its perfect balance of history, culture, and fun. Highly recommend!',
                'rating': 4.7,
                'featured': True,
                'verified': True,
                'destination': 'New York City, USA',
                'tour_package': 'USA East Coast Adventure'
            }
        ]
        
        for testimonial_data in new_testimonials:
            testimonial = Testimonial(**testimonial_data)
            db.session.add(testimonial)
            print(f"  ✓ Added testimonial from: {testimonial_data['name']}")
        
        db.session.commit()
        
        # ============================================
        # 6. ADD REALISTIC BOOKINGS
        # ============================================
        print("\n6. Adding realistic bookings...")
        
        # Get some users and packages
        users = User.query.filter(User.is_admin == False).limit(4).all()
        packages = Package.query.limit(4).all()
        
        booking_statuses = ['pending', 'confirmed', 'completed']
        payment_statuses = ['pending', 'paid', 'partially_paid']
        
        for i, (user, package) in enumerate(zip(users, packages)):
            # Create bookings with different statuses
            booking = Booking(
                user_id=user.id,
                package_id=package.id,
                destination=package.title,
                travel_date=datetime.now().date() + timedelta(days=30 + (i * 15)),
                guests=random.randint(1, 4),
                special_requests='Vegetarian meals' if i % 2 == 0 else 'Early check-in requested',
                total_price=package.base_price * random.randint(1, 4),
                booking_reference=f"GLT-{datetime.now().strftime('%y%m%d')}-{1000 + i}",
                status=booking_statuses[i % len(booking_statuses)],
                payment_status=payment_statuses[i % len(payment_statuses)]
            )
            db.session.add(booking)
            print(f"  ✓ Added booking for {user.name}: {package.title}")
        
        db.session.commit()
        
        # ============================================
        # 7. ADD GALLERY ITEMS (FIXED - removed order from GalleryImage)
        # ============================================
        print("\n7. Adding gallery items...")
        
        new_galleries = [
            {
                'title': 'Parisian Streets',
                'slug': 'parisian-streets',
                'location': 'Paris, France',
                'country': 'France',
                'category': 'City',
                'description': 'Charming Parisian streets and architecture that capture the essence of French elegance.',
                'featured': True,
                'images': [
                    'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200',
                    'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=1200',
                    'https://images.unsplash.com/photo-1522093007474-d86e9bf7ba6f?w=1200'
                ]
            },
            {
                'title': 'Japanese Temples',
                'slug': 'japanese-temples',
                'location': 'Kyoto, Japan',
                'country': 'Japan',
                'category': 'Temples',
                'description': 'Serene Japanese temples showcasing centuries of spiritual and architectural tradition.',
                'featured': True,
                'images': [
                    'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1200',
                    'https://images.unsplash.com/photo-1528164344705-47542687000d?w=1200',
                    'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=1200'
                ]
            },
            {
                'title': 'New York Cityscapes',
                'slug': 'new-york-cityscapes',
                'location': 'New York City, USA',
                'country': 'USA',
                'category': 'Skyline',
                'description': 'Iconic New York City skylines and urban landscapes that define the Big Apple.',
                'featured': True,
                'images': [
                    'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=1200',
                    'https://images.unsplash.com/photo-1485871981521-5b1fd3805eee?w=1200',
                    'https://images.unsplash.com/photo-1500916434205-0c77489c6cf7?w=1200'
                ]
            },
            {
                'title': 'African Landscapes',
                'slug': 'african-landscapes',
                'location': 'Cape Town, South Africa',
                'country': 'South Africa',
                'category': 'Nature',
                'description': 'Breathtaking African landscapes from majestic mountains to stunning coastlines.',
                'featured': True,
                'images': [
                    'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=1200',
                    'https://images.unsplash.com/photo-1573843989-c9d7ad3f6a8e?w=1200',
                    'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200'
                ]
            }
        ]
        
        for gallery_data in new_galleries:
            if not Gallery.query.filter_by(slug=gallery_data['slug']).first():
                gallery = Gallery(
                    title=gallery_data['title'],
                    slug=gallery_data['slug'],
                    location=gallery_data['location'],
                    country=gallery_data['country'],
                    category=gallery_data['category'],
                    description=gallery_data['description'],
                    featured=gallery_data['featured']
                )
                db.session.add(gallery)
                db.session.flush()
                
                # Add images (without order field)
                for img_url in gallery_data['images']:
                    gallery_img = GalleryImage(
                        gallery_id=gallery.id,
                        image_url=img_url,
                        caption=gallery_data['title']
                    )
                    db.session.add(gallery_img)
                
                print(f"  ✓ Added gallery: {gallery_data['title']}")
        
        db.session.commit()
        
        # ============================================
        # 8. ADD CONTACT MESSAGES
        # ============================================
        print("\n8. Adding sample contact messages...")
        
        contact_messages = [
            {
                'name': 'Alex Turner',
                'email': 'alex.turner@example.com',
                'subject': 'Honeymoon Package Inquiry',
                'message': 'Looking for a romantic honeymoon package in Europe for next June. Can you recommend options with private transfers?',
                'category': 'booking',
                'read': True,
                'replied': True
            },
            {
                'name': 'Maria Garcia',
                'email': 'maria.g@example.com',
                'subject': 'Family Safari Trip',
                'message': 'Interested in a family-friendly safari for 2 adults and 2 children (ages 8 and 12). What are the safety measures?',
                'category': 'booking',
                'read': True,
                'replied': False
            },
            {
                'name': 'James Wilson',
                'email': 'james.wilson@example.com',
                'subject': 'Group Travel Discount',
                'message': 'We have a group of 15 colleagues interested in your Japan tour. Are there group discounts available?',
                'category': 'booking',
                'read': False,
                'replied': False
            },
            {
                'name': 'Sarah Miller',
                'email': 'sarah.m@example.com',
                'subject': 'Travel Insurance',
                'message': 'Do you offer travel insurance with your packages? What does it typically cover?',
                'category': 'support',
                'read': True,
                'replied': True
            }
        ]
        
        for msg_data in contact_messages:
            message = ContactMessage(
                name=msg_data['name'],
                email=msg_data['email'],
                subject=msg_data['subject'],
                message=msg_data['message'],
                category=msg_data['category'],
                read=msg_data['read'],
                replied=msg_data['replied']
            )
            db.session.add(message)
            print(f"  ✓ Added contact message from: {msg_data['name']}")
        
        db.session.commit()
        
        # ============================================
        # SUMMARY
        # ============================================
        print("\n" + "="*50)
        print("SAMPLE DATA ADDED SUCCESSFULLY!")
        print("="*50)
        
        # Display statistics
        print(f"\n📊 DATABASE STATISTICS:")
        print(f"   Users: {User.query.count()}")
        print(f"   Destinations: {Destination.query.count()}")
        print(f"   Packages: {Package.query.count()}")
        print(f"   Blogs: {Blog.query.count()}")
        print(f"   Testimonials: {Testimonial.query.count()}")
        print(f"   Bookings: {Booking.query.count()}")
        print(f"   Gallery Items: {Gallery.query.count()}")
        print(f"   Contact Messages: {ContactMessage.query.count()}")
        
        print("\n🔑 SAMPLE LOGIN CREDENTIALS:")
        print("   Admin: admin@glttravel.com / admin123")
        print("   User: john@example.com / password123")
        print("   User: emma.rodriguez@example.com / emma123!")
        
        print("\n🌍 NEW DESTINATIONS ADDED:")
        for dest in Destination.query.order_by(Destination.created_at.desc()).limit(4).all():
            print(f"   • {dest.title} (${dest.base_price})")
        
        print("\n🚀 START THE SERVER:")
        print("   python run.py")
        print("\n🌐 THEN VISIT:")
        print("   http://localhost:5000/api/")
        print("   http://localhost:5000/api/destinations")
        print("   http://localhost:5000/api/packages")
        print("   http://localhost:5000/api/blogs")
        
        return True

if __name__ == '__main__':
    try:
        add_sample_data()
    except Exception as e:
        print(f"❌ Error adding sample data: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)