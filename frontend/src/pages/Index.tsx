// src/pages/Index.tsx
import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import HeroSection from "@/components/HeroSection";
import DestinationCard from "@/components/DestinationCard";
import PackageCard from "@/components/PackageCard";
import TestimonialsSection from "@/components/TestimonialsSection";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";
import { Globe, Shield, Heart, Award, Loader2, Star, Quote } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import api from "@/utils/api";

// ── Types matching backend to_dict() outputs ──────────────────────────────────

interface HomeDestination {
  id: number;
  title: string;
  slug?: string;
  image_url?: string;
  thumbnail_url?: string;
  description: string;
  location?: string;
  country?: string;
  tours_count?: number;
}

interface HomePackage {
  id: number;
  title: string;
  slug?: string;
  image_url?: string;
  description?: string;
  duration?: string;
  group_size?: string;
  base_price: number;
  discount_price?: number;
  rating: number;
  reviews: number;
  featured: boolean;
  popular: boolean;
  category?: string;
  tags?: string[];
}

interface HomeBlog {
  id: number;
  title: string;
  slug?: string;
  excerpt?: string;
  featured_image?: string;
  image_url?: string;
  published_at?: string;
  created_at?: string;
  author?: string;
  category?: string;
}

interface HomeTestimonial {
  id: number;
  name: string;
  location?: string;
  rating: number;
  comment: string;
  avatar_url?: string;
  destination?: string;
}

interface HomeGallery {
  id: number;
  title: string;
  slug?: string;
  images: Array<{ id: number; image_url: string; caption?: string }>;
  location?: string;
  category?: string;
}

interface HomeStats {
  destinations_count: number;
  tours_count: number;
  happy_customers: number;
  years_experience: number;
}

interface HomeData {
  featured_destinations: HomeDestination[];
  popular_packages: HomePackage[];
  latest_blogs: HomeBlog[];
  testimonials: HomeTestimonial[];
  gallery: HomeGallery[];
  stats: HomeStats;
}

// ── Static content ────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: Globe,
    title: "Global Destinations",
    description: "Access to over 100+ handpicked destinations worldwide",
  },
  {
    icon: Shield,
    title: "Secure Booking",
    description: "Safe and secure online booking with flexible payment options",
  },
  {
    icon: Heart,
    title: "Personalized Service",
    description: "Tailored experiences crafted to match your preferences",
  },
  {
    icon: Award,
    title: "Award Winning",
    description: "Recognized for excellence in travel and customer service",
  },
];

const PLACEHOLDER_IMG = "https://via.placeholder.com/800x600?text=Travel";

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatDate = (dateStr?: string) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

const formatStat = (n: number): string => {
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K+`;
  return `${n}+`;
};

// ── Skeleton loader ───────────────────────────────────────────────────────────

const SectionSkeleton = ({ count = 4, cols = 4 }: { count?: number; cols?: number }) => (
  <div
    className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${cols} gap-8`}
  >
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="rounded-xl bg-muted animate-pulse h-64" />
    ))}
  </div>
);

// ── Component ─────────────────────────────────────────────────────────────────

const Index = () => {
  const navigate = useNavigate();

  const [homeData, setHomeData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHomeData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get("/");
        const data = response.data;
        if (data?.success && data?.data) {
          setHomeData(data.data);
        } else {
          setError("Unexpected response from server.");
        }
      } catch (err) {
        console.error("Failed to load home data:", err);
        setError("Failed to load page content.");
      } finally {
        setLoading(false);
      }
    };
    fetchHomeData();
  }, []);

  // ── Derived data ────────────────────────────────────────────────────────────

  const destinations = homeData?.featured_destinations ?? [];
  const packages = homeData?.popular_packages ?? [];
  const blogs = homeData?.latest_blogs ?? [];
  const testimonials = homeData?.testimonials ?? [];
  const gallery = homeData?.gallery ?? [];
  const stats = homeData?.stats ?? null;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen">
      <Navigation />
      <HeroSection />

      {/* ── Features (always static) ─────────────────────────────────────── */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {FEATURES.map((feature, index) => (
              <div
                key={index}
                className="text-center p-6 animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-hero rounded-full mb-4">
                  <feature.icon className="text-white" size={32} />
                </div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats banner (dynamic) ───────────────────────────────────────── */}
      {stats && (
        <section className="py-12 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {[
                { label: "Destinations", value: formatStat(stats.destinations_count) },
                { label: "Tours Available", value: formatStat(stats.tours_count) },
                { label: "Happy Customers", value: formatStat(stats.happy_customers) },
                { label: "Years Experience", value: `${stats.years_experience}+` },
              ].map((stat, i) => (
                <div key={i}>
                  <p className="text-4xl font-bold mb-1">{stat.value}</p>
                  <p className="text-primary-foreground/80 text-sm">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Featured Destinations (dynamic) ─────────────────────────────── */}
      <section id="destinations" className="py-20 bg-muted">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Popular Destinations
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Explore the world's most captivating places, curated for
              unforgettable experiences
            </p>
          </div>

          {loading ? (
            <SectionSkeleton count={4} cols={4} />
          ) : error ? (
            <p className="text-center text-muted-foreground">{error}</p>
          ) : destinations.length === 0 ? (
            <p className="text-center text-muted-foreground">
              No featured destinations available.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {destinations.map((dest, index) => (
                <DestinationCard
                  key={dest.id}
                  id={String(dest.id)}
                  image={
                    dest.image_url ||
                    dest.thumbnail_url ||
                    PLACEHOLDER_IMG
                  }
                  title={dest.title}
                  description={dest.description || "Discover this amazing destination"}
                  tours={dest.tours_count ?? 0}
                  link={`/destination-detail/${dest.slug || dest.id}`}
                />
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Button size="lg" variant="outline" onClick={() => navigate("/destinations")}>
              View All Destinations
            </Button>
          </div>
        </div>
      </section>

      {/* ── Featured Packages (dynamic) ──────────────────────────────────── */}
      <section id="packages" className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Featured Travel Packages
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Handcrafted journeys designed to create memories that last a
              lifetime
            </p>
          </div>

          {loading ? (
            <SectionSkeleton count={3} cols={3} />
          ) : packages.length === 0 ? (
            <p className="text-center text-muted-foreground">
              No featured packages available.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {packages.map((pkg) => (
                <PackageCard
                  key={pkg.id}
                  id={pkg.id}
                  slug={pkg.slug}
                  image={pkg.image_url || PLACEHOLDER_IMG}
                  title={pkg.title}
                  duration={pkg.duration}
                  groupSize={pkg.group_size}
                  basePrice={pkg.base_price}
                  discountPrice={pkg.discount_price}
                  rating={pkg.rating}
                  reviews={pkg.reviews}
                  featured={pkg.featured}
                  popular={pkg.popular}
                  category={pkg.category}
                />
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Button size="lg" variant="outline" onClick={() => navigate("/packages")}>
              View All Packages
            </Button>
          </div>
        </div>
      </section>

      {/* ── About (always static) ───────────────────────────────────────── */}
      <section id="about" className="py-20 bg-gradient-hero text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center animate-fade-in">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              About GreenLand Travel
            </h2>
            <p className="text-xl mb-8 leading-relaxed">
              For over {stats?.years_experience ?? 15} years, we've been
              crafting exceptional travel experiences that go beyond the
              ordinary. Our passion is connecting people with the world's most
              incredible destinations through carefully curated tours and
              personalized service.
            </p>
            <p className="text-lg leading-relaxed opacity-90">
              We believe travel is more than just visiting new places — it's
              about creating meaningful connections, discovering different
              cultures, and making memories that last a lifetime. Our team of
              travel experts works tirelessly to ensure every journey is
              seamless, safe, and truly unforgettable.
            </p>
          </div>
        </div>
      </section>

      {/* ── Gallery Preview (dynamic) ────────────────────────────────────── */}
      {!loading && gallery.length > 0 && (
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16 animate-fade-in">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                Travel Gallery
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Stunning moments captured from around the world
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
              {gallery.slice(0, 6).map((item, index) => {
                const coverImg =
                  item.images?.[0]?.image_url || PLACEHOLDER_IMG;
                return (
                  <button
                    key={item.id}
                    onClick={() =>
                      navigate(`/gallery-detail/${item.slug || item.id}`)
                    }
                    className="group relative overflow-hidden rounded-xl aspect-square cursor-pointer focus:outline-none"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <img
                      src={coverImg}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = PLACEHOLDER_IMG;
                      }}
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                      <div className="text-white text-left">
                        <p className="font-semibold text-sm">{item.title}</p>
                        {item.location && (
                          <p className="text-xs text-white/70">{item.location}</p>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="text-center mt-10">
              <Button size="lg" variant="outline" onClick={() => navigate("/gallery")}>
                View Full Gallery
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* ── Latest Blogs (dynamic) ──────────────────────────────────────── */}
      <section className="py-20 bg-muted">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Latest from Our Blog
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Travel stories, tips, and inspiration to fuel your wanderlust
            </p>
          </div>

          {loading ? (
            <div className="max-w-6xl mx-auto px-12">
              <SectionSkeleton count={3} cols={3} />
            </div>
          ) : blogs.length === 0 ? (
            <p className="text-center text-muted-foreground">
              No blog posts available yet.
            </p>
          ) : (
            <div className="max-w-6xl mx-auto px-12">
              <Carousel opts={{ align: "start", loop: true }} className="w-full">
                <CarouselContent>
                  {blogs.map((post, index) => (
                    <CarouselItem
                      key={post.id}
                      className="md:basis-1/2 lg:basis-1/3"
                    >
                      <Card
                        className="overflow-hidden hover:shadow-elevated transition-shadow duration-300 cursor-pointer h-full"
                        onClick={() =>
                          navigate(`/blog-detail/${post.slug || post.id}`)
                        }
                      >
                        <div className="relative h-48 overflow-hidden">
                          <img
                            src={
                              post.featured_image ||
                              post.image_url ||
                              PLACEHOLDER_IMG
                            }
                            alt={post.title}
                            className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                PLACEHOLDER_IMG;
                            }}
                          />
                          {post.category && (
                            <div className="absolute top-3 left-3 bg-primary text-primary-foreground text-xs font-semibold px-2 py-1 rounded-full">
                              {post.category}
                            </div>
                          )}
                        </div>
                        <CardContent className="p-6">
                          <p className="text-sm text-muted-foreground mb-2">
                            {formatDate(post.published_at || post.created_at)}
                            {post.author && ` · ${post.author}`}
                          </p>
                          <h3 className="text-lg font-bold mb-2 line-clamp-2">
                            {post.title}
                          </h3>
                          <p className="text-muted-foreground text-sm line-clamp-2 mb-4">
                            {post.excerpt || ""}
                          </p>
                          <Button variant="link" className="p-0 h-auto text-primary">
                            Read More →
                          </Button>
                        </CardContent>
                      </Card>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
              </Carousel>
            </div>
          )}

          <div className="text-center mt-12">
            <Button size="lg" onClick={() => navigate("/blogs")}>
              View All Blog Posts
            </Button>
          </div>
        </div>
      </section>

      {/* ── Testimonials (dynamic if available, else static component) ───── */}
      {!loading && testimonials.length > 0 ? (
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16 animate-fade-in">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                What Our Travellers Say
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Real stories from real adventurers
              </p>
            </div>

            <div className="max-w-6xl mx-auto px-12">
              <Carousel opts={{ align: "start", loop: true }} className="w-full">
                <CarouselContent>
                  {testimonials.map((t) => (
                    <CarouselItem
                      key={t.id}
                      className="md:basis-1/2 lg:basis-1/3"
                    >
                      <Card className="h-full shadow-soft">
                        <CardContent className="p-6 flex flex-col h-full">
                          {/* Stars */}
                          <div className="flex gap-1 mb-3">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                size={16}
                                className={
                                  i < Math.round(t.rating)
                                    ? "fill-secondary text-secondary"
                                    : "text-muted-foreground"
                                }
                              />
                            ))}
                          </div>

                          <Quote size={20} className="text-primary/30 mb-2" />

                          <p className="text-muted-foreground text-sm leading-relaxed flex-1 mb-4">
                            {t.comment}
                          </p>

                          <div className="flex items-center gap-3 pt-4 border-t">
                            {t.avatar_url ? (
                              <img
                                src={t.avatar_url}
                                alt={t.name}
                                className="w-10 h-10 rounded-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display =
                                    "none";
                                }}
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                                {t.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-sm">{t.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {[t.location, t.destination]
                                  .filter(Boolean)
                                  .join(" · ")}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
              </Carousel>
            </div>
          </div>
        </section>
      ) : (
        // Fall back to the existing static TestimonialsSection component
        <TestimonialsSection />
      )}

      <ContactSection />
      <Footer />
    </div>
  );
};

export default Index;